We’ve got layout, persona pages, and basic styling. Next natural steps:
Add real charts (Ant Design Plots) to the portfolio view
Add a top-right persona chip that shows who the user is right now
Add loading skeletons + error states in a reusable way
Add a tiny “current vs target” diff list (so users see what to change)
Centralize API fetching so you don’t repeat token logic everywhere
I’ll walk through each with code.
1. Add Ant Design chart to Persona B
Install in frontend:
npm install @ant-design/plots
Then in your upload page, after fetching result, render the pie:
import dynamic from "next/dynamic";
const Pie = dynamic(
  () => import("@ant-design/plots").then((mod) => mod.Pie),
  { ssr: false }
);
Then inside your JSX:
{result && (
  <div className="bg-white rounded-lg border p-4 space-y-4">
    <h2 className="text-sm font-medium">Sector breakdown</h2>
    <Pie
      data={result.sector_breakdown}
      angleField="weight_pct"
      colorField="sector"
      radius={0.9}
      legend={{ layout: "vertical", position: "right" }}
      label={false}
    />
  </div>
)}
That gives you a proper chart without changing your data shape.
2. Persona chip in the header
We want the header to say something like:
Persona B · 10% high-risk
…so users always know what mode they’re in.
Create a small hook to fetch /me once, then use it in AppShell.
lib/useMe.ts
"use client";

import { useEffect, useState } from "react";

export function useMe() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setMe(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { me, loading };
}
Update AppShell
import { useMe } from "@/lib/useMe";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, loading } = useMe();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6">
        <div className="text-sm font-semibold tracking-tight">
          Investing Assistant
        </div>
        <div className="flex items-center gap-3">
          {!loading && me?.suggested_persona ? (
            <span className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border">
              Persona {me.suggested_persona}
              {typeof me.max_risk_allocation_pct === "number"
                ? ` · ${me.max_risk_allocation_pct}% high-risk`
                : ""}
            </span>
          ) : (
            <span className="h-5 w-20 bg-slate-200 rounded animate-pulse" />
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
Now every page has that contextual label.
3. Reusable loading + error wrappers
Instead of writing a skeleton each time, make two tiny components.
components/LoadingBlock.tsx
export function LoadingBlock() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      <div className="h-24 bg-slate-200 rounded" />
    </div>
  );
}
components/ErrorBlock.tsx
export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
      {message}
    </div>
  );
}
Use them in Persona B:
{loading && <LoadingBlock />}
{error && <ErrorBlock message={error} />}
4. “Current vs target diff” for Persona B
Users love “do this now” lists. We already get:
positions → current weights by ticker
target_allocation.instruments → target weights
So we can produce a diff on the client:
function buildDiff(current: any[], target: any[]) {
  const currentMap: Record<string, number> = {};
  current.forEach((c) => {
    currentMap[c.ticker] = c.weight_pct;
  });
  const diffs = target.map((t) => {
    const curr = currentMap[t.ticker] || 0;
    const delta = Number((t.weight_pct - curr).toFixed(2));
    return {
      ticker: t.ticker,
      target: t.weight_pct,
      current: curr,
      delta,
    };
  });
  // sort by absolute delta, biggest first
  return diffs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
Then in the page:
{result?.positions && result?.target_allocation && (
  <div className="bg-white rounded-lg border p-4">
    <h2 className="text-sm font-medium mb-2">What to adjust</h2>
    <ul className="space-y-1">
      {buildDiff(result.positions, result.target_allocation.instruments)
        .slice(0, 5)
        .map((item) => (
          <li key={item.ticker} className="flex justify-between text-sm">
            <span>{item.ticker}</span>
            <span
              className={item.delta > 0 ? "text-emerald-600" : "text-slate-500"}
            >
              {item.delta > 0 ? `+${item.delta}%` : `${item.delta}%`}
            </span>
          </li>
        ))}
    </ul>
    <p className="text-[10px] text-slate-400 mt-2">
      Positive = add, Negative = trim.
    </p>
  </div>
)}
That turns your X-ray into actionable guidance without changing the backend.
5. Centralize API calls (fetch wrapper)
You don’t want to keep doing localStorage.getItem("token") everywhere. Make a tiny helper.
lib/api.ts
export async function api(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }

  return res.json();
}
Now your onboarding submit becomes:
await api("/onboarding/answers", {
  method: "POST",
  body: JSON.stringify(answers),
});
Cleaner, and if you ever swap to cookies, it’s in one place.
6. Tiny UX polishes
Form spacing: add space-y-4 to all groups
Buttons: always text-sm and rounded, dark background
Empty screens: show a “what to do” hint
Error screens: show “expected CSV columns”
Example empty for Persona B:
{!result && !error && (
  <div className="bg-white rounded-lg border p-4 text-sm text-slate-500">
    Upload a CSV to see sector concentration, flags, and a target portfolio.
  </div>
)}
Where you are now
You have a consistent layout
Persona is visible globally
Portfolio analysis has charts, flags, and a “what to do” section
High-risk page is searchable and always shows disclaimer
Fetching is centralized
Loading/error are reusable