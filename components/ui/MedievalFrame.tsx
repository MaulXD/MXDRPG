import type { ReactNode } from "react";
import { EldarinCorners } from "@/components/ui/EldarinCorners";

export const MEDIEVAL_FRAME_VARIANTS = [
  "parchment",
  "iron",
  "gothic",
  "royal",
  "celtic",
  "rune",
] as const;

export type MedievalFrameVariant = (typeof MEDIEVAL_FRAME_VARIANTS)[number];

type Props = {
  variant?: MedievalFrameVariant;
  children: ReactNode;
  className?: string;
  /** Reduz padding interno */
  compact?: boolean;
  /** Sem padding no corpo — só a moldura */
  flush?: boolean;
  /** Margem típica de página aberta */
  page?: boolean;
};

function frameClass(
  variant: MedievalFrameVariant,
  opts: { compact?: boolean; flush?: boolean; page?: boolean; className?: string }
): string {
  const parts = ["mf", "eldarin-frame", `mf--${variant}`];
  if (opts.compact) parts.push("mf--compact");
  if (opts.flush) parts.push("mf--flush");
  if (opts.page) parts.push("mf--page");
  if (opts.className?.trim()) parts.push(opts.className.trim());
  return parts.join(" ");
}

export function MedievalFrame({
  variant = "parchment",
  children,
  className,
  compact,
  flush,
  page,
}: Props) {
  return (
    <div className={frameClass(variant, { compact, flush, page, className })}>
      <EldarinCorners className="mf-corner" />
      <div className="mf-body">{children}</div>
    </div>
  );
}
