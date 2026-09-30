import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Check, Upload as UpIcon, X } from "lucide-react";
import "./upload-dropzone.css";

/* ── SVG file page icon ───────────────────────────────────
   After Untitled UI: rounded page with a folded corner, and
   the extension on a coloured label that sticks out past the
   page's left edge. */

const EXT_COLORS: Record<string, string> = {
  PDF: "#E5484D",
  DOC: "#155EEF",
  DOCX: "#155EEF",
  XLS: "#079455",
  XLSX: "#079455",
  PNG: "#079455",
  JPG: "#E5870A",
  MP4: "#155EEF",
};

function Page({ ext, size = 40 }: { ext: string; size?: number }) {
  const tint = EXT_COLORS[ext.toUpperCase()] ?? "#64748b";
  return (
    <svg
      className="upl-page"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="upl-page-line"
        d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
      />
      <path className="upl-page-line" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
      <rect width="29" height="16" x="1" y="18" rx="8" fill={tint} />
      <text x="15.5" y="29.3" textAnchor="middle" className="upl-page-ext">
        {ext.toUpperCase()}
      </text>
    </svg>
  );
}

/* ── rolling percentage counter ────────────────────────── */
function Roll({ value }: { value: number }) {
  const s = String(Math.round(value));
  return (
    <span className="upl-roll" aria-label={`${s}%`}>
      {s.split("").map((d, i) => (
        <span key={s.length - i} className="upl-roll-col">
          <span
            className="upl-roll-strip"
            style={{ transform: `translateY(${-Number(d)}em)` }}
          >
            {"0123456789".split("").map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      ))}
      %
    </span>
  );
}

const fmt = (b: number) =>
  b >= 1e6
    ? `${(b / 1e6).toFixed(1)} MB`
    : `${Math.round(b / 1e3)} KB`;

const getExt = (name: string) => {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toUpperCase() : "FILE";
};

type UploadPhase =
  | { kind: "idle" }
  | { kind: "uploading"; file: File; progress: number }
  | { kind: "done"; file: File };

interface UploadDropzoneProps {
  /** Called when a file is selected — parent handles the actual upload */
  onFileSelect: (file: File) => void;
  /** Called when the user clears the selected file */
  onClear: () => void;
  /** Upload progress 0-100, driven by parent */
  progress: number;
  /** Whether the upload mutation is pending */
  isPending: boolean;
  /** The currently selected file */
  selectedFile: File | null;
  /** ID returned after successful upload */
  uploadedFileId: string | null;
  /** Error message */
  error: string | null;
  /** Accepted file types */
  accept?: string;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** SVG corner radius */
  corner?: number;
  /** Spring bounce 0-100 */
  bounce?: number;
}

export function UploadDropzone({
  onFileSelect,
  onClear,
  progress,
  isPending,
  selectedFile,
  uploadedFileId,
  error,
  accept = ".pdf",
  maxSizeMB = 50,
  corner = 16,
  bounce = 40,
}: UploadDropzoneProps) {
  const [over, setOver] = useState(false);
  const [refuse, setRefuse] = useState<string | null>(null);
  const [gulp, setGulp] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const shake = useAnimationControls();
  const zone = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const tries = useRef(0);
  const cool = useRef(0);

  const SNARK = [
    `Vẫn quá lớn. Tối đa ${maxSizeMB} MB.`,
    "Nén file rồi thử lại nhé",
    "File này to quá rồi",
    "Không.",
  ];

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(cool.current);
    },
    [],
  );

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /* Track upload completion for the done animation */
  useEffect(() => {
    if (uploadedFileId && !isPending && selectedFile) {
      tries.current = 0;
      setGulp(true);
      later(() => setGulp(false), 460);
      later(() => setShowDone(true), 300);
    } else {
      setShowDone(false);
    }
  }, [uploadedFileId, isPending, selectedFile]);

  const refuseIt = useCallback(
    (msg?: string) => {
      const n = tries.current++;
      setRefuse(
        msg ?? (n === 0 ? `Quá lớn — tối đa ${maxSizeMB} MB` : SNARK[Math.min(n - 1, SNARK.length - 1)]),
      );
      shake.start({
        x: [0, -7, 6, -4, 2, 0],
        transition: { duration: 0.38 },
      });
      later(() => setRefuse(null), 1800);
      clearTimeout(cool.current);
      cool.current = window.setTimeout(() => {
        tries.current = 0;
      }, 8000);
    },
    [maxSizeMB, shake],
  );

  const processFile = useCallback(
    (file: File) => {
      if (file.size > maxSizeMB * 1e6) {
        refuseIt();
        return;
      }
      setGulp(true);
      later(() => setGulp(false), 460);
      onFileSelect(file);
    },
    [maxSizeMB, onFileSelect, refuseIt],
  );

  /* ── native drag & drop ──────────────────────────────── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPending) setOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    if (isPending) return;

    const file = e.dataTransfer.files[0];
    if (!file) return;
    processFile(file);
  };

  const handleClick = () => {
    if (!isPending) fileInput.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    /* Reset so the same file can be re-selected */
    e.target.value = "";
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDone(false);
    onClear();
  };

  const r = Math.max(0, corner);
  const phase: UploadPhase = selectedFile
    ? uploadedFileId && !isPending
      ? { kind: "done", file: selectedFile }
      : isPending
        ? { kind: "uploading", file: selectedFile, progress }
        : { kind: "idle" }
    : { kind: "idle" };

  const ext = selectedFile ? getExt(selectedFile.name) : "";
  const isBusy = phase.kind !== "idle";

  return (
    <div
      className="upl"
      style={
        {
          "--upl-r": `${r}px`,
          "--upl-spring": `cubic-bezier(0.3, ${1 + (bounce / 100) * 0.9}, 0.4, 1)`,
        } as React.CSSProperties
      }
    >
      <motion.div animate={shake} className="upl-zone-wrap">
        <div
          ref={zone}
          className="upl-zone"
          data-over={over || undefined}
          data-refuse={refuse ? true : undefined}
          data-busy={isBusy || undefined}
          data-gulp={gulp || undefined}
          aria-live="polite"
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {phase.kind === "idle" && !selectedFile ? (
            <>
              <span className="upl-icon">
                <UpIcon size={22} strokeWidth={2} />
              </span>
              <span className="upl-say">
                <b>
                  {refuse ??
                    (over
                      ? "Thả để tải lên"
                      : "Kéo thả tệp vào đây hoặc nhấp để tải lên")}
                </b>
                <span>
                  Hỗ trợ {accept.replace(/\./g, "").toUpperCase()} (Tối đa{" "}
                  {maxSizeMB} MB)
                </span>
              </span>
            </>
          ) : selectedFile ? (
            <>
              <span className="upl-now" key={selectedFile.name}>
                <Page ext={ext} size={40} />
                <span className="upl-text">
                  <span className="upl-name">{selectedFile.name}</span>
                  <span className="upl-meta">
                    {fmt(selectedFile.size)} ·{" "}
                    {phase.kind === "done" || showDone ? (
                      "Tải lên thành công"
                    ) : phase.kind === "uploading" ? (
                      <Roll value={phase.progress} />
                    ) : (
                      "Sẵn sàng"
                    )}
                  </span>
                  <span className="upl-track">
                    <span
                      className="upl-bar"
                      style={{
                        transform: `scaleX(${
                          phase.kind === "uploading"
                            ? phase.progress / 100
                            : phase.kind === "done" || showDone
                              ? 1
                              : 0
                        })`,
                      }}
                    />
                  </span>
                </span>
                <span className="upl-end">
                  {(phase.kind === "done" || showDone) && (
                    <span className="upl-tick">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </span>
              </span>
              {!isPending && (
                <button
                  type="button"
                  className="upl-clear"
                  onClick={handleClear}
                  aria-label="Xóa tệp"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </>
          ) : null}

          <input
            type="file"
            ref={fileInput}
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
        </div>
      </motion.div>

      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}
    </div>
  );
}
