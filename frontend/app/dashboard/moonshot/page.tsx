"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Alert } from "@/components/Alert";
import { LoadingBlock } from "@/components/LoadingBlock";

// Type definitions
interface InvestmentIdea {
  id: string;
  ticker: string;
  companyName: string;
  sector: string;
  thesis: string;
  timeHorizon: string;
  riskLevel: "EXTREME" | "VERY HIGH" | "HIGH";
  sources?: string[];
}

// High-Risk Disclaimer Banner Component
function HighRiskBanner() {
  return (
    <Alert tone="warning">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">⚠️</div>
        <div>
          <p className="font-semibold text-sm mb-1">EXTREMELY HIGH-RISK INVESTMENTS</p>
          <p className="text-xs leading-relaxed">
            These are volatile, frontier investment ideas with significant potential for loss.
            Only invest what you can afford to lose. This is not financial advice.
            Conduct thorough research and consult with a licensed financial advisor before investing.
          </p>
        </div>
      </div>
    </Alert>
  );
}

// Investment Idea Card Component
function IdeaCard({ idea }: { idea: InvestmentIdea }) {
  const riskColors = {
    EXTREME: "bg-red-100 text-red-800 border-red-300",
    "VERY HIGH": "bg-orange-100 text-orange-800 border-orange-300",
    HIGH: "bg-amber-100 text-amber-800 border-amber-300",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with Ticker and Risk */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">{idea.ticker}</h3>
          <p className="text-sm text-slate-600">{idea.companyName}</p>
        </div>
        <div className={`px-2 py-1 text-xs font-semibold rounded border ${riskColors[idea.riskLevel]}`}>
          {idea.riskLevel}
        </div>
      </div>

      {/* Sector Tag */}
      <div className="mb-3">
        <span className="inline-block px-2 py-1 text-xs font-medium uppercase tracking-wide bg-slate-100 text-slate-700 rounded">
          {idea.sector}
        </span>
      </div>

      {/* Investment Thesis */}
      <p className="text-sm text-slate-700 leading-relaxed mb-4">
        {idea.thesis}
      </p>

      {/* Time Horizon */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Time Horizon:</span>
        <span className="font-medium text-slate-900">{idea.timeHorizon}</span>
      </div>

      {/* Sources (if available) */}
      {idea.sources && idea.sources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Research Sources:</p>
          <div className="flex flex-wrap gap-1">
            {idea.sources.map((source, idx) => (
              <span key={idx} className="text-xs px-2 py-0.5 bg-slate-50 text-slate-600 rounded">
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="col-span-2 text-center py-12">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No ideas found</h3>
      <p className="text-sm text-slate-600">
        {searchQuery
          ? `No investment ideas match "${searchQuery}". Try a different search term.`
          : "No investment ideas are currently available."}
      </p>
    </div>
  );
}

// Main Dashboard Component
export default function MoonshotDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<InvestmentIdea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<InvestmentIdea[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // Sample investment ideas (can be replaced with RAG query results)
  const defaultIdeas: InvestmentIdea[] = [
    {
      id: "1",
      ticker: "ARKK",
      companyName: "ARK Innovation ETF",
      sector: "Disruptive Technology",
      thesis:
        "Concentrated exposure to disruptive innovation across genomics, AI, robotics, and fintech. High conviction bets on companies transforming industries with breakthrough technologies.",
      timeHorizon: "7-10 years",
      riskLevel: "EXTREME",
      sources: ["ARK Research", "Industry Analysis"],
    },
    {
      id: "2",
      ticker: "COIN",
      companyName: "Coinbase Global",
      sector: "Cryptocurrency",
      thesis:
        "Leading US crypto exchange positioned to benefit from digital asset adoption. Regulatory clarity improving, institutional adoption accelerating. Exposure to crypto ecosystem growth.",
      timeHorizon: "5-7 years",
      riskLevel: "EXTREME",
      sources: ["Crypto Research", "Market Reports"],
    },
    {
      id: "3",
      ticker: "CRSP",
      companyName: "CRISPR Therapeutics",
      sector: "Gene Editing",
      thesis:
        "Pioneer in CRISPR gene-editing technology with potential to cure genetic diseases. Multiple clinical trials underway. Transformative healthcare technology with massive TAM.",
      timeHorizon: "7+ years",
      riskLevel: "EXTREME",
      sources: ["Biotech Analysis", "Clinical Data"],
    },
    {
      id: "4",
      ticker: "PLTR",
      companyName: "Palantir Technologies",
      sector: "AI/Big Data",
      thesis:
        "Enterprise AI platform with government and commercial contracts. Strong competitive moat in data analytics. Positioned for AI-driven business transformation wave.",
      timeHorizon: "5-7 years",
      riskLevel: "VERY HIGH",
      sources: ["Tech Research", "Government Contracts"],
    },
    {
      id: "5",
      ticker: "TSLA",
      companyName: "Tesla Inc.",
      sector: "Electric Vehicles / AI",
      thesis:
        "Leading EV manufacturer with autonomous driving ambitions. Potential to disrupt transportation with robotaxi network. Energy storage business provides diversification.",
      timeHorizon: "7-10 years",
      riskLevel: "VERY HIGH",
      sources: ["Automotive Research", "Energy Analysis"],
    },
    {
      id: "6",
      ticker: "SQ",
      companyName: "Block (Square)",
      sector: "Fintech",
      thesis:
        "Digital payments and Bitcoin exposure. Cash App growth driving user acquisition. Building financial ecosystem for merchants and consumers. Bitcoin treasury strategy.",
      timeHorizon: "5-7 years",
      riskLevel: "VERY HIGH",
      sources: ["Fintech Reports", "Payment Industry"],
    },
    {
      id: "7",
      ticker: "SHOP",
      companyName: "Shopify Inc.",
      sector: "E-commerce Platform",
      thesis:
        "Powering independent e-commerce businesses worldwide. Platform ecosystem with payments, fulfillment, and marketing tools. Benefiting from shift to online retail.",
      timeHorizon: "5-7 years",
      riskLevel: "HIGH",
      sources: ["E-commerce Research", "SaaS Analysis"],
    },
    {
      id: "8",
      ticker: "RKLB",
      companyName: "Rocket Lab USA",
      sector: "Space Technology",
      thesis:
        "Small satellite launch provider with growing manifest. Developing reusable rocket technology. Positioned for space economy growth and constellation buildout.",
      timeHorizon: "7-10 years",
      riskLevel: "EXTREME",
      sources: ["Aerospace Research", "Space Industry"],
    },
  ];

  // Check authentication and load ideas
  useEffect(() => {
    async function initialize() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Verify user has Persona C access
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

        if (userData.persona !== "C") {
          // Redirect to appropriate dashboard
          router.push("/dashboard");
          return;
        }

        // Load default ideas
        setIdeas(defaultIdeas);
        setFilteredIdeas(defaultIdeas);
      } catch (err: any) {
        console.error("Initialization error:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [router]);

  // Filter ideas based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredIdeas(ideas);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = ideas.filter(
      (idea) =>
        idea.sector.toLowerCase().includes(query) ||
        idea.ticker.toLowerCase().includes(query) ||
        idea.companyName.toLowerCase().includes(query) ||
        idea.thesis.toLowerCase().includes(query)
    );

    setFilteredIdeas(filtered);
  }, [searchQuery, ideas]);

  // Handle search query from RAG endpoint (optional enhancement)
  const handleRAGSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rag/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: `What are some high-risk investment opportunities in ${searchQuery}?`,
          context: "frontier investments, moonshot ideas, emerging sectors",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Could parse RAG response and add to ideas
        // For now, just use local filtering
        console.log("RAG Response:", data);
      }
    } catch (err) {
      console.error("RAG query error:", err);
      // Fallback to local filtering
    } finally {
      setLoading(false);
    }
  };

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
            Moonshot Investments
          </h1>
          <p className="text-slate-600">
            High-risk frontier investment ideas backed by research and analysis
          </p>
        </div>

        {/* High-Risk Disclaimer Banner */}
        <div className="mb-6">
          <HighRiskBanner />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search by sector, ticker, or theme (e.g., AI, biotech, crypto)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRAGSearch();
                }
              }}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
            <button
              onClick={handleRAGSearch}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Search
            </button>
          </div>
        </div>

        {/* Investment Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIdeas.length > 0 ? (
            filteredIdeas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
          ) : (
            <EmptyState searchQuery={searchQuery} />
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Disclaimer:</strong> These investment ideas are provided for educational purposes only
            and do not constitute financial advice. All investments carry risk, and past performance does not
            guarantee future results. The ideas presented here are particularly high-risk and speculative.
            You should conduct your own research and consult with a qualified financial advisor before making
            any investment decisions. Only invest what you can afford to lose.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
