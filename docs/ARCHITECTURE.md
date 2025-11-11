# SmartWise Investment Assistant - Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Scalability Considerations](#scalability-considerations)

---

## System Overview

SmartWise is a personalized investment assistant that provides tailored guidance through a persona-based system. The application analyzes user profiles through a comprehensive onboarding questionnaire and assigns one of three personas, each with specialized features and interfaces.

### Core Value Propositions

- **Persona A (Starter)**: Simplified investing for beginners with curated index fund recommendations
- **Persona B (Rebalance)**: Portfolio optimization for existing investors with AI-powered rebalancing
- **Persona C (Moonshot)**: Research-driven insights for advanced investors with RAG-powered analysis

### Key Capabilities

- **Intelligent Persona Classification**: Risk-scoring algorithm assigns optimal user persona
- **AI-Powered Recommendations**: Claude 3.5 Sonnet generates personalized investment reasoning
- **Portfolio Analysis**: Sector allocation, diversification scoring, and concentration detection
- **Research Assistant**: RAG system with vector search for investment insights
- **Persona Reassessment**: Users can update their profile as circumstances change

---

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────────────┐
│          Presentation Layer                  │
│      (Next.js 14 + React + TypeScript)      │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│            API Gateway Layer                 │
│         (FastAPI + CORS Middleware)         │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│          Business Logic Layer                │
│  (Services: Auth, Onboarding, Portfolio,    │
│   Market Data, RAG, LLM Integration)        │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│            Data Access Layer                 │
│    (SQLAlchemy ORM + Chroma Vector Store)   │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│             Persistence Layer                │
│        (SQLite + Chroma Embeddings)         │
└─────────────────────────────────────────────┘
```

### 2. Microservice-Ready Design

Each router module is designed as an independent service boundary:

- **Auth Service**: User authentication and authorization
- **Onboarding Service**: Persona classification and questionnaire
- **Market Service**: Real-time and cached market data
- **Portfolio Service**: Portfolio analysis and rebalancing
- **RAG Service**: Document retrieval and research assistance

### 3. Repository Pattern

- Models define database schema (SQLAlchemy ORM)
- Services contain business logic
- Routers handle HTTP concerns
- Clean separation between data access and business rules

---

## Technology Stack

### Backend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.11+ | Core runtime environment |
| **FastAPI** | 0.104+ | REST API framework with automatic OpenAPI docs |
| **SQLAlchemy** | 2.0+ | ORM for database operations |
| **Pydantic** | 2.5+ | Data validation and serialization |
| **Jose** | 3.3+ | JWT token generation and validation |
| **Passlib** | 1.7+ | Password hashing (bcrypt) |
| **Anthropic** | 0.40+ | Claude API integration for AI reasoning |
| **ChromaDB** | 0.4+ | Vector database for RAG system |
| **Requests** | 2.31+ | HTTP client for external APIs |
| **Pytest** | 7.4+ | Testing framework |

### Frontend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.0+ | React framework with App Router |
| **React** | 18.2+ | UI component library |
| **TypeScript** | 5.3+ | Type-safe JavaScript |
| **Tailwind CSS** | 3.3+ | Utility-first CSS framework |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Container Runtime** | Docker | Application containerization |
| **Orchestration** | Docker Compose | Multi-container deployment |
| **Database** | SQLite | Relational data storage (dev) |
| **Vector Store** | Chroma | Embedding storage for RAG |
| **Web Server** | Uvicorn | ASGI server for FastAPI |
| **Process Manager** | Node.js | Next.js production server |

### External Services

| Service | Purpose | Fallback |
|---------|---------|----------|
| **Alpha Vantage API** | Real-time market data | Mock data |
| **Anthropic Claude API** | AI reasoning generation | Basic logic |

---

## System Components

### Backend Components

#### 1. Authentication Module (`app/auth.py`, `app/routers/auth.py`)

**Responsibilities**:
- User registration with password hashing (bcrypt)
- JWT token generation and validation
- Protected route middleware

**Key Functions**:
```python
create_access_token(data: dict) -> str
verify_password(plain: str, hashed: str) -> bool
get_current_user(token: str) -> User
```

**Security Features**:
- Bcrypt password hashing with salt rounds
- JWT tokens with 60-minute expiry
- Bearer token authentication
- Secure token validation

#### 2. Onboarding Module (`app/onboarding.py`, `app/routers/onboarding.py`)

**Responsibilities**:
- 10-question investment profile questionnaire
- Risk score calculation (0-100 scale)
- Persona classification algorithm
- Persona reassessment

**Classification Logic**:
```python
Risk Score Calculation:
- Questions weighted by importance (1-5)
- Normalized to 0-100 scale

Persona Assignment:
- Persona A: score ≤ 30 OR advice_preference = "simple"
- Persona B: 31 ≤ score ≤ 60 OR (advice = "analysis" AND has_portfolio)
- Persona C: score ≥ 61 OR advice_preference = "ideas"
```

**Endpoints**:
- `GET /onboarding/questionnaire` - Fetch questions
- `POST /onboarding/submit` - Initial persona assignment
- `POST /onboarding/reassess` - Update user persona
- `GET /onboarding/persona` - Get current persona

#### 3. Market Data Module (`app/market_data.py`, `app/routers/market.py`)

**Responsibilities**:
- Ticker search and symbol lookup
- Company overview and sector information
- Sector allocation calculation
- In-memory caching (24-hour TTL)

**Data Sources**:
1. **Primary**: Alpha Vantage API
   - SYMBOL_SEARCH function
   - OVERVIEW function
   - Rate limit: 5 requests/minute (free tier)

2. **Fallback**: Mock data
   - Pre-populated ticker information
   - Major stocks: AAPL, MSFT, NVDA, INTC, LLY, etc.
   - Used when API unavailable or rate-limited

**Caching Strategy**:
```python
Cache Key Format: "{function}:{param}"
Examples: "search:apple", "overview:AAPL"
TTL: 24 hours
Eviction: Automatic on expiry
```

#### 4. Portfolio Module (`app/portfolio.py`, `app/routers/portfolio.py`)

**Responsibilities**:
- CSV portfolio parsing and validation
- Current value calculation (with mock prices)
- Sector allocation analysis
- Diversification scoring (0-1 scale)
- Concentration risk detection (>30% threshold)
- Rebalancing recommendation generation

**Key Algorithms**:

**Diversification Score**:
```python
Score = (sector_diversity * 0.4) + (concentration_score * 0.6)

sector_diversity = min(1.0, num_sectors / 5)
concentration_score = 1.0 - herfindahl_index
herfindahl_index = sum((allocation_pct / 100)² for each sector)
```

**Rebalancing Logic**:
```python
1. Compare current vs target allocation
2. Identify sectors with >5% deviation
3. Calculate required trades (buy/sell)
4. Generate AI reasoning via Claude API
5. Return prioritized recommendations
```

**Model Portfolios**:
- **Conservative**: Balanced across 11 sectors (max 15% any sector)
- **Balanced**: Growth focus (25% tech, 15% healthcare/financials)
- **Growth**: Aggressive (40% tech, 20% healthcare/consumer)

#### 5. LLM Service Module (`app/llm_service.py`)

**Responsibilities**:
- Anthropic Claude API integration
- AI reasoning generation for rebalancing
- Singleton pattern for client management
- Graceful degradation when API unavailable

**Claude Integration**:
```python
Model: claude-3-5-sonnet-20241022
Max Tokens: 500 per request
Temperature: Default
Prompt Structure:
  - Portfolio context (holdings, diversification, concentration)
  - Recommendation details (ticker, action, sector, allocation)
  - Model type (conservative/balanced/growth)
  - Specific request for reasoning
```

**Prompt Engineering**:
```
"You are an investment advisor analyzing portfolio rebalancing.

Portfolio Context:
- Total Holdings: {count}
- Diversification Score: {score}
- Concentrated Sectors: {sectors}

Recommendation:
- {action} {shares} shares of {ticker}
- Current {sector} allocation: {current}%
- Target allocation: {target}%

Provide 2-3 sentences explaining why this rebalancing makes sense..."
```

#### 6. RAG Module (`app/rag.py`, `app/routers/rag.py`)

**Responsibilities**:
- Document ingestion and embedding
- Vector similarity search
- Research query processing
- Source citation generation

**RAG Pipeline**:
```
1. Document Ingestion:
   - Load markdown documents
   - Chunk into 512-token segments
   - Generate embeddings (sentence-transformers)
   - Store in Chroma vector database

2. Query Processing:
   - Embed user question
   - Retrieve top-k similar chunks (k=5)
   - Calculate relevance scores
   - Extract source metadata

3. Response Generation:
   - Format retrieved context
   - Generate response (currently basic)
   - Attach source citations
   - Return with confidence score
```

**Chroma Configuration**:
```python
Collection: "research_docs"
Embedding Model: "all-MiniLM-L6-v2" (sentence-transformers)
Persistence: ./chroma_db directory
Metadata: document_id, title, category
```

### Frontend Components

#### 1. AppShell Component (`components/AppShell.tsx`)

**Responsibilities**:
- Global navigation header
- User authentication state display
- Persona badge rendering
- Reassessment access point

**Features**:
- Fetches current user on mount
- Shows persona badge when authenticated
- "Reassess" button links to persona update
- Responsive layout with max-width container

#### 2. Authentication Pages

**Registration** (`app/register/page.tsx`):
- Email validation
- Password requirements
- Auto-login after registration
- Redirect to onboarding

**Login** (`app/login/page.tsx`):
- JWT token acquisition
- localStorage persistence
- Redirect to dashboard
- Error handling

#### 3. Onboarding Flow (`app/onboarding/page.tsx`)

**Structure**:
- 3-step wizard (10 questions total)
- Step 1: Experience, portfolio, risk (Q1-Q3)
- Step 2: Goals, time commitment, horizon, market reaction (Q4-Q7)
- Step 3: Advice type, diversification, age (Q8-Q10)

**Validation**:
- All questions required per step
- Error messages for incomplete answers
- Progress indicator (step X of 3)
- Back/Next navigation

**Submission**:
- POST to `/onboarding/submit`
- Receive persona classification
- Show result screen with reasoning
- Auto-redirect to dashboard

#### 4. Persona Dashboards

**Starter Dashboard** (`app/dashboard/starter/page.tsx`):
- Index fund recommendations (VOO, VTI, VXUS, BND, VNQ)
- Three portfolio strategies with allocation percentages
- Fund details: expense ratio, asset class, description
- Getting started guide

**Rebalance Dashboard** (`app/dashboard/rebalance/page.tsx`):
- CSV file upload interface
- Portfolio summary (total value, diversification score)
- Sector allocation pie chart visualization
- Model selection (conservative/balanced/growth)
- AI-generated rebalancing recommendations
- Trade-by-trade action plan

**Moonshot Dashboard** (`app/dashboard/moonshot/page.tsx`):
- Research chatbot interface
- Message history display
- RAG-powered responses
- Source citations with relevance scores
- Sample question suggestions
- Real-time query processing

#### 5. Reassessment Flow (`app/reassess-persona/page.tsx`)

**Features**:
- Identical questionnaire to onboarding
- Tracks persona changes (old → new)
- Shows confidence and reasoning
- Updates persona in database
- Full page reload to refresh context

---

## Data Flow

### 1. User Registration & Onboarding Flow

```
┌──────────┐    POST /auth/register    ┌──────────┐
│  Client  │ ────────────────────────> │  Backend │
│          │    email, password        │          │
└──────────┘                            └──────────┘
                                             │
                                             ↓ Hash password (bcrypt)
                                             ↓ Save to database
                                             ↓
┌──────────┐    JWT token + user_id     ┌──────────┐
│  Client  │ <──────────────────────── │  Backend │
│          │                             │          │
└──────────┘                            └──────────┘
     │
     ↓ Store token in localStorage
     ↓ Redirect to /onboarding
     ↓
┌──────────┐    POST /onboarding/submit ┌──────────┐
│  Client  │ ────────────────────────> │  Backend │
│          │    10 answers              │          │
└──────────┘                            └──────────┘
                                             │
                                             ↓ Calculate risk score
                                             ↓ Classify persona (A/B/C)
                                             ↓ Update user.persona
                                             ↓
┌──────────┐    PersonaResponse          ┌──────────┐
│  Client  │ <──────────────────────── │  Backend │
│          │    persona, confidence     │          │
└──────────┘    reasoning               └──────────┘
     │
     ↓ Redirect to /dashboard/{persona}
```

### 2. Portfolio Analysis Flow (Persona B)

```
┌──────────┐    Upload CSV file         ┌──────────┐
│  Client  │ ────────────────────────> │  Backend │
│          │    FormData                │          │
└──────────┘                            └──────────┘
                                             │
                                             ↓ Parse CSV
                                             ↓ Validate holdings
                                             ↓
                                        ┌──────────┐
                                        │  Market  │
                                        │   Data   │
                                        └──────────┘
                                             │
                                             ↓ Fetch ticker overviews
                                             ↓ Get sector info
                                             ↓ Calculate values
                                             ↓
┌──────────┐    PortfolioAnalysis        ┌──────────┐
│  Client  │ <──────────────────────── │  Backend │
│          │    sectors, score, risks   │          │
└──────────┘                            └──────────┘
     │
     ↓ Display analysis
     ↓ User selects model
     ↓
┌──────────┐    POST /portfolio/rebalance ┌──────────┐
│  Client  │ ────────────────────────────> │  Backend │
│          │    holdings, model_type       │          │
└──────────┘                               └──────────┘
                                                │
                                                ↓ Compare allocations
                                                ↓ Calculate deviations >5%
                                                ↓
                                           ┌──────────┐
                                           │  Claude  │
                                           │   API    │
                                           └──────────┘
                                                │
                                                ↓ Generate AI reasoning
                                                ↓ Format recommendations
                                                ↓
┌──────────┐    RebalanceResponse          ┌──────────┐
│  Client  │ <──────────────────────────  │  Backend │
│          │    recommendations[]          │          │
└──────────┘    with AI reasoning         └──────────┘
```

### 3. Research Query Flow (Persona C)

```
┌──────────┐    POST /rag/query          ┌──────────┐
│  Client  │ ────────────────────────> │  Backend │
│          │    question, context       │          │
└──────────┘                            └──────────┘
                                             │
                                             ↓ Embed question
                                             ↓
                                        ┌──────────┐
                                        │  Chroma  │
                                        │ Vector DB│
                                        └──────────┘
                                             │
                                             ↓ Similarity search (top-5)
                                             ↓ Retrieve document chunks
                                             ↓ Calculate relevance scores
                                             ↓
                                        ┌──────────┐
                                        │   RAG    │
                                        │  Engine  │
                                        └──────────┘
                                             │
                                             ↓ Format retrieved context
                                             ↓ Generate response
                                             ↓ Extract source citations
                                             ↓
┌──────────┐    RAGResponse               ┌──────────┐
│  Client  │ <──────────────────────────│  Backend │
│          │    answer, sources[]        │          │
└──────────┘    confidence               └──────────┘
```

### 4. Persona Reassessment Flow

```
┌──────────┐    Click "Reassess" button  ┌──────────┐
│  Client  │ ────────────────────────> │  Client  │
│  Header  │                             │  Route   │
└──────────┘                            └──────────┘
                                             │
                                             ↓ Load /reassess-persona
                                             ↓ Render questionnaire
                                             ↓ Collect 10 answers
                                             ↓
┌──────────┐    POST /onboarding/reassess ┌──────────┐
│  Client  │ ────────────────────────────> │  Backend │
│          │    answers[], JWT token       │          │
└──────────┘                               └──────────┘
                                                │
                                                ↓ Validate token
                                                ↓ Store old_persona
                                                ↓ Calculate new risk score
                                                ↓ Classify new persona
                                                ↓ Update user.persona
                                                ↓ Add change context
                                                ↓
┌──────────┐    PersonaResponse             ┌──────────┐
│  Client  │ <───────────────────────────  │  Backend │
│          │    "Updated from B to A..."    │          │
└──────────┘                               └──────────┘
     │
     ↓ Show success screen (3 seconds)
     ↓ window.location.href = "/dashboard"
     ↓ Full page reload with new persona
```

---

## Security Architecture

### 1. Authentication & Authorization

**Password Security**:
- Bcrypt hashing with automatic salt generation
- Minimum 8-character requirement
- Password never stored in plaintext
- Hash comparison prevents timing attacks

**JWT Token Management**:
```python
Algorithm: HS256 (HMAC with SHA-256)
Expiry: 60 minutes
Claims: {"sub": user_id, "exp": timestamp}
Storage: localStorage (client-side)
Transmission: Authorization: Bearer {token}
```

**Protected Routes**:
- All persona-specific endpoints require authentication
- `get_current_user()` dependency validates tokens
- Expired tokens return 401 Unauthorized
- Invalid tokens return 401 Unauthorized

### 2. CORS Configuration

```python
Allowed Origins: ["http://localhost:3200"]
Credentials: Enabled (for cookies/auth headers)
Methods: All (GET, POST, PUT, DELETE, etc.)
Headers: All (including Authorization)
```

**Production Hardening**:
- Restrict origins to production domains only
- Disable wildcard methods and headers
- Add rate limiting per origin
- Enable HTTPS-only mode

### 3. Input Validation

**Pydantic Schemas**:
- All API inputs validated via Pydantic models
- Type checking (email, strings, integers, floats)
- Required vs optional fields enforced
- Custom validators for business rules

**Example**:
```python
class UserRegister(BaseModel):
    email: EmailStr  # Validates email format
    password: str    # Min length enforced

class PortfolioHolding(BaseModel):
    ticker: str      # Required, non-empty
    shares: float    # Must be numeric
    purchase_price: float  # Must be numeric
```

### 4. SQL Injection Prevention

- SQLAlchemy ORM prevents direct SQL execution
- Parameterized queries for all database operations
- No string interpolation in queries
- ORM handles escaping automatically

### 5. API Key Management

**Environment Variables**:
- All secrets stored in `.env` files
- Never committed to version control
- Loaded via `os.getenv()` at runtime
- Different keys per environment

**Current Keys**:
```bash
SECRET_KEY: JWT signing key (rotate regularly)
ALPHA_VANTAGE_API_KEY: Market data API
ANTHROPIC_API_KEY: Claude AI API
```

### 6. Rate Limiting (Production TODO)

**Recommended Strategy**:
```python
# Install: pip install slowapi
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/endpoint")
@limiter.limit("5/minute")  # 5 requests per minute
def endpoint():
    ...
```

---

## Scalability Considerations

### Current Limitations

1. **Single-Instance Design**
   - No horizontal scaling support
   - In-memory cache not shared across instances
   - SQLite single-writer limitation

2. **Synchronous Processing**
   - Blocking API calls to external services
   - No async task queue
   - Sequential portfolio analysis

3. **Local Storage**
   - SQLite file-based database
   - Chroma vector store on disk
   - No distributed storage

### Production Scaling Strategy

#### 1. Database Migration

**PostgreSQL Migration**:
```python
# Replace SQLite URL
DATABASE_URL = "postgresql://user:pass@host:5432/dbname"

# Add connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

**Benefits**:
- Multi-writer support
- Better concurrency
- ACID compliance
- Connection pooling
- Read replicas

#### 2. Caching Layer

**Redis Implementation**:
```python
import redis
from functools import wraps

redis_client = redis.Redis(
    host='redis-host',
    port=6379,
    decode_responses=True
)

def cache(ttl=3600):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = f"{func.__name__}:{args}:{kwargs}"
            cached = redis_client.get(key)
            if cached:
                return json.loads(cached)
            result = func(*args, **kwargs)
            redis_client.setex(key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator
```

**Benefits**:
- Shared across instances
- Distributed caching
- Persistent cache
- Pub/sub support

#### 3. Async Task Queue

**Celery Integration**:
```python
from celery import Celery

celery_app = Celery('investing_assistant',
                    broker='redis://localhost:6379/0')

@celery_app.task
def analyze_portfolio_async(user_id: int, holdings: list):
    # Long-running portfolio analysis
    result = analyze_portfolio(holdings)
    notify_user(user_id, result)
    return result
```

**Use Cases**:
- Portfolio rebalancing calculations
- Bulk RAG document ingestion
- Email notifications
- Report generation

#### 4. Horizontal Scaling

**Load Balancer Configuration**:
```
                    ┌─────────────┐
                    │    Nginx    │
                    │   (Load     │
                    │   Balancer) │
                    └─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Backend 1   │ │   Backend 2   │ │   Backend 3   │
│   (FastAPI)   │ │   (FastAPI)   │ │   (FastAPI)   │
└───────────────┘ └───────────────┘ └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ↓
                    ┌─────────────┐
                    │  PostgreSQL │
                    │   (Primary)  │
                    └─────────────┘
                           │
                           ↓
                    ┌─────────────┐
                    │    Redis    │
                    │   (Cache)   │
                    └─────────────┘
```

**Session Affinity**: Not required (stateless JWT auth)
**Health Checks**: `GET /health` endpoint
**Graceful Shutdown**: Handle SIGTERM signals

#### 5. CDN for Frontend

**Deployment Strategy**:
```bash
# Build static export
cd frontend
npm run build
npm run export

# Deploy to CDN (Cloudflare, CloudFront, etc.)
aws s3 sync out/ s3://bucket-name/
aws cloudfront create-invalidation --distribution-id XYZ
```

**Benefits**:
- Global edge caching
- Reduced latency
- DDoS protection
- Automatic SSL/TLS

#### 6. Monitoring & Observability

**Recommended Stack**:
```python
# Application metrics
from prometheus_client import Counter, Histogram

request_count = Counter('http_requests_total', 'Total HTTP requests')
request_latency = Histogram('http_request_duration_seconds', 'HTTP request latency')

# Logging
import structlog

logger = structlog.get_logger()
logger.info("portfolio_analyzed", user_id=123, ticker_count=5)

# Tracing
from opentelemetry import trace

tracer = trace.get_tracer(__name__)
with tracer.start_as_current_span("analyze_portfolio"):
    result = analyze_portfolio(holdings)
```

**Monitoring Targets**:
- Request rate and latency
- Error rates by endpoint
- Database query performance
- Cache hit/miss ratio
- External API response times
- AI API token usage

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────┐
│         Docker Compose                   │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │   Frontend Container               │ │
│  │   - Next.js dev server             │ │
│  │   - Port: 3200                     │ │
│  │   - Hot reload enabled             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │   Backend Container                │ │
│  │   - Uvicorn with --reload          │ │
│  │   - Port: 8200                     │ │
│  │   - Volume mount: ./backend:/app   │ │
│  │   - SQLite: ./investing_assistant.db│ │
│  │   - Chroma: ./chroma_db            │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Production Architecture (Recommended)

```
┌─────────────────────────────────────────────────────┐
│                     Internet                         │
└─────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────┐
│              CloudFlare / CDN                        │
│         (SSL/TLS, DDoS Protection, WAF)             │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ↓                               ↓
┌──────────────────┐          ┌──────────────────┐
│  Frontend (CDN)  │          │   API Gateway    │
│  - Static Assets │          │   (nginx/ALB)    │
│  - Next.js Build │          │   - Rate Limit   │
│  - Edge Caching  │          │   - CORS         │
└──────────────────┘          └──────────────────┘
                                      │
                      ┌───────────────┼───────────────┐
                      ↓               ↓               ↓
              ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
              │  Backend 1  │ │  Backend 2  │ │  Backend N  │
              │  (FastAPI)  │ │  (FastAPI)  │ │  (FastAPI)  │
              └─────────────┘ └─────────────┘ └─────────────┘
                      │               │               │
                      └───────────────┼───────────────┘
                                      ↓
                      ┌───────────────────────────────┐
                      │      PostgreSQL Cluster       │
                      │  Primary + Read Replicas      │
                      └───────────────────────────────┘
                                      │
                      ┌───────────────┼───────────────┐
                      ↓               ↓               ↓
              ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
              │    Redis    │ │    Chroma   │ │   Celery    │
              │  (Caching)  │ │  (Vectors)  │ │  (Tasks)    │
              └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Performance Optimization

### Current Optimizations

1. **In-Memory Caching**: 24-hour TTL for market data
2. **SQLAlchemy Query Optimization**: Eager loading for relationships
3. **Pydantic Validation**: Fast C-based validation
4. **Static Site Generation**: Next.js pre-renders pages at build time

### Future Optimizations

1. **Database Indexing**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_persona ON users(persona);
CREATE INDEX idx_research_docs_category ON research_docs(category);
```

2. **Query Optimization**:
```python
# Eager loading to prevent N+1 queries
from sqlalchemy.orm import joinedload

users = db.query(User).options(
    joinedload(User.portfolio)
).all()
```

3. **Response Compression**:
```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

4. **API Response Caching**:
```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

@router.get("/market/ticker/{symbol}")
@cache(expire=3600)  # Cache for 1 hour
async def get_ticker(symbol: str):
    return get_ticker_overview(symbol)
```

---

## Testing Strategy

### Backend Testing

**Test Structure**:
```
backend/tests/
├── test_auth.py          # Authentication tests (9 tests)
├── test_onboarding.py    # Persona classification (9 tests)
├── test_market.py        # Market data (10 tests)
└── test_portfolio.py     # Portfolio analysis (12 tests)
```

**Test Coverage**:
- Unit tests for business logic
- Integration tests for API endpoints
- Mock external dependencies (Alpha Vantage, Claude API)
- Database fixtures with test data

**Running Tests**:
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

### Frontend Testing (TODO)

**Recommended Stack**:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

**Test Types**:
- Component unit tests
- Integration tests for user flows
- E2E tests with Playwright or Cypress

---

## Error Handling Strategy

### Backend Error Responses

```python
# Standardized error format
{
    "detail": "Human-readable error message",
    "status_code": 400,
    "error_type": "ValidationError"
}
```

**HTTP Status Codes**:
- `200 OK`: Successful request
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid token
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Frontend Error Handling

```typescript
try {
    const res = await fetch(url, options);
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Request failed");
    }
    return await res.json();
} catch (err) {
    setError(err.message);
    // Show error to user
}
```

---

## Conclusion

SmartWise Investment Assistant demonstrates a modern, well-architected full-stack application with clear separation of concerns, robust security, and thoughtful scalability considerations. The persona-based approach provides tailored experiences while maintaining a cohesive architecture that can evolve with changing requirements.

**Key Architectural Strengths**:
- Clean layered architecture with clear boundaries
- Microservice-ready modular design
- Comprehensive authentication and authorization
- AI integration with graceful degradation
- Production-ready security practices
- Well-documented APIs with OpenAPI specs
- Extensive test coverage

**Next Evolution Steps**:
1. Migrate to PostgreSQL for production
2. Implement Redis caching layer
3. Add async task processing (Celery)
4. Set up monitoring and logging (Prometheus, Grafana)
5. Deploy with container orchestration (Kubernetes)
6. Implement comprehensive CI/CD pipeline
