import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type BugReportRecord = {
  id: string;
  createdAt: string;
  description: string;
  screenshotDataUrl: string | null;
  pageUrl: string | null;
  userAgent: string | null;
  userId: string | null;
  userDisplay: string | null;
};

const REPORTS_DIR = path.join(process.cwd(), "data/bug-reports");

function ensureDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

export function saveBugReport(input: {
  description: string;
  screenshotDataUrl?: string | null;
  pageUrl?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  userDisplay?: string | null;
}): BugReportRecord {
  ensureDir();
  const record: BugReportRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    description: input.description.trim(),
    screenshotDataUrl: input.screenshotDataUrl ?? null,
    pageUrl: input.pageUrl?.trim().slice(0, 2000) ?? null,
    userAgent: input.userAgent?.trim().slice(0, 500) ?? null,
    userId: input.userId ?? null,
    userDisplay: input.userDisplay?.trim().slice(0, 120) ?? null,
  };
  const filePath = path.join(REPORTS_DIR, `${record.id}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return record;
}
