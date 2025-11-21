import React from 'react';

/**
 * PageShell - Wrapper component for pages with consistent layout
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.minHeight - Min height (default: min-h-[70vh])
 */
export default function PageShell({ children, className = '', minHeight = 'min-h-[70vh]' }) {
  return (
    <div className={`login-scope ${minHeight} text-slate-200 ${className}`}>
      {children}
    </div>
  );
}
