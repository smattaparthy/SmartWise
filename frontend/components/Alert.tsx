type AlertProps = {
  tone?: "warning" | "error" | "info";
  children: React.ReactNode;
};

const toneClasses = {
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  error: "bg-red-50 border-red-200 text-red-700",
  info: "bg-slate-50 border-slate-200 text-slate-700",
};

export function Alert({ tone = "info", children }: AlertProps) {
  return (
    <div className={`border rounded p-3 text-sm ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}
