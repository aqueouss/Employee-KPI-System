import { requireRole } from "@/lib/auth/require-role";
import { ProfileForm } from "@/components/profile/profile-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ProfilePage() {
  const profile = await requireRole(["admin", "employee"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>Read-only information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{profile.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge
                variant={profile.role === "admin" ? "default" : "secondary"}
              >
                {profile.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={profile.is_active ? "success" : "destructive"}>
                {profile.is_active ? "active" : "inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">{profile.department || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Designation</span>
              <span className="font-medium">
                {profile.job_designation || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Hire date</span>
              <span className="font-medium">{formatDate(profile.hire_date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Member since</span>
              <span className="font-medium">
                {formatDate(profile.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">{profile.bank_name || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account number</span>
              <span className="font-medium">
                {profile.bank_account_number
                  ? `••••${profile.bank_account_number.slice(-4)}`
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>
              Update your name and bank details for payroll
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              fullName={profile.full_name}
              bankAccountHolder={profile.bank_account_holder}
              bankName={profile.bank_name}
              bankAccountNumber={profile.bank_account_number}
              bankIfsc={profile.bank_ifsc}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
