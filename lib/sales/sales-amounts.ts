export const SALES_GST_RATE = 0.18;

export type SalesComputedAmounts = {
  netAmount: number;
  gstAmount: number;
  totalAmount: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateSalesAmounts(input: {
  quantity: number;
  unitPrice: number;
  otherAmount: number;
}): SalesComputedAmounts {
  const netAmount = roundMoney(input.quantity * input.unitPrice);
  const taxableBase = netAmount + input.otherAmount;
  const gstAmount = roundMoney(taxableBase * SALES_GST_RATE);
  const totalAmount = roundMoney(taxableBase + gstAmount);

  return { netAmount, gstAmount, totalAmount };
}

export function calculateRemainingPayment(
  totalAmount: number,
  advanceReceived: number,
): number {
  return roundMoney(Math.max(0, totalAmount - advanceReceived));
}
