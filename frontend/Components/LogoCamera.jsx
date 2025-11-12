import React from "react";
import { Camera } from "lucide-react";

export default function LogoCamera({ size = 20, className = "", strokeWidth = 1.8 }) {
  return <Camera size={size} className={className} strokeWidth={strokeWidth} />;
}
