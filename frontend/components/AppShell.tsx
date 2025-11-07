"use client";

import React, { useEffect, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setMe(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6">
        <div className="text-sm font-semibold tracking-tight">
          <a href="/dashboard" className="hover:text-accent">
            Investing Assistant
          </a>
        </div>
        <div className="flex items-center gap-3">
          {!loading && me?.persona ? (
            <span className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border">
              Persona {me.persona}
            </span>
          ) : loading ? (
            <span className="h-5 w-20 bg-slate-200 rounded animate-pulse" />
          ) : null}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
