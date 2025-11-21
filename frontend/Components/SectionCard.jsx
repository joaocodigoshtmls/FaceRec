import React from 'react';

/**
 * SectionCard - Card with section header
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.kicker - Small text above title (optional)
 * @param {React.ReactNode} props.headerAction - Action button in header (optional)
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 */
export default function SectionCard({ 
  title, 
  kicker, 
  headerAction, 
  children, 
  className = '' 
}) {
  return (
    <article className={`rounded-3xl border border-white/10 bg-white/5 p-6 ${className}`}>
      <header className="mb-4 flex items-center justify-between">
        <div>
          {kicker && (
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{kicker}</p>
          )}
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </header>
      {children}
    </article>
  );
}
