// Stub for the platform-wide tier-gating hook. The real implementation
// will live in @dhc/shared once that package ships; until then, this
// returns "everything is allowed" so deploys aren't blocked.

export function useTier() {
  return {
    tier: "standard",
    can: () => ({ allowed: true, requiredTier: null }),
  };
}
