"""
Portfolio analysis logic for Persona B (Rebalance).

This module handles:
- Portfolio parsing and validation
- Current value calculation
- Sector allocation analysis
- Concentration risk detection
- Rebalancing recommendations
"""

from typing import List, Dict, Tuple
import pandas as pd
from io import StringIO
import logging

from .market_data import get_ticker_overview, get_sector_allocation
from .schemas import PortfolioHolding
from .llm_service import get_llm_service

logger = logging.getLogger(__name__)


# Model portfolios for rebalancing recommendations
MODEL_PORTFOLIOS = {
    "conservative": {
        "Technology": 15.0,
        "Healthcare": 15.0,
        "Financials": 15.0,
        "Consumer Discretionary": 10.0,
        "Consumer Staples": 10.0,
        "Industrials": 10.0,
        "Materials": 5.0,
        "Energy": 5.0,
        "Utilities": 5.0,
        "Real Estate": 5.0,
        "Communication Services": 5.0
    },
    "balanced": {
        "Technology": 25.0,
        "Healthcare": 15.0,
        "Financials": 15.0,
        "Consumer Discretionary": 15.0,
        "Industrials": 10.0,
        "Communication Services": 10.0,
        "Consumer Staples": 5.0,
        "Energy": 5.0
    },
    "growth": {
        "Technology": 40.0,
        "Healthcare": 20.0,
        "Consumer Discretionary": 20.0,
        "Communication Services": 10.0,
        "Financials": 10.0
    }
}

# Concentration thresholds
SECTOR_CONCENTRATION_THRESHOLD = 30.0  # Single sector > 30% is concentrated
DIVERSIFICATION_TARGET_SECTORS = 5  # Aim for at least 5 sectors


def parse_csv_portfolio(csv_content: str) -> List[PortfolioHolding]:
    """
    Parse CSV portfolio data.

    Expected CSV format (accepts either 'symbol' or 'ticker'):
    symbol,shares,purchase_price
    AAPL,100,150.00
    MSFT,50,280.00

    Args:
        csv_content: CSV string content

    Returns:
        List of PortfolioHolding objects

    Raises:
        ValueError: If CSV format is invalid
    """
    try:
        # Read CSV
        df = pd.read_csv(StringIO(csv_content))

        # Normalize column names - accept both 'symbol' and 'ticker'
        if 'symbol' in df.columns and 'ticker' not in df.columns:
            df = df.rename(columns={'symbol': 'ticker'})

        # Validate required columns
        required_cols = ['ticker', 'shares', 'purchase_price']
        if not all(col in df.columns for col in required_cols):
            raise ValueError(f"CSV must contain columns: ticker (or symbol), shares, purchase_price")

        # Parse holdings
        holdings = []
        for _, row in df.iterrows():
            holding = PortfolioHolding(
                ticker=str(row['ticker']).strip().upper(),
                shares=float(row['shares']),
                purchase_price=float(row['purchase_price'])
            )
            holdings.append(holding)

        if not holdings:
            raise ValueError("CSV contains no valid holdings")

        return holdings

    except pd.errors.EmptyDataError:
        raise ValueError("CSV file is empty")
    except Exception as e:
        raise ValueError(f"Invalid CSV format: {str(e)}")


def calculate_portfolio_value(holdings: List[PortfolioHolding]) -> Tuple[float, Dict[str, Dict]]:
    """
    Calculate current portfolio value and per-ticker breakdown.

    Args:
        holdings: List of portfolio holdings

    Returns:
        Tuple of (total_value, ticker_details)
        ticker_details = {
            "AAPL": {
                "shares": 100,
                "current_price": 180.0,  # Would fetch real price
                "value": 18000.0,
                "cost_basis": 15000.0,
                "gain_loss": 3000.0,
                "sector": "Technology"
            }
        }
    """
    total_value = 0.0
    ticker_details = {}

    for holding in holdings:
        # Get ticker overview for sector info
        overview = get_ticker_overview(holding.ticker)

        # For MVP, use purchase_price as current_price (would use real-time data in production)
        current_price = holding.purchase_price * 1.1  # Mock 10% gain
        value = holding.shares * current_price
        cost_basis = holding.shares * holding.purchase_price
        gain_loss = value - cost_basis

        ticker_details[holding.ticker] = {
            "shares": holding.shares,
            "current_price": current_price,
            "value": value,
            "cost_basis": cost_basis,
            "gain_loss": gain_loss,
            "sector": overview.get("sector", "Unknown") if overview else "Unknown"
        }

        total_value += value

    return total_value, ticker_details


def analyze_sector_allocation(ticker_details: Dict[str, Dict], total_value: float) -> List[Dict]:
    """
    Analyze sector allocation from ticker details.

    Args:
        ticker_details: Ticker breakdown with sector info
        total_value: Total portfolio value

    Returns:
        List of sector allocations with percentage and amount
    """
    sector_totals = {}

    for ticker, details in ticker_details.items():
        sector = details["sector"]
        value = details["value"]

        if sector not in sector_totals:
            sector_totals[sector] = 0.0
        sector_totals[sector] += value

    # Convert to list with percentages
    sectors = []
    for sector, amount in sector_totals.items():
        percentage = (amount / total_value * 100) if total_value > 0 else 0
        sectors.append({
            "sector": sector,
            "percentage": round(percentage, 2),
            "amount": round(amount, 2)
        })

    # Sort by percentage descending
    sectors.sort(key=lambda x: x["percentage"], reverse=True)

    return sectors


def detect_concentration_risks(sectors: List[Dict]) -> List[str]:
    """
    Detect sector concentration risks.

    Args:
        sectors: List of sector allocations

    Returns:
        List of concentrated sector names (>30% allocation)
    """
    concentrated = []

    for sector in sectors:
        if sector["percentage"] > SECTOR_CONCENTRATION_THRESHOLD:
            concentrated.append(sector["sector"])

    return concentrated


def calculate_diversification_score(sectors: List[Dict]) -> float:
    """
    Calculate diversification score (0-1).

    Score based on:
    - Number of sectors (more is better)
    - Even distribution (lower concentration is better)

    Args:
        sectors: List of sector allocations

    Returns:
        Diversification score between 0 and 1
    """
    if not sectors:
        return 0.0

    # Factor 1: Number of sectors (target: 5+)
    num_sectors = len(sectors)
    sector_score = min(1.0, num_sectors / DIVERSIFICATION_TARGET_SECTORS)

    # Factor 2: Concentration (lower is better)
    # Calculate Herfindahl index (sum of squared percentages)
    herfindahl = sum((s["percentage"] / 100) ** 2 for s in sectors)
    # Normalize: 1.0 is perfectly concentrated, 0.0 is perfectly diversified
    # For 10 equal sectors, herfindahl = 0.1, for 1 sector = 1.0
    concentration_score = 1.0 - min(1.0, herfindahl)

    # Combined score (weighted average)
    score = (sector_score * 0.4) + (concentration_score * 0.6)

    return round(score, 2)


def recommend_rebalancing(
    current_sectors: List[Dict],
    ticker_details: Dict[str, Dict],
    total_value: float,
    model_type: str = "balanced"
) -> List[Dict]:
    """
    Generate rebalancing recommendations with AI-powered reasoning.

    Args:
        current_sectors: Current sector allocations
        ticker_details: Ticker breakdown
        total_value: Total portfolio value
        model_type: "conservative", "balanced", or "growth"

    Returns:
        List of rebalancing recommendations with AI-generated reasoning
    """
    model = MODEL_PORTFOLIOS.get(model_type, MODEL_PORTFOLIOS["balanced"])
    recommendations = []

    # Build current allocation map
    current_allocation = {s["sector"]: s["percentage"] for s in current_sectors}

    # Calculate portfolio context for AI
    diversification_score = calculate_diversification_score(current_sectors)
    concentrated_sectors = detect_concentration_risks(current_sectors)
    total_holdings = len(ticker_details)

    portfolio_context = {
        "total_holdings": total_holdings,
        "diversification_score": diversification_score,
        "concentrated_sectors": concentrated_sectors,
        "total_value": total_value
    }

    # Get LLM service
    llm_service = get_llm_service()

    # Find sectors to adjust
    for target_sector, target_pct in model.items():
        current_pct = current_allocation.get(target_sector, 0.0)
        diff = target_pct - current_pct

        if abs(diff) > 5.0:  # Only recommend if difference > 5%
            # Find tickers in this sector
            sector_tickers = [
                ticker for ticker, details in ticker_details.items()
                if details["sector"] == target_sector
            ]

            if diff > 0:  # Need to buy
                action = "buy"
                basic_reasoning = f"Increase {target_sector} allocation from {current_pct:.1f}% to target {target_pct:.1f}%"
            else:  # Need to sell
                action = "sell"
                basic_reasoning = f"Reduce {target_sector} allocation from {current_pct:.1f}% to target {target_pct:.1f}%"

            # Calculate shares (simplified - would be more sophisticated in production)
            target_value = total_value * (target_pct / 100)
            current_value = total_value * (current_pct / 100)
            value_diff = abs(target_value - current_value)

            # Pick a representative ticker
            if sector_tickers:
                ticker = sector_tickers[0]
                current_price = ticker_details[ticker]["current_price"]
                shares = int(value_diff / current_price)
                amount = shares * current_price

                if shares > 0:
                    # Build recommendation
                    recommendation = {
                        "ticker": ticker,
                        "sector": target_sector,
                        "action": action,
                        "shares": shares,
                        "amount": round(amount, 2),
                        "current_percentage": round(current_pct, 2),
                        "target_percentage": round(target_pct, 2)
                    }

                    # Try to generate AI reasoning
                    try:
                        holding = {
                            "ticker": ticker,
                            "shares": ticker_details[ticker]["shares"],
                            "value": ticker_details[ticker]["value"],
                            "sector": target_sector
                        }

                        ai_reasoning = llm_service.generate_rebalancing_reasoning(
                            holding=holding,
                            recommendation=recommendation,
                            model_type=model_type,
                            portfolio_context=portfolio_context
                        )

                        if ai_reasoning:
                            recommendation["reasoning"] = ai_reasoning
                            recommendation["ai_generated"] = True
                            logger.info(f"AI reasoning generated for {ticker}")
                        else:
                            # Fallback to basic reasoning
                            recommendation["reasoning"] = basic_reasoning
                            recommendation["ai_generated"] = False
                            logger.debug(f"Using basic reasoning for {ticker}")

                    except Exception as e:
                        # Fallback to basic reasoning on error
                        logger.error(f"Error generating AI reasoning for {ticker}: {str(e)}")
                        recommendation["reasoning"] = basic_reasoning
                        recommendation["ai_generated"] = False

                    recommendations.append(recommendation)

    return recommendations
