import { z } from "zod";
import { SPECIAL_SLUGS, slugify } from "./markets";

/* -------------------------------- constants ------------------------------- */

/** Earliest year the site covers (mirrors MIN_YEAR in markets.ts). */
const MIN_YEAR = 2015;
/** Latest allowed year — no future charts. */
const MAX_YEAR = new Date().getFullYear();

/* ---------------------------------- auth ---------------------------------- */

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/* --------------------------------- charts --------------------------------- */

/** Base schema (no date refine) — reused for partial updates. */
const chartBaseSchema = z.object({
  chartName: z.string().min(1, "Chart name is required").max(100, "Chart name too long"),

  // Blank is allowed: pre-create the table now, publish the number later.
  result: z.string().max(20, "Result too long").default(""),
  openingResult: z.string().max(20, "Opening result too long").optional().nullable(),
  closingResult: z.string().max(20, "Closing result too long").optional().nullable(),

  date: z.coerce.number().int().min(1).max(31, "Invalid date"),
  month: z.coerce.number().int().min(1).max(12, "Invalid month"),
  year: z.coerce
    .number()
    .int()
    .min(MIN_YEAR, `Year must be ${MIN_YEAR} or later`)
    .max(MAX_YEAR, `Year must be between ${MIN_YEAR} and ${MAX_YEAR}`),

  displayOrder: z.coerce.number().int().min(0).default(0),
  isHighlighted: z.boolean().default(false),
  isActive: z.boolean().default(true),

  scheduledAt: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true; // empty/null allowed
        return !isNaN(new Date(val).getTime());
      },
      { message: "Invalid date time format", path: ["scheduledAt"] }
    ),

  drawTime: z
    .union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid draw time (HH:MM)")])
    .optional()
    .nullable(),
});

/** Create schema — blocks future dates; past backfill only for the Special 4. */
export const chartSchema = chartBaseSchema.refine(
  (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(data.year, data.month - 1, data.date);
    if (selectedDate > today) return false;
    if (selectedDate < today && !SPECIAL_SLUGS.includes(slugify(data.chartName))) return false;
    return true;
  },
  {
    message: "Future dates not allowed; past dates only for Gali, Desawar, Faridabad, Ghaziabad",
    path: ["date"],
  }
);

/** Update schema — no future/past restriction (editing an existing row). */
export const chartUpdateSchema = chartBaseSchema.partial();

/** List/filter schema for the admin charts API. */
export const chartFilterSchema = z.object({
  search: z.string().optional(),
  date: z.coerce.number().int().min(1).max(31).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(MIN_YEAR).max(MAX_YEAR).optional(),
  isActive: z.enum(["all", "true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "displayOrder", "date", "chartName"]).default("displayOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/* --------------------------------- admins --------------------------------- */

export const adminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["super_admin", "admin", "editor"]).default("admin"),
});

export const updateAdminSchema = adminSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

/* ---------------------------------- types --------------------------------- */

export type LoginInput = z.infer<typeof loginSchema>;
export type ChartInput = z.infer<typeof chartSchema>;
export type ChartFilterInput = z.infer<typeof chartFilterSchema>;
export type AdminInput = z.infer<typeof adminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;

/* --------------------------------- helper --------------------------------- */

export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error };
}