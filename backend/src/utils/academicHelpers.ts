export const extractNumber = (val: unknown): number | null => {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" && !isNaN(val)) return val;
  const str = String(val);
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

/**
 * Calculates the eligible feedback semester for a student based on their current semester.
 * Core Business Rule: Students always submit feedback for their PREVIOUS completed semester (currentSemester - 1).
 * 
 * Sem 1 -> null (No feedback session available yet)
 * Sem 2 -> 1
 * Sem 3 -> 2
 * Sem 4 -> 3
 * Sem 5 -> 4
 * Sem 6 -> 5
 * Sem 7 -> 6
 * Sem 8 -> 7
 */
export const getEligibleFeedbackSemester = (currentSemester: unknown): number | null => {
  const semNum = extractNumber(currentSemester);
  if (semNum === null || semNum <= 1) {
    return null;
  }
  return semNum - 1;
};
