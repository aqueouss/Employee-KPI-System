"use client";

import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateRemainingPayment,
  calculateSalesAmounts,
} from "@/lib/sales/sales-amounts";
import { cn } from "@/lib/utils";

type SalesEntryPricingFieldsProps = {
  idPrefix?: string;
  quantity: string;
  unitPrice: string;
  otherAmount: string;
  isAdvancePayment: boolean;
  advanceReceived: string;
  onQuantityChange: (value: string) => void;
  onUnitPriceChange: (value: string) => void;
  onOtherAmountChange: (value: string) => void;
  onAdvancePaymentChange: (value: boolean) => void;
  onAdvanceReceivedChange: (value: string) => void;
};

export function SalesEntryPricingFields({
  idPrefix = "",
  quantity,
  unitPrice,
  otherAmount,
  isAdvancePayment,
  advanceReceived,
  onQuantityChange,
  onUnitPriceChange,
  onOtherAmountChange,
  onAdvancePaymentChange,
  onAdvanceReceivedChange,
}: SalesEntryPricingFieldsProps) {
  const fieldId = (name: string) => (idPrefix ? `${idPrefix}_${name}` : name);

  const amounts = useMemo(
    () =>
      calculateSalesAmounts({
        quantity: Number(quantity) || 0,
        unitPrice: Number(unitPrice) || 0,
        otherAmount: Number(otherAmount) || 0,
      }),
    [quantity, unitPrice, otherAmount],
  );

  const remainingAmount = useMemo(
    () =>
      calculateRemainingPayment(
        amounts.totalAmount,
        Number(advanceReceived) || 0,
      ),
    [amounts.totalAmount, advanceReceived],
  );

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={fieldId("quantity")}>Quantity</Label>
        <Input
          id={fieldId("quantity")}
          name="quantity"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={fieldId("unit_price")}>Unit price (INR)</Label>
        <Input
          id={fieldId("unit_price")}
          name="unit_price"
          type="number"
          min="0"
          step="0.01"
          required
          value={unitPrice}
          onChange={(e) => onUnitPriceChange(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={fieldId("other_amount")}>
          Other amount (freight / packaging / COD)
        </Label>
        <Input
          id={fieldId("other_amount")}
          name="other_amount"
          type="number"
          min="0"
          step="0.01"
          required
          value={otherAmount}
          onChange={(e) => onOtherAmountChange(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={fieldId("net_amount")}>Net amount (INR)</Label>
        <Input
          id={fieldId("net_amount")}
          name="net_amount"
          type="number"
          min="0"
          step="0.01"
          required
          readOnly
          value={amounts.netAmount}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={fieldId("gst_amount")}>GST @ 18% (INR)</Label>
        <Input
          id={fieldId("gst_amount")}
          name="gst_amount"
          type="number"
          min="0"
          step="0.01"
          required
          readOnly
          value={amounts.gstAmount}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={fieldId("total_amount")}>Total amount (INR)</Label>
        <Input
          id={fieldId("total_amount")}
          name="total_amount"
          type="number"
          min="0"
          step="0.01"
          required
          readOnly
          value={amounts.totalAmount}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Payment type</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "rounded-md border px-3 py-2 text-sm transition-colors",
              !isAdvancePayment
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-transparent text-foreground hover:bg-muted/50",
            )}
            onClick={() => onAdvancePaymentChange(false)}
          >
            Complete payment
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md border px-3 py-2 text-sm transition-colors",
              isAdvancePayment
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-transparent text-foreground hover:bg-muted/50",
            )}
            onClick={() => onAdvancePaymentChange(true)}
          >
            Advance payment
          </button>
        </div>
        <input
          type="hidden"
          name="is_advance_payment"
          value={isAdvancePayment ? "true" : "false"}
        />
      </div>

      {isAdvancePayment ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor={fieldId("advance_received")}>Advance received (INR)</Label>
            <Input
              id={fieldId("advance_received")}
              name="advance_received"
              type="number"
              min="0"
              step="0.01"
              max={amounts.totalAmount}
              required
              value={advanceReceived}
              onChange={(e) => onAdvanceReceivedChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={fieldId("remaining_amount")}>Remaining payment (INR)</Label>
            <Input
              id={fieldId("remaining_amount")}
              name="remaining_amount"
              type="number"
              min="0"
              step="0.01"
              required
              readOnly
              value={remainingAmount}
            />
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="advance_received" value="" />
          <input type="hidden" name="remaining_amount" value="" />
        </>
      )}
    </>
  );
}
