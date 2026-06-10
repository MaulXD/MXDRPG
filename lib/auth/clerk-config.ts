/** Chave pública — necessária para ClerkProvider e componentes client (@clerk/nextjs). */
export function hasClerkPublishableKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}

/** Clerk completo (sessão server + API) — exige secret + publishable. */
export function isClerkEnabled(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY?.trim() && hasClerkPublishableKey());
}
