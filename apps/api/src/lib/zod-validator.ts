import type { Context } from "hono"
import { validator } from "hono/validator"
import type { ZodSchema } from "zod"

export function zodValidator<TTarget extends "json" | "query" | "param", TSchema>(
  target: TTarget,
  schema: ZodSchema<TSchema>,
) {
  return validator(target, (value, c: Context) => {
    const result = schema.safeParse(value)
    if (!result.success) {
      return c.json(
        {
          error: result.error.issues[0]?.message ?? "Invalid request",
        },
        400,
      )
    }
    return result.data
  })
}
