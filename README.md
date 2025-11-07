# Investing Assistant MVP

A personalized investing assistant that provides tailored guidance based on user personas:
- **Persona A (Starter)**: Index fund recommendations for beginners
- **Persona B (Rebalance)**: Portfolio analysis and rebalancing for existing investors
- **Persona C (Moonshot)**: Research-driven insights for advanced investors

## Architecture

### Backend (FastAPI + Python)
- **Port**: 8200
- **Database**: SQLite (development)
- **Authentication**: JWT with 60-minute expiry
- **APIs**: Alpha Vantage (market data)
- **Vector Store**: Chroma (RAG system)

### Frontend (Next.js 14 + TypeScript)
- **Port**: 3200
- **Styling**: Tailwind CSS
- **State**: React Context for authentication
- **Storage**: localStorage for token persistence

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Alpha Vantage API key (optional for market data)

### Setup

1. **Clone and configure environment**:
```bash
cd /Users/adommeti/source/smartwise_claude

# Create .env file with API key (optional)
echo "ALPHA_VANTAGE_API_KEY=your_key_here" > .env
```

2. **Start services**:
```bash
docker-compose up --build
```

3. **Access the application**:
- Frontend: http://localhost:3200
- Backend API: http://localhost:8200
- API Docs: http://localhost:8200/docs

## Project Structure

```
.
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # FastAPI app
│   │   ├── models.py    # SQLAlchemy models
│   │   └── database.py  # Database config
│   ├── tests/           # Backend tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/        # App router pages
│   │   ├── components/ # React components
│   │   └── lib/        # Utilities
│   ├── Dockerfile
│   └── package.json
├── docs/               # Documentation
└── docker-compose.yml  # Docker orchestration
```

## Development

### Backend Development
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8200 --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Manual Setup (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment (Python 3.11 or 3.12 required)
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=sqlite:///./investing_assistant.db
export SECRET_KEY=dev-secret-key-change-in-production
export ALPHA_VANTAGE_API_KEY=your_key_here  # Optional

# Run migrations (create tables)
python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine)"

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8200 --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## User Flow

### 1. Registration & Authentication
- New users register at `/register`
- Existing users login at `/login`
- JWT token stored in localStorage

### 2. Onboarding Questionnaire
- 10 questions about investment goals, risk tolerance, and experience
- Risk score (10-50) calculated from answers
- Persona assigned:
  - **Persona A**: score ≤ 20 (or prefers "simple" advice)
  - **Persona B**: 21 ≤ score ≤ 35 (or prefers "analysis" + has portfolio)
  - **Persona C**: score ≥ 36 (or prefers "ideas" advice)

### 3. Persona-Specific Dashboards

#### Persona A - Starter Dashboard
- **Path**: `/dashboard/starter`
- **Features**:
  - Curated index fund recommendations (VOO, VTI, VXUS, BND, VNQ)
  - 3 portfolio strategies: Conservative (80/20), Balanced (60/40), Growth (90/10)
  - Detailed fund information with expense ratios
  - Getting started guide

#### Persona B - Rebalance Dashboard
- **Path**: `/dashboard/rebalance`
- **Features**:
  - CSV portfolio upload
  - Portfolio analysis:
    - Total value calculation
    - Sector allocation breakdown
    - Diversification score (0-1)
    - Concentration warnings (>30% in single sector)
  - Rebalancing recommendations:
    - Choose target model (conservative/balanced/growth)
    - Get buy/sell recommendations
    - Trade-by-trade action plan

#### Persona C - Moonshot Dashboard
- **Path**: `/dashboard/moonshot`
- **Features**:
  - Research assistant chatbot
  - RAG-powered insights from curated documents
  - Source citations for all responses
  - Conversation context maintenance
  - Sample questions for exploration

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/register` - Create new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info (requires token)

### Onboarding (`/onboarding`)
- `GET /onboarding/questionnaire` - Get 10 questions
- `POST /onboarding/submit` - Submit answers and get persona
- `GET /onboarding/persona` - Get current persona (requires token)

### Market Data (`/market`)
- `GET /market/search?q={query}` - Search for tickers
- `GET /market/ticker/{symbol}` - Get ticker details
- **Note**: Falls back to mock data if API key not configured

### Portfolio (`/portfolio`) - Persona B Only
- `POST /portfolio/upload` - Upload CSV file
- `POST /portfolio/analyze` - Analyze portfolio
- `POST /portfolio/rebalance?model_type={model}` - Get rebalancing plan

### RAG (`/rag`) - Persona C Only
- `POST /rag/query` - Ask research question
- `GET /rag/documents` - List research documents
- `GET /rag/stats` - Get RAG system statistics

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v

# Run specific test files
pytest tests/test_auth.py -v
pytest tests/test_onboarding.py -v
pytest tests/test_market.py -v
pytest tests/test_portfolio.py -v
```

**Test Coverage**:
- 40 total tests across all modules
- Authentication: 9 tests
- Onboarding: 9 tests (all 3 personas)
- Market Data: 10 tests
- Portfolio: 12 tests

## Configuration

### Environment Variables

**Backend** (`backend/.env`):
```bash
DATABASE_URL=sqlite:///./investing_assistant.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALPHA_VANTAGE_API_KEY=your-api-key-here  # Optional
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8200
```

## Known Limitations

1. **Python Version**: Requires Python 3.11 or 3.12 (chromadb not compatible with 3.14)
2. **Market Data**: Limited to Alpha Vantage API (5 requests/minute free tier)
3. **RAG System**: Simplified responses without LLM integration
4. **Caching**: In-memory cache (would use Redis in production)
5. **Database**: SQLite for development (would use PostgreSQL in production)

## Portfolio CSV Format

For Persona B portfolio upload, use this CSV format:

```csv
symbol,shares,purchase_price
AAPL,100,150.00
MSFT,50,280.00
GOOGL,25,2500.00
```

## Production Deployment Notes

Before deploying to production:

1. **Security**:
   - Change `SECRET_KEY` to a secure random string
   - Use environment-specific `.env` files
   - Enable HTTPS
   - Add rate limiting

2. **Database**:
   - Migrate to PostgreSQL
   - Set up proper backups
   - Use connection pooling

3. **Caching**:
   - Replace in-memory cache with Redis
   - Configure cache expiry policies

4. **RAG System**:
   - Integrate real LLM API (OpenAI, Anthropic, etc.)
   - Add document ingestion pipeline
   - Implement proper vector search tuning

5. **Infrastructure**:
   - Use managed container service (ECS, Cloud Run)
   - Set up CDN for frontend
   - Configure monitoring and logging

## License

Educational project for demonstration purposes.

**Disclaimer**: This is not financial advice. Please consult with a licensed financial advisor before making investment decisions.
