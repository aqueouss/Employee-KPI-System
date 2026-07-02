export type BankDetailsInput = {
  bank_account_holder: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
};

export function parseBankDetailsFromForm(
  formData: FormData,
): { data: BankDetailsInput } | { error: string } {
  const bankAccountHolder = String(
    formData.get("bank_account_holder") ?? "",
  ).trim();
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const bankAccountNumber = String(
    formData.get("bank_account_number") ?? "",
  ).trim();
  const bankIfsc = String(formData.get("bank_ifsc") ?? "")
    .trim()
    .toUpperCase();

  if (bankAccountHolder.length > 120) {
    return { error: "Account holder name is too long." };
  }
  if (bankName.length > 120) {
    return { error: "Bank name is too long." };
  }
  if (bankAccountNumber.length > 30) {
    return { error: "Account number is too long." };
  }
  if (bankAccountNumber && !/^\d{6,18}$/.test(bankAccountNumber)) {
    return { error: "Invalid account number." };
  }
  if (bankIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc)) {
    return { error: "Invalid IFSC code." };
  }

  return {
    data: {
      bank_account_holder: bankAccountHolder || null,
      bank_name: bankName || null,
      bank_account_number: bankAccountNumber || null,
      bank_ifsc: bankIfsc || null,
    },
  };
}
