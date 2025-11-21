import React from 'react';

/**
 * ActionButton - Standardized button component with variants
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {string} props.variant - Button variant: solid | ghost | outlined | danger | success (default: outlined)
 * @param {React.ComponentType} props.icon - Lucide icon component (optional)
 * @param {boolean} props.disabled - Disabled state (default: false)
 * @param {string} props.type - Button type (default: button)
 * @param {string} props.size - Button size: sm | md | lg (default: md)
 * @param {string} props.className - Additional CSS classes
 */
export default function ActionButton({ 
  children, 
  onClick, 
  variant = 'outlined', 
  icon: Icon, 
  disabled = false,
  type = 'button',
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base'
  };

  const variantClasses = {
    solid: 'bg-gradient-to-b from-[#ff8a3d] to-[#ff5c00] text-white shadow-[0_8px_20px_rgba(255,100,30,0.35)] hover:brightness-110',
    ghost: 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
    outlined: 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
    danger: 'border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
    success: 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20',
    info: 'border border-sky-400/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
