import { z } from "zod";

import { parseDateString } from "@/lib/utils/dates";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

export const createSalesEntrySchema = z
  .object({
    customer_name: z.string().trim().min(1, "Customer name is required.").max(200),
    customer_phone: optionalText(30),
    customer_email: z
      .string()
      .trim()
      .max(200)
      .optional()
      .nullable()
      .transform((value) => (value ? value : null))
      .refine((value) => !value || z.string().email().safeParse(value).success, {
        message: "Enter a valid email address.",
      }),
    customer_address: optionalText(500),
    customer_region: optionalText(120),
    item_sold: z.string().trim().min(1, "Item sold is required.").max(200),
    quantity: z.coerce.number().positive("Quantity must be greater than zero."),
    unit_price: z.coerce.number().min(0, "Price cannot be negative."),
    total_amount: z.coerce.number().min(0, "Total amount cannot be negative."),
    remarks: optionalText(1000),
    sale_date: z
      .string()
      .refine((value) => parseDateString(value) !== null, "Invalid sale date."),
  })
  .refine(
    (data) => Math.abs(data.total_amount - data.quantity * data.unit_price) < 0.02,
    {
      message: "Total amount must match quantity × price.",
      path: ["total_amount"],
    },
  );

export const salesEntryIdSchema = z.object({
  id: z.string().uuid("Invalid sale id."),
});
