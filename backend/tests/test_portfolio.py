import pytest
from fastapi import status
from io import BytesIO


@pytest.fixture
def auth_token_persona_b(client):
    """Register, login, and assign Persona B."""
    # Register
    client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )

    # Login
    login_response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]

    # Complete onboarding for Persona B
    answers = [
        {"question_id": 1, "answer": "intermediate"},
        {"question_id": 2, "answer": "substantial"},
        {"question_id": 3, "answer": "moderate"},
        {"question_id": 4, "answer": "growth"},
        {"question_id": 5, "answer": "moderate"},
        {"question_id": 6, "answer": "medium"},
        {"question_id": 7, "answer": "concerned"},
        {"question_id": 8, "answer": "analysis"},
        {"question_id": 9, "answer": "important"},
        {"question_id": 10, "answer": "middle"}
    ]
    client.post(
        "/onboarding/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {token}"}
    )

    return token


@pytest.fixture
def sample_csv():
    """Sample portfolio CSV."""
    return """ticker,shares,purchase_price
AAPL,100,150.00
MSFT,50,280.00
SPY,20,400.00"""


@pytest.fixture
def sample_portfolio():
    """Sample portfolio JSON."""
    return {
        "holdings": [
            {"ticker": "AAPL", "shares": 100, "purchase_price": 150.00},
            {"ticker": "MSFT", "shares": 50, "purchase_price": 280.00},
            {"ticker": "SPY", "shares": 20, "purchase_price": 400.00}
        ]
    }


def test_upload_portfolio_csv_success(client, auth_token_persona_b, sample_csv):
    """Test successful CSV portfolio upload."""
    files = {"file": ("portfolio.csv", BytesIO(sample_csv.encode()), "text/csv")}

    response = client.post(
        "/portfolio/upload",
        files=files,
        headers={"Authorization": f"Bearer {auth_token_persona_b}"}
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_value" in data
    assert data["total_value"] > 0
    assert "sectors" in data
    assert len(data["sectors"]) > 0
    assert "concentrated_sectors" in data
    assert "diversification_score" in data
    assert 0 <= data["diversification_score"] <= 1


def test_upload_portfolio_wrong_persona(client):
    """Test portfolio upload restricted to Persona B."""
    # Register and login as Persona A
    client.post(
        "/auth/register",
        json={"email": "persona_a@example.com", "password": "password123"}
    )
    login_response = client.post(
        "/auth/login",
        json={"email": "persona_a@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]

    # Complete onboarding for Persona A
    answers = [
        {"question_id": i, "answer": "beginner" if i == 1 else "no" if i == 2 else "low"}
        for i in range(1, 11)
    ]
    # Fix answers
    answers = [
        {"question_id": 1, "answer": "beginner"},
        {"question_id": 2, "answer": "no"},
        {"question_id": 3, "answer": "low"},
        {"question_id": 4, "answer": "preservation"},
        {"question_id": 5, "answer": "minimal"},
        {"question_id": 6, "answer": "short"},
        {"question_id": 7, "answer": "panic"},
        {"question_id": 8, "answer": "simple"},
        {"question_id": 9, "answer": "critical"},
        {"question_id": 10, "answer": "older"}
    ]
    client.post(
        "/onboarding/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {token}"}
    )

    # Try to upload portfolio
    csv_content = "ticker,shares,purchase_price\nAAPL,100,150.00"
    files = {"file": ("portfolio.csv", BytesIO(csv_content.encode()), "text/csv")}

    response = client.post(
        "/portfolio/upload",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_upload_portfolio_invalid_csv(client, auth_token_persona_b):
    """Test upload with invalid CSV format."""
    invalid_csv = "invalid,format\nno,headers"
    files = {"file": ("portfolio.csv", BytesIO(invalid_csv.encode()), "text/csv")}

    response = client.post(
        "/portfolio/upload",
        files=files,
        headers={"Authorization": f"Bearer {auth_token_persona_b}"}
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_analyze_portfolio_json(client, auth_token_persona_b, sample_portfolio):
    """Test portfolio analysis with JSON payload."""
    response = client.post(
        "/portfolio/analyze",
        json=sample_portfolio,
        headers={"Authorization": f"Bearer {auth_token_persona_b}"}
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_value" in data
    assert "sectors" in data
    assert len(data["sectors"]) > 0

    # Check sector structure
    sector = data["sectors"][0]
    assert "sector" in sector
    assert "percentage" in sector
    assert "amount" in sector


def test_sector_allocation(client, auth_token_persona_b, sample_portfolio):
    """Test sector allocation calculation."""
    response = client.post(
        "/portfolio/analyze",
        json=sample_portfolio,
        headers={"Authorization": f"Bearer {auth_token_persona_b}"}
    )

    data = response.json()
    sectors = data["sectors"]

    # Total percentage should be ~100%
    total_pct = sum(s["percentage"] for s in sectors)
    assert 99 <= total_pct <= 101  # Allow for rounding


def test_concentration_detection(client, auth_token_persona_b):
    """Test concentration risk detection."""
    # Portfolio heavily concentrated in Technology
    concentrated_portfolio = {
        "holdings": [
            {"ticker": "AAPL", "shares": 1000, "purchase_price": 150.00},
            {"ticker": "MSFT", "shares": 500, "purchase_price": 280.00},
            {"ticker": "SPY", "shares": 10, "purchase_price": 400.00}
        ]
    }

    response = client.post(
        "/portfolio/analyze",
        json=concentrated_portfolio,
        headers={"Authorization": f"Bearer {auth_token_persona_b}"}
    )

    data = response.json()
    # Should detect Technology concentration
    assert len(data["concentrated_sectors"]) > 0


def test_rebalancing_recommendations(client, auth_token_persona_b, sample_portfolio):
    """Test rebalancing recommendations generation."""
    response = client.post(
        "/portfolio/rebalance?model_type=balanced",
        json=sample_portfolio,
        headers={"Authorization": f"Bearer {auth_token_persona_b}"}
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["model_type"] == "balanced"
    assert "current_allocation" in data
    assert "target_allocation" in data
    assert "recommendations" in data

    # Check recommendation structure
    if data["recommendations"]:
        rec = data["recommendations"][0]
        assert "ticker" in rec
        assert "action" in rec
        assert rec["action"] in ["buy", "sell"]
        assert "shares" in rec
        assert "current_percentage" in rec
        assert "target_percentage" in rec
        assert "reasoning" in rec


def test_rebalancing_model_types(client, auth_token_persona_b, sample_portfolio):
    """Test different rebalancing model types."""
    for model_type in ["conservative", "balanced", "growth"]:
        response = client.post(
            f"/portfolio/rebalance?model_type={model_type}",
            json=sample_portfolio,
            headers={"Authorization": f"Bearer {auth_token_persona_b}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["model_type"] == model_type


def test_rebalancing_invalid_model(client, auth_token_persona_b, sample_portfolio):
    """Test rebalancing with invalid model type."""
    response = client.post(
        "/portfolio/rebalance?model_type=invalid",
        json=sample_portfolio,
        headers={"Authorization": f"Bearer {auth_token_persona_b}"}
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
