import React from 'react';

/**
 * FormField - Reusable form field with label and input
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.name - Field name
 * @param {string} props.type - Input type (default: text)
 * @param {string} props.value - Field value
 * @param {string} props.placeholder - Placeholder text
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onKeyDown - Key down handler (optional)
 * @param {boolean} props.required - Required field (default: false)
 * @param {boolean} props.autoFocus - Auto focus (default: false)
 * @param {string} props.error - Error message (optional)
 * @param {string} props.className - Additional CSS classes
 */
export default function FormField({ 
  label, 
  name, 
  type = 'text', 
  value, 
  placeholder, 
  onChange, 
  onKeyDown,
  required = false, 
  autoFocus = false,
  error,
  className = '' 
}) {
  return (
    <div className={`flex flex-col gap-0.35 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-medium text-slate-400">
          {label}
          {required && <span className="text-rose-400"> *</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        required={required}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:border-[#00D9FF] focus:outline-none transition"
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
