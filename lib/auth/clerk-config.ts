/** Clerk ativo quando as chaves estão no ambiente (Vercel Marketplace ou .env.local). */
export function isClerkEnabled(): boolean {
  return Boolean(
    process.env.CLERK_SECRET_KEY?.trim() && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
  );
}
