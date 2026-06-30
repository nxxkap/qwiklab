const MAX_STEP = 10;

export function nextCount(current: number, step: number): number {
  return current + normalizeStep(step);
}

export function formatCountLabel(count: number): string {
  return `Count: ${count}`;
}

function normalizeStep(step: number): number {
  if (!Number.isFinite(step)) {
    return 1;
  }

  if (step < 1) {
    return 1;
  }

  if (step > MAX_STEP) {
    return MAX_STEP;
  }

  return Math.trunc(step);
}

