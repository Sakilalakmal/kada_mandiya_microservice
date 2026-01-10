export function createCorrelationId(): string {
  const now = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2);
  return `${now}-${rand}`.slice(0, 36);
}

