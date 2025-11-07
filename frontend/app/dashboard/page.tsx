"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/LoadingBlock";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        // Check if user has a token
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
          // Not authenticated, redirect to login
          router.push("/login");
          return;
        }

        // Fetch user data to get persona
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // Token invalid or API error
          if (res.status === 401) {
            // Unauthorized, clear token and redirect to login
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch user data");
        }

        const data = await res.json();

        // Check if user has a persona assigned
        if (!data.persona) {
          // No persona, redirect to onboarding
          router.push("/onboarding");
          return;
        }

        // Redirect based on persona
        switch (data.persona) {
          case "A":
            router.push("/dashboard/starter");
            break;
          case "B":
            router.push("/dashboard/rebalance");
            break;
          case "C":
            router.push("/dashboard/moonshot");
            break;
          default:
            // Unknown persona, redirect to onboarding
            router.push("/onboarding");
        }
      } catch (err: any) {
        console.error("Dashboard routing error:", err);
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      }
    }

    checkAuthAndRedirect();
  }, [router]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto mt-12">
        {loading && !error && (
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Loading your dashboard...</h2>
            <LoadingBlock />
          </div>
        )}

        {error && (
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
        )}
      </div>
    </AppShell>
  );
}
