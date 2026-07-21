"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import {
  createSalesEntryAction,
  type SalesActionState,
} from "@/actions/sales.actions";
import { SalesEntryPricingFields } from "@/components/sales/sales-entry-pricing-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SALES_DISPATCH_STATUS_LABELS,
  SALES_DISPATCH_STATUSES,
  SALES_ORDER_STATUS_LABELS,
  SALES_ORDER_STATUSES,
} from "@/lib/sales/sales-status";
import { nativeSelectClassName } from "@/lib/ui/native-select";

const initialState: SalesActionState = {};

export function SalesEntryForm({
  today,
  minOrderDate,
  maxOrderDate,
}: {
  today: string;
  minOrderDate?: string | null;
  maxOrderDate: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createSalesEntryAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("0");
  const [otherAmount, setOtherAmount] = useState("0");
  const [isAdvancePayment, setIsAdvancePayment] = useState(false);
  const [advanceReceived, setAdvanceReceived] = useState("0");
  const [orderDate, setOrderDate] = useState(today);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setQuantity("1");
      setUnitPrice("0");
      setOtherAmount("0");
      setIsAdvancePayment(false);
      setAdvanceReceived("0");
      setOrderDate(today);
    }
  }, [state.success, today]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
        Net amount is qty × unit price. Total includes other charges plus 18% GST
        on (net + other). You can backfill previous months; order date cannot be
        in a future month.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="order_date">Order date</Label>
          <Input
            id="order_date"
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

        <SalesEntryPricingFields
          quantity={quantity}
          unitPrice={unitPrice}
          otherAmount={otherAmount}
          isAdvancePayment={isAdvancePayment}
          advanceReceived={advanceReceived}
          onQuantityChange={setQuantity}
          onUnitPriceChange={setUnitPrice}
          onOtherAmountChange={setOtherAmount}
          onAdvancePaymentChange={setIsAdvancePayment}
          onAdvanceReceivedChange={setAdvanceReceived}
        />

        <div className="space-y-1.5">
          <Label htmlFor="order_status">Order status</Label>
          <select
            id="order_status"
            name="order_status"
            required
            defaultValue="pending"
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
          <Label htmlFor="dispatch_status">Dispatch status</Label>
          <select
            id="dispatch_status"
            name="dispatch_status"
            required
            defaultValue="pending"
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
