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
  const progressWidth = (step / total) * 100;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 rounded bg-slate-200">
          <div
            className="h-1 rounded bg-slate-900 transition-all"
            style={{ width: progressWidth + '%' }}
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
            className="text-sm text-slate-500 hover:text-slate-700"
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
            className="bg-slate-900 text-white text-sm px-4 py-2 rounded hover:bg-slate-800"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
