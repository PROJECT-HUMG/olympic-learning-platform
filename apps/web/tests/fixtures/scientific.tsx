import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ScientificBlockEditor } from "../../src/features/questions/components/scientific-block-editor";
import type { ScientificBlock } from "../../src/features/questions/types/scientific-content";
import "../../src/index.css";

const raster = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#dbeafe"/><path d="M20 180L100 40L200 120L380 20" fill="none" stroke="#1d4ed8" stroke-width="4"/></svg>');

export function Fixture() {
  const [blocks, setBlocks] = useState<ScientificBlock[]>([
    { id: "prose", kind: "text", source: "Chứng minh \\(x^2+y^2\\) và giải thích kết quả." },
    { id: "math", kind: "math", source: "\\frac{1}{", display: true },
    { id: "figures", kind: "figure_group", layout: "side_by_side", figures: [
      { assetId: "first", alt: "Đồ thị thứ nhất", caption: "Hình 1" },
      { assetId: "second", alt: "Đồ thị thứ hai", caption: "Hình 2" },
    ] },
  ]);
  return <main style={{ maxWidth: 1000, margin: "auto", padding: 16 }}>
    <h1>Scientific component fixture — no API</h1>
    <button onClick={() => document.documentElement.classList.toggle("dark")}>Theme</button>
    <ScientificBlockEditor label="Nội dung câu hỏi" value={blocks} onChange={setBlocks}
      resolveFigure={() => raster}
      uploadFigure={async () => { throw new Error("Fixture upload failure; source retained"); }} />
    <output data-testid="source" style={{ display: "block", overflowWrap: "anywhere" }}>{JSON.stringify(blocks)}</output>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Fixture />);
