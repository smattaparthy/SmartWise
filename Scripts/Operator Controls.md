Next sensible layer is: give yourself controls. Right now everything is hardcoded (seeded ideas, model portfolios, research on disk). That’s fine for a demo, but it means every change = code change.
So the next steps will be:
Add a lightweight admin surface (no RBAC yet)
Expose model portfolios over API so the UI can show what’s being used
Add a research-docs viewer (so you can confirm RAG is actually ingesting things)
Add a mini “system health” panel (shows counts, last ingest, etc.)
Add some simple tests/checks
I’ll show you how to do all of those without making this a whole new product.
1. Lightweight admin surface
We’ll make a page like /admin in Next.js that only shows up if the user is logged in. No roles for MVP — we trust ourselves.
Frontend: /app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function AdminPage() {
  const [me, setMe] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setMe);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Admin</h1>
        <p className="text-sm text-slate-500">
          Inspect model portfolios, research docs, and basic system status.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded p-4">
            <h2 className="text-sm font-medium mb-2">Users</h2>
            <p className="text-2xl font-semibold">
              {stats?.users_count ?? "—"}
            </p>
          </div>
          <div className="bg-white border rounded p-4">
            <h2 className="text-sm font-medium mb-2">Research docs</h2>
            <p className="text-2xl font-semibold">
              {stats?.research_count ?? "—"}
            </p>
          </div>
          <div className="bg-white border rounded p-4">
            <h2 className="text-sm font-medium mb-2">Model portfolios</h2>
            <p className="text-2xl font-semibold">
              {stats?.model_portfolios_count ?? "—"}
            </p>
          </div>
        </div>

        {/* later: tables for research + portfolios */}
      </div>
    </AppShell>
  );
}
We need an endpoint for /admin/stats on the backend — we’ll do that next.
2. Backend: /admin/stats and model portfolios endpoint
We already hardcoded model portfolios in the backend. Let’s expose them as read-only JSON so the admin page can see what the current recipes are.
Backend snippet
# routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..model_portfolios import MODEL_PORTFOLIOS  # the dict we defined

router = APIRouter(prefix="/admin", tags=["admin"])

def get_current_user(...):
    # reuse your existing version from main
    ...

@router.get("/stats")
def get_stats(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    # MVP: any logged in user can see this
    users_count = db.query(models.User).count()
    research_count = db.query(models.ResearchDoc).count()
    model_portfolios_count = len(MODEL_PORTFOLIOS.keys())
    return {
        "users_count": users_count,
        "research_count": research_count,
        "model_portfolios_count": model_portfolios_count,
    }

@router.get("/model-portfolios")
def list_model_portfolios(current_user=Depends(get_current_user)):
    return MODEL_PORTFOLIOS
Then in main.py:
from .routers import admin
app.include_router(admin.router)
Now you have a simple inspection API.
3. Research docs viewer
Right now, you drop files in ./data/research and run an ingest script. You should be able to see which ones made it into the DB/vector store.
Backend: list research docs
# routers/research.py (extend existing)
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/research", tags=["research"])

@router.get("/docs")
def list_research_docs(db: Session = Depends(get_db)):
    docs = db.query(models.ResearchDoc).order_by(models.ResearchDoc.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "sector": d.sector,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]
Frontend: show them in /admin
// inside AdminPage, after stats
const [docs, setDocs] = useState<any[]>([]);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;
  fetch(`${process.env.NEXT_PUBLIC_API_BASE}/research/docs`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => r.json())
    .then(setDocs)
    .catch(() => {});
}, []);

...

<div className="bg-white border rounded p-4">
  <h2 className="text-sm font-medium mb-2">Recent research</h2>
  <ul className="space-y-1 max-h-56 overflow-auto">
    {docs.map((d) => (
      <li key={d.id} className="text-xs flex justify-between gap-2">
        <span>{d.title}</span>
        <span className="text-slate-400">{d.sector || "general"}</span>
      </li>
    ))}
    {!docs.length && (
      <li className="text-xs text-slate-400">No research ingested yet.</li>
    )}
  </ul>
</div>
Now you can visually confirm what your RAG is working with.
4. Editable model portfolios (MVP-ish)
Right now we return static:
MODEL_PORTFOLIOS = { ... }
If you want to tweak allocations without redeploying, we can let the backend load them from a JSON file mounted into the container, e.g. ./data/model_portfolios.json.
Load-from-file approach
import json, os

def load_model_portfolios():
    path = os.getenv("MODEL_PORTFOLIOS_FILE", "./data/model_portfolios.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    # fallback to hardcoded
    return {
        "conservative": [...],
        ...
    }

MODEL_PORTFOLIOS = load_model_portfolios()
Then at runtime, change the JSON, restart container — you don’t have to change code. That’s admin-enough for MVP.
5. System health panel
This is tiny but useful: show if your vector store dir exists, if your research dir exists, and maybe last ingest time (if you store it).
Backend
import os
from datetime import datetime

@router.get("/health")
def get_health():
    research_dir = os.getenv("FILES_BASE_PATH", "./data/research")
    chroma_dir = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma_store")
    return {
        "research_dir_exists": os.path.exists(research_dir),
        "chroma_dir_exists": os.path.exists(chroma_dir),
        "server_time": datetime.utcnow().isoformat() + "Z"
    }
Frontend (admin page)
const [health, setHealth] = useState<any>(null);
useEffect(() => {
  const token = localStorage.getItem("token");
  fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/health`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then((r) => r.json())
    .then(setHealth)
    .catch(() => {});
}, []);
Render it as little green/red pills.
6. Basic automated checks
You don’t need a full test suite, but you can add two simple things to the repo:
backend/tests/test_onboarding.py
backend/tests/test_portfolio_parse.py
so you can run pytest locally to catch regressions.
backend/tests/test_onboarding.py
from app.routers.onboarding import compute_risk_score, compute_experience_level
from app.routers.onboarding import OnboardingAnswers

def test_risk_high_when_user_says_they_can_lose_20pct():
    ans = OnboardingAnswers(
        q1_experience="c",
        q2_has_portfolio="c",
        q3_goal="c",
        q4_horizon="c",
        q5_risk_reaction="c",
        q6_max_risk_pct="d",
        q7_contribution="a",
        q8_concentration="b",
        q9_frontier_interest="c",
        q10_guidance_style="b",
    )
    risk = compute_risk_score(ans)
    assert risk >= 80
It’s small, but it proves your mapping logic didn’t get accidentally “optimized away.”
7. What you can do right after this
Add a link to /admin in the header (only if logged in)
Drop a couple of .md research files in ./data/research and confirm they show up
Tweak data/model_portfolios.json and confirm admin page shows the new count
Run docker compose up and sanity-check admin → stats → research
At this point, you have:
user app (onboard + persona)
operator view (admin)
data view (research list)
and still the clean Next.js/FastAPI container setup
That’s a surprisingly complete MVP for “novice-to-moonshot investing helper.” Next next steps would be optional grown-up stuff (RBAC, audit log, upload research over HTTP), but the core loop is done.