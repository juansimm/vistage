"use client";
import React, { useRef, useState } from "react";

// Standalone browser-only WAV recorder that does NOT touch the agent mic
export const UserRecorder: React.FC = () => {
  const [isRec, setIsRec] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local-only recording pipeline
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const buffersRef = useRef<Int16Array[]>([]);
  const sampleRateRef = useRef<number>(16000);

  const start = async () => {
    setError(null);
    try {
      const audioContext = new AudioContext({ sampleRate: 16000, latencyHint: "interactive" });
      audioCtxRef.current = audioContext;
      if (audioContext.state === "suspended") await audioContext.resume();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      sampleRateRef.current = audioContext.sampleRate || 16000;

      const src = audioContext.createMediaStreamSource(stream);
      sourceRef.current = src;
      const proc = audioContext.createScriptProcessor(2048, 1, 1);
      procRef.current = proc;
      buffersRef.current = [];

      proc.onaudioprocess = (ev) => {
        const input = ev.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        if (pcm.byteLength > 0) buffersRef.current.push(pcm);
      };

      src.connect(proc);
      proc.connect(audioContext.destination);
      setIsRec(true);
    } catch (e: any) {
      console.error("User-only recorder failed to start", e);
      setError(e?.message || "No se pudo acceder al micrófono");
      await teardown();
    }
  };

  const teardown = async () => {
    try {
      if (procRef.current) {
        procRef.current.disconnect();
        procRef.current.onaudioprocess = null;
      }
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioCtxRef.current) {
        await audioCtxRef.current.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    } finally {
      audioCtxRef.current = null;
      sourceRef.current = null;
      procRef.current = null;
      streamRef.current = null;
    }
  };

  const buildWavBlob = (): Blob | null => {
    const parts = buffersRef.current;
    if (!parts.length) return null;
    const sr = sampleRateRef.current || 16000;
    const total = parts.reduce((n, b) => n + b.length, 0);
    const pcm = new Int16Array(total);
    let off = 0;
    for (const b of parts) { pcm.set(b, off); off += b.length; }

    const header = 44;
    const buf = new ArrayBuffer(header + pcm.length * 2);
    const view = new DataView(buf);
    // RIFF
    writeStr(view, 0, "RIFF");
    view.setUint32(4, 36 + pcm.length * 2, true);
    writeStr(view, 8, "WAVE");
    // fmt 
    writeStr(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    // data
    writeStr(view, 36, "data");
    view.setUint32(40, pcm.length * 2, true);
    // samples
    let idx = 44;
    for (let i = 0; i < pcm.length; i++, idx += 2) view.setInt16(idx, pcm[i], true);
    return new Blob([view], { type: "audio/wav" });

    function writeStr(dv: DataView, offset: number, s: string) {
      for (let i = 0; i < s.length; i++) dv.setUint8(offset + i, s.charCodeAt(i));
    }
  };

  const stopAndSave = async () => {
    setSaving(true);
    try {
      const blob = buildWavBlob();
      buffersRef.current = [];
      await teardown();
      setIsRec(false);
      if (!blob) throw new Error("No se generó audio");

      const ts = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "_");
      const fname = `user_recording_${ts}.wav`;
      const form = new FormData();
      form.append("audio", blob, fname);
      const res = await fetch("/api/upload-audio", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Error al guardar (${res.status})`);
      alert("Grabación guardada como " + fname);
    } catch (e: any) {
      console.error(e);
      alert("Error al guardar: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const stopAndDownload = async () => {
    try {
      const blob = buildWavBlob();
      buffersRef.current = [];
      await teardown();
      setIsRec(false);
      if (!blob) return;
      const ts = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "_");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `user_recording_${ts}.wav`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-3 glass rounded-lg border border-stone-600/30 bg-stone-800/30">
      <h5 className="text-xs font-medium text-stone-300 mb-2">Grabación Solo Usuario</h5>
      <p className="text-[11px] text-stone-400 mb-2">Graba solo tu voz (sin transcribir ni enviar al agente) y guarda como WAV.</p>
      {error && (
        <div className="mb-2 text-[11px] text-red-400">{error}</div>
      )}
      <div className="flex gap-2">
        {!isRec ? (
          <button onClick={start} className="px-3 py-2 text-xs modern-button text-stone-900 rounded">
            Iniciar Grabación
          </button>
        ) : (
          <>
            <button onClick={stopAndSave} disabled={saving} className="px-3 py-2 text-xs bg-green-600 hover:bg-green-700 rounded disabled:opacity-50">
              {saving ? "Guardando…" : "Detener y Guardar"}
            </button>
            <button onClick={stopAndDownload} className="px-3 py-2 text-xs bg-stone-600 hover:bg-stone-700 rounded">
              Detener y Descargar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

