"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  deleteSalesEntryAction,
  type SalesActionState,
} from "@/actions/sales.actions";
import { SalesEntryEditDialog } from "@/components/sales/sales-entry-edit-dialog";
import { Button } from "@/components/ui/button";
import {
  formatSalesCurrency,
  type SalesEntryRow,
  type SalesReportSummary,
} from "@/lib/sales/sales-report";
import {
  formatSalesDispatchStatus,
  formatSalesOrderStatus,
} from "@/lib/sales/sales-status";
import { formatDateLabel } from "@/lib/utils/dates";

const initialState: SalesActionState = {};

function DeleteSaleButton({ id }: { id: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteSalesEntryAction,
    initialState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-destructive"
        disabled={isPending}
        aria-label="Delete sale"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {state.error ? (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

export function SalesReportPanel({
  summary,
  entries,
  editableEntryIds,
  deletableEntryIds,
  minOrderDate,
  maxOrderDate,
}: {
  summary: SalesReportSummary;
  entries: SalesEntryRow[];
  editableEntryIds?: string[];
  deletableEntryIds?: string[];
  minOrderDate?: string | null;
  maxOrderDate?: string;
}) {
  const [editingEntry, setEditingEntry] = useState<SalesEntryRow | null>(null);
  const editableIds = new Set(editableEntryIds ?? []);
  const deletableIds = new Set(deletableEntryIds ?? []);
  const showActionsColumn =
    editableEntryIds !== undefined || deletableEntryIds !== undefined;

  return (
    <div className="space-y-6">
      <SalesEntryEditDialog
        entry={editingEntry}
        open={editingEntry !== null}
        onClose={() => setEditingEntry(null)}
        minOrderDate={minOrderDate}
        maxOrderDate={maxOrderDate ?? ""}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">Report</p>
          <p className="mt-1 text-lg font-semibold">{summary.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateLabel(summary.startDate)} – {formatDateLabel(summary.endDate)}
          </p>
        </div>
        <div className="rounded-xl border bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">Total sales</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatSalesCurrency(summary.totalAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.entryCount} sale{summary.entryCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-xl border bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">Quantity sold</p>
          <p className="mt-1 text-2xl font-semibold">{summary.totalQuantity}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">GST</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Dispatch</th>
              {showActionsColumn ? <th className="px-4 py-3">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={showActionsColumn ? 11 : 10}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No sales recorded for this period.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="align-top">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDateLabel(entry.order_date)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{entry.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[entry.customer_phone, entry.customer_email]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                    {entry.customer_address ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.customer_address}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{entry.customer_region || "—"}</td>
                  <td className="px-4 py-3">{entry.item_sold}</td>
                  <td className="px-4 py-3 text-right">{entry.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    {formatSalesCurrency(entry.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatSalesCurrency(entry.gst_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatSalesCurrency(entry.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    {formatSalesOrderStatus(entry.order_status)}
                  </td>
                  <td className="px-4 py-3">
                    {formatSalesDispatchStatus(entry.dispatch_status)}
                  </td>
                  {showActionsColumn ? (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {editableIds.has(entry.id) ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditingEntry(entry)}
                            aria-label="Edit sale"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {deletableIds.has(entry.id) ? (
                          <DeleteSaleButton id={entry.id} />
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
