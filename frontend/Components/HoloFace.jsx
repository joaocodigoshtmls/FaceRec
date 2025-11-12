
import React, { useMemo } from "react";

export default function HoloFace({ className = "" }) {
  const CX = 300, CY = 280, RX = 105, RY = 150;
  const Y_TOP = CY - RY + 10, Y_BOT = CY + RY - 10;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const widthAtY = (y) => {
    const dy = (y - CY) / RY;
    let w = RX * Math.sqrt(clamp(1 - dy * dy, 0, 1));
    w += 16 * Math.exp(-((y - (CY + 10)) ** 2) / (2 * 35 ** 2));
    w -= 10 * Math.exp(-((y - (CY + 80)) ** 2) / (2 * 40 ** 2));
    w -= 8 * Math.exp(-((y - (CY - 90)) ** 2) / (2 * 28 ** 2));
    return Math.max(0, w);
  };

  const centerShiftAtY = (y) => {
    const dy = (y - CY) / RY;
    return 26 + 6 * dy;
  };

  const catmullRom2bezier = (pts) => {
    if (pts.length < 2) return "";
    const p = pts.map(([x, y]) => ({ x, y }));
    const d = [`M ${p[0].x} ${p[0].y}`];
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2] || p[i + 1];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`);
    }
    return d.join(" ");
  };

  const latitudes = useMemo(() => {
    const ys = Array.from({ length: 12 }, (_, i) =>
      Y_TOP + ((i + 1) / 13) * (Y_BOT - Y_TOP)
    );
    return ys.map((y) => {
      const pts = [];
      const w = widthAtY(y);
      const cx = CX + centerShiftAtY(y);
      for (let i = 0; i <= 18; i++) {
        const t = -1 + (2 * i) / 18;
        const s = Math.sin((Math.PI * (t + 1)) / 2);
        const x = cx + s * w * (0.92 + 0.08 * (1 - s * s));
        const yy = y + 4 * Math.sin(Math.PI * t) * (1 - Math.abs(t)) * 0.6;
        pts.push([x, yy]);
      }
      return catmullRom2bezier(pts);
    });
  }, []);

  const meridians = useMemo(() => {
    const phis = [-0.8, -0.6, -0.45, -0.3, -0.15, 0.15, 0.3, 0.45, 0.6, 0.8];
    return phis.map((phi) => {
      const pts = [];
      for (let i = 0; i <= 22; i++) {
        const y = Y_TOP + (i / 22) * (Y_BOT - Y_TOP);
        const w = widthAtY(y);
        const cx = CX + centerShiftAtY(y);
        const bend = Math.sin((phi * Math.PI) / 2);
        const x = cx + bend * w * (1 - 0.15 * Math.abs((y - (CY - 10)) / RY));
        const xx = x + 6 * bend * Math.cos(((y - CY) / RY) * Math.PI) * 0.6;
        pts.push([xx, y]);
      }
      return catmullRom2bezier(pts);
    });
  }, []);

  const particles = [
    [120, 90, 2.2], [460, 120, 2.0], [80, 270, 1.6], [495, 340, 1.8],
    [160, 420, 1.4], [420, 70, 1.6], [520, 280, 1.5], [90, 160, 1.2]
  ];

  return (
    <div className={`relative isolate ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, rgba(56,189,248,0.22), rgba(0,0,0,0) 70%)",
          filter: "blur(14px)",
        }}
      />
      <svg viewBox="0 0 560 560" className="relative z-10 w-full h-full" aria-hidden="true">
        <defs>
          <radialGradient id="glowCyan" cx="50%" cy="48%" r="60%">
            <stop offset="0%" stopColor="#79E3FF" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#29D0FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00C2FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="wire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8BE9FF" />
            <stop offset="100%" stopColor="#00C2FF" />
          </linearGradient>
          <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="headClip">
            <path d="
              M 355 120
              C 415 150, 440 220, 425 300
              C 412 365, 360 422, 305 445
              C 280 455, 255 450, 244 432
              C 235 418, 236 395, 242 374
              C 248 352, 242 330, 235 310
              C 228 293, 235 278, 252 268
              C 270 257, 283 240, 289 223
              C 300 195, 323 165, 355 120 Z
            "/>
          </clipPath>
        </defs>

        <g filter="url(#soft)" opacity="0.9" strokeLinecap="round">
          <circle cx="280" cy="280" r="235" fill="none" stroke="url(#wire)" strokeWidth="2" opacity="0.6" />
          <circle cx="280" cy="280" r="205" fill="none" stroke="url(#wire)" strokeWidth="1.4" opacity="0.45" />
          <circle cx="280" cy="280" r="175" fill="none" stroke="url(#wire)" strokeWidth="1" opacity="0.35" />
          <circle cx="280" cy="280" r="205" fill="none" stroke="#79E3FF" strokeWidth="1.2" className="ringPulse" strokeDasharray="8 10" opacity="0.6" />
        </g>

        <ellipse cx="300" cy="285" rx="125" ry="158" fill="url(#glowCyan)" opacity="0.26" />

        <g filter="url(#soft)" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M 355 120 C 415 150, 440 220, 425 300 C 412 365, 360 422, 305 445 C 280 455, 255 450, 244 432 C 235 418, 236 395, 242 374 C 248 352, 242 330, 235 310 C 228 293, 235 278, 252 268 C 270 257, 283 240, 289 223 C 300 195, 323 165, 355 120 Z"
            fill="none" stroke="url(#wire)" strokeWidth="1.4" opacity="0.95"
          />
        </g>

        <g clipPath="url(#headClip)" stroke="url(#wire)" fill="none" opacity="0.28" strokeLinecap="round">
          {latitudes.map((d, i) => (<path key={`lat-${i}`} d={d} strokeWidth="0.85" />))}
          {meridians.map((d, i) => (<path key={`mer-${i}`} d={d} strokeWidth="0.85" />))}
          <ellipse cx={300 + (26 - 28)} cy={274} rx="18" ry="11" strokeWidth="1" opacity="0.75" />
        </g>

        <g>
          {particles.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#9AE8FF" className="twinkle" opacity="0.9" />
          ))}
        </g>
      </svg>
    </div>
  );
}
