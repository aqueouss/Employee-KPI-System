import { z } from "zod";

import {
  calculateRemainingPayment,
  calculateSalesAmounts,
} from "@/lib/sales/sales-amounts";
import {
  SALES_DISPATCH_STATUSES,
  SALES_ORDER_STATUSES,
} from "@/lib/sales/sales-status";
import { parseDateString } from "@/lib/utils/dates";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

const advancePaymentFlag = z
  .union([z.literal("true"), z.literal("false"), z.boolean()])
  .transform((value) => value === true || value === "true");

const salesEntryFieldsSchema = z.object({
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
  other_amount: z.coerce.number().min(0, "Other amount cannot be negative."),
  net_amount: z.coerce.number().min(0, "Net amount cannot be negative."),
  gst_amount: z.coerce.number().min(0, "GST amount cannot be negative."),
  total_amount: z.coerce.number().min(0, "Total amount cannot be negative."),
  is_advance_payment: advancePaymentFlag,
  advance_received: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? null : value,
    z.coerce.number().min(0, "Advance received cannot be negative.").nullable().optional(),
  ),
  remaining_amount: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? null : value,
    z.coerce.number().min(0, "Remaining payment cannot be negative.").nullable().optional(),
  ),
  order_status: z.enum(SALES_ORDER_STATUSES, {
    message: "Select a valid order status.",
  }),
  dispatch_status: z.enum(SALES_DISPATCH_STATUSES, {
    message: "Select a valid dispatch status.",
  }),
  order_date: z
    .string()
    .refine((value) => parseDateString(value) !== null, "Invalid order date."),
});

type SalesEntryFields = z.infer<typeof salesEntryFieldsSchema>;

function withSalesAmountChecks<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .refine(
      (data: SalesEntryFields) => {
        const computed = calculateSalesAmounts({
          quantity: data.quantity,
          unitPrice: data.unit_price,
          otherAmount: data.other_amount,
        });
        return (
          Math.abs(data.net_amount - computed.netAmount) < 0.02 &&
          Math.abs(data.gst_amount - computed.gstAmount) < 0.02 &&
          Math.abs(data.total_amount - computed.totalAmount) < 0.02
        );
      },
      {
        message:
          "Amounts must match: net = qty × price, total = (net + other) + 18% GST.",
        path: ["total_amount"],
      },
    )
    .refine(
      (data: SalesEntryFields) => {
        if (!data.is_advance_payment) return true;
        return (
          data.advance_received !== null &&
          data.advance_received !== undefined &&
          data.advance_received <= data.total_amount
        );
      },
      {
        message: "Advance received must be between 0 and the total amount.",
        path: ["advance_received"],
      },
    )
    .refine(
      (data: SalesEntryFields) => {
        if (!data.is_advance_payment) return true;
        const remaining = calculateRemainingPayment(
          data.total_amount,
          data.advance_received ?? 0,
        );
        return Math.abs((data.remaining_amount ?? 0) - remaining) < 0.02;
      },
      {
        message: "Remaining payment must equal total minus advance received.",
        path: ["remaining_amount"],
      },
    );
}

export const createSalesEntrySchema = withSalesAmountChecks(salesEntryFieldsSchema);

export const updateSalesEntrySchema = withSalesAmountChecks(
  salesEntryFieldsSchema.extend({
    id: z.string().uuid("Invalid sale id."),
  }),
);

export const salesEntryIdSchema = z.object({
  id: z.string().uuid("Invalid sale id."),
});

export function resolveSalesPaymentFields(data: SalesEntryFields) {
  if (data.is_advance_payment) {
    const advanceReceived = data.advance_received ?? 0;
    return {
      is_advance_payment: true,
      advance_received: advanceReceived,
      remaining_amount: calculateRemainingPayment(data.total_amount, advanceReceived),
    };
  }

  return {
    is_advance_payment: false,
    advance_received: null,
    remaining_amount: null,
  };
}
