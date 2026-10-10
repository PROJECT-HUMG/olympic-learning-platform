// Actual shared owners; synthetic choices only. No requests or persistence.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../src/index.css";
import { Button } from "../../src/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "../../src/components/ui/dropdown-menu";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../src/components/ui/select";

function Fixture() {
  const [choice, setChoice] = useState("Alpha");
  return <main className="page-shell p-4"><header><h1>Floating controls fixture</h1></header>
    <DropdownMenu><DropdownMenuTrigger asChild><Button className="self-start w-fit">Menu fixture</Button></DropdownMenuTrigger>
      <DropdownMenuContent><DropdownMenuItem>Alpha action</DropdownMenuItem>
        <DropdownMenuSub><DropdownMenuSubTrigger>More options</DropdownMenuSubTrigger>
          <DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem>Nested action</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
    <Select value={choice} onValueChange={setChoice}><SelectTrigger aria-label="Aligned choice"><SelectValue /></SelectTrigger>
      <SelectContent position="item-aligned">{["Alpha", "Beta"].map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
    </Select><output>{choice}</output>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
