import React from 'react';

/**
 * StatCard - Metric display card
 * @param {Object} props
 * @param {string} props.label - Metric label
 * @param {string|number} props.value - Metric value
 * @param {string} props.hint - Additional hint text (optional)
 * @param {React.ComponentType} props.icon - Lucide icon component (optional)
 * @param {string} props.iconColor - Icon color class (default: text-white/70)
 * @param {string} props.className - Additional CSS classes
 */
export default function StatCard({ 
  label, 
  value, 
  hint, 
  icon: Icon, 
  iconColor = 'text-white/70',
  className = '' 
}) {
  return (
    <article className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${className}`}>
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        {label}
        {Icon && <Icon className={`h-4 w-4 ${iconColor}`} />}
      </div>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </article>
  );
}
