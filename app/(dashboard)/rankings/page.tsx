import { Trophy, Medal, Crown } from "lucide-react";

import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { isKpiTracked } from "@/lib/auth/kpi-tracked";
import { createClient } from "@/lib/supabase/server";
import {
  getTodayDateString,
  startOfWeekDateString,
  startOfMonthDateString,
} from "@/lib/utils/dates";
import { getRankingCaption } from "@/lib/captions/funny-captions";
import { FunnyCaption } from "@/components/ui/funny-caption";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RankingRow = {
  employee_id: string;
  full_name: string;
  avg_completion: number;
  green_days: number;
  days_tracked: number;
};

function topPerformer(rows: RankingRow[]): RankingRow | null {
  const ranked = rows.filter((r) => r.days_tracked > 0);
  return ranked.length > 0 ? ranked[0] : null;
}

export default async function RankingsPage() {
  const profile = await requireRole(["admin", "employee"]);
  if (profile.role === "employee" && !isKpiTracked(profile)) {
    redirect("/employee/attendance");
  }
  const supabase = await createClient();

  const today = getTodayDateString();
  const weekStart = startOfWeekDateString(today);
  const monthStart = startOfMonthDateString(today);

  const [{ data: weekData }, { data: monthData }] = await Promise.all([
    supabase.rpc("get_employee_rankings", {
      p_start: weekStart,
      p_end: today,
    }),
    supabase.rpc("get_employee_rankings", {
      p_start: monthStart,
      p_end: today,
    }),
  ]);

  const week = (weekData ?? []) as RankingRow[];
  const month = (monthData ?? []) as RankingRow[];

  const weekTop = topPerformer(week);
  const monthTop = topPerformer(month);

  const weekById = new Map(week.map((r) => [r.employee_id, r]));

  const rankingCaption = getRankingCaption(month, profile.id, profile.full_name);

  const rankIcon = (i: number) => {
    if (i === 0) return <Crown className="h-4 w-4 text-amber-500" />;
    if (i === 1) return <Medal className="h-4 w-4 text-slate-400" />;
    if (i === 2) return <Medal className="h-4 w-4 text-amber-700" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
        <p className="text-muted-foreground">
          Employee performance leaderboard based on average daily KPI completion.
        </p>
      </div>

      <FunnyCaption>{rankingCaption}</FunnyCaption>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              This week&apos;s top performer
            </CardDescription>
            <CardTitle className="text-xl">
              {weekTop ? weekTop.full_name : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {weekTop
              ? `${weekTop.avg_completion}% avg · ${weekTop.green_days} green day${weekTop.green_days === 1 ? "" : "s"}`
              : "No data this week yet."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              This month&apos;s top performer
            </CardDescription>
            <CardTitle className="text-xl">
              {monthTop ? monthTop.full_name : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {monthTop
              ? `${monthTop.avg_completion}% avg · ${monthTop.green_days} green day${monthTop.green_days === 1 ? "" : "s"}`
              : "No data this month yet."}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full ranking</CardTitle>
          <CardDescription>
            Ranked by this month&apos;s average completion (since {monthStart}).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {month.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No active employees to rank.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Week avg</TableHead>
                  <TableHead className="text-right">Month avg</TableHead>
                  <TableHead className="text-right">Green days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {month.map((row, i) => {
                  const isMe = row.employee_id === profile.id;
                  const weekRow = weekById.get(row.employee_id);
                  return (
                    <TableRow
                      key={row.employee_id}
                      className={isMe ? "bg-accent/40" : undefined}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {rankIcon(i)}
                          <span className="font-medium">{i + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.full_name}
                        {isMe ? (
                          <Badge variant="secondary" className="ml-2">
                            You
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {weekRow && weekRow.days_tracked > 0
                          ? `${weekRow.avg_completion}%`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.days_tracked > 0 ? `${row.avg_completion}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {row.green_days}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
