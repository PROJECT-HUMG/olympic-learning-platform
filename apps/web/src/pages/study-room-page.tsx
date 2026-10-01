import { useParams } from "react-router-dom";
import { StudyRoomSession } from "@/features/study-room/components/study-room-session";

export default function StudyRoomPage() {
  const { roomId = "" } = useParams();
  return <StudyRoomSession key={roomId} id={roomId} />;
}
