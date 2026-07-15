"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Pencil, X } from "lucide-react";

import {
  updateSalesEntryAction,
  type SalesActionState,
} from "@/actions/sales.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SalesEntryRow } from "@/lib/sales/sales-report";
import {
  SALES_DISPATCH_STATUS_LABELS,
  SALES_DISPATCH_STATUSES,
  SALES_ORDER_STATUS_LABELS,
  SALES_ORDER_STATUSES,
} from "@/lib/sales/sales-status";
import { nativeSelectClassName } from "@/lib/ui/native-select";

const initialState: SalesActionState = {};

export function SalesEntryEditDialog({
  entry,
  open,
  onClose,
  minOrderDate,
  maxOrderDate,
}: {
  entry: SalesEntryRow | null;
  open: boolean;
  onClose: () => void;
  minOrderDate?: string | null;
  maxOrderDate: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateSalesEntryAction,
    initialState,
  );
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  const [gstAmount, setGstAmount] = useState("0");
  const [orderDate, setOrderDate] = useState("");

  useEffect(() => {
    if (!entry) return;
    setQuantity(String(entry.quantity));
    setUnitPrice(String(entry.unit_price));
    setGstAmount(String(entry.gst_amount));
    setOrderDate(entry.order_date);
  }, [entry]);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  const totalAmount = useMemo(() => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    const gst = Number(gstAmount) || 0;
    return Math.round((qty * price + gst) * 100) / 100;
  }, [quantity, unitPrice, gstAmount]);

  if (!open || !entry) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-sale-title"
    >
      <div className="glass-panel max-h-[90vh] w-full max-w-3xl animate-fade-in-up overflow-y-auto rounded-2xl p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id="edit-sale-title" className="text-lg font-semibold">
              Edit sale
            </h3>
            <p className="text-sm text-muted-foreground">
              Update customer, order, and dispatch details.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={entry.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit_order_date">Order date</Label>
              <Input
                id="edit_order_date"
                name="order_date"
                type="date"
                required
                min={minOrderDate ?? undefined}
                max={maxOrderDate}
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="edit_customer_name">Customer name</Label>
              <Input
                id="edit_customer_name"
                name="customer_name"
                required
                maxLength={200}
                defaultValue={entry.customer_name}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_customer_phone">Phone</Label>
              <Input
                id="edit_customer_phone"
                name="customer_phone"
                maxLength={30}
                defaultValue={entry.customer_phone ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_customer_email">Email</Label>
              <Input
                id="edit_customer_email"
                name="customer_email"
                type="email"
                maxLength={200}
                defaultValue={entry.customer_email ?? ""}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="edit_customer_address">Address</Label>
              <textarea
                id="edit_customer_address"
                name="customer_address"
                rows={2}
                maxLength={500}
                defaultValue={entry.customer_address ?? ""}
                className="flex min-h-[4.5rem] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_customer_region">Region</Label>
              <Input
                id="edit_customer_region"
                name="customer_region"
                maxLength={120}
                defaultValue={entry.customer_region ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_item_sold">Item sold</Label>
              <Input
                id="edit_item_sold"
                name="item_sold"
                required
                maxLength={200}
                defaultValue={entry.item_sold}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_quantity">Quantity</Label>
              <Input
                id="edit_quantity"
                name="quantity"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_unit_price">Unit price (INR)</Label>
              <Input
                id="edit_unit_price"
                name="unit_price"
                type="number"
                min="0"
                step="0.01"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_gst_amount">GST amount (INR)</Label>
              <Input
                id="edit_gst_amount"
                name="gst_amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={gstAmount}
                onChange={(e) => setGstAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_total_amount">Total amount (INR)</Label>
              <Input
                id="edit_total_amount"
                name="total_amount"
                type="number"
                min="0"
                step="0.01"
                required
                readOnly
                value={totalAmount}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_order_status">Order status</Label>
              <select
                id="edit_order_status"
                name="order_status"
                required
                defaultValue={entry.order_status}
                className={nativeSelectClassName}
              >
                {SALES_ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {SALES_ORDER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_dispatch_status">Dispatch status</Label>
              <select
                id="edit_dispatch_status"
                name="dispatch_status"
                required
                defaultValue={entry.dispatch_status}
                className={nativeSelectClassName}
              >
                {SALES_DISPATCH_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {SALES_DISPATCH_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              <Pencil className="mr-1 h-4 w-4" />
              {isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            {state.success ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {state.success}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
