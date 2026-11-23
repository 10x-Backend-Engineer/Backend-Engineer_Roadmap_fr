import type { SystemPlan } from "@/lib/types";
import { computePlans } from "./compute";
import { dataPlans } from "./data";
import { realtimePlans } from "./realtime";
import { platformPlans } from "./platform";
import { storagePlans } from "./storage";
import { aiPlans } from "./ai";

export const plans: Record<string, SystemPlan> = {
  ...computePlans,
  ...dataPlans,
  ...realtimePlans,
  ...platformPlans,
  ...storagePlans,
  ...aiPlans,
};

export const planFor = (slug: string): SystemPlan | undefined => plans[slug];
