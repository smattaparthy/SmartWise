from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, onboarding, market, portfolio, rag

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Investing Assistant API", version="1.0.0")

# Configure CORS for frontend on port 3200
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(market.router)
app.include_router(portfolio.router)
app.include_router(rag.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
