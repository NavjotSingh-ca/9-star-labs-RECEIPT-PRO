// ─── Placeholder rendered by locked/stubbed features ───
// See LOCKED_FILES.md for the full inventory of locked features.

export function FeatureLocked({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-glass-border/30">
        <svg
          className="h-7 w-7 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-text-secondary mb-1">{name}</h3>
      <p className="text-sm text-text-muted max-w-xs">
        This feature is temporarily disabled while we stabilize the core app.
      </p>
    </div>
  );
}
