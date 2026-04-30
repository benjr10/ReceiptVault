export function getISODateString(date: string | Date): string {
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (e) {
    console.error("Error parsing date for ISO string:", date, e);
    return '';
  }
}

export function isDateInPeriod(dateStr: string, startISO: string, endISO: string): boolean {
  const expenseISO = getISODateString(dateStr);
  if (!expenseISO) return false;
  return expenseISO >= startISO && expenseISO <= endISO;
}

export function getUTCStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function getUTCEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}
