export function truncateTowardZero(value: number): number {
  return value < 0 ? Math.ceil(value) : Math.floor(value)
}
