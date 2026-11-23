export type ResourceType =
  | "doc"
  | "cours"
  | "livre"
  | "video"
  | "pratique"
  | "outil"
  | "ref"
  | "tuto";

export type Resource = {
  title: string;
  url: string;
  type: ResourceType;
  note?: string;
  free?: boolean;
};

export type ExerciseKind = "code" | "design" | "debug" | "ops" | "write" | "quiz";

export type Exercise = {
  id: string;
  title: string;
  brief: string;
  kind: ExerciseKind;
  level: 1 | 2 | 3;
  time: string;
  deliverable: string;
  hints?: string[];
};

export type Module = {
  id: string;
  title: string;
  week: string;
  summary: string;
  objectives: string[];
  resources: Resource[];
  exercises: Exercise[];
};

export type Domain = {
  slug: string;
  n: string;
  title: string;
  short: string;
  phase: string;
  weeks: string;
  color: DomainColor;
  tagline: string;
  why: string;
  outcomes: string[];
  modules: Module[];
  project: {
    title: string;
    brief: string;
    steps: string[];
    proof: string;
  };
  mastery: string[];
};

export type DomainColor = "blue" | "green" | "orange" | "purple" | "cyan" | "pink";

export type Phase = {
  id: string;
  name: string;
  weeks: string;
  span: string;
  color: DomainColor;
  goal: string;
  domains: string[];
  deliverable: string;
};

export type Week = {
  n: number;
  phaseId: string;
  theme: string;
  focus: string;
  practice: string;
  checkpoint: string;
};

export type Milestone = {
  at: string;
  title: string;
  proof: string;
};

export type ProjectSpec = {
  id: string;
  name: string;
  pitch: string;
  phase: string;
  stack: string[];
  steps: { title: string; detail: string }[];
  done: string[];
};

export type ResourceItem = Resource & { domain: string; domainSlug: string; module: string };

export type ExerciseItem = Exercise & {
  domain: string;
  domainSlug: string;
  module: string;
  moduleId: string;
};

export type SystemCategory =
  | "compute"
  | "data"
  | "realtime"
  | "platform"
  | "storage"
  | "ai";

export type SystemProject = {
  slug: string;
  title: string;
  category: SystemCategory;
  level: 1 | 2 | 3;
  pitch: string;
  hard: string;
  stack: string[];
  steps: string[];
  done: string[];
  scale: string;
  domains: string[];
};

export type BlueprintNode = {
  name: string;
  note: string;
  domains?: string[];
  systems?: string[];
};

export type BlueprintSection = {
  key: string;
  title: string;
  blurb: string;
  nodes: BlueprintNode[];
};

export type PlanStep = {
  title: string;
  how: string;
  check: string;
};

export type DayTask = {
  day: string;
  title: string;
  detail: string;
  time: string;
};

export type WeekPlan = {
  n: number;
  theme: string;
  phaseId: string;
  goals: string[];
  days: DayTask[];
  resources: Resource[];
  exercises: string[];
  systems?: string[];
  deliverable: string;
  checkpoint: string;
  blocker: string;
};

export type SystemPlan = {
  scope: string[];
  model: string[];
  api: string[];
  todos: PlanStep[];
  pitfalls: string[];
  tests: string[];
  deliverable: string;
};
