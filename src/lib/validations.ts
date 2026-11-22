import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const currentYear = new Date().getFullYear();
const maxYear = currentYear;

// Base schema without refine (for partial updates)
const chartBaseSchema = z.object({
  chartName: z.string().min(1, "Chart name is required").max(100, "Chart name too long"),
   // Blank is allowed: pre-create the table now, publish the number later.
  result: z.string().max(20, "Result too long").default(""),
  openingResult: z.string().max(20, "Opening result too long").optional().nullable(),
  closingResult: z.string().max(20, "Closing result too long").optional().nullable(),
  date: z.coerce.number().int().min(1).max(31, "Invalid date"),
  month: z.coerce.number().int().min(1).max(12, "Invalid month"),
  year: z.coerce.number().int().min(2012).max(maxYear, `Year must be between 2012 and ${maxYear}`),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isHighlighted: z.boolean().default(false),
  isActive: z.boolean().default(true),
  scheduledAt: z.string().optional().nullable().refine((val) => {
    if (!val || val === "") return true; // Allow empty/null
    return !isNaN(new Date(val).getTime()); // Must be valid date if provided
  }, { message: "Invalid date time format", path: ["scheduledAt"] }),
    drawTime: z
    .union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid draw time (HH:MM)")])
    .optional()
    .nullable(),
});

// Full schema with future date validation (for create)
export const chartSchema = chartBaseSchema.refine((data) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(data.year, data.month - 1, data.date);
  return selectedDate <= today;
}, {
  message: "Future dates are not allowed",
  path: ["date"],
});

// Partial schema without future date check (for updates)
export const chartUpdateSchema = chartBaseSchema.partial();

export const chartFilterSchema = z.object({
  search: z.string().optional(),
  date: z.coerce.number().int().min(1).max(31).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2012).max(maxYear).optional(),
  isActive: z.enum(["all", "true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "displayOrder", "date", "chartName"]).default("displayOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

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

export type LoginInput = z.infer<typeof loginSchema>;
export type ChartInput = z.infer<typeof chartSchema>;
export type ChartFilterInput = z.infer<typeof chartFilterSchema>;
export type AdminInput = z.infer<typeof adminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;

export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}