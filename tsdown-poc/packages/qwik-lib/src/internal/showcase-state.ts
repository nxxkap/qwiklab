export interface ScoreChangeInput {
  step: number;
  multiplier: number;
  action: string;
  clickCount: number;
}

export function calculateScoreDelta(input: ScoreChangeInput): number {
  const actionBoost = input.action === "boost" ? 1 : 0;
  return input.step * input.multiplier + actionBoost + input.clickCount - 1;
}

export function formatMetric(label: string, value: string | number): string {
  return `${label}: ${value}`;
}
