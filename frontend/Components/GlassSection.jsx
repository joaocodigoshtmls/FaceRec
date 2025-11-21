import React from 'react';

/**
 * GlassSection - Card with glassmorphism effect
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.padding - Padding classes (default: p-6 md:p-8)
 * @param {string} props.maxWidth - Max width (default: max-w-6xl)
 * @param {boolean} props.centered - Center horizontally with mx-auto (default: true)
 */
export default function GlassSection({ 
  children, 
  className = '', 
  padding = 'p-6 md:p-8',
  maxWidth = 'max-w-6xl',
  centered = true
}) {
  const centerClass = centered ? 'mx-auto' : '';
  return (
    <section className={`glass ${maxWidth} ${centerClass} rounded-2xl ${padding} ${className}`}>
      {children}
    </section>
  );
}
