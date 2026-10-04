export type TaskPriority = "MUST" | "SHOULD" | "COULD";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface TaskMark {
  priority: TaskPriority;
  status: TaskStatus;
}

export interface CountRate {
  completed: number;
  total: number;
  rate: number | null;
}

export interface DailyFigures {
  overall: CountRate;
  must: CountRate;
}

export interface WeekFigures {
  plannedDays: number;
  weekLength: 7;
  averageRate: number | null;
  must: CountRate;
}

function counts(tasks: readonly TaskMark[]): CountRate {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "COMPLETED").length;
  return { completed, total, rate: total === 0 ? null : completed / total };
}

export function dailyFigures(tasks: readonly TaskMark[]): DailyFigures {
  return {
    overall: counts(tasks),
    must: counts(tasks.filter((task) => task.priority === "MUST")),
  };
}

/** Saved rows, including an empty plan, count as planned. Null is a missing day. The mean uses nonempty rows only. */
export function weeklyFigures(days: readonly (readonly TaskMark[] | null)[]): WeekFigures {
  const saved = days.filter((tasks): tasks is readonly TaskMark[] => tasks !== null);
  const nonempty = saved.filter((tasks) => tasks.length > 0);
  const rates = nonempty.map((tasks) => counts(tasks).rate).filter((rate): rate is number => rate !== null);
  const must = saved.flatMap((tasks) => tasks.filter((task) => task.priority === "MUST"));
  return {
    plannedDays: saved.length,
    weekLength: 7,
    averageRate: rates.length === 0 ? null : rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
    must: counts(must),
  };
}
