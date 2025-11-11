"""
Alpha Vantage API integration for market data.

This module provides a caching layer for ticker metadata and search functionality.
Caching reduces API calls and improves performance.
"""

import os
import requests
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import json

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")
ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

# Simple in-memory cache (would use Redis in production)
_cache = {}
CACHE_TTL = timedelta(hours=24)


def _get_from_cache(key: str) -> Optional[Dict]:
    """Get data from cache if not expired."""
    if key in _cache:
        data, timestamp = _cache[key]
        if datetime.utcnow() - timestamp < CACHE_TTL:
            return data
        else:
            del _cache[key]
    return None


def _set_cache(key: str, data: Dict):
    """Set data in cache with timestamp."""
    _cache[key] = (data, datetime.utcnow())


def search_ticker(query: str) -> List[Dict]:
    """
    Search for tickers matching the query.

    Args:
        query: Search term (company name or ticker symbol)

    Returns:
        List of matching tickers with symbol, name, type, region
    """
    cache_key = f"search:{query.lower()}"
    cached = _get_from_cache(cache_key)
    if cached:
        return cached

    if not ALPHA_VANTAGE_API_KEY:
        # Return mock data if no API key for development
        return _mock_search_results(query)

    try:
        params = {
            "function": "SYMBOL_SEARCH",
            "keywords": query,
            "apikey": ALPHA_VANTAGE_API_KEY
        }
        response = requests.get(ALPHA_VANTAGE_BASE_URL, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()
        matches = data.get("bestMatches", [])

        results = [
            {
                "symbol": match.get("1. symbol"),
                "name": match.get("2. name"),
                "type": match.get("3. type"),
                "region": match.get("4. region")
            }
            for match in matches[:10]  # Limit to top 10
        ]

        _set_cache(cache_key, results)
        return results

    except Exception as e:
        print(f"Error searching ticker: {e}")
        return _mock_search_results(query)


def get_ticker_overview(symbol: str) -> Optional[Dict]:
    """
    Get detailed overview of a ticker.

    Args:
        symbol: Ticker symbol (e.g., "AAPL")

    Returns:
        Dict with symbol details including sector, industry, market cap, description
    """
    cache_key = f"overview:{symbol.upper()}"
    cached = _get_from_cache(cache_key)
    if cached:
        return cached

    if not ALPHA_VANTAGE_API_KEY:
        return _mock_ticker_overview(symbol)

    try:
        params = {
            "function": "OVERVIEW",
            "symbol": symbol,
            "apikey": ALPHA_VANTAGE_API_KEY
        }
        response = requests.get(ALPHA_VANTAGE_BASE_URL, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()

        # Check if we got valid data (API returns empty dict or error message on failure)
        if not data or "Symbol" not in data or "Note" in data or "Error Message" in data:
            # Fall back to mock data if API fails or rate limited
            print(f"Alpha Vantage API unavailable for {symbol}, using mock data")
            return _mock_ticker_overview(symbol)

        result = {
            "symbol": data.get("Symbol"),
            "name": data.get("Name"),
            "sector": data.get("Sector"),
            "industry": data.get("Industry"),
            "market_cap": float(data.get("MarketCapitalization", 0)),
            "description": data.get("Description", "")
        }

        _set_cache(cache_key, result)
        return result

    except Exception as e:
        print(f"Error fetching ticker overview for {symbol}: {e}")
        return _mock_ticker_overview(symbol)


def get_sector_allocation(tickers: List[str]) -> Dict[str, float]:
    """
    Get sector allocation for a list of tickers.

    Args:
        tickers: List of ticker symbols

    Returns:
        Dict mapping sector name to percentage allocation
    """
    sector_counts = {}
    total = 0

    for ticker in tickers:
        overview = get_ticker_overview(ticker)
        if overview and overview.get("sector"):
            sector = overview["sector"]
            sector_counts[sector] = sector_counts.get(sector, 0) + 1
            total += 1

    if total == 0:
        return {}

    return {
        sector: (count / total) * 100
        for sector, count in sector_counts.items()
    }


def _mock_search_results(query: str) -> List[Dict]:
    """Mock search results for development without API key."""
    mock_data = {
        "AAPL": {"symbol": "AAPL", "name": "Apple Inc", "type": "Equity", "region": "United States"},
        "MSFT": {"symbol": "MSFT", "name": "Microsoft Corporation", "type": "Equity", "region": "United States"},
        "GOOGL": {"symbol": "GOOGL", "name": "Alphabet Inc", "type": "Equity", "region": "United States"},
        "AMZN": {"symbol": "AMZN", "name": "Amazon.com Inc", "type": "Equity", "region": "United States"},
        "TSLA": {"symbol": "TSLA", "name": "Tesla Inc", "type": "Equity", "region": "United States"},
        "SPY": {"symbol": "SPY", "name": "SPDR S&P 500 ETF Trust", "type": "ETF", "region": "United States"},
        "VTI": {"symbol": "VTI", "name": "Vanguard Total Stock Market ETF", "type": "ETF", "region": "United States"},
    }

    query_upper = query.upper()
    results = []

    for symbol, data in mock_data.items():
        if query_upper in symbol or query_upper in data["name"].upper():
            results.append(data)

    return results


def _mock_ticker_overview(symbol: str) -> Optional[Dict]:
    """Mock ticker overview for development without API key."""
    mock_data = {
        "AAPL": {
            "symbol": "AAPL",
            "name": "Apple Inc",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "market_cap": 2800000000000.0,
            "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
        },
        "MSFT": {
            "symbol": "MSFT",
            "name": "Microsoft Corporation",
            "sector": "Technology",
            "industry": "Software",
            "market_cap": 2500000000000.0,
            "description": "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide."
        },
        "NVDA": {
            "symbol": "NVDA",
            "name": "NVIDIA Corporation",
            "sector": "Technology",
            "industry": "Semiconductors",
            "market_cap": 1800000000000.0,
            "description": "NVIDIA Corporation provides graphics and compute solutions."
        },
        "INTC": {
            "symbol": "INTC",
            "name": "Intel Corporation",
            "sector": "Technology",
            "industry": "Semiconductors",
            "market_cap": 180000000000.0,
            "description": "Intel Corporation designs and manufactures computing and communications products."
        },
        "LLY": {
            "symbol": "LLY",
            "name": "Eli Lilly and Company",
            "sector": "Healthcare",
            "industry": "Pharmaceuticals",
            "market_cap": 650000000000.0,
            "description": "Eli Lilly and Company discovers, develops, and markets pharmaceutical products."
        },
        "SPY": {
            "symbol": "SPY",
            "name": "SPDR S&P 500 ETF Trust",
            "sector": "Index Fund",
            "industry": "ETF",
            "market_cap": 400000000000.0,
            "description": "SPDR S&P 500 ETF Trust seeks to provide investment results that correspond to the price and yield performance of the S&P 500 Index."
        },
        "VTI": {
            "symbol": "VTI",
            "name": "Vanguard Total Stock Market ETF",
            "sector": "Index Fund",
            "industry": "ETF",
            "market_cap": 300000000000.0,
            "description": "Vanguard Total Stock Market ETF seeks to track the performance of the CRSP US Total Market Index."
        }
    }

    return mock_data.get(symbol.upper())


def clear_cache():
    """Clear the entire cache. Useful for testing."""
    global _cache
    _cache = {}
