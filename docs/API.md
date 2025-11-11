# SmartWise Investment Assistant - API Documentation

## Base URL

```
Development: http://localhost:8200
Production: https://api.smartwise.example.com
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### Health Check

#### `GET /health`

Check if the API is running.

**Authentication**: Not required

**Response**:
```json
{
  "status": "ok"
}
```

---

## Authentication Endpoints (`/auth`)

### Register New User

#### `POST /auth/register`

Create a new user account.

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** `201 Created`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:
- `400 Bad Request`: Email already registered or invalid email format
- `422 Unprocessable Entity`: Invalid request body

### Login

#### `POST /auth/login`

Authenticate and receive a JWT token.

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** `200 OK`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:
- `401 Unauthorized`: Invalid email or password

### Get Current User

#### `GET /auth/me`

Get information about the authenticated user.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "id": 1,
  "email": "user@example.com",
  "persona": "B",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or expired token

---

## Onboarding Endpoints (`/onboarding`)

### Get Questionnaire

#### `GET /onboarding/questionnaire`

Retrieve the 10-question onboarding questionnaire.

**Authentication**: Not required

**Response** `200 OK`:
```json
{
  "questions": [
    {
      "id": 1,
      "text": "What is your investment experience level?",
      "options": ["beginner", "intermediate", "advanced"],
      "weight": 3
    },
    {
      "id": 2,
      "text": "Do you currently have an investment portfolio?",
      "options": ["no", "small", "substantial"],
      "weight": 4
    },
    // ... 8 more questions
  ]
}
```

### Submit Onboarding

#### `POST /onboarding/submit`

Submit questionnaire answers and receive persona classification.

**Authentication**: Required

**Request Body**:
```json
{
  "answers": [
    {
      "question_id": 1,
      "answer": "intermediate"
    },
    {
      "question_id": 2,
      "answer": "substantial"
    },
    // ... 8 more answers (total 10)
  ]
}
```

**Response** `200 OK`:
```json
{
  "persona": "B",
  "confidence": 0.85,
  "reasoning": "Based on your substantial portfolio and intermediate experience, Persona B (Rebalance) provides portfolio optimization and rebalancing guidance."
}
```

**Errors**:
- `400 Bad Request`: Expected 10 answers but received different count
- `401 Unauthorized`: Missing or invalid token

### Get User Persona

#### `GET /onboarding/persona`

Get the current user's assigned persona.

**Authentication**: Required

**Response** `200 OK`:
```json
{
  "persona": "B",
  "confidence": 1.0,
  "reasoning": "Previously classified persona"
}
```

**Errors**:
- `404 Not Found`: User has not completed onboarding
- `401 Unauthorized`: Missing or invalid token

### Reassess Persona

#### `POST /onboarding/reassess`

Retake the questionnaire and update persona classification.

**Authentication**: Required

**Request Body**:
```json
{
  "answers": [
    {
      "question_id": 1,
      "answer": "advanced"
    },
    // ... 9 more answers (total 10)
  ]
}
```

**Response** `200 OK`:
```json
{
  "persona": "C",
  "confidence": 0.92,
  "reasoning": "Persona updated from B to C. Your advanced experience and aggressive growth goals suggest research-driven investment insights."
}
```

**Errors**:
- `400 Bad Request`: Expected 10 answers
- `401 Unauthorized`: Missing or invalid token

---

## Market Data Endpoints (`/market`)

### Search Tickers

#### `GET /market/search?q={query}`

Search for stock tickers by company name or symbol.

**Authentication**: Not required

**Query Parameters**:
- `q` (required): Search term (company name or ticker symbol)

**Example**: `GET /market/search?q=apple`

**Response** `200 OK`:
```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc",
    "type": "Equity",
    "region": "United States"
  },
  {
    "symbol": "APLE",
    "name": "Apple Hospitality REIT Inc",
    "type": "Equity",
    "region": "United States"
  }
]
```

**Notes**:
- Returns top 10 matches
- Falls back to mock data if Alpha Vantage API unavailable
- Results cached for 24 hours

### Get Ticker Details

#### `GET /market/ticker/{symbol}`

Get detailed information about a specific ticker.

**Authentication**: Not required

**Path Parameters**:
- `symbol` (required): Ticker symbol (e.g., "AAPL")

**Example**: `GET /market/ticker/AAPL`

**Response** `200 OK`:
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "market_cap": 2800000000000.0,
  "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
}
```

**Errors**:
- `404 Not Found`: Ticker not found
- Returns mock data if API unavailable

**Notes**:
- Cached for 24 hours
- Falls back to mock data for common tickers (AAPL, MSFT, NVDA, INTC, LLY, SPY, VTI)

---

## Portfolio Endpoints (`/portfolio`) - Persona B Only

### Upload Portfolio CSV

#### `POST /portfolio/upload`

Upload a CSV file containing portfolio holdings.

**Authentication**: Required

**Request**:
- Content-Type: `multipart/form-data`
- Form field: `file` (CSV file)

**CSV Format**:
```csv
symbol,shares,purchase_price
AAPL,100,150.00
MSFT,50,280.00
GOOGL,25,2500.00
```

**Alternative CSV Format** (also accepted):
```csv
ticker,shares,purchase_price
AAPL,100,150.00
MSFT,50,280.00
```

**Response** `200 OK`:
```json
{
  "message": "Portfolio uploaded successfully",
  "holdings_count": 3
}
```

**Errors**:
- `400 Bad Request`: Invalid CSV format or missing required columns
- `401 Unauthorized`: Missing or invalid token

### Analyze Portfolio

#### `POST /portfolio/analyze`

Analyze portfolio holdings for sector allocation and diversification.

**Authentication**: Required

**Request Body**:
```json
{
  "holdings": [
    {
      "ticker": "AAPL",
      "shares": 100,
      "purchase_price": 150.00
    },
    {
      "ticker": "MSFT",
      "shares": 50,
      "purchase_price": 280.00
    }
  ]
}
```

**Response** `200 OK`:
```json
{
  "total_value": 29500.00,
  "sectors": [
    {
      "sector": "Technology",
      "percentage": 100.0,
      "amount": 29500.00
    }
  ],
  "concentrated_sectors": ["Technology"],
  "diversification_score": 0.12
}
```

**Response Fields**:
- `total_value`: Total portfolio value in USD
- `sectors`: Array of sector allocations with percentage and dollar amount
- `concentrated_sectors`: Sectors with >30% allocation (concentration risk)
- `diversification_score`: 0-1 scale (0=concentrated, 1=diversified)

**Diversification Score Calculation**:
```
score = (sector_diversity * 0.4) + (concentration_score * 0.6)

sector_diversity = min(1.0, num_sectors / 5)
concentration_score = 1.0 - herfindahl_index
herfindahl_index = sum((allocation_pct / 100)² for each sector)
```

**Errors**:
- `400 Bad Request`: Invalid holdings data
- `401 Unauthorized`: Missing or invalid token

### Get Rebalancing Recommendations

#### `POST /portfolio/rebalance?model_type={model}`

Generate AI-powered rebalancing recommendations.

**Authentication**: Required

**Query Parameters**:
- `model_type` (optional): Target portfolio model
  - `conservative` (default): Balanced allocation across 11 sectors
  - `balanced`: Growth focus (25% tech)
  - `growth`: Aggressive (40% tech)

**Request Body**:
```json
{
  "holdings": [
    {
      "ticker": "AAPL",
      "shares": 100,
      "purchase_price": 150.00
    },
    {
      "ticker": "NVDA",
      "shares": 50,
      "purchase_price": 200.00
    }
  ]
}
```

**Response** `200 OK`:
```json
{
  "model_type": "balanced",
  "current_allocation": [
    {
      "sector": "Technology",
      "percentage": 100.0,
      "amount": 27500.00
    }
  ],
  "target_allocation": [
    {
      "sector": "Technology",
      "percentage": 25.0,
      "amount": 6875.00
    },
    {
      "sector": "Healthcare",
      "percentage": 15.0,
      "amount": 4125.00
    },
    // ... more sectors
  ],
  "recommendations": [
    {
      "ticker": "AAPL",
      "sector": "Technology",
      "action": "sell",
      "shares": 75,
      "amount": 12375.00,
      "current_percentage": 100.0,
      "target_percentage": 25.0,
      "reasoning": "Your portfolio is heavily concentrated in Technology at 100% versus the balanced target of 25%. Reducing AAPL position helps diversify sector exposure and manage concentration risk. This rebalancing aligns with a balanced growth strategy while maintaining exposure to quality tech names.",
      "ai_generated": true,
      "confidence_score": null
    },
    {
      "ticker": "JNJ",
      "sector": "Healthcare",
      "action": "buy",
      "shares": 25,
      "amount": 4125.00,
      "current_percentage": 0.0,
      "target_percentage": 15.0,
      "reasoning": "Adding Healthcare exposure diversifies your technology-heavy portfolio. Johnson & Johnson provides defensive characteristics and dividend income, complementing your growth-oriented tech holdings. This move reduces concentration risk and improves portfolio resilience.",
      "ai_generated": true,
      "confidence_score": null
    }
  ]
}
```

**Recommendation Fields**:
- `ticker`: Stock symbol to trade
- `sector`: Sector this stock belongs to
- `action`: "buy" or "sell"
- `shares`: Number of shares to trade
- `amount`: Dollar amount of trade
- `current_percentage`: Current sector allocation
- `target_percentage`: Target sector allocation
- `reasoning`: AI-generated explanation from Claude 3.5 Sonnet
- `ai_generated`: Whether reasoning was generated by AI
- `confidence_score`: Future feature for AI confidence (currently null)

**Model Portfolio Allocations**:

**Conservative Model**:
```json
{
  "Technology": 15.0,
  "Healthcare": 15.0,
  "Financials": 15.0,
  "Consumer Discretionary": 10.0,
  "Consumer Staples": 10.0,
  "Industrials": 10.0,
  "Materials": 5.0,
  "Energy": 5.0,
  "Utilities": 5.0,
  "Real Estate": 5.0,
  "Communication Services": 5.0
}
```

**Balanced Model**:
```json
{
  "Technology": 25.0,
  "Healthcare": 15.0,
  "Financials": 15.0,
  "Consumer Discretionary": 15.0,
  "Industrials": 10.0,
  "Communication Services": 10.0,
  "Consumer Staples": 5.0,
  "Energy": 5.0
}
```

**Growth Model**:
```json
{
  "Technology": 40.0,
  "Healthcare": 20.0,
  "Consumer Discretionary": 20.0,
  "Communication Services": 10.0,
  "Financials": 10.0
}
```

**Notes**:
- Only generates recommendations for >5% allocation differences
- Reasoning generated via Anthropic Claude API
- Falls back to basic reasoning if AI unavailable
- Recommendations prioritized by largest deviations

**Errors**:
- `400 Bad Request`: Invalid holdings data
- `401 Unauthorized`: Missing or invalid token

---

## RAG Endpoints (`/rag`) - Persona C Only

### Query Research Assistant

#### `POST /rag/query`

Ask a research question and get RAG-powered insights.

**Authentication**: Required

**Request Body**:
```json
{
  "question": "What are the key factors to consider when evaluating semiconductor stocks?",
  "context": "Previous conversation context (optional)"
}
```

**Response** `200 OK`:
```json
{
  "answer": "When evaluating semiconductor stocks, key factors include:\n\n1. **Technology Leadership**: Companies with cutting-edge process nodes (7nm, 5nm, 3nm) maintain competitive advantages.\n\n2. **Customer Diversification**: Reliance on single customers (e.g., Apple) creates concentration risk.\n\n3. **Capital Intensity**: Fab construction costs billions, favoring established players with scale.\n\n4. **Cyclicality**: Semiconductor demand is highly cyclical with boom-bust patterns.\n\n5. **Geopolitical Risk**: Taiwan concentration and US-China tensions create supply chain risks.",
  "sources": [
    {
      "document_id": 15,
      "title": "Semiconductor Industry Analysis 2024",
      "excerpt": "The semiconductor industry operates on a 4-5 year cycle driven by consumer demand, data center expansion, and automotive electrification...",
      "relevance_score": 0.89
    },
    {
      "document_id": 23,
      "title": "Technology Sector Deep Dive",
      "excerpt": "Process node leadership determines profitability. TSMC's 3nm advantage creates a structural moat...",
      "relevance_score": 0.76
    }
  ],
  "confidence": 0.82
}
```

**Response Fields**:
- `answer`: Generated response based on retrieved documents
- `sources`: Array of source documents used
  - `document_id`: Database ID of source document
  - `title`: Document title
  - `excerpt`: Relevant excerpt from document
  - `relevance_score`: 0-1 similarity score
- `confidence`: Overall confidence in response quality

**RAG Pipeline**:
1. Embed user question using sentence-transformers
2. Query Chroma vector database for top 5 similar chunks
3. Format retrieved context
4. Generate response (currently basic formatting)
5. Attach source citations

**Errors**:
- `400 Bad Request`: Missing question
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: RAG system error

### List Research Documents

#### `GET /rag/documents`

Get list of available research documents in the RAG system.

**Authentication**: Required

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "title": "Growth Stock Investment Strategies",
    "category": "Strategy",
    "created_at": "2025-01-10T08:00:00Z"
  },
  {
    "id": 2,
    "title": "Semiconductor Industry Analysis 2024",
    "category": "Industry Analysis",
    "created_at": "2025-01-12T14:30:00Z"
  }
]
```

**Errors**:
- `401 Unauthorized`: Missing or invalid token

### Get RAG System Statistics

#### `GET /rag/stats`

Get statistics about the RAG system.

**Authentication**: Required

**Response** `200 OK`:
```json
{
  "total_documents": 25,
  "total_chunks": 482,
  "embedding_model": "all-MiniLM-L6-v2",
  "collection_name": "research_docs"
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid token

---

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200 OK` | Success | Request completed successfully |
| `201 Created` | Resource created | User registered successfully |
| `400 Bad Request` | Invalid input | Missing required fields, invalid format |
| `401 Unauthorized` | Authentication failed | Missing token, expired token, invalid credentials |
| `404 Not Found` | Resource not found | Ticker doesn't exist, user hasn't completed onboarding |
| `422 Unprocessable Entity` | Validation failed | Pydantic validation error |
| `500 Internal Server Error` | Server error | Database error, external API failure |

### Example Error Responses

**400 Bad Request**:
```json
{
  "detail": "Expected 10 answers, received 8"
}
```

**401 Unauthorized**:
```json
{
  "detail": "Could not validate credentials"
}
```

**404 Not Found**:
```json
{
  "detail": "User has not completed onboarding"
}
```

**422 Unprocessable Entity**:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## Rate Limiting

**Current**: No rate limiting implemented

**Production Recommendation**:
- 100 requests per minute per IP for authenticated endpoints
- 20 requests per minute per IP for authentication endpoints
- 5 requests per minute for external API-dependent endpoints (market data)

---

## CORS Configuration

**Allowed Origins**:
- Development: `http://localhost:3200`
- Production: Configure based on deployment

**Allowed Methods**: All (GET, POST, PUT, DELETE, PATCH, OPTIONS)

**Allowed Headers**: All

**Credentials**: Enabled

---

## OpenAPI Documentation

Interactive API documentation available at:

- **Swagger UI**: http://localhost:8200/docs
- **ReDoc**: http://localhost:8200/redoc

These provide:
- Complete API schema
- Interactive request testing
- Request/response examples
- Model schemas

---

## Client Examples

### JavaScript/TypeScript (Next.js)

```typescript
// Authentication
const registerUser = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  return data;
};

// Authenticated request
const getPortfolioAnalysis = async (holdings: any[]) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/portfolio/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ holdings })
  });
  return await response.json();
};
```

### Python

```python
import requests

# Authentication
def register_user(email: str, password: str):
    response = requests.post(
        f"{API_URL}/auth/register",
        json={"email": email, "password": password}
    )
    data = response.json()
    return data['access_token']

# Authenticated request
def get_portfolio_analysis(token: str, holdings: list):
    response = requests.post(
        f"{API_URL}/portfolio/analyze",
        headers={"Authorization": f"Bearer {token}"},
        json={"holdings": holdings}
    )
    return response.json()
```

### cURL

```bash
# Register
curl -X POST http://localhost:8200/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:8200/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Get current user
curl -X GET http://localhost:8200/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Portfolio analysis
curl -X POST http://localhost:8200/portfolio/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "holdings": [
      {"ticker": "AAPL", "shares": 100, "purchase_price": 150.00},
      {"ticker": "MSFT", "shares": 50, "purchase_price": 280.00}
    ]
  }'
```

---

## Webhooks (Future Feature)

Not currently implemented. Future webhook support could include:

- Portfolio rebalancing alerts
- Market data updates
- Research document additions
- Persona change notifications

---

## Versioning

**Current Version**: 1.0.0

**Versioning Strategy**: Not yet implemented

**Future**: API versioning via URL path (`/v1/`, `/v2/`, etc.) or Accept header

---

## Support

For API issues or questions:
- **GitHub Issues**: [Repository Issues](https://github.com/your-org/smartwise)
- **Email**: support@smartwise.example.com
- **Documentation**: http://localhost:8200/docs
