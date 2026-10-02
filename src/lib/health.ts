/** Metric BMI: kilograms divided by height in metres squared. */
export function calculateBmi(heightCm: number | null, weightKg: number | null): number | null {
  if (heightCm == null || weightKg == null || heightCm <= 0 || weightKg <= 0) return null;
  const heightMetres = heightCm / 100;
  return weightKg / (heightMetres * heightMetres);
}
