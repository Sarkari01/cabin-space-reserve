import { format, isValid, parseISO } from "date-fns";

/**
 * Safe date formatting utility that handles null, undefined, and invalid dates gracefully
 */
export function safeFormatDate(
  date: string | Date | null | undefined,
  formatStr: string = "MMM d, yyyy",
  fallback: string = "N/A"
): string {
  try {
    if (!date) {
      return fallback;
    }

    // Convert string to Date if needed
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    
    // Check if the date is valid
    if (!isValid(dateObj)) {
      console.warn("Invalid date provided to safeFormatDate:", date);
      return fallback;
    }

    return format(dateObj, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error, "Date:", date);
    return fallback;
  }
}

/**
 * Safe date parsing that handles various input formats
 */
export function safeParseDateISO(dateString: string | null | undefined): Date | null {
  try {
    if (!dateString) {
      return null;
    }

    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch (error) {
    console.error("Error parsing date:", error, "Date string:", dateString);
    return null;
  }
}

/**
 * Check if a date string or Date object is valid
 */
export function isValidDate(date: string | Date | null | undefined): boolean {
  try {
    if (!date) {
      return false;
    }

    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return isValid(dateObj);
  } catch {
    return false;
  }
}

/**
 * Safe time formatting for time-only display
 */
export function safeFormatTime(
  date: string | Date | null | undefined,
  formatStr: string = "hh:mm a",
  fallback: string = "N/A"
): string {
  return safeFormatDate(date, formatStr, fallback);
}

/**
 * Safe date-time formatting for combined display
 */
export function safeFormatDateTime(
  date: string | Date | null | undefined,
  formatStr: string = "MMM dd, yyyy hh:mm a",
  fallback: string = "N/A"
): string {
  return safeFormatDate(date, formatStr, fallback);
}