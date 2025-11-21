import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Info } from 'lucide-react';

/**
 * StatusAlert - Alert messages with different types
 * @param {Object} props
 * @param {string} props.type - Alert type: ok | error | warn | info | loading
 * @param {string} props.message - Alert message
 * @param {string} props.className - Additional CSS classes
 */
export default function StatusAlert({ type, message, className = '' }) {
  const statusStyles = {
    ok: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    error: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    loading: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
    info: 'border-white/10 bg-white/5 text-slate-300',
  };

  const icons = {
    ok: CheckCircle2,
    error: XCircle,
    warn: AlertTriangle,
    loading: Loader2,
    info: Info
  };

  const Icon = icons[type] || Info;
  const animateClass = type === 'loading' ? 'animate-spin' : '';

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${statusStyles[type] || statusStyles.info} ${className}`}>
      <Icon className={`h-4 w-4 ${animateClass}`} />
      <span>{message}</span>
    </div>
  );
}
