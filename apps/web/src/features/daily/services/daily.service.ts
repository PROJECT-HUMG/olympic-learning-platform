import { apiClient } from "@/lib/axios";
import { parsePlatformDate } from "../lib/platform-calendar";
import type { AddDailyTaskBody } from "../lib/plan-editor";
import {
  DAILY_CONTRACT,
  alignedDailyPlan,
  alignedDailyWeek,
  isMissingDailyPlan,
  readDailyPlan,
  readDailyWeek,
  requireDailyAccountDate,
  requireDailyAccount,
  requireDailySubmitTarget,
  requireDailyWeekRequest,
  type SaveDailyPlanBody,
  type SaveDailyWeekBody,
} from "../lib/daily-contract";

function planFromResponse(data: unknown, accountId: string, date: string) {
  const read = readDailyPlan(data);
  const plan = read ? alignedDailyPlan(read, accountId, date) : null;
  if (!plan) throw new Error(DAILY_CONTRACT);
  return plan;
}

function weekFromResponse(data: unknown, weekStart: string) {
  const read = readDailyWeek(data);
  const week = read ? alignedDailyWeek(read, weekStart) : null;
  if (!week) throw new Error(DAILY_CONTRACT);
  return week;
}

export const dailyService = {
  async addTask(accountId: string, date: string, body: AddDailyTaskBody) {
    requireDailyAccountDate(accountId, date);
    const response = await apiClient.post("/daily/plans/tasks", body, { params: { date } });
    const plan = planFromResponse(response.data, accountId, date);
    if (!plan.tasks.some(task => task.id === body.taskId && task.title === body.title && task.priority === body.priority && task.status === body.status)) throw new Error(DAILY_CONTRACT);
    return plan;
  },
  async getPlan(accountId: string, date: string) {
    requireDailyAccountDate(accountId, date);
    try {
      const response = await apiClient.get("/daily/plans", { params: { date } });
      return planFromResponse(response.data, accountId, date);
    } catch (error) {
      if (error instanceof Error && error.message === DAILY_CONTRACT) throw error;
      if (isMissingDailyPlan(error)) return null;
      throw error;
    }
  },

  async savePlan(accountId: string, date: string, body: SaveDailyPlanBody) {
    requireDailyAccountDate(accountId, date);
    const response = await apiClient.put("/daily/plans", body, { params: { date } });
    return planFromResponse(response.data, accountId, date);
  },

  async submitPlan(accountId: string, date: string, planId: string) {
    requireDailySubmitTarget(accountId, date, planId);
    const response = await apiClient.post(`/daily/plans/${planId}/submit`);
    return planFromResponse(response.data, accountId, date);
  },

  async getWeek(accountId: string, weekStart: string) {
    requireDailyWeekRequest(accountId, weekStart);
    const response = await apiClient.get("/daily/weeks", { params: { weekStart } });
    return weekFromResponse(response.data, weekStart);
  },

  async saveWeek(accountId: string, weekStart: string, body: SaveDailyWeekBody) {
    requireDailyWeekRequest(accountId, weekStart);
    const response = await apiClient.put("/daily/weeks", body, { params: { weekStart } });
    return weekFromResponse(response.data, weekStart);
  },

  async getPlanDates(accountId: string, signal?: AbortSignal) {
    requireDailyAccount(accountId);
    const response = await apiClient.get<unknown>("/daily/plans/dates", { signal });
    if (!Array.isArray(response.data) || !response.data.every(date => typeof date === "string" && parsePlatformDate(date))) throw new Error(DAILY_CONTRACT);
    return response.data as string[];
  },
};
