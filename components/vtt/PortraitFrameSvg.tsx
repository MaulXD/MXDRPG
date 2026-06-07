import type { PortraitFrameTier } from "@/lib/vtt/portrait-frame";
import { getPortraitFrameClass } from "@/lib/vtt/portrait-frame";

type Props = {
  tier: PortraitFrameTier;
  className?: string;
};

export function PortraitFrameSvg({ tier, className = "" }: Props) {
  const frameClass = `portrait-frame ${getPortraitFrameClass(tier)}${className ? ` ${className}` : ""}`;

  switch (tier) {
    case "hero":
      return (
        <svg className={frameClass} viewBox="0 0 80 80" fill="none" aria-hidden>
          <rect x="4" y="4" width="72" height="72" stroke="#8a6020" strokeWidth="0.5" />
          <rect x="7" y="7" width="66" height="66" stroke="#d4a030" strokeWidth="1.2" />
          <rect x="10" y="10" width="60" height="60" stroke="#8a6020" strokeWidth="0.5" />
          <path d="M7,20 L7,7 L20,7" fill="none" stroke="#d4a030" strokeWidth="2.5" strokeLinecap="square" />
          <path d="M7,7 Q7,16 16,16 Q16,7 7,7Z" fill="#d4a030" opacity="0.25" />
          <path d="M7,7 Q7,16 16,16 Q16,7 7,7Z" fill="none" stroke="#d4a030" strokeWidth="1" />
          <circle cx="7" cy="7" r="2.5" fill="#d4a030" />
          <path d="M73,20 L73,7 L60,7" fill="none" stroke="#d4a030" strokeWidth="2.5" strokeLinecap="square" />
          <path d="M73,7 Q73,16 64,16 Q64,7 73,7Z" fill="#d4a030" opacity="0.25" />
          <path d="M73,7 Q73,16 64,16 Q64,7 73,7Z" fill="none" stroke="#d4a030" strokeWidth="1" />
          <circle cx="73" cy="7" r="2.5" fill="#d4a030" />
          <path d="M7,60 L7,73 L20,73" fill="none" stroke="#d4a030" strokeWidth="2.5" strokeLinecap="square" />
          <path d="M7,73 Q7,64 16,64 Q16,73 7,73Z" fill="#d4a030" opacity="0.25" />
          <path d="M7,73 Q7,64 16,64 Q16,73 7,73Z" fill="none" stroke="#d4a030" strokeWidth="1" />
          <circle cx="7" cy="73" r="2.5" fill="#d4a030" />
          <path d="M73,60 L73,73 L60,73" fill="none" stroke="#d4a030" strokeWidth="2.5" strokeLinecap="square" />
          <path d="M73,73 Q73,64 64,64 Q64,73 73,73Z" fill="#d4a030" opacity="0.25" />
          <path d="M73,73 Q73,64 64,64 Q64,73 73,73Z" fill="none" stroke="#d4a030" strokeWidth="1" />
          <circle cx="73" cy="73" r="2.5" fill="#d4a030" />
          <polygon points="40,2 43,5 40,8 37,5" fill="#d4a030" />
          <polygon points="40,72 43,75 40,78 37,75" fill="#d4a030" />
          <polygon points="2,40 5,43 8,40 5,37" fill="#d4a030" />
          <polygon points="72,40 75,43 78,40 75,37" fill="#d4a030" />
          <line x1="28" y1="7" x2="28" y2="5.5" stroke="#d4a030" strokeWidth="0.8" opacity=".6" />
          <line x1="52" y1="7" x2="52" y2="5.5" stroke="#d4a030" strokeWidth="0.8" opacity=".6" />
          <line x1="28" y1="73" x2="28" y2="74.5" stroke="#d4a030" strokeWidth="0.8" opacity=".6" />
          <line x1="52" y1="73" x2="52" y2="74.5" stroke="#d4a030" strokeWidth="0.8" opacity=".6" />
          <line x1="7" y1="28" x2="5.5" y2="28" stroke="#d4a030" strokeWidth="0.8" opacity=".6" />
          <line x1="7" y1="52" x2="5.5" y2="52" stroke="#d4a030" strokeWidth="0.8" opacity=".6" />
          <line x1="73" y1="28" x2="74.5" y2="28" stroke="#d4a030" strokeWidth="0.8" opacity=".6" />
          <line x1="73" y1="52" x2="74.5" y2="52" stroke="#d4a030" strokeWidth="0.8" opacity=".6" />
        </svg>
      );
    case "monster":
      return (
        <svg className={frameClass} viewBox="0 0 80 80" fill="none" aria-hidden>
          <rect x="6" y="6" width="68" height="68" stroke="#5a4030" strokeWidth="1" />
          <rect x="9" y="9" width="62" height="62" stroke="#3a2510" strokeWidth="0.5" />
          <line x1="6" y1="6" x2="18" y2="6" stroke="#6a5040" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="6" y1="6" x2="6" y2="18" stroke="#6a5040" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="74" y1="6" x2="62" y2="6" stroke="#6a5040" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="74" y1="6" x2="74" y2="18" stroke="#6a5040" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="6" y1="74" x2="18" y2="74" stroke="#6a5040" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="6" y1="74" x2="6" y2="62" stroke="#6a5040" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="74" y1="74" x2="62" y2="74" stroke="#6a5040" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="74" y1="74" x2="74" y2="62" stroke="#6a5040" strokeWidth="1.5" strokeLinecap="square" />
          <rect x="4.5" y="4.5" width="3" height="3" fill="#6a5040" />
          <rect x="72.5" y="4.5" width="3" height="3" fill="#6a5040" />
          <rect x="4.5" y="72.5" width="3" height="3" fill="#6a5040" />
          <rect x="72.5" y="72.5" width="3" height="3" fill="#6a5040" />
        </svg>
      );
    case "elite":
      return (
        <svg className={frameClass} viewBox="0 0 80 80" fill="none" aria-hidden>
          <rect x="7" y="7" width="66" height="66" stroke="#4a6080" strokeWidth="1" />
          <rect x="10" y="10" width="60" height="60" stroke="#2a3a50" strokeWidth="0.5" />
          <line x1="4" y1="7" x2="20" y2="7" stroke="#7aa3c9" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="7" y1="4" x2="7" y2="20" stroke="#7aa3c9" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="7" y1="7" x2="13" y2="13" stroke="#7aa3c9" strokeWidth="1" opacity=".6" />
          <circle cx="7" cy="7" r="2" fill="#7aa3c9" />
          <line x1="76" y1="7" x2="60" y2="7" stroke="#7aa3c9" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="73" y1="4" x2="73" y2="20" stroke="#7aa3c9" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="73" y1="7" x2="67" y2="13" stroke="#7aa3c9" strokeWidth="1" opacity=".6" />
          <circle cx="73" cy="7" r="2" fill="#7aa3c9" />
          <line x1="4" y1="73" x2="20" y2="73" stroke="#7aa3c9" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="7" y1="76" x2="7" y2="60" stroke="#7aa3c9" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="7" y1="73" x2="13" y2="67" stroke="#7aa3c9" strokeWidth="1" opacity=".6" />
          <circle cx="7" cy="73" r="2" fill="#7aa3c9" />
          <line x1="76" y1="73" x2="60" y2="73" stroke="#7aa3c9" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="73" y1="76" x2="73" y2="60" stroke="#7aa3c9" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="73" y1="73" x2="67" y2="67" stroke="#7aa3c9" strokeWidth="1" opacity=".6" />
          <circle cx="73" cy="73" r="2" fill="#7aa3c9" />
          <line x1="40" y1="7" x2="40" y2="4" stroke="#4a6080" strokeWidth="1" />
          <line x1="40" y1="73" x2="40" y2="76" stroke="#4a6080" strokeWidth="1" />
          <line x1="7" y1="40" x2="4" y2="40" stroke="#4a6080" strokeWidth="1" />
          <line x1="73" y1="40" x2="76" y2="40" stroke="#4a6080" strokeWidth="1" />
        </svg>
      );
    case "miniboss":
      return (
        <svg className={frameClass} viewBox="0 0 80 80" fill="none" aria-hidden>
          <rect x="4" y="4" width="72" height="72" stroke="#3a2860" strokeWidth="0.5" />
          <rect x="7" y="7" width="66" height="66" stroke="#8060c0" strokeWidth="1.2" />
          <rect x="10" y="10" width="60" height="60" stroke="#3a2860" strokeWidth="0.5" />
          <polygon points="7,7 20,7 7,20" fill="#12101e" stroke="#8060c0" strokeWidth="1" />
          <polygon points="7,7 16,7 7,16" fill="#8060c0" opacity=".9" />
          <polygon points="73,7 60,7 73,20" fill="#12101e" stroke="#8060c0" strokeWidth="1" />
          <polygon points="73,7 64,7 73,16" fill="#8060c0" opacity=".9" />
          <polygon points="7,73 20,73 7,60" fill="#12101e" stroke="#8060c0" strokeWidth="1" />
          <polygon points="7,73 16,73 7,64" fill="#8060c0" opacity=".9" />
          <polygon points="73,73 60,73 73,60" fill="#12101e" stroke="#8060c0" strokeWidth="1" />
          <polygon points="73,73 64,73 73,64" fill="#8060c0" opacity=".9" />
          <polygon points="40,2 44,6 40,10 36,6" fill="#8060c0" />
          <polygon points="40,70 44,74 40,78 36,74" fill="#8060c0" />
          <polygon points="2,40 6,44 10,40 6,36" fill="#8060c0" />
          <polygon points="70,40 74,44 78,40 74,36" fill="#8060c0" />
          <line x1="28" y1="7" x2="28" y2="5.5" stroke="#8060c0" strokeWidth="0.8" opacity=".5" />
          <line x1="52" y1="7" x2="52" y2="5.5" stroke="#8060c0" strokeWidth="0.8" opacity=".5" />
          <line x1="28" y1="73" x2="28" y2="74.5" stroke="#8060c0" strokeWidth="0.8" opacity=".5" />
          <line x1="52" y1="73" x2="52" y2="74.5" stroke="#8060c0" strokeWidth="0.8" opacity=".5" />
          <line x1="7" y1="28" x2="5.5" y2="28" stroke="#8060c0" strokeWidth="0.8" opacity=".5" />
          <line x1="7" y1="52" x2="5.5" y2="52" stroke="#8060c0" strokeWidth="0.8" opacity=".5" />
          <line x1="73" y1="28" x2="74.5" y2="28" stroke="#8060c0" strokeWidth="0.8" opacity=".5" />
          <line x1="73" y1="52" x2="74.5" y2="52" stroke="#8060c0" strokeWidth="0.8" opacity=".5" />
        </svg>
      );
    case "boss":
      return (
        <svg className={frameClass} viewBox="0 0 80 80" fill="none" aria-hidden>
          <rect x="2" y="2" width="76" height="76" stroke="#5a1010" strokeWidth="0.5" />
          <rect x="5" y="5" width="70" height="70" stroke="#c0392b" strokeWidth="0.8" />
          <rect x="7" y="7" width="66" height="66" stroke="#e05040" strokeWidth="1.5" />
          <rect x="10" y="10" width="60" height="60" stroke="#5a1010" strokeWidth="0.5" />
          <polygon points="7,7 22,7 7,22" fill="#180808" stroke="#c0392b" strokeWidth="1" />
          <path d="M7,7 Q7,17 17,17 Q17,7 7,7Z" fill="#c0392b" opacity="0.3" />
          <path d="M7,7 Q7,17 17,17 Q17,7 7,7Z" fill="none" stroke="#e05040" strokeWidth="1" />
          <line x1="2" y1="7" x2="7" y2="7" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="7" y1="2" x2="7" y2="7" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="square" />
          <circle cx="7" cy="7" r="3" fill="#c0392b" />
          <polygon points="73,7 58,7 73,22" fill="#180808" stroke="#c0392b" strokeWidth="1" />
          <path d="M73,7 Q73,17 63,17 Q63,7 73,7Z" fill="#c0392b" opacity="0.3" />
          <path d="M73,7 Q73,17 63,17 Q63,7 73,7Z" fill="none" stroke="#e05040" strokeWidth="1" />
          <line x1="78" y1="7" x2="73" y2="7" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="73" y1="2" x2="73" y2="7" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="square" />
          <circle cx="73" cy="7" r="3" fill="#c0392b" />
          <polygon points="7,73 22,73 7,58" fill="#180808" stroke="#c0392b" strokeWidth="1" />
          <path d="M7,73 Q7,63 17,63 Q17,73 7,73Z" fill="#c0392b" opacity="0.3" />
          <path d="M7,73 Q7,63 17,63 Q17,73 7,73Z" fill="none" stroke="#e05040" strokeWidth="1" />
          <line x1="2" y1="73" x2="7" y2="73" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="7" y1="78" x2="7" y2="73" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="square" />
          <circle cx="7" cy="73" r="3" fill="#c0392b" />
          <polygon points="73,73 58,73 73,58" fill="#180808" stroke="#c0392b" strokeWidth="1" />
          <path d="M73,73 Q73,63 63,63 Q63,73 73,73Z" fill="#c0392b" opacity="0.3" />
          <path d="M73,73 Q73,63 63,63 Q63,73 73,73Z" fill="none" stroke="#e05040" strokeWidth="1" />
          <line x1="78" y1="73" x2="73" y2="73" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="73" y1="78" x2="73" y2="73" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="square" />
          <circle cx="73" cy="73" r="3" fill="#c0392b" />
          <polygon points="40,0 44,4 40,8 36,4" fill="#c0392b" />
          <polygon points="40,72 44,76 40,80 36,76" fill="#c0392b" />
          <polygon points="0,40 4,44 8,40 4,36" fill="#c0392b" />
          <polygon points="72,40 76,44 80,40 76,36" fill="#c0392b" />
          <line x1="26" y1="7" x2="26" y2="4.5" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="28" y1="7" x2="28" y2="4.5" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="52" y1="7" x2="52" y2="4.5" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="54" y1="7" x2="54" y2="4.5" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="26" y1="73" x2="26" y2="75.5" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="28" y1="73" x2="28" y2="75.5" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="52" y1="73" x2="52" y2="75.5" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="54" y1="73" x2="54" y2="75.5" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="7" y1="26" x2="4.5" y2="26" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="7" y1="28" x2="4.5" y2="28" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="7" y1="52" x2="4.5" y2="52" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="7" y1="54" x2="4.5" y2="54" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="73" y1="26" x2="75.5" y2="26" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="73" y1="28" x2="75.5" y2="28" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="73" y1="52" x2="75.5" y2="52" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
          <line x1="73" y1="54" x2="75.5" y2="54" stroke="#c0392b" strokeWidth="0.8" opacity=".7" />
        </svg>
      );
    default:
      return null;
  }
}
