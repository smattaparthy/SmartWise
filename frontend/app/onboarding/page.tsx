"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStep } from "@/components/OnboardingStep";
import { CardOption } from "@/components/CardOption";

type Answers = {
  q1_experience: string;
  q2_has_portfolio: string;
  q3_goal: string;
  q4_horizon: string;
  q5_risk_reaction: string;
  q6_max_risk_pct: string;
  q7_contribution: string;
  q8_concentration: string;
  q9_frontier_interest: string;
  q10_guidance_style: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    q1_experience: "",
    q2_has_portfolio: "",
    q3_goal: "",
    q4_horizon: "",
    q5_risk_reaction: "",
    q6_max_risk_pct: "",
    q7_contribution: "",
    q8_concentration: "",
    q9_frontier_interest: "",
    q10_guidance_style: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateAnswer = (key: keyof Answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    setError("");

    // Validate current step
    if (currentStep === 1) {
      if (!answers.q1_experience || !answers.q2_has_portfolio || !answers.q3_goal) {
        setError("Please answer all questions before continuing");
        return;
      }
    } else if (currentStep === 2) {
      if (!answers.q4_horizon || !answers.q5_risk_reaction || !answers.q6_max_risk_pct) {
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
    if (!answers.q7_contribution || !answers.q8_concentration ||
        !answers.q9_frontier_interest || !answers.q10_guidance_style) {
      setError("Please answer all questions before submitting");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(answers),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to submit questionnaire");
      }

      // Successfully submitted, navigate to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to submit questionnaire");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Step 1: Experience, Portfolio, Goal */}
      {currentStep === 1 && (
        <OnboardingStep
          step={1}
          total={3}
          title="Tell us about your investing experience"
          description="Help us understand where you're starting from"
          onNext={handleNext}
          showBack={false}
        >
          {/* Question 1: Experience */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              1. What is your level of investing experience?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers.q1_experience === "a"}
                onClick={() => updateAnswer("q1_experience", "a")}
                title="New to investing"
                description="I'm just getting started and learning the basics"
              />
              <CardOption
                selected={answers.q1_experience === "b"}
                onClick={() => updateAnswer("q1_experience", "b")}
                title="Some experience"
                description="I've invested before but want to learn more"
              />
              <CardOption
                selected={answers.q1_experience === "c"}
                onClick={() => updateAnswer("q1_experience", "c")}
                title="Experienced"
                description="I actively manage my investments"
              />
              <CardOption
                selected={answers.q1_experience === "d"}
                onClick={() => updateAnswer("q1_experience", "d")}
                title="Very experienced"
                description="I'm a sophisticated investor with deep knowledge"
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
                selected={answers.q2_has_portfolio === "a"}
                onClick={() => updateAnswer("q2_has_portfolio", "a")}
                title="No portfolio"
                description="I'm starting from scratch"
              />
              <CardOption
                selected={answers.q2_has_portfolio === "b"}
                onClick={() => updateAnswer("q2_has_portfolio", "b")}
                title="Small portfolio"
                description="I have some investments (under $10k)"
              />
              <CardOption
                selected={answers.q2_has_portfolio === "c"}
                onClick={() => updateAnswer("q2_has_portfolio", "c")}
                title="Moderate portfolio"
                description="I have a decent portfolio ($10k-$100k)"
              />
              <CardOption
                selected={answers.q2_has_portfolio === "d"}
                onClick={() => updateAnswer("q2_has_portfolio", "d")}
                title="Large portfolio"
                description="I have substantial investments (over $100k)"
              />
            </div>
          </div>

          {/* Question 3: Goal */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              3. What is your primary investment goal?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers.q3_goal === "a"}
                onClick={() => updateAnswer("q3_goal", "a")}
                title="Building wealth"
                description="Long-term growth and wealth accumulation"
              />
              <CardOption
                selected={answers.q3_goal === "b"}
                onClick={() => updateAnswer("q3_goal", "b")}
                title="Retirement planning"
                description="Saving for a comfortable retirement"
              />
              <CardOption
                selected={answers.q3_goal === "c"}
                onClick={() => updateAnswer("q3_goal", "c")}
                title="Generating income"
                description="Creating steady cash flow from investments"
              />
              <CardOption
                selected={answers.q3_goal === "d"}
                onClick={() => updateAnswer("q3_goal", "d")}
                title="Preserving capital"
                description="Protecting wealth while earning modest returns"
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

      {/* Step 2: Time Horizon, Risk Reaction, Max Risk */}
      {currentStep === 2 && (
        <OnboardingStep
          step={2}
          total={3}
          title="Understand your risk profile"
          description="These questions help us tailor recommendations to your comfort level"
          onNext={handleNext}
          onBack={handleBack}
          showBack={true}
        >
          {/* Question 4: Time Horizon */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              4. What is your investment time horizon?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers.q4_horizon === "a"}
                onClick={() => updateAnswer("q4_horizon", "a")}
                title="Short-term (1-3 years)"
                description="I need access to my money soon"
              />
              <CardOption
                selected={answers.q4_horizon === "b"}
                onClick={() => updateAnswer("q4_horizon", "b")}
                title="Medium-term (3-7 years)"
                description="I'm planning for a specific goal in the next few years"
              />
              <CardOption
                selected={answers.q4_horizon === "c"}
                onClick={() => updateAnswer("q4_horizon", "c")}
                title="Long-term (7-15 years)"
                description="I'm investing for the long haul"
              />
              <CardOption
                selected={answers.q4_horizon === "d"}
                onClick={() => updateAnswer("q4_horizon", "d")}
                title="Very long-term (15+ years)"
                description="I have decades until I'll need this money"
              />
            </div>
          </div>

          {/* Question 5: Risk Reaction */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              5. If your portfolio dropped 20% in value, how would you react?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers.q5_risk_reaction === "a"}
                onClick={() => updateAnswer("q5_risk_reaction", "a")}
                title="Sell immediately"
                description="I can't handle significant losses"
              />
              <CardOption
                selected={answers.q5_risk_reaction === "b"}
                onClick={() => updateAnswer("q5_risk_reaction", "b")}
                title="Reduce risk exposure"
                description="I'd move some investments to safer options"
              />
              <CardOption
                selected={answers.q5_risk_reaction === "c"}
                onClick={() => updateAnswer("q5_risk_reaction", "c")}
                title="Hold steady"
                description="I'd wait it out and not make changes"
              />
              <CardOption
                selected={answers.q5_risk_reaction === "d"}
                onClick={() => updateAnswer("q5_risk_reaction", "d")}
                title="Buy more"
                description="I'd see it as a buying opportunity"
              />
            </div>
          </div>

          {/* Question 6: Max Risk Percentage */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              6. What's the maximum you'd be comfortable losing in a bad year?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers.q6_max_risk_pct === "a"}
                onClick={() => updateAnswer("q6_max_risk_pct", "a")}
                title="Up to 5%"
                description="I prefer stability over high returns"
              />
              <CardOption
                selected={answers.q6_max_risk_pct === "b"}
                onClick={() => updateAnswer("q6_max_risk_pct", "b")}
                title="Up to 15%"
                description="I can handle moderate volatility"
              />
              <CardOption
                selected={answers.q6_max_risk_pct === "c"}
                onClick={() => updateAnswer("q6_max_risk_pct", "c")}
                title="Up to 30%"
                description="I'm willing to take significant risk for higher returns"
              />
              <CardOption
                selected={answers.q6_max_risk_pct === "d"}
                onClick={() => updateAnswer("q6_max_risk_pct", "d")}
                title="More than 30%"
                description="I'm comfortable with high risk and volatility"
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

      {/* Step 3: Contribution, Concentration, Frontier Interest, Guidance Style */}
      {currentStep === 3 && (
        <OnboardingStep
          step={3}
          total={3}
          title="Personalize your strategy"
          description="Final questions to customize your investment experience"
          onNext={handleSubmit}
          onBack={handleBack}
          showNext={true}
          showBack={true}
        >
          {/* Question 7: Contribution Frequency */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              7. How often do you plan to add to your investments?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers.q7_contribution === "a"}
                onClick={() => updateAnswer("q7_contribution", "a")}
                title="Monthly"
                description="Regular monthly contributions"
              />
              <CardOption
                selected={answers.q7_contribution === "b"}
                onClick={() => updateAnswer("q7_contribution", "b")}
                title="Quarterly"
                description="Every 3 months"
              />
              <CardOption
                selected={answers.q7_contribution === "c"}
                onClick={() => updateAnswer("q7_contribution", "c")}
                title="Annually"
                description="Once or twice per year"
              />
              <CardOption
                selected={answers.q7_contribution === "d"}
                onClick={() => updateAnswer("q7_contribution", "d")}
                title="Irregularly"
                description="When I have extra funds available"
              />
            </div>
          </div>

          {/* Question 8: Concentration Comfort */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              8. How comfortable are you with concentrated positions?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers.q8_concentration === "a"}
                onClick={() => updateAnswer("q8_concentration", "a")}
                title="Not comfortable"
                description="I want maximum diversification across many holdings"
              />
              <CardOption
                selected={answers.q8_concentration === "b"}
                onClick={() => updateAnswer("q8_concentration", "b")}
                title="Somewhat comfortable"
                description="I'm okay with some larger positions if well-researched"
              />
              <CardOption
                selected={answers.q8_concentration === "c"}
                onClick={() => updateAnswer("q8_concentration", "c")}
                title="Very comfortable"
                description="I prefer focused portfolios with conviction bets"
              />
              <CardOption
                selected={answers.q8_concentration === "d"}
                onClick={() => updateAnswer("q8_concentration", "d")}
                title="Extremely comfortable"
                description="I'm happy with concentrated, high-conviction positions"
              />
            </div>
          </div>

          {/* Question 9: Frontier Interest */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              9. What's your interest in emerging sectors (AI, crypto, biotech)?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers.q9_frontier_interest === "a"}
                onClick={() => updateAnswer("q9_frontier_interest", "a")}
                title="Not interested"
                description="I prefer established, traditional investments"
              />
              <CardOption
                selected={answers.q9_frontier_interest === "b"}
                onClick={() => updateAnswer("q9_frontier_interest", "b")}
                title="Slightly interested"
                description="I'd consider a small allocation to emerging sectors"
              />
              <CardOption
                selected={answers.q9_frontier_interest === "c"}
                onClick={() => updateAnswer("q9_frontier_interest", "c")}
                title="Very interested"
                description="I want significant exposure to innovative sectors"
              />
              <CardOption
                selected={answers.q9_frontier_interest === "d"}
                onClick={() => updateAnswer("q9_frontier_interest", "d")}
                title="Extremely interested"
                description="I want to focus heavily on frontier opportunities"
              />
            </div>
          </div>

          {/* Question 10: Guidance Style */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              10. What type of guidance do you prefer?
            </label>
            <div className="space-y-2">
              <CardOption
                selected={answers.q10_guidance_style === "a"}
                onClick={() => updateAnswer("q10_guidance_style", "a")}
                title="Hands-off automation"
                description="Auto-invest based on my profile, minimal input needed"
              />
              <CardOption
                selected={answers.q10_guidance_style === "b"}
                onClick={() => updateAnswer("q10_guidance_style", "b")}
                title="Guided recommendations"
                description="Show me options and let me choose from suggestions"
              />
              <CardOption
                selected={answers.q10_guidance_style === "c"}
                onClick={() => updateAnswer("q10_guidance_style", "c")}
                title="Educational insights"
                description="Teach me along the way with detailed explanations"
              />
              <CardOption
                selected={answers.q10_guidance_style === "d"}
                onClick={() => updateAnswer("q10_guidance_style", "d")}
                title="Expert consultation"
                description="Give me direct access to professional advisors"
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
              Submitting your questionnaire...
            </div>
          )}
        </OnboardingStep>
      )}
    </div>
  );
}
