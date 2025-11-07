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
