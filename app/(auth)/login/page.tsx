import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { AppLogo } from "@/components/layout/app-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="glass-panel hover-lift overflow-hidden rounded-2xl">
      <div className="theme-accent-bar" />
      <Card className="border-0 bg-transparent shadow-none hover:shadow-none">
        <CardHeader className="space-y-3">
          <AppLogo href={null} showText={false} className="justify-center" />
          <CardTitle className="gradient-text text-center text-2xl font-semibold">
            KPI System
          </CardTitle>
        <CardDescription>
          Sign in to manage tasks, KPIs, and performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Internal use only. Contact your administrator for access.
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link href="/api/health" className="underline underline-offset-4">
            System health
          </Link>
        </p>
      </CardContent>
      </Card>
    </div>
  );
}
