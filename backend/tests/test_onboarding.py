import pytest
from fastapi import status


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


def test_get_questionnaire(client):
    """Test getting the onboarding questionnaire."""
    response = client.get("/onboarding/questionnaire")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "questions" in data
    assert len(data["questions"]) == 10
    # Check first question structure
    assert data["questions"][0]["id"] == 1
    assert "question" in data["questions"][0]
    assert "options" in data["questions"][0]


def test_submit_onboarding_persona_a(client, auth_token):
    """Test persona A classification (Starter - low risk)."""
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

    response = client.post(
        "/onboarding/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["persona"] == "A"
    assert 0 < data["confidence"] <= 1.0
    assert "reasoning" in data


def test_submit_onboarding_persona_b(client, auth_token):
    """Test persona B classification (Rebalance - moderate risk)."""
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

    response = client.post(
        "/onboarding/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["persona"] == "B"
    assert 0 < data["confidence"] <= 1.0
    assert "reasoning" in data


def test_submit_onboarding_persona_c(client, auth_token):
    """Test persona C classification (Moonshot - high risk)."""
    answers = [
        {"question_id": 1, "answer": "advanced"},
        {"question_id": 2, "answer": "substantial"},
        {"question_id": 3, "answer": "high"},
        {"question_id": 4, "answer": "aggressive"},
        {"question_id": 5, "answer": "active"},
        {"question_id": 6, "answer": "long"},
        {"question_id": 7, "answer": "opportunity"},
        {"question_id": 8, "answer": "ideas"},
        {"question_id": 9, "answer": "flexible"},
        {"question_id": 10, "answer": "young"}
    ]

    response = client.post(
        "/onboarding/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["persona"] == "C"
    assert 0 < data["confidence"] <= 1.0
    assert "reasoning" in data


def test_submit_onboarding_incomplete(client, auth_token):
    """Test submitting incomplete answers fails."""
    answers = [
        {"question_id": 1, "answer": "beginner"},
        {"question_id": 2, "answer": "no"}
    ]

    response = client.post(
        "/onboarding/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_submit_onboarding_no_auth(client):
    """Test submitting without authentication fails."""
    answers = [
        {"question_id": i, "answer": "beginner"} for i in range(1, 11)
    ]

    response = client.post(
        "/onboarding/submit",
        json={"answers": answers}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_persona_after_onboarding(client, auth_token):
    """Test getting persona after completing onboarding."""
    # Submit onboarding
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
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    # Get persona
    response = client.get(
        "/onboarding/persona",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["persona"] == "A"


def test_get_persona_before_onboarding(client, auth_token):
    """Test getting persona before onboarding fails."""
    response = client.get(
        "/onboarding/persona",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
