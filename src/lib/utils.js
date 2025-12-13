export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
