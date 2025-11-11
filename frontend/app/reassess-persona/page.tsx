"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStep } from "@/components/OnboardingStep";
import { CardOption } from "@/components/CardOption";

interface Answer {
  question_id: number;
  answer: string;
}

export default function ReassessPersonaPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    persona: string;
    confidence: number;
    reasoning: string;
  } | null>(null);

  const updateAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    setError("");

    // Validate current step
    if (currentStep === 1) {
      if (!answers[1] || !answers[2] || !answers[3]) {
        setError("Please answer all questions before continuing");
        return;
      }
    } else if (currentStep === 2) {
      if (!answers[4] || !answers[5] || !answers[6] || !answers[7]) {
        setError("Please answer all questions before continuing");
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setError("");

    // Validate final step
    if (!answers[8] || !answers[9] || !answers[10]) {
      setError("Please answer all questions before submitting");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Format answers according to backend schema
      const formattedAnswers: Answer[] = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        answer: answer,
      }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/reassess`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to reassess persona");
      }

      const data = await res.json();
      setResult(data);

      // Show results for a moment, then redirect to dashboard with full reload
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reassess persona");
    } finally {
      setLoading(false);
    }
  };

  // Show success result
  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Persona Updated!</h2>
            <div className="space-y-3 text-left">
              <div>
                <span className="font-semibold">Your Persona:</span>{" "}
                <span className="text-blue-600 font-bold">Persona {result.persona}</span>
              </div>
              <div>
                <span className="font-semibold">Confidence:</span>{" "}
                {(result.confidence * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-slate-600">
                {result.reasoning}
              </div>
            </div>
            <p className="text-slate-600 mt-6">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Step 1: Experience, Portfolio, Risk Tolerance */}
      {currentStep === 1 && (
        <OnboardingStep
          step={1}
          total={3}
          title="Reassess Your Investment Profile"
          description="Answer these questions to update your persona based on your current situation"
          onNext={handleNext}
          showBack={false}
        >
          {/* Question 1: Experience Level */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              1. What is your investment experience level?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers[1] === "beginner"}
                onClick={() => updateAnswer(1, "beginner")}
                title="Beginner"
                description="I'm just starting out"
              />
              <CardOption
                selected={answers[1] === "intermediate"}
                onClick={() => updateAnswer(1, "intermediate")}
                title="Intermediate"
                description="I have some experience"
              />
              <CardOption
                selected={answers[1] === "advanced"}
                onClick={() => updateAnswer(1, "advanced")}
                title="Advanced"
                description="I'm very experienced"
              />
            </div>
          </div>

          {/* Question 2: Has Portfolio */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              2. Do you currently have an investment portfolio?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers[2] === "no"}
                onClick={() => updateAnswer(2, "no")}
                title="No"
                description="I'm starting fresh"
              />
              <CardOption
                selected={answers[2] === "small"}
                onClick={() => updateAnswer(2, "small")}
                title="Yes, a small portfolio"
                description="I have some investments"
              />
              <CardOption
                selected={answers[2] === "substantial"}
                onClick={() => updateAnswer(2, "substantial")}
                title="Yes, a substantial portfolio"
                description="I have significant investments"
              />
            </div>
          </div>

          {/* Question 3: Risk Tolerance */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              3. What is your risk tolerance?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers[3] === "low"}
                onClick={() => updateAnswer(3, "low")}
                title="Low"
                description="I prefer stable, safe investments"
              />
              <CardOption
                selected={answers[3] === "moderate"}
                onClick={() => updateAnswer(3, "moderate")}
                title="Moderate"
                description="Balanced approach"
              />
              <CardOption
                selected={answers[3] === "high"}
                onClick={() => updateAnswer(3, "high")}
                title="High"
                description="I'm comfortable with volatility"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
              {error}
            </div>
          )}
        </OnboardingStep>
      )}

      {/* Step 2: Goals and Time Management */}
      {currentStep === 2 && (
        <OnboardingStep
          step={2}
          total={3}
          title="Your Investment Goals"
          description="Help us understand your objectives and approach"
          onNext={handleNext}
          onBack={handleBack}
          showBack={true}
        >
          {/* Question 4: Primary Goal */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              4. What is your primary investment goal?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers[4] === "preservation"}
                onClick={() => updateAnswer(4, "preservation")}
                title="Capital Preservation"
                description="Protect my wealth with stable returns"
              />
              <CardOption
                selected={answers[4] === "growth"}
                onClick={() => updateAnswer(4, "growth")}
                title="Long-term Growth"
                description="Build wealth over time"
              />
              <CardOption
                selected={answers[4] === "aggressive"}
                onClick={() => updateAnswer(4, "aggressive")}
                title="Aggressive Growth"
                description="Maximize returns with higher risk"
              />
            </div>
          </div>

          {/* Question 5: Time Commitment */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              5. How much time do you want to spend managing investments?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers[5] === "minimal"}
                onClick={() => updateAnswer(5, "minimal")}
                title="Minimal"
                description="Set and forget"
              />
              <CardOption
                selected={answers[5] === "moderate"}
                onClick={() => updateAnswer(5, "moderate")}
                title="Moderate"
                description="Periodic reviews"
              />
              <CardOption
                selected={answers[5] === "active"}
                onClick={() => updateAnswer(5, "active")}
                title="Active"
                description="Regular monitoring"
              />
            </div>
          </div>

          {/* Question 6: Time Horizon */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              6. What is your investment time horizon?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers[6] === "short"}
                onClick={() => updateAnswer(6, "short")}
                title="Short-term"
                description="Less than 3 years"
              />
              <CardOption
                selected={answers[6] === "medium"}
                onClick={() => updateAnswer(6, "medium")}
                title="Medium-term"
                description="3-10 years"
              />
              <CardOption
                selected={answers[6] === "long"}
                onClick={() => updateAnswer(6, "long")}
                title="Long-term"
                description="10+ years"
              />
            </div>
          </div>

          {/* Question 7: Market Reaction */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              7. How do you react to market downturns?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers[7] === "panic"}
                onClick={() => updateAnswer(7, "panic")}
                title="Get Nervous"
                description="I get nervous and want to sell"
              />
              <CardOption
                selected={answers[7] === "concerned"}
                onClick={() => updateAnswer(7, "concerned")}
                title="Stay the Course"
                description="I'm concerned but stay the course"
              />
              <CardOption
                selected={answers[7] === "opportunity"}
                onClick={() => updateAnswer(7, "opportunity")}
                title="Buying Opportunity"
                description="I see it as a buying opportunity"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
              {error}
            </div>
          )}
        </OnboardingStep>
      )}

      {/* Step 3: Advice Type and Diversification */}
      {currentStep === 3 && (
        <OnboardingStep
          step={3}
          total={3}
          title="Finalize Your Profile"
          description="Last few questions to personalize your experience"
          onNext={handleSubmit}
          onBack={handleBack}
          showNext={true}
          showBack={true}
        >
          {/* Question 8: Advice Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              8. What type of investment advice are you seeking?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers[8] === "simple"}
                onClick={() => updateAnswer(8, "simple")}
                title="Simple Recommendations"
                description="Basic index funds and ETFs"
              />
              <CardOption
                selected={answers[8] === "analysis"}
                onClick={() => updateAnswer(8, "analysis")}
                title="Portfolio Analysis"
                description="Analysis and rebalancing advice"
              />
              <CardOption
                selected={answers[8] === "ideas"}
                onClick={() => updateAnswer(8, "ideas")}
                title="Growth Ideas"
                description="Research-backed growth opportunities"
              />
            </div>
          </div>

          {/* Question 9: Diversification */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              9. How important is diversification to you?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers[9] === "critical"}
                onClick={() => updateAnswer(9, "critical")}
                title="Critical"
                description="I want maximum diversification"
              />
              <CardOption
                selected={answers[9] === "important"}
                onClick={() => updateAnswer(9, "important")}
                title="Important"
                description="Balanced diversification"
              />
              <CardOption
                selected={answers[9] === "flexible"}
                onClick={() => updateAnswer(9, "flexible")}
                title="Flexible"
                description="Willing to concentrate"
              />
            </div>
          </div>

          {/* Question 10: Age Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              10. What is your age range?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers[10] === "young"}
                onClick={() => updateAnswer(10, "young")}
                title="Under 30"
                description="Young investor with time horizon"
              />
              <CardOption
                selected={answers[10] === "middle"}
                onClick={() => updateAnswer(10, "middle")}
                title="30-50"
                description="Mid-career investor"
              />
              <CardOption
                selected={answers[10] === "older"}
                onClick={() => updateAnswer(10, "older")}
                title="Over 50"
                description="Approaching or in retirement"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded p-3 text-sm">
              Reassessing your persona...
            </div>
          )}
        </OnboardingStep>
      )}
    </div>
  );
}
