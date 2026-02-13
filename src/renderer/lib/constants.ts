export { OVERSCAN_COUNT, MAX_LINES } from '@shared/constants'

/** Compute the log line row height for a given font size (keeps ~1.54x ratio). */
export function getRowHeight(fontSize: number): number {
  return Math.round(fontSize * 1.54)
}
