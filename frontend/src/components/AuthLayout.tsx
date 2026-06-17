import type { ReactNode } from 'react';

const FEATURES = [
  'AI-powered screening across six policy categories',
  'Structured verdicts with confidence and reasoning',
  'A fair appeal workflow with admin review',
];

function Check() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  );
}

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-sky-100 px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 md:grid-cols-2">
        {/* Hero panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-700 p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span className="text-2xl">🛡️</span> Content Moderation
            </div>
            <p className="mt-6 text-2xl font-semibold leading-snug">
              Keep your platform safe with AI-assisted image review.
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Submit images for automated policy screening, get structured verdicts, and appeal decisions you disagree with.
            </p>
          </div>
          <ul className="relative mt-10 space-y-3 text-sm text-slate-200">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <Check />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          <div className="mb-6 flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 md:hidden">
            <span className="text-xl">🛡️</span> Content Moderation
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
