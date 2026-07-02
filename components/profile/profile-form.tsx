"use client";

import { useActionState } from "react";

import {
  updateProfileAction,
  type ProfileActionState,
} from "@/actions/profile.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ProfileActionState = {};

export function ProfileForm({
  fullName,
  bankAccountHolder,
  bankName,
  bankAccountNumber,
  bankIfsc,
}: {
  fullName: string;
  bankAccountHolder: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={fullName}
          required
          minLength={2}
        />
      </div>

      <div className="space-y-3 rounded-md border px-4 py-3">
        <p className="text-sm font-medium">Bank details</p>
        <p className="text-xs text-muted-foreground">
          Used for monthly payroll processing.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bank_account_holder">Account holder name</Label>
            <Input
              id="bank_account_holder"
              name="bank_account_holder"
              maxLength={120}
              defaultValue={bankAccountHolder ?? ""}
              placeholder="Name as per bank account"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank_name">Bank name</Label>
            <Input
              id="bank_name"
              name="bank_name"
              maxLength={120}
              defaultValue={bankName ?? ""}
              placeholder="e.g. HDFC Bank"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank_ifsc">IFSC code</Label>
            <Input
              id="bank_ifsc"
              name="bank_ifsc"
              maxLength={11}
              defaultValue={bankIfsc ?? ""}
              placeholder="e.g. HDFC0001234"
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bank_account_number">Account number</Label>
            <Input
              id="bank_account_number"
              name="bank_account_number"
              maxLength={30}
              defaultValue={bankAccountNumber ?? ""}
              placeholder="e.g. 123456789012"
            />
          </div>
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
