"use client";

type CardOptionProps = {
  selected?: boolean;
  onClick?: () => void;
  title: string;
  description?: string;
};

export function CardOption({ selected, onClick, title, description }: CardOptionProps) {
  const baseClasses = "text-left border rounded-lg p-3 transition";
  const selectedClasses = selected
    ? "border-slate-900 bg-slate-900/5"
    : "border-slate-200 hover:border-slate-400";

  return (
    <button
      type="button"
      onClick={onClick}
      className={baseClasses + " " + selectedClasses}
    >
      <div className="text-sm font-medium">{title}</div>
      {description && (
        <div className="text-xs text-slate-500 mt-1">{description}</div>
      )}
    </button>
  );
}
