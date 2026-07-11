import type { AttendanceStatus, ShortLeaveType } from "@/types/domain";

type RankingEntry = {
  employee_id: string;
  full_name: string;
  avg_completion: number;
  days_tracked: number;
};

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function formatGapPct(value: number): string {
  const n = Math.round(Math.max(0, value) * 100) / 100;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function pickFromPool(pool: string[], seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) | 0;
  }
  return pool[Math.abs(hash) % pool.length]!;
}

export function getAttendanceMarkCaption(input: {
  status: AttendanceStatus;
  employeeName: string;
  shortLeaveType?: ShortLeaveType | null;
  seed: string;
}): string {
  const name = firstName(input.employeeName);
  const shortLeaveHint =
    input.shortLeaveType === "early_departure"
      ? "Head out at 4:30 PM"
      : input.shortLeaveType === "late_arrival"
        ? "Arrive by 11:30 AM"
        : null;

  switch (input.status) {
    case "present":
      return pickFromPool(
        [
          `Good morning ${name}! Hope you have a great day today — stay motivated and complete your work. The KPI board is watching (in a friendly way).`,
          `Hey ${name}, you're in! Have an awesome day, keep the momentum rolling, and turn today's tasks green.`,
          `Morning ${name}! Present and accounted for. Coffee in hand, tasks in mind — let's make today count.`,
        ],
        input.seed,
      );
    case "late":
      return pickFromPool(
        [
          `Good morning ${name} — fashionably late, but you're here! Shake off the delay and make the rest of today count.`,
          `Late arrival logged, ${name}. Traffic happens; productivity still counts. Dive in and catch up like a legend.`,
          `Hey ${name}, the snooze button won round one. You win the day by finishing strong — go get those tasks done.`,
        ],
        input.seed,
      );
    case "half_day":
      return pickFromPool(
        [
          `Half day mode activated, ${name}. Short shift, tall goals — make every hour before you log off actually matter.`,
          `Hey ${name}, you're on a half day. Work smart, not forever — finish the important stuff and enjoy the rest.`,
          `Good morning ${name}! Half day on the books. Compact schedule, maximum impact — you've got this.`,
        ],
        input.seed,
      );
    case "late_half_day":
      return pickFromPool(
        [
          `Late AND half day, ${name}? Bold combo. Limited time, unlimited hustle — make the hours you have look expensive.`,
          `Hey ${name}, late start plus half day — the clock is spicy today. Prioritize hard and leave no loose ends.`,
          `Good morning ${name}! You're on a late half day. Arrive, focus, execute — then bounce with your head held high.`,
        ],
        input.seed,
      );
    case "short_leave":
      return pickFromPool(
        [
          shortLeaveHint
            ? `Short leave day, ${name} — ${shortLeaveHint}. Use the window wisely and still crush what matters.`
            : `Short leave day, ${name}. A little flexibility, a lot of focus — make the working hours count.`,
          `Hey ${name}, short leave logged. Flex the schedule, not the standards — stay sharp on your tasks.`,
          `Good morning ${name}! Short leave today. Work the hours you have like they owe you money.`,
        ],
        input.seed,
      );
    case "late_short_leave":
      return pickFromPool(
        [
          shortLeaveHint
            ? `Late plus short leave, ${name} — ${shortLeaveHint}. Tight window, big energy. Go make it productive.`
            : `Late plus short leave, ${name}. The day is short and sassy — prioritize like a pro.`,
          `Hey ${name}, late and on short leave. Not much clock left — make every minute look intentional.`,
          `Good morning ${name}! Late short leave day. Show up, lock in, and finish what you can with style.`,
        ],
        input.seed,
      );
    case "paid_leave":
      return pickFromPool(
        [
          `Paid leave today, ${name}. Enjoy the break — recharge hard so tomorrow you come back sharper than Wi-Fi.`,
          `Hey ${name}, you're on paid leave. Rest up, ignore the guilt, and return ready to dominate the leaderboard.`,
          `Good vibes only, ${name} — paid leave activated. Take the day, reset your brain, tasks can wait.`,
        ],
        input.seed,
      );
    case "absent":
      return pickFromPool(
        [
          `Absent today, ${name}. Hope everything's okay — rest if you need to, and we'll see you when you're back.`,
          `Hey ${name}, you're marked absent today. Take care of what you need to — we'll pick up the tasks when you return.`,
          `No worries, ${name} — absent logged. Handle your day, recover well, and come back swinging.`,
        ],
        input.seed,
      );
    case "sunday_leave":
      return pickFromPool(
        [
          `Sunday leave, ${name}. Weekend recovery is valid — enjoy the calm before Monday's chaos.`,
          `Hey ${name}, Sunday leave on the books. Rest mode: ON. Monday can wait its turn.`,
          `Good Sunday, ${name}! Take the leave, ignore the inbox, and recharge like a pro.`,
        ],
        input.seed,
      );
    default:
      return pickFromPool(
        [
          `Good morning ${name}! Attendance is marked — hope you have a great day and keep smashing your goals.`,
          `Hey ${name}, you're on the board for today. Stay motivated and get that work done.`,
        ],
        input.seed,
      );
  }
}

export function getFixedDailyTasksAddedCaption(seed: string): string {
  return pickFromPool(
    [
      "Your daily fixed tasks are added — check them and don't miss these. Finish them before you head to the gym.",
      "Heads up: your fixed daily tasks just landed. Review the list and knock them out before life's distractions win.",
      "Daily fixed tasks are in your queue. Check them now and complete them before you disappear into lunch or the gym.",
      "Your fixed tasks for today are ready. Don't skip them — get them done before you log off or hit the treadmill.",
    ],
    `${seed}-fixed-tasks`,
  );
}

export function getRankingCaption(
  rankings: RankingEntry[],
  userId: string,
  userName: string,
): string {
  const tracked = rankings.filter((r) => r.days_tracked > 0);
  if (tracked.length === 0) {
    return "The leaderboard is warming up. Be the first to put numbers on the board this month.";
  }

  const myIndex = tracked.findIndex((r) => r.employee_id === userId);
  if (myIndex === -1) {
    return `${firstName(tracked[0]!.full_name)} is leading the pack. Log some green days and join the race.`;
  }

  const rank = myIndex + 1;
  const leader = tracked[0]!;
  const me = tracked[myIndex]!;
  const chaser = tracked[myIndex + 1];
  const myFirst = firstName(userName);

  if (rank === 1) {
    if (chaser) {
      const gap = Math.max(0, me.avg_completion - chaser.avg_completion);
      return `Yaay ${myFirst}, you're winning — top contender! But don't slack; ${firstName(chaser.full_name)} is just ${formatGapPct(gap)}% behind. Don't let them win the race.`;
    }
    return `Yaay ${myFirst}, you're #1 with nobody close behind. Enjoy the crown — just don't nap on it.`;
  }

  if (rank <= 3) {
    const gap = Math.max(0, leader.avg_completion - me.avg_completion);
    return `Buckle up ${myFirst} — ${firstName(leader.full_name)} is winning the race, but you're still in the top 3. Only ${formatGapPct(gap)}% to catch. You can still be a top contender.`;
  }

  if (rank <= 5) {
    const gap = Math.max(0, leader.avg_completion - me.avg_completion);
    return `Buckle up ${myFirst} — ${firstName(leader.full_name)} is out front, but you're in the top 5. ${formatGapPct(gap)}% separates you from #1. The podium is still reachable.`;
  }

  const ahead = tracked[myIndex - 1];
  if (ahead) {
    const gapToNext = Math.max(0, ahead.avg_completion - me.avg_completion);
    return `${firstName(leader.full_name)} is cruising at #1. You're #${rank} — ${formatGapPct(gapToNext)}% behind ${firstName(ahead.full_name)}. Time to shift gears and climb.`;
  }

  return `You're #${rank} on the board. Every approved task is a step up the leaderboard.`;
}

export function getEmployeeDashboardCaption(input: {
  todayCompletionPct: number;
  rankingCaption?: string;
  seed: string;
}): string {
  if (input.rankingCaption) return input.rankingCaption;

  if (input.todayCompletionPct >= 100) {
    return pickFromPool(
      [
        "100% today? The leaderboard felt that. Keep this energy rolling.",
        "You cleared today's board. Admin approval pending — but you're flying.",
      ],
      input.seed,
    );
  }

  if (input.todayCompletionPct === 0) {
    return pickFromPool(
      [
        "Zero tasks done yet? The race doesn't wait — tick one off and get moving.",
        "Your KPI flag is shy today. Give it something to report.",
      ],
      input.seed,
    );
  }

  return pickFromPool(
    [
      "Small wins stack up. Finish strong today and the rankings will notice.",
      "You're in the game — push a few more tasks over the line before EOD.",
    ],
    input.seed,
  );
}

export function getAdminDashboardCaption(input: {
  approvals: number;
  reminders: number;
  warnings: number;
  rewards: number;
  reviews: number;
  seed: string;
}): string {
  const parts: string[] = [];

  if (input.approvals >= 8) {
    parts.push(
      `Buckle up — ${input.approvals} approvals are pending. The team is literally waiting for your click.`,
    );
  } else if (input.approvals >= 3) {
    parts.push(
      `${input.approvals} approvals queued up. Grab coffee, open Approvals, be the hero.`,
    );
  } else if (input.approvals > 0) {
    parts.push(
      `${input.approvals} task${input.approvals === 1 ? "" : "s"} need your stamp. Quick review, big morale boost.`,
    );
  }

  if (input.reminders >= 5) {
    parts.push(
      `Drink some coffee and resolve ${input.reminders} reminders/blockers — they're multiplying like unchecked emails.`,
    );
  } else if (input.reminders > 0) {
    parts.push(
      `${input.reminders} open reminder${input.reminders === 1 ? "" : "s"} waiting. Unblock someone today.`,
    );
  }

  if (input.reviews > 0) {
    parts.push(
      `${input.reviews} termination review${input.reviews === 1 ? "" : "s"} open — handle with care (and documentation).`,
    );
  }

  if (input.rewards > 0) {
    parts.push(
      `${input.rewards} reward${input.rewards === 1 ? "" : "s"} ready to celebrate. Spread some good news.`,
    );
  }

  if (input.warnings > 0 && parts.length < 2) {
    parts.push(
      `${input.warnings} active warning${input.warnings === 1 ? "" : "s"} on file — keep an eye on trends.`,
    );
  }

  if (parts.length > 0) {
    return parts.slice(0, 2).join(" ");
  }

  return pickFromPool(
    [
      "Inbox zero energy. No pending approvals or blockers — enjoy the calm, or audit yesterday's KPIs.",
      "All quiet on the admin front. Perfect time to check department performance or touch grass.",
      "Nothing screaming for attention. Maybe prep next month's attendance allowances?",
    ],
    input.seed,
  );
}

export function getAttendanceCaption(input: {
  date: string;
  paidLeaveRemaining: number;
  paidLeaveUsed: number;
  lateUsed: number;
  seed: string;
}): string {
  const day = new Date(`${input.date}T12:00:00`).getDay();

  if (day === 1) {
    return pickFromPool(
      [
        "I know it's Monday, but motivation should equal rewards. Show up, mark attendance, let the week know you mean business.",
        "Monday again? Your salary doesn't take weekends off — neither should your attendance discipline.",
        "Fresh week, fresh leave balance. Don't spend it all before Wednesday.",
      ],
      input.seed,
    );
  }

  if (day === 5) {
    return pickFromPool(
      [
        "Friday vibes are real, but attendance still impacts your salary. Don't ghost the clock on the way out.",
        "Almost weekend — finish strong. Future-you will thank present-you for not burning leave casually.",
      ],
      input.seed,
    );
  }

  if (day === 0 || day === 6) {
    return pickFromPool(
      [
        "Too much hangover on weekends? We get it — but don't take attendance lightly; it directly impacts your salary.",
        "Weekend mode: ON. Recovery is valid. Just remember Monday's attendance still counts toward payroll.",
        "Saturday/Sunday scroll time is fine. Just don't let leave slip through your fingers next week.",
      ],
      input.seed,
    );
  }

  if (input.paidLeaveRemaining <= 1 && input.paidLeaveUsed > 0) {
    return pickFromPool(
      [
        "Paid leave is running low — spend it wisely or earn overtime credits instead of surprise deductions.",
        "Your leave jar is almost empty. Plan ahead before HR becomes your calendar.",
      ],
      input.seed,
    );
  }

  if (input.lateUsed >= 3) {
    return pickFromPool(
      [
        `${input.lateUsed} lates this month — the snooze button is not your friend. Salary math remembers.`,
        "Multiple lates logged. Traffic isn't a payroll strategy — buffer your mornings.",
      ],
      input.seed,
    );
  }

  return pickFromPool(
    [
      "Attendance is the quiet MVP of your payslip. Mark it right, get paid right.",
      "Every present day is a vote for full salary. Absent days vote otherwise.",
      "Leave balance looking healthy — use it when you need it, not when you forget to set an alarm.",
      "Your calendar is your contract with payroll. Keep it honest.",
    ],
    input.seed,
  );
}

export function getAdminAttendanceCaption(seed: string): string {
  return pickFromPool(
    [
      "Someone's probably planning a long weekend — check calendars before payroll surprises you.",
      "Attendance today, salary tomorrow. Mark it before employees start asking questions.",
      "If it's Monday, assume at least one person is still on weekend time zone.",
      "Half days add up faster than you'd think. Keep the grid updated.",
    ],
    seed,
  );
}

export function getKpiCaption(input: {
  livePct: number;
  greenDaysLast7: number;
  seed: string;
}): string {
  if (input.livePct >= 90) {
    return pickFromPool(
      [
        "Green zone today — rankings are watching. Stay there.",
        "Strong KPI day. Admin approval is the final boss — submit early.",
      ],
      input.seed,
    );
  }

  if (input.greenDaysLast7 >= 5) {
    return pickFromPool(
      [
        `${input.greenDaysLast7} green days in the last week. You're building a streak worth bragging about.`,
        "Green streak detected. Rewards committee might be taking notes.",
      ],
      input.seed,
    );
  }

  if (input.livePct < 50 && input.livePct > 0) {
    return pickFromPool(
      [
        "Yellow/red territory today. A few approved tasks could flip the whole flag.",
        "KPI looking spicy — in the wrong way. Rescue the day before cron does.",
      ],
      input.seed,
    );
  }

  return pickFromPool(
    [
      "KPI flags don't lie — but they also don't try. You do.",
      "Completion % is a mood. Make yours green before end of day.",
    ],
    input.seed,
  );
}
