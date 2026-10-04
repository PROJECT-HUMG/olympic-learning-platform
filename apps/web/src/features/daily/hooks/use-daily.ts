import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { dailyPlanKey, dailyWeekAccountKey, dailyWeekKey, type SaveDailyPlanBody, type SaveDailyWeekBody } from "../lib/daily-contract";
import { dailyService } from "../services/daily.service";

export function useDailyAccount() {
  const query = useCurrentUser();
  const user = query.data ?? null;
  const userId = user?.status === "ACTIVE" ? user.id : null;
  return { user, userId, pending: query.isPending, error: query.isError, refetch: () => query.refetch() };
}

export function useDailyPlan(userId: string | null, date: string | null) {
  return useQuery({
    queryKey: dailyPlanKey(userId ?? "", date ?? ""),
    queryFn: () => dailyService.getPlan(userId ?? "", date ?? ""),
    enabled: Boolean(userId && date),
  });
}

export function useSaveDailyPlan(userId: string, date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveDailyPlanBody) => dailyService.savePlan(userId, date, body),
    onSuccess: (plan) => {
      client.setQueryData(dailyPlanKey(userId, plan.planDate), plan);
      void client.invalidateQueries({ queryKey: dailyWeekAccountKey(userId) });
    },
  });
}

export function useSubmitDailyPlan(userId: string, date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => dailyService.submitPlan(userId, date, planId),
    onSuccess: (plan) => {
      client.setQueryData(dailyPlanKey(userId, plan.planDate), plan);
      void client.invalidateQueries({ queryKey: dailyWeekAccountKey(userId) });
    },
  });
}

export function useDailyWeek(userId: string | null, weekStart: string | null) {
  return useQuery({
    queryKey: dailyWeekKey(userId ?? "", weekStart ?? ""),
    queryFn: () => dailyService.getWeek(userId ?? "", weekStart ?? ""),
    enabled: Boolean(userId && weekStart),
  });
}

export function useSaveDailyWeek(userId: string, weekStart: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveDailyWeekBody) => dailyService.saveWeek(userId, weekStart, body),
    onSuccess: (week) => { client.setQueryData(dailyWeekKey(userId, week.weekStart), week); },
  });
}
