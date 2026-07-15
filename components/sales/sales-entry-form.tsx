"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";

import {
  createSalesEntryAction,
  type SalesActionState,
} from "@/actions/sales.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SalesActionState = {};

export function SalesEntryForm({
  today,
  monthLabel,
}: {
  today: string;
  monthLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createSalesEntryAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");

  const totalAmount = useMemo(() => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    return Math.round(qty * price * 100) / 100;
  }, [quantity, unitPrice]);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setQuantity("1");
      setUnitPrice("0");
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="sale_date" value={today} />

      <div className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
        Logging sales for <span className="font-medium text-foreground">{monthLabel}</span>.
        Entries count toward this month&apos;s report.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="customer_name">Customer name</Label>
          <Input id="customer_name" name="customer_name" required maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customer_phone">Phone</Label>
          <Input id="customer_phone" name="customer_phone" maxLength={30} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customer_email">Email</Label>
          <Input id="customer_email" name="customer_email" type="email" maxLength={200} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="customer_address">Address</Label>
          <textarea
            id="customer_address"
            name="customer_address"
            rows={2}
            maxLength={500}
            className="flex min-h-[4.5rem] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customer_region">Region</Label>
          <Input id="customer_region" name="customer_region" maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="item_sold">Item sold</Label>
          <Input id="item_sold" name="item_sold" required maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
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
          <Label htmlFor="unit_price">Unit price (INR)</Label>
          <Input
            id="unit_price"
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
          <Label htmlFor="total_amount">Total amount (INR)</Label>
          <Input
            id="total_amount"
            name="total_amount"
            type="number"
            min="0"
            step="0.01"
            required
            readOnly
            value={totalAmount}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="remarks">Remarks</Label>
          <textarea
            id="remarks"
            name="remarks"
            rows={3}
            maxLength={1000}
            className="flex min-h-[4.5rem] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          <Plus className="mr-1 h-4 w-4" />
          {isPending ? "Saving..." : "Add sale"}
        </Button>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>
        ) : null}
      </div>
    </form>
  );
}
