import pytest
from fastapi import status


def test_register_success(client):
    """Test successful user registration."""
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert data["persona"] is None


def test_register_duplicate_email(client):
    """Test registration with duplicate email fails."""
    # Register first user
    client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )

    # Try to register again with same email
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "different_password"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already registered" in response.json()["detail"].lower()


def test_login_success(client):
    """Test successful login."""
    # Register user
    client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )

    # Login
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    """Test login with wrong password fails."""
    # Register user
    client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )

    # Try to login with wrong password
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "wrong_password"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_login_nonexistent_user(client):
    """Test login with non-existent user fails."""
    response = client.post(
        "/auth/login",
        json={"email": "nonexistent@example.com", "password": "password123"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_me_success(client):
    """Test getting current user info."""
    # Register and login
    client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    login_response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]

    # Get current user
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "test@example.com"


def test_get_me_no_token(client):
    """Test getting current user without token fails."""
    response = client.get("/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_me_invalid_token(client):
    """Test getting current user with invalid token fails."""
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
