/** IDs legados (`clerk-{clerkId}`) quando o Postgres falhou no primeiro login. */
export function memberIdsHasUser(
  memberIds: string[],
  userId: string,
  clerkId?: string | null
): boolean {
  if (memberIds.includes(userId)) return true;
  if (clerkId) {
    const legacy = `clerk-${clerkId}`;
    if (memberIds.includes(legacy)) return true;
  }
  if (userId.startsWith("clerk-")) {
    return memberIds.includes(userId);
  }
  return false;
}
