import { useId } from "react";

/**
 * The brand emblem that sits at the far right of every banner: a stylised Asante stool in gold.
 *
 * IMPORTANT: this is interim, stylised artwork drawn for the site. It is not a photograph or an official depiction of the
 * Golden Stool (Sika Dwa), which is sacred. Before launch, replace this drawing with artwork approved by the custodians
 * (the Manhyia Palace) by editing this one component; every banner updates together.
 * It is decorative: the banner text carries the meaning, so it is hidden from screen readers.
 */
export function SikaDwaEmblem({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const gold = `g${id}`, dark = `d${id}`, glow = `l${id}`, clip = `c${id}`;
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8CF83" /><stop offset="0.45" stopColor="#D5A642" /><stop offset="1" stopColor="#B88A1E" />
        </linearGradient>
        <linearGradient id={dark} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B88A1E" /><stop offset="0.5" stopColor="#E8CF83" /><stop offset="1" stopColor="#A87F1A" />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="0.55" r="0.55">
          <stop offset="0" stopColor="#E8CF83" stopOpacity="0.55" /><stop offset="1" stopColor="#E8CF83" stopOpacity="0" />
        </radialGradient>
        <clipPath id={clip}>
          <path d="M8 38 C22 54 98 54 112 38 L112 50 C98 66 22 66 8 50 Z" />
          <rect x="47" y="64" width="26" height="42" rx="4" />
          <path d="M20 108 C40 99 80 99 100 108 L100 120 C80 128 40 128 20 120 Z" />
        </clipPath>
      </defs>
      <ellipse className="emblem-glow" cx="60" cy="74" rx="58" ry="64" fill={`url(#${glow})`} />
      {/* base */}
      <path d="M20 108 C40 99 80 99 100 108 L100 120 C80 128 40 128 20 120 Z" fill={`url(#${gold})`} />
      <path d="M20 108 C40 99 80 99 100 108" fill="none" stroke="#F6E7B0" strokeWidth="1.2" opacity="0.8" />
      {/* side supports */}
      <rect x="27" y="62" width="9" height="46" rx="3" fill={`url(#${dark})`} />
      <rect x="84" y="62" width="9" height="46" rx="3" fill={`url(#${dark})`} />
      {/* central column with rings */}
      <rect x="47" y="64" width="26" height="42" rx="4" fill={`url(#${dark})`} />
      <g stroke="#8B6845" strokeWidth="1.4" opacity="0.8"><path d="M47 74h26M47 85h26M47 96h26" /></g>
      <path d="M60 76l5 6-5 6-5-6z" fill="#8B6845" opacity="0.85" />
      {/* seat: curved, rising at both ends */}
      <path d="M8 38 C22 54 98 54 112 38 L112 50 C98 66 22 66 8 50 Z" fill={`url(#${gold})`} />
      <path d="M8 38 C22 54 98 54 112 38" fill="none" stroke="#F6E7B0" strokeWidth="1.6" opacity="0.9" />
      <path d="M12 51 C28 62 92 62 108 51" fill="none" stroke="#8B6845" strokeWidth="1" opacity="0.6" />
      {/* hanging bells */}
      <g fill={`url(#${gold})`} stroke="#8B6845" strokeWidth="0.6">
        <path d="M14 56v5M106 56v5M34 62v5M86 62v5" stroke="#B88A1E" strokeWidth="1" fill="none" />
        <circle cx="14" cy="65" r="4" /><circle cx="106" cy="65" r="4" /><circle cx="34" cy="71" r="3.4" /><circle cx="86" cy="71" r="3.4" />
      </g>
      {/* slow band of light, kept inside the shape */}
      <g clipPath={`url(#${clip})`}>
        <rect className="emblem-shine" x="-20" y="30" width="26" height="100" fill="#FFFFFF" opacity="0.28" transform="skewX(-20)" />
      </g>
    </svg>
  );
}
