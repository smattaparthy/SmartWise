"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Alert } from "@/components/Alert";
import { LoadingBlock } from "@/components/LoadingBlock";
import { api } from "@/lib/api";

type SectorAllocation = {
  sector: string;
  currentValue: number;
  currentPercent: number;
  targetPercent: number;
  difference: number;
};

type ConcentrationWarning = {
  type: "sector" | "single_stock";
  message: string;
  severity: "high" | "medium";
};

type RebalanceSuggestion = {
  ticker?: string;
  sector?: string;
  action: "buy" | "sell" | "hold";
  amount: number;
  reason: string;
  ai_generated?: boolean;
};

type AnalysisResults = {
  totalValue: number;
  sectors: SectorAllocation[];
  warnings: ConcentrationWarning[];
  suggestions: RebalanceSuggestion[];
};

// Balanced model portfolio targets (default rebalancing strategy)
const BALANCED_MODEL: { [key: string]: number } = {
  "Technology": 25.0,
  "Healthcare": 15.0,
  "Financial Services": 15.0,
  "Consumer Cyclical": 15.0,
  "Industrials": 10.0,
  "Communication Services": 10.0,
  "Consumer Defensive": 5.0,
  "Energy": 5.0,
  "Real Estate": 0.0,
  "Utilities": 0.0,
  "Basic Materials": 0.0,
};

export default function RebalancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [portfolioHoldings, setPortfolioHoldings] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<"conservative" | "balanced" | "growth">("balanced");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      setFile(null);
      return;
    }

    // Validate file size (max 1MB)
    if (selectedFile.size > 1024 * 1024) {
      setError("File size must be less than 1MB");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError("");
    setResults(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      // Parse CSV to extract holdings for later rebalancing
      const csvText = await file.text();
      const lines = csvText.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

      // Find column indices (support both 'ticker' and 'symbol')
      const tickerIdx = headers.findIndex(h => h === 'ticker' || h === 'symbol');
      const sharesIdx = headers.indexOf('shares');
      const priceIdx = headers.indexOf('purchase_price');

      if (tickerIdx === -1 || sharesIdx === -1 || priceIdx === -1) {
        throw new Error("CSV must contain ticker (or symbol), shares, and purchase_price columns");
      }

      const holdings = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          ticker: values[tickerIdx].toUpperCase(),
          shares: parseFloat(values[sharesIdx]),
          purchase_price: parseFloat(values[priceIdx])
        };
      }).filter(h => h.ticker && !isNaN(h.shares) && !isNaN(h.purchase_price));

      setPortfolioHoldings(holdings);

      // Upload for analysis
      const formData = new FormData();
      formData.append("file", file);

      const data = await api("/portfolio/upload", {
        method: "POST",
        body: formData,
      });

      // Transform backend response to frontend format
      const transformedData: AnalysisResults = {
        totalValue: data.total_value,
        sectors: data.sectors.map((s: any) => {
          // Get target percentage from balanced model, default to 0 if sector not in model
          const targetPercent = BALANCED_MODEL[s.sector] || 0;
          // Calculate difference (positive = overweight, negative = underweight)
          const difference = s.percentage - targetPercent;

          return {
            sector: s.sector,
            currentValue: s.amount,
            currentPercent: s.percentage,
            targetPercent: targetPercent,
            difference: difference,
          };
        }),
        warnings: data.concentrated_sectors.map((sector: string) => ({
          type: "sector" as const,
          message: `${sector} sector is overconcentrated (>30% of portfolio)`,
          severity: "high" as const,
        })),
        suggestions: [], // Will be populated when user generates rebalancing suggestions
      };

      setResults(transformedData);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze portfolio. Please check your CSV format.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!portfolioHoldings.length || !results) {
      setError("Please upload and analyze a portfolio first");
      return;
    }

    setLoadingSuggestions(true);
    setError("");

    try {
      const response = await api(`/portfolio/rebalance?model_type=${selectedModel}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          holdings: portfolioHoldings
        })
      });

      // Transform backend recommendations to frontend suggestions format
      // Backend now includes: { ticker, sector, action, shares, amount, current_percentage, target_percentage, reasoning, ai_generated }
      // Frontend expects: { ticker, sector, action, amount, reason, ai_generated }
      const suggestions: RebalanceSuggestion[] = response.recommendations.map((rec: any) => ({
        ticker: rec.ticker,
        sector: rec.sector,
        action: rec.action,
        amount: rec.amount,
        reason: rec.reasoning,
        ai_generated: rec.ai_generated || false
      }));

      // Update results with suggestions
      setResults({
        ...results,
        suggestions: suggestions
      });

    } catch (err: any) {
      console.error("Rebalancing error:", err);
      setError(err.message || "Failed to generate rebalancing suggestions.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portfolio Rebalancing</h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload your portfolio CSV to analyze sector concentration and get rebalancing recommendations
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload Portfolio CSV
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Expected format: Ticker, TotalValue columns (max 1MB)
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-medium
                  file:bg-slate-900 file:text-white
                  hover:file:bg-slate-800
                  file:cursor-pointer cursor-pointer"
              />
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-slate-900 text-white px-6 py-2 rounded text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Analyzing..." : "Analyze Portfolio"}
                </button>
              </div>
            )}

            {error && (
              <Alert tone="error">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </Alert>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Analyzing your portfolio...</h2>
            <LoadingBlock />
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="grid grid-cols-5 gap-6">
            {/* Left Column - Portfolio Overview (2/5) */}
            <div className="col-span-2 space-y-6">
              {/* Total Value */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h2 className="text-sm font-medium text-slate-500 mb-1">
                  Total Portfolio Value
                </h2>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(results.totalValue)}
                </p>
              </div>

              {/* Sector Breakdown */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Sector Breakdown</h2>
                <div className="space-y-3">
                  {results.sectors.length > 0 ? (
                    results.sectors.map((sector, idx) => (
                      <div key={idx} className="border-b last:border-b-0 pb-3 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-slate-900">{sector.sector}</span>
                          <span className="text-sm text-slate-600">
                            {formatCurrency(sector.currentValue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">
                            Current: {formatPercent(sector.currentPercent)}
                          </span>
                          <span className="text-slate-500">
                            Target: {formatPercent(sector.targetPercent)}
                          </span>
                        </div>
                        {Math.abs(sector.difference) > 5 && (
                          <div className="mt-1">
                            <span
                              className={`text-xs font-medium ${
                                sector.difference > 0 ? "text-amber-700" : "text-blue-700"
                              }`}
                            >
                              {sector.difference > 0 ? "Overweight" : "Underweight"} by{" "}
                              {formatPercent(Math.abs(sector.difference))}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No sector data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Column - Warnings and Recommendations (2/5) */}
            <div className="col-span-2 space-y-6">
              {/* Concentration Warnings */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Concentration Alerts</h2>
                <div className="space-y-3">
                  {results.warnings.length > 0 ? (
                    results.warnings.map((warning, idx) => (
                      <Alert key={idx} tone="warning">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <div className="flex-1">
                            <p className="font-medium capitalize">
                              {warning.type.replace("_", " ")} Concentration
                            </p>
                            <p className="text-sm mt-1">{warning.message}</p>
                            <span className="inline-block mt-2 text-xs font-medium px-2 py-1 rounded bg-amber-100 text-amber-800">
                              {warning.severity} risk
                            </span>
                          </div>
                        </div>
                      </Alert>
                    ))
                  ) : (
                    <Alert tone="info">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm">
                          No concentration warnings detected. Your portfolio appears well-diversified.
                        </p>
                      </div>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Rebalancing Suggestions */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Rebalancing Suggestions</h2>

                {/* Model Selector and Generate Button */}
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Rebalancing Model
                  </label>
                  <div className="flex gap-3 mb-3">
                    {["conservative", "balanced", "growth"].map((model) => (
                      <button
                        key={model}
                        onClick={() => setSelectedModel(model as typeof selectedModel)}
                        className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                          selectedModel === model
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 border hover:bg-slate-100"
                        }`}
                      >
                        {model.charAt(0).toUpperCase() + model.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateSuggestions}
                    disabled={loadingSuggestions || !portfolioHoldings.length}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingSuggestions ? "Generating AI-Powered Suggestions..." : "Generate Rebalancing Suggestions"}
                  </button>
                  <p className="text-xs text-slate-500 mt-2">
                    {selectedModel === "conservative" && "Lower risk, emphasizes stable sectors like utilities and consumer staples"}
                    {selectedModel === "balanced" && "Moderate risk, diversified across multiple sectors"}
                    {selectedModel === "growth" && "Higher risk, emphasizes technology and high-growth sectors"}
                  </p>
                </div>

                <div className="space-y-3">
                  {results.suggestions.length > 0 ? (
                    results.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="border rounded p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                suggestion.action === "buy"
                                  ? "bg-green-100 text-green-800"
                                  : suggestion.action === "sell"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {suggestion.action.toUpperCase()}
                            </span>
                            {suggestion.ticker && (
                              <span className="font-medium text-slate-900">
                                {suggestion.ticker}
                              </span>
                            )}
                            {suggestion.sector && (
                              <span className="text-sm text-slate-600">
                                ({suggestion.sector})
                              </span>
                            )}
                            {suggestion.ai_generated && (
                              <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded font-medium">
                                🤖 AI-Generated
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(Math.abs(suggestion.amount))}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{suggestion.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No rebalancing needed. Your portfolio is well-aligned with target allocations.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions (1/5) */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg border shadow-sm p-6 sticky top-6">
                <h2 className="text-sm font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setFile(null);
                      setResults(null);
                      setError("");
                    }}
                    className="w-full bg-slate-100 text-slate-700 px-4 py-2 rounded text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    Upload New CSV
                  </button>
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(results, null, 2);
                      const blob = new Blob([dataStr], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = "portfolio-analysis.json";
                      link.click();
                    }}
                    className="w-full bg-slate-100 text-slate-700 px-4 py-2 rounded text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    Export Results
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sectors</span>
                      <span className="font-medium">{results.sectors.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Warnings</span>
                      <span className="font-medium">{results.warnings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Suggestions</span>
                      <span className="font-medium">{results.suggestions.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!file && !loading && !results && !error && (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
            <svg
              className="w-16 h-16 text-slate-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Ready to analyze your portfolio
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Upload a CSV file with your current holdings to get personalized rebalancing
              recommendations and concentration warnings.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
