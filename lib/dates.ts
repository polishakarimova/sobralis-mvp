export function timeToMinutes(time: string) {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

export function calculateDurationHours(startTime: string, endTime: string) {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  if (end <= start) end += 24 * 60;
  return Math.max((end - start) / 60, 1);
}

export function formatDuration(hours: number) {
  const fullHours = Math.floor(hours);
  const minutes = Math.round((hours - fullHours) * 60);
  if (minutes === 0) return `${fullHours} ч`;
  return `${fullHours} ч ${minutes} мин`;
}

export function isBeforeDate(dateA: string, dateB: string) {
  if (!dateA || !dateB) return true;
  return new Date(`${dateA}T00:00:00`) < new Date(`${dateB}T00:00:00`);
}
