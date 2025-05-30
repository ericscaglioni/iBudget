export const sanitizeFilterInput = (input: string, maxLength = 100): string => {
  return input
    .trim()
    .slice(0, maxLength) // limit size
    .replace(/[^a-zA-Z0-9\s\-_'@.,]/g, ""); // strip dangerous chars
};