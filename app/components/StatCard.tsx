export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="min-w-0 rounded-md border border-brand-border bg-white p-4">
      <p className="text-sm text-brand-grey">{label}</p>
      <p
        className={
          "mt-1 truncate text-2xl font-semibold " +
          (tone === "warning" ? "text-red-700" : "text-brand-navy")
        }
        title={value}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-brand-grey">{hint}</p>}
    </div>
  );
}
