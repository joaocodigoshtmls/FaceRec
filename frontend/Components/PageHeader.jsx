import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * PageHeader - Standardized page header with title, description, and optional actions
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {React.ReactNode} props.actions - Action buttons (optional)
 * @param {boolean} props.showBackButton - Show back button (default: false)
 * @param {Function} props.onBack - Custom back handler (optional)
 * @param {string} props.className - Additional CSS classes
 */
export default function PageHeader({ 
  title, 
  description, 
  actions, 
  showBackButton = false,
  onBack,
  className = '' 
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {showBackButton && (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        )}
        <div>
          <h1 className="heading-gradient text-2xl font-semibold md:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
