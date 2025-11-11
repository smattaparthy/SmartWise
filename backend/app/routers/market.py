from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List

from ..schemas import TickerSearch, TickerDetail, HistoricalDataResponse
from ..market_data import search_ticker, get_ticker_overview, get_historical_data
from ..auth import get_current_user
from ..models import User

router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/search", response_model=List[TickerSearch])
def search_tickers(
    q: str,
    current_user: User = Depends(get_current_user)
):
    """
    Search for tickers by symbol or company name.

    Args:
        q: Search query (e.g., "Apple" or "AAPL")

    Returns:
        List of matching tickers with symbol, name, type, region
    """
    if not q or len(q) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 2 characters"
        )

    results = search_ticker(q)
    return results


@router.get("/ticker/{symbol}", response_model=TickerDetail)
def get_ticker_details(
    symbol: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific ticker.

    Args:
        symbol: Ticker symbol (e.g., "AAPL")

    Returns:
        Detailed ticker information including sector, industry, market cap, description
    """
    if not symbol or len(symbol) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ticker symbol"
        )

    overview = get_ticker_overview(symbol.upper())

    if not overview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticker {symbol} not found"
        )

    return overview


@router.get("/ticker/{symbol}/history", response_model=HistoricalDataResponse)
def get_ticker_history(
    symbol: str,
    time_range: str = Query("1y", regex="^(1y|3y|5y|10y)$"),
    current_user: User = Depends(get_current_user)
):
    """
    Get historical time-series data for a ticker with appropriate granularity.

    Granularity rules:
    - 1 year: Weekly data
    - 3, 5, 10 years: Monthly data

    Args:
        symbol: Ticker symbol (e.g., "AAPL")
        time_range: Time range - "1y", "3y", "5y", or "10y" (default: "1y")

    Returns:
        Historical data with symbol, time_range, granularity, and list of data points
    """
    if not symbol or len(symbol) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ticker symbol"
        )

    historical_data = get_historical_data(symbol.upper(), time_range)

    if not historical_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Historical data for {symbol} not available"
        )

    return historical_data
