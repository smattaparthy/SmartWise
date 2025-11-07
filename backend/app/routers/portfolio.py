from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import (
    PortfolioUpload,
    PortfolioAnalysis,
    SectorAllocation,
    RebalanceResponse,
    RebalanceRecommendation
)
from ..auth import get_current_user
from ..portfolio import (
    parse_csv_portfolio,
    calculate_portfolio_value,
    analyze_sector_allocation,
    detect_concentration_risks,
    calculate_diversification_score,
    recommend_rebalancing
)

router = APIRouter(prefix="/portfolio", tags=["Portfolio Analysis"])


@router.post("/upload", response_model=PortfolioAnalysis)
async def upload_portfolio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload portfolio CSV and get analysis.

    CSV format:
    ticker,shares,purchase_price
    AAPL,100,150.00
    MSFT,50,280.00

    Returns:
    - Total portfolio value
    - Sector allocation breakdown
    - Concentration risks
    - Diversification score
    """
    # Check persona (only for Persona B)
    if current_user.persona != "B":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Portfolio analysis is only available for Persona B users"
        )

    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )

    try:
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')

        # Parse portfolio
        holdings = parse_csv_portfolio(csv_content)

        # Calculate values
        total_value, ticker_details = calculate_portfolio_value(holdings)

        # Analyze sectors
        sectors = analyze_sector_allocation(ticker_details, total_value)

        # Detect risks
        concentrated_sectors = detect_concentration_risks(sectors)

        # Calculate diversification score
        diversification_score = calculate_diversification_score(sectors)

        # Build response
        return PortfolioAnalysis(
            total_value=round(total_value, 2),
            sectors=[SectorAllocation(**s) for s in sectors],
            concentrated_sectors=concentrated_sectors,
            diversification_score=diversification_score
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing portfolio: {str(e)}"
        )


@router.post("/analyze", response_model=PortfolioAnalysis)
def analyze_portfolio(
    portfolio: PortfolioUpload,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze portfolio from JSON payload (alternative to CSV upload).

    Accepts:
    {
        "holdings": [
            {"ticker": "AAPL", "shares": 100, "purchase_price": 150.00},
            {"ticker": "MSFT", "shares": 50, "purchase_price": 280.00}
        ]
    }
    """
    if current_user.persona != "B":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Portfolio analysis is only available for Persona B users"
        )

    try:
        # Calculate values
        total_value, ticker_details = calculate_portfolio_value(portfolio.holdings)

        # Analyze sectors
        sectors = analyze_sector_allocation(ticker_details, total_value)

        # Detect risks
        concentrated_sectors = detect_concentration_risks(sectors)

        # Calculate diversification score
        diversification_score = calculate_diversification_score(sectors)

        return PortfolioAnalysis(
            total_value=round(total_value, 2),
            sectors=[SectorAllocation(**s) for s in sectors],
            concentrated_sectors=concentrated_sectors,
            diversification_score=diversification_score
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing portfolio: {str(e)}"
        )


@router.post("/rebalance", response_model=RebalanceResponse)
def get_rebalancing_recommendations(
    portfolio: PortfolioUpload,
    model_type: str = "balanced",
    current_user: User = Depends(get_current_user)
):
    """
    Get rebalancing recommendations based on model portfolio.

    Args:
        portfolio: Current portfolio holdings
        model_type: "conservative", "balanced", or "growth"

    Returns:
        Current allocation, target allocation, and specific recommendations
    """
    if current_user.persona != "B":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Portfolio rebalancing is only available for Persona B users"
        )

    if model_type not in ["conservative", "balanced", "growth"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="model_type must be 'conservative', 'balanced', or 'growth'"
        )

    try:
        # Calculate values
        total_value, ticker_details = calculate_portfolio_value(portfolio.holdings)

        # Analyze current sectors
        current_sectors = analyze_sector_allocation(ticker_details, total_value)

        # Get target allocation from model
        from ..portfolio import MODEL_PORTFOLIOS
        target_model = MODEL_PORTFOLIOS[model_type]
        target_sectors = [
            SectorAllocation(sector=sector, percentage=pct, amount=total_value * pct / 100)
            for sector, pct in target_model.items()
        ]

        # Generate recommendations
        recommendations = recommend_rebalancing(
            current_sectors,
            ticker_details,
            total_value,
            model_type
        )

        return RebalanceResponse(
            model_type=model_type,
            current_allocation=[SectorAllocation(**s) for s in current_sectors],
            target_allocation=target_sectors,
            recommendations=[RebalanceRecommendation(**r) for r in recommendations]
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating recommendations: {str(e)}"
        )
