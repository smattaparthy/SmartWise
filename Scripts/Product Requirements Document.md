Product: Guided 3-Persona Investing Assistant
Scope: End-to-end MVP (local, containerized, RAG-ready)
Status: Buildable
Assumptions: US-listed assets only, generic CSV first, local DB + vector store, Next.js + FastAPI, local auth
1. Product Summary
Build a web app that takes a non-expert investor, asks up to 10 smart questions, classifies them into one of three investment personas, and then gives them portfolio guidance appropriate to that persona:
Persona A (Starter) – index funds, SIP style, low friction
Persona B (Rebalance) – CSV import → portfolio X-ray → rebalance suggestions
Persona C (Moonshot) – small, user-bounded high-risk allocation backed by local research (RAG) on frontier sectors
App will run locally in containers (frontend + backend), use local storage for research docs and vector store, and will be ready to move to Azure later.
2. Goals & Non-Goals
2.1 Goals
Classify users via 10-question onboarding into A/B/C
Generate portfolio suggestions based on time horizon (1–2y, 2–5y, 5y+)
Ingest CSV portfolios and detect concentration (sector / single ticker)
Offer high-risk baskets capped by user’s “I can lose X%”
Fetch market data (Yahoo/Alpha Vantage style) to enrich tickers
Run entirely locally via docker compose up
Store research locally and query via vector store for Persona C
2.2 Non-Goals (MVP)
No real trading / brokerage integration
No multi-region / multi-currency
No advanced auth (OIDC, SSO)
No full-blown admin CMS (just hardcoded lists + simple DB table)
3. Target Users / Personas
3.1 Persona A – “Just make it go up”
Experience: low
Has no current portfolio
Wants index funds + SIP
Output: simple allocation (VOO, VTI, SPY, BND) + short explanation
3.2 Persona B – “I already bought stuff, am I in danger?”
Experience: medium
Has CSV from broker
Wants X-ray for sector/single-stock concentration
Output: current vs target allocation, flags, rebalance actions
3.3 Persona C – “Show me the weird good stuff”
Experience: high
Risk: high (10–25% of portfolio ok)
Wants frontier ideas: quantum, hydrogen, green energy, biotech/oncology
Output: high-risk basket limited to user’s % + disclaimer
4. User Experience Flows
4.1 Auth & Onboarding
User signs up (email + password)
User logs in → token stored in browser (localStorage)
App calls /me
If no persona → redirect to /onboarding
User fills 10-question wizard
Backend computes:
suggested_persona ∈ {A, B, C}
risk_score (0–100)
experience_level (1–3)
time_horizon (short/mid/long %)
max_risk_allocation_pct (5/10/20/25)
User redirected to /dashboard → router sends to persona page
4.2 Persona A Flow
Fetch /instruments/core
Show “Starter portfolio”
Show monthly SIP option (just UI for MVP)
Show rationale (“you picked low complexity, short horizon → we picked index/bonds”)
4.3 Persona B Flow
User uploads CSV → Ticker,TotalValue,...
Backend:
parses CSV
fetches market metadata per ticker
computes sector breakdown
detects flags
picks target model portfolio (conservative / balanced / growth)
returns JSON with current vs target
UI:
show flags (sector > 35%, position > 10%)
show target allocation
show “trim overweight → move to VOO/VTI/BND”
4.4 Persona C Flow
User opens high-risk ideas page
UI hits /ideas/highrisk?max_risk_pct=X
Backend:
tries to query local vector store (if sector/query passed)
otherwise returns seeded US-listed frontier ideas
returns disclaimer: true
UI shows banner + idea cards
Optional: call /portfolio/final to show base+overlay
5. Functional Requirements
5.1 Authentication
FR-1: System shall support local authentication (email + password)
FR-2: Passwords shall be stored hashed (bcrypt)
FR-3: System shall issue JWT access tokens with 60 min expiry
FR-4: /me shall return current user profile and stored persona
5.2 Onboarding Questionnaire
FR-5: System shall present exactly 10 questions (we defined them)
FR-6: System shall accept answers as letters (a/b/c/d)
FR-7: System shall compute risk_score, experience_level, time_horizon, max_risk_allocation_pct
FR-8: System shall suggest a persona but allow future override (v2)
5.3 Persona Assignment
FR-9: Low experience OR “simple portfolio” intent → Persona A
FR-10: Portfolio present OR “rebalance” intent → Persona B
FR-11: High risk (≥60) AND frontier interest → Persona C
5.4 Portfolio Analysis (Persona B)
FR-12: System shall accept CSV with at least Ticker and TotalValue
FR-13: System shall compute total portfolio value
FR-14: System shall compute position weights
FR-15: System shall fetch sector/name per ticker from market data adapter
FR-16: System shall aggregate by sector
FR-17: System shall flag:
sector weight > 35%
single position > 10%
FR-18: System shall return a target allocation from a model portfolio
FR-19: System shall recommend shifting overweight to core ETFs (VOO, VTI, BND)
5.5 High-Risk Ideas (Persona C)
FR-20: System shall return a list of US-listed high-risk stocks/ETFs
FR-21: System shall cap high-risk suggestions by user’s max_risk_allocation_pct
FR-22: System shall always return disclaimer: true for high-risk
FR-23: System shall support filtering by sector (?sector=quantum)
FR-24: If research corpus exists, system shall attempt to retrieve ideas via vector search
5.6 Research / RAG
FR-25: System shall allow storing research docs metadata in local DB
FR-26: System shall persist embeddings in a local vector store
FR-27: System shall expose /research/search?q=... to retrieve relevant chunks
FR-28: System shall let /ideas/highrisk consume those chunks to generate ideas
5.7 Instruments / Index Universe
FR-29: System shall expose /instruments/core returning hardcoded list:
VOO, VTI, QQQ, SPY, BND (US-listed)
FR-30: System shall allow future admin management (v2)
6. Non-Functional Requirements
NFR-1: Run locally via Docker containers (docker compose up)
NFR-2: Backend response for portfolio analysis (≤ 100 tickers) < 3 seconds with cached market calls
NFR-3: UI must be responsive (desktop first, mobile usable)
NFR-4: CORS must allow http://localhost:3000
NFR-5: All endpoints must return JSON with clear error messages
NFR-6: High-risk suggestions must always include a disclaimer field
NFR-7: All stored user data stays local (for MVP)
7. System Architecture
7.1 High-Level
[Next.js (frontend)]
     |
     |  HTTP (JWT)
     v
[FastAPI (backend)]
     |--- Auth / Users (SQLite)
     |--- Onboarding scoring
     |--- Portfolio analyze
     |--- RAG / research search
     |
     |--- Market data adapter (Alpha Vantage / Yahoo-style)
     |
Local volumes:
  ./data/research      <- human docs
  ./data/chroma_store  <- embeddings
7.2 Tech Stack
Frontend: Next.js (App Router), React, simple components (ShadCN/AntD optional)
Backend: Python, FastAPI, SQLAlchemy, JWT (python-jose)
DB: SQLite (MVP) → volume-backed
Vector Store: Chroma (local, persisted)
Containers: Docker, docker-compose
Data: Alpha Vantage / Yahoo-style HTTP calls
8. API Contracts (MVP)
8.1 Auth
POST /auth/signup
{ "email": "user@example.com", "password": "secret123" }
→ 200 { "access_token": "jwt...", "token_type": "bearer" }
POST /auth/login (OAuth2 form)
→ same response
GET /me (Bearer)
→
{
  "email": "user@example.com",
  "suggested_persona": "B",
  "risk_score": 62,
  "time_horizon": { "short_term": 30, "mid_term": 30, "long_term": 40 },
  "max_risk_allocation_pct": 20
}
8.2 Onboarding
POST /onboarding/answers
{
  "q1_experience": "b",
  "q2_has_portfolio": "c",
  "q3_goal": "b",
  "q4_horizon": "d",
  "q5_risk_reaction": "b",
  "q6_max_risk_pct": "c",
  "q7_contribution": "a",
  "q8_concentration": "b",
  "q9_frontier_interest": "b",
  "q10_guidance_style": "b"
}
→
{
  "suggested_persona": "B",
  "risk_score": 70,
  "experience_level": 3,
  "time_horizon": { "short_term": 30, "mid_term": 30, "long_term": 40 },
  "max_risk_allocation_pct": 20
}
8.3 Portfolio (Persona B)
POST /portfolio/analyze (multipart CSV)
→
{
  "total_value": 23500.0,
  "positions": [...],
  "sector_breakdown": [...],
  "flags": [
    { "type": "sector_overweight", "message": "..." }
  ],
  "rebalance_suggestions": [
    {
      "action": "reduce_sector",
      "detail": "Trim positions ...",
      "suggested_targets": ["VOO","VTI","BND"]
    }
  ],
  "target_allocation": {
    "name": "balanced",
    "instruments": [
      {"ticker": "VTI", "weight_pct": 40},
      ...
    ]
  }
}
8.4 High-Risk Ideas (Persona C)
GET /ideas/highrisk?sector=quantum&max_risk_pct=10
→
{
  "disclaimer": true,
  "max_risk_allocation_pct": 10,
  "ideas": [
    {
      "ticker": "IONQ",
      "name": "IonQ Inc.",
      "sector": "quantum",
      "thesis": "Pure-play ...",
      "time_horizon_years": 7,
      "risk_level": "high",
      "source_docs": ["local:quantum_report_q1"]
    }
  ]
}
8.5 Instruments
GET /instruments/core
→ list of hardcoded ETFs
8.6 Final Portfolio
GET /portfolio/final
→
{
  "persona": "C",
  "base_portfolio": {...},
  "highrisk_used": true,
  "max_risk_allocation_pct": 10,
  "final_allocation": [
    {"ticker": "VTI", "weight_pct": 36.0},
    {"ticker": "BND", "weight_pct": 20.0},
    {"ticker": "IONQ", "weight_pct": 5.0},
    ...
  ]
}
9. Data Model (Backend)
User
id (int)
email (str)
password_hash (str)
suggested_persona (str)
risk_score (int)
experience_level (int)
time_horizon (JSON)
max_risk_allocation_pct (int)
created_at (datetime)
ResearchDoc
id
title
path
sector
tags (JSON)
created_at
(Derived) Holding – not necessarily stored, often just request-time
10. Frontend Requirements (Next.js)
FE-1: /login, /signup
FE-2: /onboarding with 10 questions (2–3 per screen to reduce scroll)
FE-3: /dashboard → calls /me → routes to persona page
FE-4: /dashboard/persona-a → show core instruments + simple allocation
FE-5: /dashboard/persona-b → show upload CTA
FE-6: /dashboard/persona-b/upload → CSV upload → render flags + target
FE-7: /dashboard/persona-c/ideas → show high-risk ideas + disclaimer
FE-8: Use cards, minimal clicks, avoid deep scrolling
FE-9: Use NEXT_PUBLIC_API_BASE to talk to backend in container
FE-10: Show banner whenever API says disclaimer: true
11. Deployment (Local Containers)
compose services:
backend: build from ./backend, expose 8000:8000, mount ./data/...
frontend: build from ./frontend, expose 3000:3000, env NEXT_PUBLIC_API_BASE=http://backend:8000
volumes:
./data/research:/data/research
./data/chroma_store:/data/chroma_store
backend env:
SECRET_KEY
DATABASE_URL=sqlite:///./app.db
CHROMA_PERSIST_DIR=/data/chroma_store
FILES_BASE_PATH=/data/research
Run with:
docker compose build
docker compose up
12. Validation & Edge Cases
If CSV has unknown tickers → mark sector “Unknown” and add data warning
If user says 0–5% risk but chooses Persona C → still cap overlay to 5% and show banner
If AV/Yahoo fails → fallback sector and DO NOT crash analysis
If research corpus is empty → /ideas/highrisk must still return seeded ideas
13. Future Enhancements (Documented but not MVP)
Admin UI to add/update model portfolios
Broker-specific CSV parsers
Real charting for X-ray (Ant Design Charts)
Scheduled rebalancing suggestions
Azure deployment (App Service + mounted storage)
OAuth / SSO