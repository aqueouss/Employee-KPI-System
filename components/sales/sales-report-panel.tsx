"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  deleteSalesEntryAction,
  type SalesActionState,
} from "@/actions/sales.actions";
import { SalesEntryEditDialog } from "@/components/sales/sales-entry-edit-dialog";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

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

function statusBadgeVariant(status: string): "secondary" | "warning" | "success" | "destructive" {
  if (status === "completed" || status === "delivered") return "success";
  if (status === "cancelled") return "destructive";
  if (status === "pending") return "secondary";
  return "warning";
}

function SalesEntryCard({
  entry,
  canEdit,
  canDelete,
  onEdit,
}: {
  entry: SalesEntryRow;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
}) {
  const contact = [entry.customer_phone, entry.customer_email].filter(Boolean).join(" · ");
  const customerTitle = [entry.customer_name, contact, entry.customer_address]
    .filter(Boolean)
    .join("\n");

  return (
    <article className="px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="whitespace-nowrap text-muted-foreground">
              {formatDateLabel(entry.order_date)}
            </span>
            <span className="text-muted-foreground">·</span>
            <span
              className="truncate font-medium"
              title={customerTitle}
            >
              {entry.customer_name}
            </span>
            {entry.customer_region ? (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="truncate text-muted-foreground">
                  {entry.customer_region}
                </span>
              </>
            ) : null}
          </div>
          {contact ? (
            <p className="truncate text-xs text-muted-foreground" title={contact}>
              {contact}
            </p>
          ) : null}
        </div>

        {canEdit || canDelete ? (
          <div className="flex shrink-0 items-center gap-1">
            {canEdit ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onEdit}
                aria-label="Edit sale"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            {canDelete ? <DeleteSaleButton id={entry.id} /> : null}
          </div>
        ) : null}
      </div>

      <p
        className="mt-2 line-clamp-2 text-sm leading-snug"
        title={entry.item_sold}
      >
        {entry.item_sold}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <AmountStat label="Qty" value={String(entry.quantity)} />
        <AmountStat label="Unit price" value={formatSalesCurrency(entry.unit_price)} />
        <AmountStat label="Other" value={formatSalesCurrency(entry.other_amount)} />
        <AmountStat
          label="Net"
          value={formatSalesCurrency(entry.net_amount)}
          emphasis
        />
        <AmountStat label="GST" value={formatSalesCurrency(entry.gst_amount)} />
        <AmountStat
          label="Total"
          value={formatSalesCurrency(entry.total_amount)}
          emphasis
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={entry.is_advance_payment ? "warning" : "secondary"}>
          {entry.is_advance_payment ? "Advance payment" : "Complete payment"}
        </Badge>
        {entry.is_advance_payment ? (
          <span className="text-xs text-muted-foreground">
            Received {formatSalesCurrency(entry.advance_received ?? 0)} · Remaining{" "}
            {formatSalesCurrency(entry.remaining_amount ?? 0)}
          </span>
        ) : null}
        <Badge variant={statusBadgeVariant(entry.order_status)}>
          Order: {formatSalesOrderStatus(entry.order_status)}
        </Badge>
        <Badge variant={statusBadgeVariant(entry.dispatch_status)}>
          Dispatch: {formatSalesDispatchStatus(entry.dispatch_status)}
        </Badge>
      </div>
    </article>
  );
}

function AmountStat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm tabular-nums",
          emphasis && "font-semibold",
        )}
      >
        {value}
      </p>
    </div>
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
  const showActions =
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">Report</p>
          <p className="mt-1 text-lg font-semibold">{summary.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateLabel(summary.startDate)} – {formatDateLabel(summary.endDate)}
          </p>
        </div>
        <div className="rounded-xl border bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">Net sales (incentive base)</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatSalesCurrency(summary.totalNetAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.entryCount} sale{summary.entryCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-xl border bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">Total sales (incl. GST)</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatSalesCurrency(summary.totalAmount)}
          </p>
        </div>
        <div className="rounded-xl border bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">Quantity sold</p>
          <p className="mt-1 text-2xl font-semibold">{summary.totalQuantity}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        {entries.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No sales recorded for this period.
          </p>
        ) : (
          <div className="divide-y">
            {entries.map((entry) => (
              <SalesEntryCard
                key={entry.id}
                entry={entry}
                canEdit={showActions && editableIds.has(entry.id)}
                canDelete={showActions && deletableIds.has(entry.id)}
                onEdit={() => setEditingEntry(entry)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
