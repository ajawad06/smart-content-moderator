import type { ReactNode } from "react";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <path d="M12 3l7 2.5v5.5c0 4.2-2.9 7.4-7 8.5-4.1-1.1-7-4.3-7-8.5V5.5L12 3z" />
      <path d="M9.2 12l1.9 1.9 3.7-4" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function VerdictIcon({ className }: { className?: string }) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v2.5H9z" />
      <path d="M8.5 13.5l2 2 4-4.5" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} {...ICON_PROPS}>
      <path d="M12 4.5v15" />
      <path d="M6 20h12" />
      <path d="M6 7.5h12" />
      <path d="M6 7.5L3.5 13a2.5 2.5 0 005 0L6 7.5z" />
      <path d="M18 7.5L15.5 13a2.5 2.5 0 005 0L18 7.5z" />
    </svg>
  );
}

const FEATURES = [
  { Icon: GridIcon, label: "Six categories" },
  { Icon: VerdictIcon, label: "Clear verdicts" },
  { Icon: ScaleIcon, label: "Fair appeals" },
];

/** Split-screen shell for auth pages: branded hero on the left, form on the right. */
export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 md:grid-cols-2">
        {/* Hero panel */}
        <div className="relative hidden flex-col justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-500/25 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <ShieldIcon className="h-9 w-9 shrink-0 text-sky-300" />
              <h2 className="whitespace-nowrap text-4xl font-bold tracking-tight">
                Content Moderation
              </h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              AI image screening with clear verdicts and a fair appeal process.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {FEATURES.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-xl bg-white/10 px-2 py-4 text-center ring-1 ring-white/10 backdrop-blur"
                >
                  <Icon className="h-6 w-6 text-sky-300" />
                  <span className="mt-2 text-xs font-medium text-slate-200">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          <div className="mb-6 flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 md:hidden">
            <ShieldIcon className="h-5 w-5 text-slate-700" /> Content Moderation
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
