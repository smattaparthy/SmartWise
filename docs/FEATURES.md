# Investing Assistant - Features Documentation

**Last Updated**: November 9, 2025

---

## Implemented Features ✅

### 1. User Authentication System ✅

**Status**: Fully functional

**Features**:
- User registration with email/password
- Secure password hashing (bcrypt)
- JWT token-based authentication
- 60-minute token expiration
- Automatic token refresh on expiration
- Protected routes requiring authentication
- Session persistence via localStorage

**User Flow**:
```
1. User visits /register
2. Enters email and password
3. Password hashed and stored in database
4. Redirected to /login
5. Login generates JWT token
6. Token stored in localStorage
7. Token sent with all API requests: Authorization: Bearer {token}
8. After 60 minutes, token expires → redirect to login
```

**Technical Details**:
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Token Payload**: `{sub: email, exp: timestamp}`
- **Storage**: Browser localStorage
- **Validation**: Every protected endpoint validates token

---

### 2. Onboarding Questionnaire ✅

**Status**: Fully functional

**Features**:
- 10-question assessment
- Risk score calculation (10-50 scale)
- Automatic persona assignment
- Persona persistence in database
- Personalized dashboard routing

**Questions Covered**:
1. Investment goals
2. Risk tolerance
3. Investment timeline
4. Experience level
5. Portfolio existence
6. Preferred advice style
7. Income stability
8. Emergency fund status
9. Debt situation
10. Age group

**Persona Assignment Logic**:

| Persona | Criteria | Risk Score | Dashboard |
|---------|----------|------------|-----------|
| **A (Starter)** | Low risk tolerance OR no experience OR prefers "simple" advice | ≤ 20 | `/dashboard/starter` |
| **B (Rebalance)** | Medium risk + has portfolio OR prefers "analysis" | 21-35 | `/dashboard/rebalance` |
| **C (Moonshot)** | High risk tolerance OR experienced OR prefers "research" | ≥ 36 | `/dashboard/moonshot` |

**Risk Score Calculation**:
```python
risk_score = 0
for answer in answers:
    if answer indicates high risk: risk_score += 5
    elif answer indicates medium risk: risk_score += 3
    elif answer indicates low risk: risk_score += 1

# Range: 10 (very conservative) to 50 (very aggressive)
```

---

### 3. Persona A - Starter Dashboard ✅

**Status**: Fully functional

**Target User**: Beginners, low risk tolerance, no existing portfolio

**Features**:
- Curated index fund recommendations
- Three portfolio strategies
- Fund comparison table
- Expense ratio display
- Getting started guide

**Recommended Funds**:

| Fund | Ticker | Type | Expense Ratio | Description |
|------|--------|------|---------------|-------------|
| Vanguard S&P 500 ETF | VOO | US Stocks | 0.03% | Tracks S&P 500 |
| Vanguard Total Stock Market ETF | VTI | US Stocks | 0.03% | Total US market |
| Vanguard Total International Stock ETF | VXUS | International | 0.07% | Non-US stocks |
| Vanguard Total Bond Market ETF | BND | Bonds | 0.03% | US bonds |
| Vanguard Real Estate ETF | VNQ | Real Estate | 0.12% | REITs |

**Portfolio Strategies**:

**Conservative (80/20)**:
- 50% VTI (US Total Stock Market)
- 10% VXUS (International Stocks)
- 30% BND (Bonds)
- 10% VNQ (Real Estate)

**Balanced (60/40)**:
- 40% VTI
- 20% VXUS
- 30% BND
- 10% VNQ

**Growth (90/10)**:
- 60% VTI
- 30% VXUS
- 10% BND

**Getting Started Guide**:
1. Open a brokerage account (Vanguard, Fidelity, Schwab)
2. Set up automatic monthly contributions
3. Choose a portfolio strategy
4. Buy the recommended ETFs
5. Rebalance annually

---

### 4. Persona B - Rebalance Dashboard ✅

**Status**: Fully functional

**Target User**: Existing investors, medium risk, needs portfolio optimization

**Features**:
- CSV portfolio upload
- Real-time portfolio analysis
- Sector allocation visualization
- Concentration risk warnings
- Diversification scoring
- Rebalancing recommendations
- Target allocation comparison

**CSV Upload Format**:
```csv
symbol,shares,purchase_price
AAPL,100,150.00
NVDA,1000,200.00
INTC,4000,35.00
```

**Analysis Capabilities**:

1. **Total Portfolio Value**
   - Fetches current prices from Alpha Vantage API
   - Calculates: `sum(shares × current_price)`
   - Displays total value prominently

2. **Sector Allocation**
   - Groups holdings by sector
   - Calculates percentage of each sector
   - Compares to target balanced model
   - Shows overweight/underweight indicators

3. **Concentration Risk Detection**
   - Flags sectors > 30% of portfolio
   - Warning: "Your portfolio is heavily concentrated in Technology (100%)"
   - Recommends diversification

4. **Diversification Score**
   - Herfindahl-Hirschman Index (HHI)
   - Range: 0 (perfect diversification) to 1 (single holding)
   - Formula: `sum(sector_percentage²)`
   - < 0.25 = Well diversified
   - > 0.25 = Concentrated

**Balanced Model Targets**:
```javascript
Technology: 25%
Healthcare: 15%
Financial Services: 15%
Consumer Cyclical: 15%
Industrials: 10%
Communication Services: 10%
Consumer Defensive: 5%
Energy: 5%
Real Estate: 0%
Utilities: 0%
Basic Materials: 0%
```

**Example Analysis Output**:
```
Total Portfolio Value: $390,500

Sector Breakdown:
┌──────────────────────┬─────────┬──────────┬────────────┐
│ Sector               │ Current │ Target   │ Difference │
├──────────────────────┼─────────┼──────────┼────────────┤
│ Technology           │ 100.0%  │ 25.0%    │ +75.0%     │
└──────────────────────┴─────────┴──────────┴────────────┘

⚠️ Concentration Warnings:
• Technology is 75% overweight (target: 25%, current: 100%)

Diversification Score: 0.08 (Highly concentrated)
```

**Rebalancing Recommendations** (Future Feature):
- Choose target model (Conservative/Balanced/Growth)
- Get buy/sell recommendations
- Trade-by-trade action plan
- Tax-loss harvesting suggestions

---

### 5. Persona C - Moonshot Dashboard ✅

**Status**: Fully functional

**Target User**: Advanced investors, research-driven, high risk tolerance

**Features**:
- Research assistant chatbot
- RAG-powered insights
- Document source citations
- Conversation context maintenance
- Sample question prompts

**RAG System Architecture**:
```
User Question
     ↓
Vector Search in ChromaDB
     ↓
Retrieve relevant document chunks
     ↓
Synthesize answer from chunks
     ↓
Return answer + source citations
```

**Sample Questions**:
- "What are emerging trends in technology investing?"
- "How do I evaluate a startup's growth potential?"
- "What are the key risks in tech stocks?"
- "Explain the importance of diversification"

**Example Interaction**:
```
User: "What are the key risks in tech stocks?"