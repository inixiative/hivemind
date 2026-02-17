const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

export function isNetworkLivenessMode(): boolean {
  const value = process.env.HIVEMIND_NETWORK_MODE?.trim().toLowerCase();
  return value ? TRUE_VALUES.has(value) : false;
}

export function getAgentLeaseTtlMs(): number {
  const raw = process.env.HIVEMIND_AGENT_LEASE_TTL_SECONDS;
  const seconds = raw ? Number(raw) : 180;

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 180_000;
  }

  return Math.floor(seconds * 1000);
}
