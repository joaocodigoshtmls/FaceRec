import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * BackButton - Reusable back navigation button
 * @param {Object} props
 * @param {Function} props.onClick - Custom click handler (optional)
 * @param {string} props.label - Button label (default: "Voltar")
 * @param {string} props.className - Additional CSS classes
 */
export default function BackButton({ onClick, label = 'Voltar', className = '' }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
