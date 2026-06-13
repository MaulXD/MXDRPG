import type { Metadata } from "next";

export const SITE_NAME = "MXDRPG";

export function pageMetadata(title: string, description?: string): Metadata {
  const meta: Metadata = { title };
  if (description) meta.description = description;
  return meta;
}
