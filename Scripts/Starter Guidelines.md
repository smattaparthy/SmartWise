Alright, let’s move from “we know what it should look like” to “here are the actual React components you can paste in.”
I’ll give you a mini UI kit for this app:
AppShell (shared layout)
TopBar (header)
OnboardingStep (so the 10 questions don’t become spaghetti)
Styled Persona B upload page (with chart placeholder)
Persona C ideas page with banner + search
A tiny Alert component for flags
You can drop these into frontend/components/ and wire into your pages.
I’ll assume: Next.js (app router) + Tailwind + ShadCN-ish patterns.
1. AppShell.tsx
// components/AppShell.tsx
"use client";

import React from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6">
        <div className="text-sm font-semibold tracking-tight">
          Investing Assistant
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Demo user</span>
          {/* later: avatar */}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
Use this to wrap every dashboard-ish page.
2. Onboarding as 3 steps
Let’s make a reusable step wrapper:
// components/OnboardingStep.tsx
"use client";

type OnboardingStepProps = {
  step: number;
  total: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  showNext?: boolean;
  showBack?: boolean;
};

export function OnboardingStep({
  step,
  total,
  title,
  description,
  children,
  onNext,
  onBack,
  showNext = true,
  showBack = false,
}: OnboardingStepProps) {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 rounded bg-slate-200">
          <div
            className="h-1 rounded bg-slate-900"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">
          Step {step} of {total}
        </span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
      <div className="flex justify-between pt-2">
        {showBack ? (
          <button
            onClick={onBack}
            type="button"
            className="text-sm text-slate-500"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {showNext && (
          <button
            onClick={onNext}
            type="button"
            className="bg-slate-900 text-white text-sm px-4 py-2 rounded"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
Now your /onboarding/page.tsx can just swap steps and at the end call the FastAPI endpoint.
3. A “card-select” component for answers
This keeps questions tidy.
// components/CardOption.tsx
"use client";

type CardOptionProps = {
  selected?: boolean;
  onClick?: () => void;
  title: string;
  description?: string;
};

export function CardOption({ selected, onClick, title, description }: CardOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left border rounded-lg p-3 transition ${
        selected
          ? "border-slate-900 bg-slate-900/5"
          : "border-slate-200 hover:border-slate-400"
      }`}
    >
      <div className="text-sm font-medium">{title}</div>
      {description && (
        <div className="text-xs text-slate-500 mt-1">{description}</div>
      )}
    </button>
  );
}
This is perfect for the 10 multiple-choice items.
4. Persona B – styled upload page
// app/dashboard/persona-b/upload/page.tsx
"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function UploadPortfolioPage() {
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    const formData = new FormData(e.currentTarget);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/portfolio/analyze`,
      {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    if (!res.ok) {
      setError("Could not analyze your CSV. Check columns (Ticker, TotalValue).");
      return;
    }
    const data = await res.json();
    setResult(data);
  }

  return (
    <AppShell>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h1 className="text-lg font-semibold mb-1">Portfolio X-ray</h1>
            <p className="text-sm text-slate-500 mb-3">
              Upload a CSV with columns <code>Ticker</code> and{" "}
              <code>TotalValue</code>. We&apos;ll detect concentration and suggest a target.
            </p>
            <form onSubmit={handleUpload} className="space-y-3">
              <input
                name="file"
                type="file"
                accept=".csv"
                className="block text-sm"
              />
              <button
                className="bg-slate-900 text-white text-sm px-4 py-2 rounded"
                type="submit"
              >
                Analyze
              </button>
            </form>
            {error && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 rounded p-2">
                {error}
              </p>
            )}
          </div>

          {result && (
            <div className="bg-white rounded-lg border p-4 space-y-4">
              <h2 className="text-sm font-medium">Sector breakdown</h2>
              {/* TODO: add AntD chart here, for now we show list */}
              <ul className="space-y-1">
                {result.sector_breakdown?.map((s: any) => (
                  <li key={s.sector} className="flex justify-between text-sm">
                    <span>{s.sector}</span>
                    <span className="text-slate-500">{s.weight_pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {result?.flags?.length ? (
            <div className="bg-white rounded-lg border p-4 space-y-2">
              <h2 className="text-sm font-medium">Flags</h2>
              {result.flags.map((f: any, idx: number) => (
                <div
                    key={idx}
                    className="bg-amber-50 border border-amber-200 rounded p-2"
                >
                  <p className="text-xs text-amber-900">{f.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-medium">Flags</h2>
              <p className="text-xs text-slate-400">
                Upload a portfolio to see concentration issues.
              </p>
            </div>
          )}

          {result?.target_allocation && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-medium mb-2">
                Target: {result.target_allocation.name}
              </h2>
              <ul className="space-y-1">
                {result.target_allocation.instruments.map((inst: any) => (
                  <li
                    key={inst.ticker}
                    className="flex justify-between text-sm"
                  >
                    <span>{inst.ticker}</span>
                    <span className="text-slate-500">
                      {inst.weight_pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
That’s a clean, 3-column dashboard look.
5. Persona C with banner + search
// components/HighRiskBanner.tsx
export function HighRiskBanner() {
  return (
    <div className="rounded-md bg-amber-100 text-amber-900 p-3 text-sm border border-amber-200">
      <b>High-Risk Ideas:</b> These are volatile and should only use the high-risk % you set. This is not investment advice.
    </div>
  );
}
// app/dashboard/persona-c/ideas/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HighRiskBanner } from "@/components/HighRiskBanner";

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [disclaimer, setDisclaimer] = useState(false);
  const [query, setQuery] = useState("");

  async function fetchIdeas(q?: string) {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_BASE}/ideas/highrisk`
    );
    url.searchParams.set("max_risk_pct", "10");
    if (q) url.searchParams.set("q", q);
    const res = await fetch(url.toString());
    const data = await res.json();
    setIdeas(data.ideas || []);
    setDisclaimer(data.disclaimer);
  }

  useEffect(() => {
    fetchIdeas();
  }, []);

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Frontier / Moonshot Ideas</h1>
            <p className="text-sm text-slate-500">
              Curated from your research corpus and internal seed list.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border rounded p-2 text-sm w-48"
              placeholder="Search sector..."
            />
            <button
              onClick={() => fetchIdeas(query)}
              className="bg-slate-900 text-white text-sm px-4 py-2 rounded"
            >
              Search
            </button>
          </div>
        </div>

        {disclaimer && <HighRiskBanner />}

        <div className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea) => (
            <div
              key={idea.ticker + idea.name}
              className="bg-white border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">
                  {idea.ticker} {idea.name ? `— ${idea.name}` : ""}
                </h2>
                {idea.sector && (
                  <span className="text-[10px] uppercase text-slate-400">
                    {idea.sector}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 line-clamp-3">
                {idea.thesis}
              </p>
              {idea.time_horizon_years && (
                <p className="text-[10px] text-slate-400">
                  Horizon: {idea.time_horizon_years} yrs
                </p>
              )}
            </div>
          ))}
          {!ideas.length && (
            <p className="text-xs text-slate-400">
              No ideas found. Try a broader search term.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
That’s the Persona C experience, fully styled.
6. Little Alert component for reuse
// components/Alert.tsx
type AlertProps = {
  tone?: "warning" | "error" | "info";
  children: React.ReactNode;
};

const toneClasses = {
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  error: "bg-red-50 border-red-200 text-red-700",
  info: "bg-slate-50 border-slate-200 text-slate-700",
};

export function Alert({ tone = "info", children }: AlertProps) {
  return (
    <div className={`border rounded p-2 text-xs ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}
Use that for CSV errors or missing sector data.
What’s next after this styling step
Swap the sector list for an Ant Design Pie chart.
Add skeletons while fetching /me and /portfolio/analyze.
Add a tiny “persona chip” in header once /me returns (Persona: B · 10% high-risk).