# Investing Assistant MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local containerized 3-persona investing assistant that guides users from onboarding through personalized portfolio recommendations with RAG-backed research.

**Architecture:** FastAPI backend + Next.js frontend, SQLite DB, Chroma vector store, Docker Compose deployment, market data adapter with caching, JWT auth.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy, Chroma, Next.js 14 (App Router), React, Tailwind CSS, Ant Design Charts, Docker

---

## Phase 1: Project Setup & Infrastructure

### Task 1.1: Backend Project Structure

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/database.py`
- Create: `backend/app/models.py`
- Create: `backend/app/schemas.py`
- Create: `backend/requirements.txt`
- Create: `backend/Dockerfile`
- Create: `backend/.env.example`

**Step 1: Write requirements.txt**

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
chromadb==0.4.18
pandas==2.1.3
requests==2.31.0
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
```

**Step 2: Write backend Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 3: Write database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Step 4: Write models.py**

```python
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    suggested_persona = Column(String, nullable=True)
    risk_score = Column(Integer, nullable=True)
    experience_level = Column(Integer, nullable=True)
    time_horizon = Column(JSON, nullable=True)
    max_risk_allocation_pct = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ResearchDoc(Base):
    __tablename__ = "research_docs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    path = Column(String, nullable=False)
    sector = Column(String, nullable=True)
    tags = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

**Step 5: Write basic main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Investing Assistant API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Investing Assistant API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
```

**Step 6: Write .env.example**

```env
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=sqlite:///./app.db
CHROMA_PERSIST_DIR=/data/chroma_store
FILES_BASE_PATH=/data/research
ALPHA_VANTAGE_API_KEY=demo
```

**Step 7: Test backend starts**

Run: `cd backend && uvicorn app.main:app --reload`
Expected: Server starts on http://localhost:8200, GET / returns JSON

**Step 8: Commit**

```bash
git add backend/
git commit -m "feat: initialize backend project structure

- Add FastAPI app with database models
- Configure SQLAlchemy with SQLite
- Add User and ResearchDoc models
- Setup CORS for frontend
- Add Dockerfile and requirements"
```

### Task 1.2: Frontend Project Structure

**Files:**
- Create: `frontend/` (via create-next-app)
- Create: `frontend/Dockerfile`
- Create: `frontend/.env.local.example`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/components/.gitkeep`
- Create: `frontend/lib/.gitkeep`

**Step 1: Create Next.js app**

Run: `npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir`
Expected: Next.js project created in frontend/

**Step 2: Install additional dependencies**

Run: `cd frontend && npm install @ant-design/plots`
Expected: Package installed successfully

**Step 3: Write frontend Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Run application
CMD ["npm", "start"]
```

**Step 4: Write .env.local.example**

```env
NEXT_PUBLIC_API_BASE=http://localhost:8200
```

**Step 5: Update tailwind.config.ts with custom colors**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f5f5f6',
        surface: '#ffffff',
        'text-primary': '#0f172a',
        'text-muted': '#6b7280',
        accent: '#2563eb',
        warning: '#f97316',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}
export default config
```

**Step 6: Test frontend starts**

Run: `cd frontend && npm run dev`
Expected: Server starts on http://localhost:3200

**Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: initialize frontend project structure

- Create Next.js 14 with App Router
- Configure Tailwind CSS with custom theme
- Add Ant Design Charts dependency
- Add Dockerfile for containerization
- Configure environment variables"
```

### Task 1.3: Docker Compose Setup

**Files:**
- Create: `docker-compose.yml`
- Create: `data/research/.gitkeep`
- Create: `data/chroma_store/.gitkeep`
- Create: `.dockerignore` (root)
- Create: `README.md`

**Step 1: Write docker-compose.yml**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8200:8000"
    volumes:
      - ./data/research:/data/research
      - ./data/chroma_store:/data/chroma_store
      - ./backend/app.db:/app/app.db
    environment:
      - SECRET_KEY=dev-secret-key-change-in-production
      - DATABASE_URL=sqlite:///./app.db
      - CHROMA_PERSIST_DIR=/data/chroma_store
      - FILES_BASE_PATH=/data/research
      - ALPHA_VANTAGE_API_KEY=demo
    networks:
      - investing-network

  frontend:
    build: ./frontend
    ports:
      - "3200:3000"
    environment:
      - NEXT_PUBLIC_API_BASE=http://localhost:8200
    depends_on:
      - backend
    networks:
      - investing-network

networks:
  investing-network:
    driver: bridge

volumes:
  research_data:
  chroma_data:
```

**Step 2: Create data directories**

Run: `mkdir -p data/research data/chroma_store`
Expected: Directories created

**Step 3: Write root .dockerignore**

```
**/.git
**/node_modules
**/dist
**/build
**/__pycache__
**/*.pyc
**/.env
**/.DS_Store
**/app.db
```

**Step 4: Write README.md**

```markdown
# Investing Assistant MVP

A guided 3-persona investing assistant that classifies users and provides personalized portfolio guidance.

## Quick Start

1. Clone the repository
2. Run: `docker compose build`
3. Run: `docker compose up`
4. Open: http://localhost:3200

## Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Architecture

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy
- **Database**: SQLite (MVP)
- **Vector Store**: Chroma (local)
- **Deployment**: Docker Compose

## Personas

- **A (Starter)**: Index funds + SIP for beginners
- **B (Rebalance)**: CSV portfolio analysis with rebalancing suggestions
- **C (Moonshot)**: RAG-backed high-risk frontier ideas
```

**Step 5: Test docker compose build**

Run: `docker compose build`
Expected: Both services build successfully

**Step 6: Commit**

```bash
git add docker-compose.yml data/ .dockerignore README.md
git commit -m "feat: add docker compose configuration

- Configure backend and frontend services
- Mount data volumes for research and vector store
- Setup networking between services
- Add development README
- Create data directories"
```

---

## Phase 2: Authentication & User Management

### Task 2.1: Auth Utilities

**Files:**
- Create: `backend/app/auth.py`
- Create: `backend/app/schemas.py` (extend)

**Step 1: Write test for password hashing**

Create: `backend/tests/test_auth.py`

```python
from app.auth import hash_password, verify_password

def test_password_hashing():
    password = "secret123"
    hashed = hash_password(password)
    assert verify_password(password, hashed) == True
    assert verify_password("wrong", hashed) == False
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_auth.py -v`
Expected: FAIL with "No module named 'app.auth'"

**Step 3: Write auth.py with password utilities**

```python
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

**Step 4: Run test to verify it passes**

Run: `cd backend && pytest tests/test_auth.py -v`
Expected: PASS

**Step 5: Write auth schemas**

Extend: `backend/app/schemas.py`

```python
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    email: str
    suggested_persona: Optional[str]
    risk_score: Optional[int]
    experience_level: Optional[int]
    time_horizon: Optional[Dict]
    max_risk_allocation_pct: Optional[int]

    class Config:
        from_attributes = True
```

**Step 6: Commit**

```bash
git add backend/app/auth.py backend/app/schemas.py backend/tests/
git commit -m "feat: add authentication utilities

- Implement password hashing with bcrypt
- Add JWT token creation and verification
- Create auth schemas for user operations
- Add tests for password hashing"
```

### Task 2.2: Auth Endpoints

**Files:**
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/auth.py`
- Modify: `backend/app/main.py`

**Step 1: Write test for signup endpoint**

Create: `backend/tests/test_auth_endpoints.py`

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_signup_creates_user():
    response = client.post(
        "/auth/signup",
        json={"email": "test@example.com", "password": "secret123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_auth_endpoints.py::test_signup_creates_user -v`
Expected: FAIL with 404

**Step 3: Write auth router**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, Token, UserResponse
from ..auth import hash_password, verify_password, create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create user
    hashed_password = hash_password(user.password)
    new_user = User(
        email=user.email,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    return user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
```

**Step 4: Include router in main app**

Modify: `backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Investing Assistant API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "Investing Assistant API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
```

**Step 5: Run test to verify it passes**

Run: `cd backend && pytest tests/test_auth_endpoints.py::test_signup_creates_user -v`
Expected: PASS

**Step 6: Test login endpoint**

Write test in `backend/tests/test_auth_endpoints.py`:

```python
def test_login_returns_token():
    # First signup
    client.post(
        "/auth/signup",
        json={"email": "login@example.com", "password": "secret123"}
    )

    # Then login
    response = client.post(
        "/auth/login",
        data={"username": "login@example.com", "password": "secret123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
```

Run: `cd backend && pytest tests/test_auth_endpoints.py::test_login_returns_token -v`
Expected: PASS

**Step 7: Commit**

```bash
git add backend/app/routers/ backend/app/main.py backend/tests/
git commit -m "feat: add authentication endpoints

- Implement /auth/signup endpoint
- Implement /auth/login with OAuth2 password flow
- Add /auth/me to get current user
- Create get_current_user dependency
- Add tests for signup and login flows"
```

---

## Phase 3: Onboarding & Persona Classification

### Task 3.1: Onboarding Logic

**Files:**
- Create: `backend/app/routers/onboarding.py`
- Create: `backend/app/schemas.py` (extend)

**Step 1: Write test for persona A classification**

Create: `backend/tests/test_onboarding.py`

```python
def test_low_experience_gets_persona_a():
    from app.routers.onboarding import classify_persona, OnboardingAnswers

    answers = OnboardingAnswers(
        q1_experience="a",  # new
        q2_has_portfolio="a",  # no portfolio
        q3_goal="a",  # simple
        q4_horizon="b",
        q5_risk_reaction="b",
        q6_max_risk_pct="a",  # 5%
        q7_contribution="a",
        q8_concentration="a",
        q9_frontier_interest="a",
        q10_guidance_style="a"
    )

    persona, risk, exp = classify_persona(answers)
    assert persona == "A"
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_onboarding.py -v`
Expected: FAIL with "No module named 'app.routers.onboarding'"

**Step 3: Write onboarding schemas**

Extend: `backend/app/schemas.py`

```python
class OnboardingAnswers(BaseModel):
    q1_experience: str  # a/b/c/d
    q2_has_portfolio: str
    q3_goal: str
    q4_horizon: str
    q5_risk_reaction: str
    q6_max_risk_pct: str
    q7_contribution: str
    q8_concentration: str
    q9_frontier_interest: str
    q10_guidance_style: str

class OnboardingResult(BaseModel):
    suggested_persona: str
    risk_score: int
    experience_level: int
    time_horizon: Dict[str, int]
    max_risk_allocation_pct: int
```

**Step 4: Write onboarding router with classification logic**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import OnboardingAnswers, OnboardingResult
from ..routers.auth import get_current_user

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

def compute_risk_score(answers: OnboardingAnswers) -> int:
    score = 0

    # q1_experience: a=0, b=15, c=25, d=35
    exp_map = {"a": 0, "b": 15, "c": 25, "d": 35}
    score += exp_map.get(answers.q1_experience, 0)

    # q5_risk_reaction: a=0, b=10, c=20, d=30
    risk_map = {"a": 0, "b": 10, "c": 20, "d": 30}
    score += risk_map.get(answers.q5_risk_reaction, 0)

    # q6_max_risk_pct: a=5, b=10, c=15, d=20
    max_risk_map = {"a": 5, "b": 10, "c": 15, "d": 20}
    score += max_risk_map.get(answers.q6_max_risk_pct, 0)

    # q9_frontier_interest: a=0, b=10, c=20, d=30
    frontier_map = {"a": 0, "b": 10, "c": 20, "d": 30}
    score += frontier_map.get(answers.q9_frontier_interest, 0)

    return min(score, 100)

def compute_experience_level(answers: OnboardingAnswers) -> int:
    # 1=beginner, 2=intermediate, 3=advanced
    exp_map = {"a": 1, "b": 1, "c": 2, "d": 3}
    return exp_map.get(answers.q1_experience, 1)

def compute_time_horizon(answers: OnboardingAnswers) -> dict:
    # q4_horizon: a=short, b=mid, c=long, d=mixed
    horizon_map = {
        "a": {"short_term": 80, "mid_term": 15, "long_term": 5},
        "b": {"short_term": 30, "mid_term": 50, "long_term": 20},
        "c": {"short_term": 10, "mid_term": 30, "long_term": 60},
        "d": {"short_term": 30, "mid_term": 30, "long_term": 40},
    }
    return horizon_map.get(answers.q4_horizon, horizon_map["d"])

def compute_max_risk_pct(answers: OnboardingAnswers) -> int:
    # q6_max_risk_pct: a=5, b=10, c=20, d=25
    risk_map = {"a": 5, "b": 10, "c": 20, "d": 25}
    return risk_map.get(answers.q6_max_risk_pct, 10)

def classify_persona(answers: OnboardingAnswers) -> tuple:
    risk_score = compute_risk_score(answers)
    exp_level = compute_experience_level(answers)

    # Persona A: Low experience OR simple intent
    if exp_level == 1 or answers.q3_goal == "a":
        return "A", risk_score, exp_level

    # Persona C: High risk (≥60) AND frontier interest
    if risk_score >= 60 and answers.q9_frontier_interest in ["c", "d"]:
        return "C", risk_score, exp_level

    # Persona B: Has portfolio OR rebalance intent
    if answers.q2_has_portfolio in ["c", "d"] or answers.q3_goal == "b":
        return "B", risk_score, exp_level

    # Default to B
    return "B", risk_score, exp_level

@router.post("/answers", response_model=OnboardingResult)
def submit_onboarding(
    answers: OnboardingAnswers,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    persona, risk_score, exp_level = classify_persona(answers)
    time_horizon = compute_time_horizon(answers)
    max_risk_pct = compute_max_risk_pct(answers)

    # Update user
    current_user.suggested_persona = persona
    current_user.risk_score = risk_score
    current_user.experience_level = exp_level
    current_user.time_horizon = time_horizon
    current_user.max_risk_allocation_pct = max_risk_pct

    db.commit()

    return OnboardingResult(
        suggested_persona=persona,
        risk_score=risk_score,
        experience_level=exp_level,
        time_horizon=time_horizon,
        max_risk_allocation_pct=max_risk_pct
    )
```

**Step 5: Run test to verify it passes**

Run: `cd backend && pytest tests/test_onboarding.py -v`
Expected: PASS

**Step 6: Add more classification tests**

Extend: `backend/tests/test_onboarding.py`

```python
def test_high_risk_frontier_gets_persona_c():
    from app.routers.onboarding import classify_persona, OnboardingAnswers

    answers = OnboardingAnswers(
        q1_experience="d",  # expert
        q2_has_portfolio="d",
        q3_goal="c",  # moonshot
        q4_horizon="c",
        q5_risk_reaction="d",  # high risk
        q6_max_risk_pct="d",  # 25%
        q7_contribution="c",
        q8_concentration="c",
        q9_frontier_interest="d",  # very interested
        q10_guidance_style="c"
    )

    persona, risk, exp = classify_persona(answers)
    assert persona == "C"
    assert risk >= 60

def test_has_portfolio_gets_persona_b():
    from app.routers.onboarding import classify_persona, OnboardingAnswers

    answers = OnboardingAnswers(
        q1_experience="c",
        q2_has_portfolio="c",  # yes
        q3_goal="b",  # rebalance
        q4_horizon="b",
        q5_risk_reaction="b",
        q6_max_risk_pct="b",
        q7_contribution="b",
        q8_concentration="b",
        q9_frontier_interest="b",
        q10_guidance_style="b"
    )

    persona, risk, exp = classify_persona(answers)
    assert persona == "B"
```

Run: `cd backend && pytest tests/test_onboarding.py -v`
Expected: All tests PASS

**Step 7: Include router in main app**

Modify: `backend/app/main.py`

```python
from .routers import auth, onboarding

# ... existing code ...

app.include_router(auth.router)
app.include_router(onboarding.router)
```

**Step 8: Commit**

```bash
git add backend/app/routers/onboarding.py backend/app/schemas.py backend/app/main.py backend/tests/
git commit -m "feat: add onboarding questionnaire logic

- Implement persona classification algorithm
- Calculate risk score from 10 questions
- Compute experience level and time horizon
- Store results in user profile
- Add comprehensive tests for all personas"
```

---

## Phase 4: Market Data & Instruments

### Task 4.1: Market Data Adapter

**Files:**
- Create: `backend/app/market_data.py`
- Create: `backend/app/cache.py`

**Step 1: Write test for ticker metadata fetching**

Create: `backend/tests/test_market_data.py`

```python
from app.market_data import get_ticker_metadata

def test_get_ticker_metadata_returns_sector():
    result = get_ticker_metadata("AAPL")
    assert result is not None
    assert "sector" in result
    assert "name" in result
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_market_data.py -v`
Expected: FAIL with "No module named 'app.market_data'"

**Step 3: Write simple cache utility**

```python
# backend/app/cache.py
from datetime import datetime, timedelta
from typing import Optional, Any

_cache = {}

def get_cached(key: str, ttl_minutes: int = 60) -> Optional[Any]:
    if key in _cache:
        value, timestamp = _cache[key]
        if datetime.now() - timestamp < timedelta(minutes=ttl_minutes):
            return value
    return None

def set_cached(key: str, value: Any):
    _cache[key] = (value, datetime.now())
```

**Step 4: Write market data adapter with caching**

```python
# backend/app/market_data.py
import os
import requests
from typing import Optional, Dict
from .cache import get_cached, set_cached

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")

# Fallback sector mapping for common tickers
SECTOR_FALLBACK = {
    "AAPL": {"name": "Apple Inc.", "sector": "Technology"},
    "MSFT": {"name": "Microsoft Corporation", "sector": "Technology"},
    "GOOGL": {"name": "Alphabet Inc.", "sector": "Technology"},
    "AMZN": {"name": "Amazon.com Inc.", "sector": "Consumer Cyclical"},
    "TSLA": {"name": "Tesla Inc.", "sector": "Automotive"},
    "VOO": {"name": "Vanguard S&P 500 ETF", "sector": "Equity ETF"},
    "VTI": {"name": "Vanguard Total Stock Market ETF", "sector": "Equity ETF"},
    "QQQ": {"name": "Invesco QQQ Trust", "sector": "Equity ETF"},
    "SPY": {"name": "SPDR S&P 500 ETF", "sector": "Equity ETF"},
    "BND": {"name": "Vanguard Total Bond Market ETF", "sector": "Bond ETF"},
}

def get_ticker_metadata(ticker: str) -> Optional[Dict]:
    # Check cache first
    cache_key = f"ticker:{ticker}"
    cached = get_cached(cache_key, ttl_minutes=1440)  # 24 hour cache
    if cached:
        return cached

    # Try fallback first for common tickers
    if ticker.upper() in SECTOR_FALLBACK:
        result = SECTOR_FALLBACK[ticker.upper()]
        set_cached(cache_key, result)
        return result

    # Try Alpha Vantage (will likely hit rate limit with demo key)
    try:
        url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}"
        response = requests.get(url, timeout=5)
        data = response.json()

        if "Symbol" in data:
            result = {
                "name": data.get("Name", ticker),
                "sector": data.get("Sector", "Unknown")
            }
            set_cached(cache_key, result)
            return result
    except Exception:
        pass

    # Final fallback
    result = {"name": ticker, "sector": "Unknown"}
    set_cached(cache_key, result)
    return result
```

**Step 5: Run test to verify it passes**

Run: `cd backend && pytest tests/test_market_data.py -v`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/app/market_data.py backend/app/cache.py backend/tests/
git commit -m "feat: add market data adapter with caching

- Implement ticker metadata fetching
- Add fallback sector mapping for common tickers
- Implement simple in-memory cache with TTL
- Support Alpha Vantage API with demo key
- Add tests for ticker metadata"
```

### Task 4.2: Core Instruments Endpoint

**Files:**
- Create: `backend/app/routers/instruments.py`

**Step 1: Write test for core instruments endpoint**

Create: `backend/tests/test_instruments.py`

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_core_instruments():
    response = client.get("/instruments/core")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert any(i["ticker"] == "VOO" for i in data)
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_instruments.py -v`
Expected: FAIL with 404

**Step 3: Write instruments router**

```python
# backend/app/routers/instruments.py
from fastapi import APIRouter
from typing import List, Dict

router = APIRouter(prefix="/instruments", tags=["instruments"])

CORE_INSTRUMENTS = [
    {
        "ticker": "VOO",
        "name": "Vanguard S&P 500 ETF",
        "type": "equity_etf",
        "risk_level": "low",
        "description": "Tracks S&P 500 index"
    },
    {
        "ticker": "VTI",
        "name": "Vanguard Total Stock Market ETF",
        "type": "equity_etf",
        "risk_level": "low",
        "description": "Total US stock market exposure"
    },
    {
        "ticker": "QQQ",
        "name": "Invesco QQQ Trust",
        "type": "equity_etf",
        "risk_level": "medium",
        "description": "Nasdaq-100 tech-focused index"
    },
    {
        "ticker": "SPY",
        "name": "SPDR S&P 500 ETF",
        "type": "equity_etf",
        "risk_level": "low",
        "description": "Tracks S&P 500 index"
    },
    {
        "ticker": "BND",
        "name": "Vanguard Total Bond Market ETF",
        "type": "bond_etf",
        "risk_level": "very_low",
        "description": "US investment-grade bonds"
    }
]

@router.get("/core", response_model=List[Dict])
def get_core_instruments():
    return CORE_INSTRUMENTS
```

**Step 4: Run test to verify it passes**

Run: `cd backend && pytest tests/test_instruments.py -v`
Expected: PASS

**Step 5: Include router in main app**

Modify: `backend/app/main.py`

```python
from .routers import auth, onboarding, instruments

# ... existing code ...

app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(instruments.router)
```

**Step 6: Commit**

```bash
git add backend/app/routers/instruments.py backend/app/main.py backend/tests/
git commit -m "feat: add core instruments endpoint

- Return hardcoded list of core ETFs
- Include VOO, VTI, QQQ, SPY, BND
- Add instrument metadata (name, type, risk)
- Add tests for instruments endpoint"
```

---

## Phase 5: Portfolio Analysis (Persona B)

### Task 5.1: CSV Parser

**Files:**
- Create: `backend/app/portfolio_analyzer.py`

**Step 1: Write test for CSV parsing**

Create: `backend/tests/test_portfolio_analyzer.py`

```python
import pandas as pd
from io import StringIO
from app.portfolio_analyzer import parse_portfolio_csv

def test_parse_portfolio_csv():
    csv_content = """Ticker,TotalValue
AAPL,10000
MSFT,8000
GOOGL,5500"""

    csv_file = StringIO(csv_content)
    holdings = parse_portfolio_csv(csv_file)

    assert len(holdings) == 3
    assert holdings[0]["ticker"] == "AAPL"
    assert holdings[0]["value"] == 10000.0
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_portfolio_analyzer.py::test_parse_portfolio_csv -v`
Expected: FAIL with "No module named 'app.portfolio_analyzer'"

**Step 3: Write CSV parser**

```python
# backend/app/portfolio_analyzer.py
import pandas as pd
from typing import List, Dict
from io import BytesIO

def parse_portfolio_csv(file_content: bytes) -> List[Dict]:
    try:
        df = pd.read_csv(BytesIO(file_content))
    except Exception as e:
        raise ValueError(f"Could not parse CSV: {str(e)}")

    # Validate required columns
    if "Ticker" not in df.columns or "TotalValue" not in df.columns:
        raise ValueError("CSV must have 'Ticker' and 'TotalValue' columns")

    holdings = []
    for _, row in df.iterrows():
        ticker = str(row["Ticker"]).strip().upper()
        try:
            value = float(row["TotalValue"])
        except (ValueError, TypeError):
            continue  # Skip invalid rows

        if ticker and value > 0:
            holdings.append({
                "ticker": ticker,
                "value": value
            })

    if not holdings:
        raise ValueError("No valid positions found in CSV")

    return holdings
```

**Step 4: Run test to verify it passes**

Run: `cd backend && pytest tests/test_portfolio_analyzer.py::test_parse_portfolio_csv -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/portfolio_analyzer.py backend/tests/
git commit -m "feat: add CSV portfolio parser

- Parse CSV with Ticker and TotalValue columns
- Validate required columns
- Skip invalid rows gracefully
- Return list of holdings with ticker and value
- Add tests for CSV parsing"
```

### Task 5.2: Portfolio Analysis Logic

**Files:**
- Modify: `backend/app/portfolio_analyzer.py`

**Step 1: Write test for sector concentration detection**

Extend: `backend/tests/test_portfolio_analyzer.py`

```python
from app.portfolio_analyzer import analyze_portfolio

def test_detect_sector_overweight():
    holdings = [
        {"ticker": "AAPL", "value": 7000},
        {"ticker": "MSFT", "value": 7000},
        {"ticker": "GOOGL", "value": 1000},
    ]

    result = analyze_portfolio(holdings)

    # Total = 15000, both AAPL and MSFT are tech, so tech = 14000 / 15000 = 93%
    assert result["total_value"] == 15000

    tech_sector = next(s for s in result["sector_breakdown"] if s["sector"] == "Technology")
    assert tech_sector["weight_pct"] > 35  # Should flag as overweight

    assert any(f["type"] == "sector_overweight" for f in result["flags"])
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_portfolio_analyzer.py::test_detect_sector_overweight -v`
Expected: FAIL with "analyze_portfolio not found"

**Step 3: Write analysis logic**

Extend: `backend/app/portfolio_analyzer.py`

```python
from .market_data import get_ticker_metadata

def analyze_portfolio(holdings: List[Dict]) -> Dict:
    # Calculate total value
    total_value = sum(h["value"] for h in holdings)

    # Enrich with market data
    positions = []
    for holding in holdings:
        metadata = get_ticker_metadata(holding["ticker"])
        weight_pct = round((holding["value"] / total_value) * 100, 2)

        positions.append({
            "ticker": holding["ticker"],
            "value": holding["value"],
            "weight_pct": weight_pct,
            "name": metadata.get("name", holding["ticker"]),
            "sector": metadata.get("sector", "Unknown")
        })

    # Aggregate by sector
    sector_totals = {}
    for pos in positions:
        sector = pos["sector"]
        sector_totals[sector] = sector_totals.get(sector, 0) + pos["value"]

    sector_breakdown = [
        {
            "sector": sector,
            "value": value,
            "weight_pct": round((value / total_value) * 100, 2)
        }
        for sector, value in sector_totals.items()
    ]
    sector_breakdown.sort(key=lambda x: x["weight_pct"], reverse=True)

    # Detect flags
    flags = []

    # Check sector concentration (>35%)
    for sector_data in sector_breakdown:
        if sector_data["weight_pct"] > 35:
            flags.append({
                "type": "sector_overweight",
                "message": f"{sector_data['sector']} sector is {sector_data['weight_pct']}% of portfolio (target: <35%)"
            })

    # Check single position concentration (>10%)
    for pos in positions:
        if pos["weight_pct"] > 10:
            flags.append({
                "type": "position_overweight",
                "message": f"{pos['ticker']} is {pos['weight_pct']}% of portfolio (target: <10%)"
            })

    return {
        "total_value": total_value,
        "positions": positions,
        "sector_breakdown": sector_breakdown,
        "flags": flags
    }
```

**Step 4: Run test to verify it passes**

Run: `cd backend && pytest tests/test_portfolio_analyzer.py::test_detect_sector_overweight -v`
Expected: PASS

**Step 5: Write test for position overweight**

Extend: `backend/tests/test_portfolio_analyzer.py`

```python
def test_detect_position_overweight():
    holdings = [
        {"ticker": "AAPL", "value": 5000},  # 50% of portfolio
        {"ticker": "VOO", "value": 5000},   # 50% of portfolio
    ]

    result = analyze_portfolio(holdings)

    # Both positions are >10%
    position_flags = [f for f in result["flags"] if f["type"] == "position_overweight"]
    assert len(position_flags) == 2
```

Run: `cd backend && pytest tests/test_portfolio_analyzer.py::test_detect_position_overweight -v`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/app/portfolio_analyzer.py backend/tests/
git commit -m "feat: add portfolio analysis logic

- Calculate position weights
- Aggregate holdings by sector
- Detect sector concentration >35%
- Detect position concentration >10%
- Enrich positions with market metadata
- Add tests for concentration detection"
```

### Task 5.3: Model Portfolios & Rebalancing

**Files:**
- Create: `backend/app/model_portfolios.py`
- Modify: `backend/app/portfolio_analyzer.py`

**Step 1: Write test for target allocation**

Extend: `backend/tests/test_portfolio_analyzer.py`

```python
def test_returns_target_allocation():
    holdings = [{"ticker": "AAPL", "value": 10000}]

    result = analyze_portfolio(holdings)

    assert "target_allocation" in result
    assert result["target_allocation"]["name"] in ["conservative", "balanced", "growth"]
    assert len(result["target_allocation"]["instruments"]) > 0
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_portfolio_analyzer.py::test_returns_target_allocation -v`
Expected: FAIL with "target_allocation not in result"

**Step 3: Write model portfolios**

```python
# backend/app/model_portfolios.py

MODEL_PORTFOLIOS = {
    "conservative": {
        "name": "Conservative",
        "description": "Low volatility, income focused",
        "instruments": [
            {"ticker": "BND", "weight_pct": 50},
            {"ticker": "VOO", "weight_pct": 30},
            {"ticker": "VTI", "weight_pct": 20},
        ]
    },
    "balanced": {
        "name": "Balanced",
        "description": "Moderate growth with stability",
        "instruments": [
            {"ticker": "VTI", "weight_pct": 40},
            {"ticker": "VOO", "weight_pct": 30},
            {"ticker": "BND", "weight_pct": 20},
            {"ticker": "QQQ", "weight_pct": 10},
        ]
    },
    "growth": {
        "name": "Growth",
        "description": "Higher risk, long-term growth",
        "instruments": [
            {"ticker": "VTI", "weight_pct": 50},
            {"ticker": "QQQ", "weight_pct": 30},
            {"ticker": "VOO", "weight_pct": 15},
            {"ticker": "BND", "weight_pct": 5},
        ]
    }
}

def select_model_portfolio(risk_score: int, time_horizon: dict) -> dict:
    """Select appropriate model portfolio based on risk and horizon."""
    long_term_pct = time_horizon.get("long_term", 40)

    # Conservative: low risk or short term
    if risk_score < 40 or long_term_pct < 30:
        return MODEL_PORTFOLIOS["conservative"]

    # Growth: high risk and long term
    if risk_score > 70 and long_term_pct > 50:
        return MODEL_PORTFOLIOS["growth"]

    # Balanced: default
    return MODEL_PORTFOLIOS["balanced"]
```

**Step 4: Integrate into analyzer**

Extend: `backend/app/portfolio_analyzer.py`

```python
from .model_portfolios import MODEL_PORTFOLIOS

def analyze_portfolio(holdings: List[Dict], risk_score: int = 50, time_horizon: dict = None) -> Dict:
    if time_horizon is None:
        time_horizon = {"short_term": 30, "mid_term": 30, "long_term": 40}

    # ... existing analysis code ...

    # Select target allocation
    from .model_portfolios import select_model_portfolio
    target_allocation = select_model_portfolio(risk_score, time_horizon)

    # Generate rebalance suggestions
    rebalance_suggestions = []
    if flags:  # If there are flags, suggest rebalancing
        overweight_sectors = [f for f in flags if f["type"] == "sector_overweight"]
        if overweight_sectors:
            rebalance_suggestions.append({
                "action": "reduce_sector",
                "detail": "Trim overweight sectors and reallocate to diversified ETFs",
                "suggested_targets": ["VOO", "VTI", "BND"]
            })

    return {
        "total_value": total_value,
        "positions": positions,
        "sector_breakdown": sector_breakdown,
        "flags": flags,
        "target_allocation": target_allocation,
        "rebalance_suggestions": rebalance_suggestions
    }
```

**Step 5: Run test to verify it passes**

Run: `cd backend && pytest tests/test_portfolio_analyzer.py::test_returns_target_allocation -v`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/app/model_portfolios.py backend/app/portfolio_analyzer.py backend/tests/
git commit -m "feat: add model portfolios and rebalancing logic

- Define conservative/balanced/growth portfolios
- Select model based on risk score and time horizon
- Generate rebalance suggestions for flags
- Integrate target allocation into analysis
- Add tests for target allocation"
```

### Task 5.4: Portfolio Analysis Endpoint

**Files:**
- Create: `backend/app/routers/portfolio.py`

**Step 1: Write test for analyze endpoint**

Create: `backend/tests/test_portfolio_endpoints.py`

```python
from fastapi.testclient import TestClient
from app.main import app
from io import BytesIO

client = TestClient(app)

def test_analyze_portfolio_endpoint():
    # Create test user and login
    client.post("/auth/signup", json={"email": "portfolio@test.com", "password": "test123"})
    login_response = client.post("/auth/login", data={"username": "portfolio@test.com", "password": "test123"})
    token = login_response.json()["access_token"]

    # Create CSV file
    csv_content = b"Ticker,TotalValue\nAAPL,10000\nMSFT,8000\nVOO,5500"
    files = {"file": ("portfolio.csv", BytesIO(csv_content), "text/csv")}

    # Upload and analyze
    response = client.post(
        "/portfolio/analyze",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "total_value" in data
    assert "positions" in data
    assert "sector_breakdown" in data
    assert "target_allocation" in data
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_portfolio_endpoints.py -v`
Expected: FAIL with 404

**Step 3: Write portfolio router**

```python
# backend/app/routers/portfolio.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..routers.auth import get_current_user
from ..portfolio_analyzer import parse_portfolio_csv, analyze_portfolio

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

@router.post("/analyze")
async def analyze_uploaded_portfolio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    # Read file
    try:
        content = await file.read()
        if len(content) > 1_000_000:  # 1MB limit
            raise HTTPException(status_code=400, detail="File too large (max 1MB)")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read file")

    # Parse CSV
    try:
        holdings = parse_portfolio_csv(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Analyze
    risk_score = current_user.risk_score or 50
    time_horizon = current_user.time_horizon or {"short_term": 30, "mid_term": 30, "long_term": 40}

    result = analyze_portfolio(holdings, risk_score, time_horizon)

    return result
```

**Step 4: Run test to verify it passes**

Run: `cd backend && pytest tests/test_portfolio_endpoints.py -v`
Expected: PASS

**Step 5: Include router in main app**

Modify: `backend/app/main.py`

```python
from .routers import auth, onboarding, instruments, portfolio

# ... existing code ...

app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(instruments.router)
app.include_router(portfolio.router)
```

**Step 6: Commit**

```bash
git add backend/app/routers/portfolio.py backend/app/main.py backend/tests/
git commit -m "feat: add portfolio analysis endpoint

- Accept CSV file upload via multipart form
- Parse and analyze portfolio
- Return positions, sectors, flags, and target
- Use current user's risk profile
- Add 1MB file size limit
- Add tests for analyze endpoint"
```

---

*Due to length constraints, I'll create the plan in sections. This is Part 1 of the comprehensive implementation plan covering Phases 1-5. The plan continues with:*

- **Phase 6**: RAG & Research System (Persona C)
- **Phase 7**: Frontend - Auth & Layout
- **Phase 8**: Frontend - Onboarding Flow
- **Phase 9**: Frontend - Persona Pages
- **Phase 10**: Admin Interface
- **Phase 11**: Testing & Validation
- **Phase 12**: Deployment & Documentation

**Shall I continue with the remaining phases?**
