import { useQuery } from "@tanstack/react-query";
import { recognitionService } from "@/features/recognition/service";
import { hasUuidFormat } from "@/lib/uuid";

// Preview and full page have one public-only cache. Never seed from private user/achievement DTOs.
export function usePublicProfile(userId: string, enabled = true) {
  return useQuery({
    meta: { publicRead: true },
    queryKey: ["recognition", "profile", userId],
    queryFn: ({ signal }) => {
      if (!hasUuidFormat(userId)) throw new Error("Invalid public user ID");
      return recognitionService.publicProfile(userId, signal);
    },
    enabled,
    staleTime: 0,
    retry: 1,
  });
}
