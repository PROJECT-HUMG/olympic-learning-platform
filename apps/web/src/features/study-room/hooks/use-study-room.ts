import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { studyRoomService } from "../services/study-room.service";
import type { RoomAction, StudyRoomSnapshot } from "../types/study-room";

interface RoomClock {
  room: StudyRoomSnapshot;
  serverOffsetMs: number;
}

async function withClock(request: () => Promise<StudyRoomSnapshot | null>): Promise<RoomClock | null> {
  const started = Date.now();
  const room = await request();
  return room ? { room, serverOffsetMs: Date.parse(room.serverNow) - (started + Date.now()) / 2 } : null;
}

export function useStudyRoom(id: string, userId?: string) {
  const [recovering, setRecovering] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const client = useQueryClient();
  const key = ["study-room", id, userId];
  const action = useMutation({
    mutationFn: async (input: RoomAction) => {
      await client.cancelQueries({ queryKey: key });
      return withClock(() => studyRoomService.act(id, input));
    },
    onSuccess: (data) => {
      if (data) client.setQueryData(key, data);
      else client.removeQueries({ queryKey: key });
      void client.invalidateQueries({ queryKey: ["study-rooms"] });
    },
    onError: () => { void client.invalidateQueries({ queryKey: key }); },
  });
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(userId && id),
    queryFn: async ({ signal }) => {
      const previous = client.getQueryData<RoomClock>(key);
      if (!previous?.room.me || previous.room.closed) return withClock(() => studyRoomService.get(id, signal));
      try {
        return await withClock(() => studyRoomService.heartbeat(id, signal));
      } catch (error) {
        // A switched/expired membership or a closed room needs a fresh preview.
        if ([403, 409].includes((error as { status?: number }).status ?? 0)) return withClock(() => studyRoomService.get(id, signal));
        throw error;
      }
    },
    staleTime: 0,
    refetchInterval: (state) => action.isPending || state.state.data?.room.closed ? false : 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const { refetch } = query;
  const reconnect = useCallback(async () => {
    if (!userId || !navigator.onLine) return;
    setRecovering(true);
    try { await refetch({ cancelRefetch: false }); }
    finally { setRecovering(false); }
  }, [userId, refetch]);

  useEffect(() => {
    const onOnline = () => { setOnline(true); void reconnect(); };
    const onOffline = () => setOnline(false);
    const onVisible = () => { if (document.visibilityState === "visible") void reconnect(); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reconnect]);
  return { query, action, recovering, online, reconnect };
}
