import { z } from 'zod';
import parseTime from '@d10f/time-utils';

/**
 * The JWT library supports both numbers or strings but this function enforces
 * the use of strings in the form of "20d" or "15m". This is far easier to read
 * and helps avoid misunderstandings.
 */
export function isValidTimeSpan(val: string, ctx: z.RefinementCtx) {
  //const match = val.match(
  //  /^(?<value>-?(?:\d+)?\.?\d+) *(?<type>milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i,
  //);

  try {
    const resultInMs = parseTime(val);

    if (resultInMs <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        inclusive: true,
        type: 'number',
        message: 'Expiration time must be a positive integer',
      });
      return z.NEVER;
    }

    return resultInMs;
  } catch (error) {
    if ((error as Error).message === 'Invalid input.') {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_string,
        validation: 'regex',
        message:
          'JWT expiration time must be expressed as an time amount e.g. "20d", "20 days", "15m", "15 minutes", "1w" or "1 week"',
      });
      return z.NEVER;
    }
  }
}
