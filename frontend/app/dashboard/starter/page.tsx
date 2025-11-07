"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/LoadingBlock";
import { Alert } from "@/components/Alert";
import { api } from "@/lib/api";

type CoreETF = {
  ticker: string;
  name: string;
  weight: number;
  description?: string;
};

// Default starter portfolio allocation
const DEFAULT_PORTFOLIO: CoreETF[] = [
  {
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    weight: 50,
    description: "Tracks the S&P 500 index - large US companies",
  },
  {
    ticker: "BND",
    name: "Vanguard Total Bond Market ETF",
    weight: 30,
    description: "Diversified US investment-grade bonds",
  },
  {
    ticker: "VTI",
    name: "Vanguard Total Stock Market ETF",
    weight: 20,
    description: "Broad exposure to entire US stock market",
  },
];

export default function StarterDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [portfolio, setPortfolio] = useState<CoreETF[]>(DEFAULT_PORTFOLIO);
  const [monthlyAmount, setMonthlyAmount] = useState<string>("500");

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Check authentication
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          router.push("/login");
          return;
        }

        // Verify user has correct persona
        const userData = await api("/auth/me");
        if (userData.persona !== "A") {
          router.push("/dashboard");
          return;
        }

        // Try to fetch core instruments from API
        try {
          const instruments = await api("/instruments/core");
          if (instruments && Array.isArray(instruments)) {
            setPortfolio(instruments);
          }
        } catch (err) {
          // If endpoint doesn't exist yet, use default portfolio
          console.log("Using default portfolio (API endpoint not available yet)");
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Dashboard error:", err);
        if (err.message.includes("401") || err.message.includes("Unauthorized")) {
          localStorage.removeItem("token");
          router.push("/login");
        } else {
          setError(err.message || "Failed to load dashboard");
          setLoading(false);
        }
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Loading your portfolio...</h2>
            <LoadingBlock />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <Alert tone="error">
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm mt-1">{error}</p>
          </Alert>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Starter Portfolio</h1>
          <p className="text-slate-600 mt-1">
            A simple, low-cost approach to long-term investing
          </p>
        </div>

        {/* 2-column grid layout (8:4 ratio) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Portfolio Recommendations */}
          <div className="lg:col-span-8 space-y-6">
            {/* Strategy Explanation */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Why Index Funds?
              </h2>
              <div className="text-slate-700 space-y-3 text-sm">
                <p>
                  Index funds are a great starting point for new investors. They offer:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Low fees (more money stays invested)</li>
                  <li>Automatic diversification across hundreds of companies</li>
                  <li>Historically strong long-term returns</li>
                  <li>Simple to understand and maintain</li>
                </ul>
                <p className="pt-2">
                  The portfolio below follows a balanced three-fund approach, mixing stocks and bonds
                  to match a moderate risk profile suitable for long-term growth.
                </p>
              </div>
            </div>

            {/* Core ETF Recommendations */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-slate-900">
                  Recommended Core ETFs
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Your three-fund portfolio allocation
                </p>
              </div>

              <div className="divide-y">
                {portfolio.map((etf) => (
                  <div key={etf.ticker} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {etf.ticker}
                          </h3>
                          <span className="text-2xl font-bold text-accent">
                            {etf.weight}%
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 mt-1">
                          {etf.name}
                        </p>
                        {etf.description && (
                          <p className="text-sm text-slate-600 mt-2">
                            {etf.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Visual weight bar */}
                    <div className="mt-4">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${etf.weight}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total allocation check */}
              <div className="p-6 bg-slate-50 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Total Allocation
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {portfolio.reduce((sum, etf) => sum + etf.weight, 0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Getting Started & Tools */}
          <div className="lg:col-span-4 space-y-6">
            {/* Getting Started Tips */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Getting Started
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Open a brokerage account</p>
                    <p className="text-slate-600 mt-1">
                      Choose a low-fee broker like Vanguard, Fidelity, or Schwab
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Set up automatic investing</p>
                    <p className="text-slate-600 mt-1">
                      Invest a fixed amount monthly - consistency is key
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Buy according to allocation</p>
                    <p className="text-slate-600 mt-1">
                      Follow the percentages shown above when purchasing
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold text-xs">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Stay the course</p>
                    <p className="text-slate-600 mt-1">
                      Avoid checking daily - invest for years, not days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Investment Calculator (UI-only for MVP) */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Monthly Investment
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="monthly-amount" className="block text-sm font-medium text-slate-700 mb-2">
                    How much can you invest monthly?
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      id="monthly-amount"
                      type="number"
                      min="0"
                      step="50"
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                    Suggested allocation:
                  </p>
                  {portfolio.map((etf) => (
                    <div key={etf.ticker} className="flex justify-between items-baseline text-sm">
                      <span className="text-slate-600">{etf.ticker}</span>
                      <span className="font-semibold text-slate-900">
                        ${((parseFloat(monthlyAmount) || 0) * etf.weight / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Alert tone="info">
                  <p className="text-xs">
                    This is a planning tool. Actual purchases should be made through your brokerage account.
                  </p>
                </Alert>
              </div>
            </div>

            {/* Next Steps CTA */}
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Ready to start?</h3>
              <p className="text-sm text-slate-700 mb-4">
                Take the first step towards building long-term wealth with a simple, proven strategy.
              </p>
              <button
                onClick={() => {
                  // For MVP, this could link to educational resources
                  // or external brokerage links
                  alert("Feature coming soon: Direct brokerage account setup");
                }}
                className="w-full bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Open Brokerage Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
