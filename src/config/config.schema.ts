import { z } from 'zod';

export const schema = z
  .object({
    MONGODB_NAME: z.string(),
    MONGODB_USER: z.string(),
    MONGODB_PASSWORD: z.string(),
    JWT_ACCESS_EXPIRES: z.string().transform(isValidExpirationTime),
    JWT_ACCESS_SECRET: z.string(),
    JWT_REFRESH_EXPIRES: z.string().transform(isValidExpirationTime),
    JWT_REFRESH_SECRET: z.string(),
    PORT: z.string().transform(isValidPortNumber),
  })
  .required();

export type SchemaIn = z.input<typeof schema>;
export type SchemaOut = z.output<typeof schema>;

/**
 * PORT number must be above 1024, since those are restricted to root, and
 * running an application with elevated privileges is generally a bad idea.
 * 65_535 is the maximum number of ports, so anything beyond that is going
 * to cause an error anyway.
 */
function isValidPortNumber(val: string, ctx: z.RefinementCtx) {
  const parsed = parseInt(val);

  if (isNaN(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Not a number',
    });
    return z.NEVER;
  }

  if (parsed < 1_024) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1024,
      inclusive: true,
      type: 'number',
    });
    return z.NEVER;
  }

  if (parsed > 65_535) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 65_535,
      inclusive: true,
      type: 'number',
    });
    return z.NEVER;
  }
}

/**
 * The JWT library supports both numbers or strings but this function enforces
 * the use of strings in the form of "20d" or "15m". This is far easier to read
 * and helps avoid misunderstandings.
 */
function isValidExpirationTime(val: string, ctx: z.RefinementCtx) {
  const match = val.match(
    /^(?<value>-?(?:\d+)?\.?\d+) *(?<type>milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i,
  );

  if (!match) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_string,
      validation: 'regex',
      message:
        'JWT expiration time must be expressed as an time amount e.g. "20d", "20 days", "15m", "15 minutes", "1w" or "1 week"',
    });
    return z.NEVER;
  }

  if (parseInt(match.groups.value) <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      inclusive: true,
      type: 'number',
      message: 'Expiration time must be a positive integer',
    });
    return z.NEVER;
  }
}
