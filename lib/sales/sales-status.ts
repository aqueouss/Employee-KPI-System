export const SALES_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const SALES_DISPATCH_STATUSES = [
  "pending",
  "packed",
  "dispatched",
  "delivered",
  "cancelled",
] as const;

export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number];
export type SalesDispatchStatus = (typeof SALES_DISPATCH_STATUSES)[number];

export const SALES_ORDER_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const SALES_DISPATCH_STATUS_LABELS: Record<SalesDispatchStatus, string> = {
  pending: "Pending",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function formatSalesOrderStatus(status: string): string {
  return (
    SALES_ORDER_STATUS_LABELS[status as SalesOrderStatus] ??
    status.replaceAll("_", " ")
  );
}

export function formatSalesDispatchStatus(status: string): string {
  return (
    SALES_DISPATCH_STATUS_LABELS[status as SalesDispatchStatus] ??
    status.replaceAll("_", " ")
  );
}
