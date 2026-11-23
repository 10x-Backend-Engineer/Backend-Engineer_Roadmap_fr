import type { WeekPlan } from "@/lib/types";
import { weeksP1 } from "./weeks-1-8";
import { weeksP2 } from "./weeks-9-16";
import { weeksP3 } from "./weeks-17-24";

export const weekly: WeekPlan[] = [...weeksP1, ...weeksP2, ...weeksP3];

export const weekPlan = (n: number) => weekly.find((w) => w.n === n);

export const weekCount = weekly.length;

export const weeklyStats = {
  weeks: weekly.length,
  days: weekly.reduce((a, w) => a + w.days.length, 0),
  resources: weekly.reduce((a, w) => a + w.resources.length, 0),
};
