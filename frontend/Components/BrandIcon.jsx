import React from "react";

/**
 * BrandIcon
 * Componente padronizado que exibe o favicon principal (32x32) e permite variações de tamanho.
 * Usa imagens da pasta public (vite entrega /favicon-32x32.png). Pode receber className extra.
 */
export default function BrandIcon({ size = 32, className = "" }) {
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <img
      src="/favicon-32x32.png"
      width={px}
      height={px}
      alt="FaceRec"
      className={`select-none ${className}`.trim()}
      style={{ width: px, height: px }}
      draggable={false}
    />
  );
}
