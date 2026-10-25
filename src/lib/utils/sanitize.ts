import { DESCRIPTION_MAX_LENGTH } from "@/lib/constants";
import { ValidationError } from "@/lib/errors/AppError";

/**
 * For search boxes only: strips most punctuation before it is used in a filter.
 * Do NOT use it on text the user wants saved, it deletes characters such as ( ) & / # and accents.
 */
export const sanitizeFilterInput = (input: string, maxLength = 100): string => {
  return input
    .trim()
    .slice(0, maxLength) // limit size
    .replace(/[^a-zA-Z0-9\s\-_'@.,]/g, ""); // strip dangerous chars
};

/**
 * For user-written text that gets saved (transaction descriptions): keep it exactly as typed.
 * Queries are parameterised by Prisma and React escapes output, so there is nothing to strip here.
 */
export const normalizeDescription = (input: unknown): string => {
  if (typeof input !== "string") throw new ValidationError("Description is required");

  const description = input.trim();
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(`Description can be at most ${DESCRIPTION_MAX_LENGTH} characters long`);
  }
  return description;
};
