import pytest
from fastapi import status
from app.market_data import clear_cache


@pytest.fixture
def auth_token(client):
    """Register and login to get auth token."""
    client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    return response.json()["access_token"]


@pytest.fixture(autouse=True)
def reset_cache():
    """Clear cache before each test."""
    clear_cache()
    yield
    clear_cache()


def test_search_ticker_success(client, auth_token):
    """Test successful ticker search."""
    response = client.get(
        "/market/search?q=AAPL",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "symbol" in data[0]
    assert "name" in data[0]


def test_search_ticker_apple(client, auth_token):
    """Test searching by company name."""
    response = client.get(
        "/market/search?q=Apple",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) > 0
    # Should find Apple Inc
    symbols = [item["symbol"] for item in data]
    assert "AAPL" in symbols


def test_search_ticker_short_query(client, auth_token):
    """Test search with query too short fails."""
    response = client.get(
        "/market/search?q=A",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_search_ticker_no_auth(client):
    """Test search without authentication fails."""
    response = client.get("/market/search?q=AAPL")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_ticker_details_success(client, auth_token):
    """Test getting ticker details."""
    response = client.get(
        "/market/ticker/AAPL",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["symbol"] == "AAPL"
    assert "name" in data
    assert "sector" in data
    assert "industry" in data
    assert "market_cap" in data
    assert "description" in data


def test_get_ticker_details_etf(client, auth_token):
    """Test getting ETF details."""
    response = client.get(
        "/market/ticker/SPY",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["symbol"] == "SPY"
    assert "ETF" in data.get("name", "") or "ETF" in data.get("industry", "")


def test_get_ticker_details_not_found(client, auth_token):
    """Test getting details for non-existent ticker."""
    response = client.get(
        "/market/ticker/INVALID123",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_ticker_details_no_auth(client):
    """Test getting ticker details without authentication fails."""
    response = client.get("/market/ticker/AAPL")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_cache_functionality(client, auth_token):
    """Test that caching works for repeated requests."""
    # First request
    response1 = client.get(
        "/market/ticker/AAPL",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response1.status_code == status.HTTP_200_OK
    data1 = response1.json()

    # Second request (should be cached)
    response2 = client.get(
        "/market/ticker/AAPL",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response2.status_code == status.HTTP_200_OK
    data2 = response2.json()

    # Should return same data
    assert data1 == data2


def test_get_historical_data_success(client, auth_token):
    """Test getting historical data for a ticker."""
    response = client.get(
        "/market/ticker/AAPL/history?time_range=1y",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Verify response structure
    assert data["symbol"] == "AAPL"
    assert data["time_range"] == "1y"
    assert data["granularity"] == "weekly"
    assert "data" in data
    assert len(data["data"]) > 0

    # Verify data point structure
    first_point = data["data"][0]
    assert "date" in first_point
    assert "open" in first_point
    assert "high" in first_point
    assert "low" in first_point
    assert "close" in first_point
    assert "volume" in first_point
    assert "percentage_change" in first_point


def test_historical_data_percentage_calculation(client, auth_token):
    """Test that percentage change is calculated correctly from baseline."""
    response = client.get(
        "/market/ticker/AAPL/history?time_range=1y",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    data_points = data["data"]
    assert len(data_points) > 0

    # First data point should have 0% change (baseline)
    first_point = data_points[0]
    assert first_point["percentage_change"] == 0.0

    # Verify percentage calculation for subsequent points
    baseline_price = first_point["close"]
    for i, point in enumerate(data_points):
        expected_pct = ((point["close"] - baseline_price) / baseline_price) * 100
        # Allow small rounding difference (0.01%)
        assert abs(point["percentage_change"] - expected_pct) < 0.01, \
            f"Point {i}: Expected {expected_pct:.2f}%, got {point['percentage_change']}%"


def test_historical_data_different_time_ranges(client, auth_token):
    """Test historical data with different time ranges."""
    time_ranges = ["1y", "3y", "5y", "10y"]

    for time_range in time_ranges:
        response = client.get(
            f"/market/ticker/AAPL/history?time_range={time_range}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["time_range"] == time_range
        assert len(data["data"]) > 0

        # Verify all points have percentage_change
        for point in data["data"]:
            assert "percentage_change" in point
            assert isinstance(point["percentage_change"], (int, float))


def test_historical_data_granularity(client, auth_token):
    """Test that granularity is correct for different time ranges."""
    # 1 year should be weekly
    response = client.get(
        "/market/ticker/AAPL/history?time_range=1y",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["granularity"] == "weekly"

    # 3+ years should be monthly
    response = client.get(
        "/market/ticker/AAPL/history?time_range=3y",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["granularity"] == "monthly"


def test_historical_data_invalid_ticker(client, auth_token):
    """Test historical data for invalid ticker."""
    response = client.get(
        "/market/ticker/INVALID123/history?time_range=1y",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    # Should still return data (mock data for unknown tickers)
    # or return 404 depending on implementation
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]


def test_historical_data_no_auth(client):
    """Test getting historical data without authentication fails."""
    response = client.get("/market/ticker/AAPL/history?time_range=1y")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
