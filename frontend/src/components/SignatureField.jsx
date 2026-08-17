import React, { useEffect, useRef, useState } from "react";
import { Pen, Type, Trash2 } from "lucide-react";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 150;

/**
 * Renders typed text as a signature image using the cursive web font — used
 * both for the "typed" mode's live preview and, at submit time, to turn the
 * typed name into the same kind of PNG a drawn signature produces. Keeping
 * the two modes converging on one data shape (a PNG data URL) means the
 * backend and the studio's viewer never need to know which mode was used.
 */
function renderTypedSignature(canvas, text) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!text.trim()) return;
  ctx.fillStyle = "#18181b";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  // Shrinks a long name to fit rather than overflowing the field — most
  // names fit at the base size, this only kicks in for unusually long ones.
  let size = 56;
  ctx.font = `${size}px "Dancing Script", cursive`;
  while (ctx.measureText(text).width > canvas.width - 40 && size > 20) {
    size -= 2;
    ctx.font = `${size}px "Dancing Script", cursive`;
  }
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

/**
 * Both signature modes the customer can pick, matching what was asked for:
 * type your name (rendered in a handwriting font) or draw it with mouse/touch.
 * Either way the parent gets a single PNG data URL via onChange — that's
 * what's actually stored (see healthConsent.ts: the backend just stores
 * whatever image and mode were submitted).
 */
export default function SignatureField({ onChange }) {
  const [mode, setMode] = useState("typed");
  const [typedName, setTypedName] = useState("");
  const typedCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const drawingRef = useRef(false);
  const hasDrawingRef = useRef(false);

  // Typed mode: re-render on every keystroke and report the current image.
  useEffect(() => {
    if (mode !== "typed") return;
    const canvas = typedCanvasRef.current;
    if (!canvas) return;
    renderTypedSignature(canvas, typedName);
    onChange(typedName.trim() ? canvas.toDataURL("image/png") : null, "typed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typedName]);

  function pointFromEvent(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = e.touches?.[0] ?? e;
    return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = pointFromEvent(canvas, e);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function moveDraw(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = pointFromEvent(canvas, e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#18181b";
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawingRef.current = true;
  }

  function endDraw() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = drawCanvasRef.current;
    onChange(hasDrawingRef.current ? canvas.toDataURL("image/png") : null, "drawn");
  }

  function clearDrawing() {
    const canvas = drawCanvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    hasDrawingRef.current = false;
    onChange(null, "drawn");
  }

  function switchMode(next) {
    setMode(next);
    if (next === "drawn") {
      hasDrawingRef.current = false;
      const canvas = drawCanvasRef.current;
      if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      onChange(null, "drawn");
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => switchMode("typed")}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-inter transition-colors ${
            mode === "typed" ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
          }`}
        >
          <Type size={12} /> Eintippen
        </button>
        <button
          type="button"
          onClick={() => switchMode("drawn")}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-inter transition-colors ${
            mode === "drawn" ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
          }`}
        >
          <Pen size={12} /> Zeichnen
        </button>
      </div>

      {mode === "typed" && (
        <input
          type="text"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder="Ihr Name"
          className="w-full h-10 px-3 mb-2 rounded-xl border border-zinc-200 text-sm font-inter focus:outline-none focus:border-zinc-400"
        />
      )}

      <div className="relative rounded-xl border border-dashed border-zinc-300 bg-zinc-50 overflow-hidden">
        <canvas
          ref={typedCanvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={mode === "typed" ? "w-full h-[110px] block" : "hidden"}
        />
        <canvas
          ref={drawCanvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
          className={mode === "drawn" ? "w-full h-[110px] block touch-none cursor-crosshair" : "hidden"}
        />
        {mode === "drawn" && (
          <button
            type="button"
            onClick={clearDrawing}
            className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-white/80 hover:bg-white text-zinc-400 hover:text-zinc-600 transition-colors"
            title="Löschen"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
