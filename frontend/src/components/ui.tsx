import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { OUTCOME_LABELS, APPEAL_STATUS_LABELS } from '../lib/constants';

function cn(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
};

export function Button({ variant = 'primary', loading, className, children, disabled, ...rest }: ButtonProps) {
  const styles = {
    primary: 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-sm hover:from-slate-800 hover:to-slate-600',
    secondary: 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }[variant];
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed',
        styles,
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-1 focus:ring-sky-300',
        className,
      )}
      {...rest}
    />
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-1 focus:ring-sky-300',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-1 focus:ring-sky-300',
        className,
      )}
      {...rest}
    />
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200', className)}>
      {children}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin text-current', className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'bg-red-50 text-red-700 ring-red-200',
    success: 'bg-green-50 text-green-700 ring-green-200',
    info: 'bg-blue-50 text-blue-700 ring-blue-200',
  }[kind];
  return <div className={cn('rounded-lg px-4 py-3 text-sm ring-1', styles)}>{children}</div>;
}

const OUTCOME_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  flagged: 'bg-amber-100 text-amber-700',
  blocked: 'bg-red-100 text-red-700',
};

export function OutcomeBadge({ outcome }: { outcome: string }) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', OUTCOME_STYLES[outcome] ?? 'bg-slate-100 text-slate-600')}>
      {OUTCOME_LABELS[outcome] ?? outcome}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-slate-200 text-slate-600',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600')}>
      {APPEAL_STATUS_LABELS[status] ?? status}
    </span>
  );
}
