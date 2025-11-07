1. User Stories
1.1 Auth & Onboarding
US-1: As a new user, I want to sign up with email/password so I can save my persona and portfolio settings.
US-2: As a logged-in user without a persona, I want to be forced into a short questionnaire so the app knows what kind of investor I am.
US-3: As a user, I want the app to remember my choices so I don’t have to re-answer questions.
1.2 Persona A
US-4: As a beginner, I want the app to tell me a small list of index/bond funds so I don’t have to research 50 ETFs.
US-5: As a beginner, I want to see why these funds were picked so I trust the app (even if the explanation is short).
US-6: As a beginner, I want to invest a fixed amount monthly (SIP style) so I don’t have to time the market (UI-only MVP).
1.3 Persona B
US-7: As a user with an existing portfolio, I want to upload a generic CSV of my holdings so the app can analyze it.
US-8: As that user, I want to see which sectors I’m overexposed to so I can reduce risk.
US-9: As that user, I want a suggested “target” portfolio so I know what “good” looks like.
US-10: As that user, I want rebalance suggestions in human terms (“trim tech, add VOO/BND”) not just numbers.
1.4 Persona C
US-11: As an advanced user, I want to tell the system I can risk 10–20% so the app doesn’t blow up my whole portfolio.
US-12: As an advanced user, I want research-backed picks in frontier sectors so I don’t chase random meme stocks.
US-13: As an advanced user, I want to see a disclaimer so I know this is high-volatility stuff.
1.5 Admin-ish (MVP-light)
US-14: As the product owner, I want to drop new research docs into a folder and have them show up in search so I don’t need to redeploy.
US-15: As the product owner, I want to run everything locally in containers so I can demo to stakeholders.
2. Sequence / Flow Narratives
2.1 Onboarding Flow
Frontend loads /dashboard.
Calls GET /me with JWT.
Backend sees suggested_persona == null → frontend redirects /onboarding.
User completes 10 questions.
Frontend POST /onboarding/answers with all 10 answers.
Backend:
computes scores
saves them to User row
returns computed result
Frontend redirects to /dashboard.
/dashboard calls /me again → now gets persona → routes to /dashboard/persona-X.
No extra DB round trips needed.
2.2 Persona B (CSV → X-ray → target)
User hits /dashboard/persona-b/upload.
User uploads CSV.
Frontend POST /portfolio/analyze (multipart).
Backend:
parse CSV
for each ticker → call get_market_metadata (cached)
compute sector totals
detect flags
pick model portfolio (e.g. balanced)
return JSON with current + target + flags
Frontend:
render flags (yellow boxes)
render sector breakdown (chart/table)
render target allocation (list)
optionally show “diff” (current vs target)
2.3 Persona C (query → RAG → idea cards)
User opens /dashboard/persona-c/ideas.
Frontend calls GET /ideas/highrisk?max_risk_pct=10.
Backend:
tries vector search if available
otherwise returns seeded ideas
always sets disclaimer=true
Frontend renders banner + cards.
If user searches, frontend calls again with ?q=quantum photonics.
3. Validation & Error States
3.1 CSV Upload
Missing Ticker column → 400 "No valid positions found in CSV."
Non-numeric TotalValue → skip row, continue
All rows invalid → 400
Ticker resolved but sector unknown → return "Unknown" and add a data-warning flag
3.2 Onboarding
If any of the 10 answers missing → 422 (FastAPI default)
If user already has persona and calls onboarding again → overwrite (MVP) and save new persona (this lets users “re-take” the quiz)
3.3 Auth
Wrong password → 400 "Incorrect email or password"
Token expired → 401 → frontend redirects to /login
3.4 Ideas / RAG
If vector store empty → return seeded ideas, no error
If query returns no docs → return empty ideas array but still disclaimer: true
4. Test Plan (MVP-level)
You don’t need a NASA test matrix, but you do need to be sure each persona path works.
4.1 Unit-ish
test_scoring_low_experience → q1=a, q2=a, q3=a → persona A
test_scoring_existing_portfolio → q2=c → persona B
test_scoring_frontier_high_risk → q3=c, q9=c, q5=c, q6=d → persona C
test_max_risk_caps → q6=a → 5% → final allocation must have overlay ≤5%
4.2 API Integration
Auth flow
POST /auth/signup
GET /me (401) with no token
GET /me (200) with token
Onboarding flow
POST /onboarding/answers
GET /me → persona is set
CSV flow
POST /portfolio/analyze with valid CSV → 200
Response has flags, sector_breakdown, target_allocation
Ideas flow
GET /ideas/highrisk → 200, disclaimer=true
GET /research/search?q=test → 200 (even if empty)
4.3 UI Smoke (manual is fine for MVP)
Login → Onboarding → Dashboard routes properly
Persona B upload → data shows
Persona C → disclaimer shows
5. Dev Workflow (local containers)
Clone repo (we’re imagining you split backend/ and frontend/).
Create folders:
mkdir -p data/research data/chroma_store
Run compose:
docker compose build
docker compose up
Open:
Backend docs: http://localhost:8000/docs
Frontend: http://localhost:3000
Add a research doc:
drop data/research/quantum_report.md
docker exec -it investing-backend python ingest_research.py
Hit: GET /research/search?q=quantum → should see it
Develop frontend with hot reload by mounting local folder (optional).
That’s the loop.
6. Logging / Observability (local)
We don’t need fancy Prometheus yet, but we do want to see what users are doing.
Log level: INFO
Log each:
onboarding completion (user_id, persona, risk_score)
CSV analysis request (user_id, #tickers, #flags)
high-risk ideas request (user_id, sector/q, max_risk_pct)
Don’t log passwords or JWTs
In FastAPI:
import logging
logger = logging.getLogger("app")

@app.post("/onboarding/answers")
def handle_onboarding(...):
    ...
    logger.info(f"onboarding user={current_user.id} persona={persona} risk={risk}")
That’s enough for local debugging.
7. Security Notes (still MVP)
Use HTTPS in prod, but for local we do HTTP
JWT secret must be env var
Passwords hashed
CORS limited to http://localhost:3000
No upload of arbitrary files except CSV; reject >1MB
8. Azure Hook Points (for later-you)
You said “later Azure,” so we just mark extensibility points:
DB URL is env-based → swap SQLite → Postgres
Chroma dir is env-based → mount Azure file share
Next.js base API URL is env-based → swap to App Service URL
Dockerfiles already exist → can push to Azure Container Apps
So future-you doesn’t have to refactor the whole codebase to go cloud.
9. Recap of Deliverables (what this PRD expects to exist)
Backend (FastAPI)
/auth/signup, /auth/login, /me
/onboarding/answers
/portfolio/analyze
/portfolio/final
/instruments/core
/ideas/highrisk
/research/search
local DB models (User, ResearchDoc)
market data adapter with caching
Frontend (Next.js)
Auth pages
Onboarding wizard
Dashboard router
Persona A, B (upload), C (ideas) pages
High-risk banner component
Infra
docker-compose.yml with frontend + backend + mounted data/
Dockerfiles for both
Docs
This PRD
Example CSV
Example research doc format