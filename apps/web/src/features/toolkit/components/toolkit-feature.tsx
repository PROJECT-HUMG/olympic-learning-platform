import { PageHeader } from "@/components/ui/page-header";
import { Calculator, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StudyRoomsLobby } from "@/features/study-room/components/study-rooms-lobby";
import { GpaCalculator } from "./gpa-calculator";
import "./toolkit.css";

export function ToolkitFeature() {
  const [params, setParams] = useSearchParams();
  const tool = params.get("tool") === "gpa" ? "gpa" : "rooms";
  return (
    <div className="page-shell page-shell--public toolkit-page">
      <PageHeader title="Tiện ích học tập" description="Giữ nhịp tập trung trong phòng học chung hoặc tính điểm và mục tiêu GPA." />
      <Tabs value={tool} onValueChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set("tool", value); return next; })} className={`toolkit-workspace${tool === "rooms" ? " toolkit-workspace--rooms" : ""}`}>
        <SmoothTab value={tool} label="Chọn tiện ích" className="toolkit-workspace__tabs" items={[
          { value: "rooms", label: "Phòng học chung", icon: <Users aria-hidden="true" /> },
          { value: "gpa", label: "Tính GPA", icon: <Calculator aria-hidden="true" /> },
        ]} />
        <TabsContent value="rooms"><StudyRoomsLobby /></TabsContent>
        <TabsContent value="gpa"><GpaCalculator /></TabsContent>
      </Tabs>
    </div>
  );
}
