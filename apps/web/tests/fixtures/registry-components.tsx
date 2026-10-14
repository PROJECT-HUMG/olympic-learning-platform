// Owned synthetic component proof only; never imported by the product router.
import { StrictMode, useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import BlurText from "@/components/react-bits/blur-text";
import FileUpload from "@/components/kokonutui/file-upload";
import "@/index.css";

function RegistryComponents() {
  const [showText, setShowText] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const [renders, setRenders] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [success, setSuccess] = useState(0);
  const [aborted, setAborted] = useState(0);
  const failNext = useRef(false);
  const transfer = useRef<{ onProgress: (n: number) => void; resolve: () => void } | null>(null);
  const upload = useCallback((_file: File, helpers: { onProgress: (n: number) => void; signal: AbortSignal }) => new Promise<void>((resolve, reject) => {
    transfer.current = { onProgress: helpers.onProgress, resolve };
    helpers.signal.addEventListener("abort", () => { setAborted(n => n + 1); reject(new DOMException("Synthetic cancellation", "AbortError")); }, { once: true });
    if (failNext.current) { failNext.current = false; reject(new Error("Synthetic transfer failed")); }
  }), []);
  return <main style={{ maxWidth: 640, padding: 16, margin: "auto", color: "var(--foreground)", background: "var(--background)", minHeight: "100dvh" }}>
    <header><h1>Owned synthetic registry proof</h1><p>Memory-only files and transfer callbacks. No server upload.</p></header>
    <div className="my-4 flex flex-wrap gap-2 [&_button]:min-h-11 [&_button]:rounded-md [&_button]:border [&_button]:px-3">
      <button onClick={() => setShowText(v => !v)}>Toggle text</button>
      <button onClick={() => setRenders(n => n + 1)}>Unrelated render</button>
      <button onClick={() => setShowUpload(v => !v)}>Toggle upload</button>
      <button onClick={() => { failNext.current = true; }}>Fail next transfer</button>
      <button onClick={() => transfer.current?.onProgress(60)}>Progress 60</button>
      <button onClick={() => transfer.current?.resolve()}>Complete transfer</button>
    </div>
    <output id="registry-state" data-completed={completed} data-success={success} data-aborted={aborted} data-renders={renders}>Synthetic state</output>
    <h2 id="registry-title" style={{ minHeight: "4em", fontSize: 26, lineHeight: 1.3, marginBlock: 16 }}>
      {showText && <BlurText text="Tài nguyên học tập Olympic HUMG" onAnimationComplete={() => setCompleted(n => n + 1)} />}
    </h2>
    <div id="upload-specimen">{showUpload && <FileUpload acceptedFileTypes={[".pdf"]} maxFileSize={1024} onUpload={upload} onUploadSuccess={() => setSuccess(n => n + 1)} />}</div>
  </main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><RegistryComponents /></StrictMode>);
