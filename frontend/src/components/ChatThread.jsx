import React, { useRef, useState } from "react";
import { Send, Paperclip, Mic, Square, X, Loader2 } from "lucide-react";
import { studioApi } from "../lib/studioApi";

function formatTime(iso) {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** "gerade online" / "zuletzt online vor 5 Min." — never exact clock time, that's not the point of presence. */
function formatPresence(presence) {
  if (!presence?.lastSeenAt) return null;
  if (presence.online) return "Online";
  const minutes = Math.round((Date.now() - new Date(presence.lastSeenAt).getTime()) / 60000);
  if (minutes < 1) return "Gerade eben online";
  if (minutes < 60) return `Zuletzt online vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Zuletzt online vor ${hours} Std.`;
  return `Zuletzt online vor ${Math.round(hours / 24)} Tagen`;
}

function AUDIO_MIME() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of ["audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

const MAX_RECORD_SECONDS = 120;

/**
 * Dumb message list + composer, no modal chrome of its own — the single chat
 * surface used by the staff inbox and the customer's Nachrichten tab.
 * `viewerRole` decides which sender's bubbles align right (own) vs. left.
 */
export default function ChatThread({ messages, onSend, sending, viewerRole, uploadPath, locked, lockedReason, presence }) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(null); // { url, type: 'image'|'audio' }
  const [sendError, setSendError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const sorted = [...(messages || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const presenceLabel = formatPresence(presence);

  async function uploadFile(file) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await studioApi.post(uploadPath, form);
      return data.url;
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await uploadFile(file);
    setPending({ url, type: "image" });
  }

  async function startRecording() {
    const mimeType = AUDIO_MIME();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const ext = (recorder.mimeType || "audio/webm").split("/")[1]?.split(";")[0] || "webm";
      const url = await uploadFile(new File([blob], `voice.${ext}`, { type: blob.type }));
      setPending({ url, type: "audio" });
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setRecordSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordSeconds((s) => {
        if (s + 1 >= MAX_RECORD_SECONDS) recorder.stop();
        return s + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  /**
   * Clearing the composer only on success, not before the send: a failed
   * request used to wipe the typed text or attachment first, so a network
   * blip looked exactly like a sent message and the content was simply gone.
   * On failure the draft/attachment comes back so nothing is lost, and
   * sendError says what happened instead of leaving it to look like it sent.
   */
  async function submit(e) {
    e.preventDefault();
    if (sending || uploading) return;
    setSendError("");
    if (pending) {
      try {
        await onSend({ body: "", attachmentUrl: pending.url, attachmentType: pending.type });
        setPending(null);
      } catch (err) {
        setSendError(err.response?.data?.error || "Senden fehlgeschlagen — bitte erneut versuchen.");
      }
      return;
    }
    const body = draft.trim();
    if (!body) return;
    try {
      await onSend({ body });
      setDraft("");
    } catch (err) {
      setSendError(err.response?.data?.error || "Senden fehlgeschlagen — bitte erneut versuchen.");
    }
  }

  return (
    <div className="flex flex-col h-full">
      {presenceLabel && (
        <div className="flex items-center gap-1.5 text-[11px] font-inter text-zinc-500 mb-2 flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${presence.online ? "bg-emerald-500" : "bg-zinc-300"}`} />
          {presenceLabel}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 min-h-0">
        {sorted.length === 0 ? (
          <p className="text-[11px] font-inter text-zinc-400 text-center py-4">Noch keine Nachrichten.</p>
        ) : (
          sorted.map((m) => {
            const own = m.sender === viewerRole;
            return (
              <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${own ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-800"}`}>
                  {m.attachment_type === "image" && (
                    <a href={m.attachment_url} target="_blank" rel="noreferrer">
                      <img src={m.attachment_url} alt="" className="rounded-lg max-w-56 max-h-56 object-cover" />
                    </a>
                  )}
                  {m.attachment_type === "audio" && <audio controls src={m.attachment_url} className="max-w-56" />}
                  {m.body && <p className="text-xs font-inter whitespace-pre-line break-words mt-1 first:mt-0">{m.body}</p>}
                  <p className={`text-[9px] font-inter mt-1 ${own ? "text-white/50" : "text-zinc-400"}`}>{formatTime(m.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {locked ? (
        <p className="text-[11px] font-inter text-zinc-400 text-center mt-3 py-2 border-t border-zinc-100">{lockedReason}</p>
      ) : (
        <div className="mt-3 flex-shrink-0">
          {sendError && <p className="text-[11px] font-inter text-red-600 mb-2">{sendError}</p>}
          {pending && (
            <div className="flex items-center gap-2 mb-2 bg-zinc-50 rounded-xl px-2.5 py-1.5">
              {pending.type === "image" ? (
                <img src={pending.url} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <audio controls src={pending.url} className="h-8 max-w-[180px]" />
              )}
              <button type="button" onClick={() => setPending(null)} className="ml-auto p-1 rounded-lg hover:bg-zinc-200 text-zinc-400">
                <X size={14} />
              </button>
            </div>
          )}
          <form onSubmit={submit} className="flex items-end gap-1.5">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || recording || !!pending}
              className="w-9 h-9 flex-shrink-0 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 flex items-center justify-center transition-colors"
              title="Bild anhängen"
            >
              {uploading && !recording ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={15} />}
            </button>
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading || !!pending}
              className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 ${
                recording ? "bg-red-100 text-red-600" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              }`}
              title="Sprachnachricht"
            >
              {recording ? <Square size={13} /> : <Mic size={15} />}
            </button>
            {recording && (
              <span className="text-[11px] font-inter text-red-600 self-center tabular-nums">
                {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:{String(recordSeconds % 60).padStart(2, "0")}
              </span>
            )}
            {!recording && (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(e);
                  }
                }}
                rows={1}
                disabled={!!pending}
                placeholder={pending ? "Anhang bereit zum Senden…" : "Nachricht schreiben…"}
                className="flex-1 resize-none rounded-xl border border-zinc-200 px-3 py-2 text-xs font-inter focus:outline-none focus:ring-2 focus:ring-zinc-900/10 max-h-24 disabled:bg-zinc-50"
              />
            )}
            <button
              type="submit"
              disabled={recording || uploading || sending || (!pending && !draft.trim())}
              className="w-9 h-9 flex-shrink-0 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
