import { Calculator, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudyRoomsLobby } from "@/features/study-room/components/study-rooms-lobby";
import { GpaCalculator } from "./gpa-calculator";
import "./toolkit.css";

export function ToolkitFeature() {
  const [params, setParams] = useSearchParams();
  const tool = params.get("tool") === "gpa" ? "gpa" : "rooms";
  return (
    <div className="toolkit-page">
      <header className="toolkit-page__heading">
        <h1>Tiện ích học tập</h1>
        <p>Một nhịp học tập trung hơn, một bảng điểm dễ tính hơn.</p>
      </header>
      <Tabs value={tool} onValueChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set("tool", value); return next; })} className="toolkit-workspace">
        <TabsList className="toolkit-workspace__tabs" aria-label="Chọn tiện ích">
          <TabsTrigger value="rooms"><Users aria-hidden="true" /> Phòng học chung</TabsTrigger>
          <TabsTrigger value="gpa"><Calculator aria-hidden="true" /> Tính GPA</TabsTrigger>
        </TabsList>
        <TabsContent value="rooms"><StudyRoomsLobby /></TabsContent>
        <TabsContent value="gpa"><GpaCalculator /></TabsContent>
      </Tabs>
    </div>
  );
}
