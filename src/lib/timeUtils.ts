/**
 * Format time string to remove seconds (HH:mm:ss -> HH:mm)
 */
export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return ''
  // Remove seconds if present (HH:mm:ss -> HH:mm)
  return timeStr.split(':').slice(0, 2).join(':')
}

