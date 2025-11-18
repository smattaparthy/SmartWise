"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Alert } from "@/components/Alert";
import { LoadingBlock } from "@/components/LoadingBlock";
import TickerWithChart from "@/components/TickerWithChart";

// Type definitions
interface OptionsStrategy {
  id: string;
  strategyName: string;
  ticker: string;
  companyName: string;
  strategyType: "BULLISH" | "BEARISH" | "NEUTRAL" | "VOLATILITY";
  description: string;
  maxRisk: string;
  maxProfit: string;
  breakeven: string;
  timeframe: string;
  complexity: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  volatilityOutlook: string;
}

// Options Trading Disclaimer Banner Component
function OptionsDisclaimer() {
  return (
    <Alert tone="warning">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">⚠️</div>
        <div>
          <p className="font-semibold text-sm mb-1">OPTIONS TRADING CARRIES SIGNIFICANT RISK</p>
          <p className="text-xs leading-relaxed">
            Options trading involves substantial risk and is not suitable for all investors.
            You can lose your entire investment. Options are complex instruments - ensure you
            understand how they work before trading. This is not financial advice.
            Consult with a licensed financial advisor and options specialist before trading.
          </p>
        </div>
      </div>
    </Alert>
  );
}

// Strategy Card Component
function StrategyCard({ strategy }: { strategy: OptionsStrategy }) {
  const typeColors = {
    BULLISH: "bg-green-100 text-green-800 border-green-300",
    BEARISH: "bg-red-100 text-red-800 border-red-300",
    NEUTRAL: "bg-blue-100 text-blue-800 border-blue-300",
    VOLATILITY: "bg-purple-100 text-purple-800 border-purple-300",
  };

  const complexityColors = {
    BEGINNER: "bg-slate-100 text-slate-700",
    INTERMEDIATE: "bg-amber-100 text-amber-700",
    ADVANCED: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            {strategy.strategyName}
          </h3>
          <TickerWithChart symbol={strategy.ticker}>
            <p className="text-sm text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">
              {strategy.ticker} - {strategy.companyName}
            </p>
          </TickerWithChart>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <div className={`px-2 py-1 text-xs font-semibold rounded border ${typeColors[strategy.strategyType]}`}>
            {strategy.strategyType}
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded ${complexityColors[strategy.complexity]}`}>
            {strategy.complexity}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-700 leading-relaxed mb-4">
        {strategy.description}
      </p>

      {/* Strategy Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-50 rounded p-2">
          <p className="text-xs text-slate-500 mb-0.5">Max Risk</p>
          <p className="text-sm font-semibold text-red-700">{strategy.maxRisk}</p>
        </div>
        <div className="bg-slate-50 rounded p-2">
          <p className="text-xs text-slate-500 mb-0.5">Max Profit</p>
          <p className="text-sm font-semibold text-green-700">{strategy.maxProfit}</p>
        </div>
        <div className="bg-slate-50 rounded p-2">
          <p className="text-xs text-slate-500 mb-0.5">Breakeven</p>
          <p className="text-sm font-semibold text-slate-900">{strategy.breakeven}</p>
        </div>
        <div className="bg-slate-50 rounded p-2">
          <p className="text-xs text-slate-500 mb-0.5">Timeframe</p>
          <p className="text-sm font-semibold text-slate-900">{strategy.timeframe}</p>
        </div>
      </div>

      {/* Volatility Outlook */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-1">Volatility Outlook:</p>
        <p className="text-sm text-slate-700">{strategy.volatilityOutlook}</p>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="col-span-2 text-center py-12">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No strategies found</h3>
      <p className="text-sm text-slate-600">
        {searchQuery
          ? `No options strategies match "${searchQuery}". Try a different search term.`
          : "No options strategies are currently available."}
      </p>
    </div>
  );
}

// Main Dashboard Component
export default function OptionsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<OptionsStrategy[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<OptionsStrategy[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // Sample options strategies
  const defaultStrategies: OptionsStrategy[] = [
    {
      id: "1",
      strategyName: "Bull Call Spread",
      ticker: "SPY",
      companyName: "SPDR S&P 500 ETF",
      strategyType: "BULLISH",
      description:
        "Limited risk, limited profit strategy. Buy ATM call and sell OTM call. Ideal when moderately bullish with controlled risk.",
      maxRisk: "$200 per spread",
      maxProfit: "$300 per spread",
      breakeven: "$505",
      timeframe: "30-45 days",
      complexity: "BEGINNER",
      volatilityOutlook: "Expecting moderate upward movement with controlled volatility",
    },
    {
      id: "2",
      strategyName: "Iron Condor",
      ticker: "QQQ",
      companyName: "Invesco QQQ Trust",
      strategyType: "NEUTRAL",
      description:
        "Market-neutral strategy combining bull put spread and bear call spread. Profit from low volatility and range-bound movement.",
      maxRisk: "$400 per spread",
      maxProfit: "$100 per spread",
      breakeven: "$445 / $455",
      timeframe: "30-45 days",
      complexity: "INTERMEDIATE",
      volatilityOutlook: "Expecting low volatility with sideways price action",
    },
    {
      id: "3",
      strategyName: "Long Straddle",
      ticker: "NVDA",
      companyName: "NVIDIA Corporation",
      strategyType: "VOLATILITY",
      description:
        "Buy ATM call and put with same strike/expiration. Profit from large price movement in either direction. Ideal before earnings or major events.",
      maxRisk: "$800 per straddle",
      maxProfit: "Unlimited (theoretically)",
      breakeven: "$492 / $508",
      timeframe: "7-14 days",
      complexity: "INTERMEDIATE",
      volatilityOutlook: "Expecting significant volatility expansion around earnings announcement",
    },
    {
      id: "4",
      strategyName: "Cash-Secured Put",
      ticker: "AAPL",
      companyName: "Apple Inc.",
      strategyType: "BULLISH",
      description:
        "Sell put option while holding cash to buy shares if assigned. Generate income while potentially acquiring stock at discount.",
      maxRisk: "$17,000 (if stock goes to zero)",
      maxProfit: "$150 premium",
      breakeven: "$168.50",
      timeframe: "30-60 days",
      complexity: "BEGINNER",
      volatilityOutlook: "Mildly bullish, comfortable owning stock at current levels",
    },
    {
      id: "5",
      strategyName: "Butterfly Spread",
      ticker: "TSLA",
      companyName: "Tesla Inc.",
      strategyType: "NEUTRAL",
      description:
        "Advanced limited-risk strategy. Combine bull spread and bear spread. Maximum profit if stock stays at middle strike at expiration.",
      maxRisk: "$100 per spread",
      maxProfit: "$400 per spread",
      breakeven: "$242 / $258",
      timeframe: "20-30 days",
      complexity: "ADVANCED",
      volatilityOutlook: "Expecting price to stabilize around $250 with decreasing volatility",
    },
    {
      id: "6",
      strategyName: "Bear Put Spread",
      ticker: "XLE",
      companyName: "Energy Select Sector SPDR",
      strategyType: "BEARISH",
      description:
        "Limited risk bearish strategy. Buy ATM put and sell OTM put. Ideal when moderately bearish with defined risk.",
      maxRisk: "$150 per spread",
      maxProfit: "$350 per spread",
      breakeven: "$82.50",
      timeframe: "30-45 days",
      complexity: "BEGINNER",
      volatilityOutlook: "Expecting moderate downward pressure in energy sector",
    },
    {
      id: "7",
      strategyName: "Covered Call",
      ticker: "MSFT",
      companyName: "Microsoft Corporation",
      strategyType: "NEUTRAL",
      description:
        "Own 100 shares and sell call option. Generate income from premium while limiting upside. Conservative income strategy.",
      maxRisk: "Share price decline",
      maxProfit: "$250 premium + gains to strike",
      breakeven: "$397.50 (cost basis minus premium)",
      timeframe: "30-45 days",
      complexity: "BEGINNER",
      volatilityOutlook: "Neutral to slightly bullish, comfortable capping upside for income",
    },
    {
      id: "8",
      strategyName: "Strangle",
      ticker: "META",
      companyName: "Meta Platforms Inc.",
      strategyType: "VOLATILITY",
      description:
        "Buy OTM call and OTM put. Cheaper than straddle but requires larger move. Ideal for high volatility expectations.",
      maxRisk: "$600 per strangle",
      maxProfit: "Unlimited (theoretically)",
      breakeven: "$475 / $525",
      timeframe: "10-20 days",
      complexity: "INTERMEDIATE",
      volatilityOutlook: "Expecting large price movement but uncertain of direction",
    },
  ];

  // Check authentication and load strategies
  useEffect(() => {
    async function initialize() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Verify user has Persona D access
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          throw new Error("Failed to verify authentication");
        }

        const userData = await res.json();

        if (userData.persona !== "D") {
          // Redirect to appropriate dashboard
          router.push("/dashboard");
          return;
        }

        // Load default strategies
        setStrategies(defaultStrategies);
        setFilteredStrategies(defaultStrategies);
      } catch (err: any) {
        console.error("Initialization error:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [router]);

  // Filter strategies based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStrategies(strategies);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = strategies.filter(
      (strategy) =>
        strategy.strategyName.toLowerCase().includes(query) ||
        strategy.ticker.toLowerCase().includes(query) ||
        strategy.companyName.toLowerCase().includes(query) ||
        strategy.description.toLowerCase().includes(query) ||
        strategy.strategyType.toLowerCase().includes(query)
    );

    setFilteredStrategies(filtered);
  }, [searchQuery, strategies]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto">
          <LoadingBlock />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 mb-4">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Options Trading Strategies
          </h1>
          <p className="text-slate-600">
            Advanced options strategies for experienced traders
          </p>
        </div>

        {/* Options Trading Disclaimer Banner */}
        <div className="mb-6">
          <OptionsDisclaimer />
        </div>

        {/* Strategy Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setSearchQuery("")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchQuery === ""
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Strategies
          </button>
          <button
            onClick={() => setSearchQuery("bullish")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchQuery === "bullish"
                ? "bg-green-600 text-white"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            Bullish
          </button>
          <button
            onClick={() => setSearchQuery("bearish")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchQuery === "bearish"
                ? "bg-red-600 text-white"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            Bearish
          </button>
          <button
            onClick={() => setSearchQuery("neutral")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchQuery === "neutral"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            Neutral
          </button>
          <button
            onClick={() => setSearchQuery("volatility")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchQuery === "volatility"
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
          >
            Volatility
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search strategies by name, ticker, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
          />
        </div>

        {/* Strategies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStrategies.length > 0 ? (
            filteredStrategies.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))
          ) : (
            <EmptyState searchQuery={searchQuery} />
          )}
        </div>

        {/* Educational Resources */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Options Trading Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-800 mb-1">Getting Started</p>
              <p className="text-blue-700 text-xs">
                Learn the basics of options, including calls, puts, strike prices, and expiration dates.
              </p>
            </div>
            <div>
              <p className="font-medium text-blue-800 mb-1">Risk Management</p>
              <p className="text-blue-700 text-xs">
                Understand position sizing, stop losses, and portfolio allocation for options.
              </p>
            </div>
            <div>
              <p className="font-medium text-blue-800 mb-1">Greeks</p>
              <p className="text-blue-700 text-xs">
                Master Delta, Gamma, Theta, Vega, and Rho to better understand options pricing.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Disclaimer:</strong> Options involve risk and are not suitable for all investors.
            The strategies presented are for educational purposes only and do not constitute investment advice.
            Options can result in the loss of your entire investment and, in some cases, losses exceeding your initial investment.
            Before trading options, carefully read the "Characteristics and Risks of Standardized Options"
            available from your broker or the Options Clearing Corporation. Consult with a qualified financial
            advisor before making any trading decisions.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
