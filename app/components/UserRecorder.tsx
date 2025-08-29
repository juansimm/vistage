"use client";
import React, { useState } from "react";
import { useWebSocketContext } from "../context/WebSocketContext";

export const UserRecorder: React.FC = () => {
  const { startUserOnlyRecording, stopUserOnlyRecording } = useWebSocketContext();
  const [isRec, setIsRec] = useState(false);
  const [saving, setSaving] = useState(false);

  const start = async () => {
    await startUserOnlyRecording();
    setIsRec(true);
  };

  const stopAndSave = async () => {
    setSaving(true);
    try {
      const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
      const fname = `user_recording_${ts}.wav`;
      const blob = await stopUserOnlyRecording({ save: true, filename: fname });
      if (!blob) throw new Error('No se generó audio');
      alert('Grabación guardada como ' + fname);
    } catch (e: any) {
      alert('Error al guardar: ' + (e?.message || e));
    } finally {
      setSaving(false);
      setIsRec(false);
    }
  };

  const stopAndDownload = async () => {
    const blob = await stopUserOnlyRecording({ save: false });
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
    a.href = url;
    a.download = `user_recording_${ts}.wav`;
    a.click();
    URL.revokeObjectURL(url);
    setIsRec(false);
  };

  return (
    <div className="p-3 glass rounded-lg border border-stone-600/30 bg-stone-800/30">
      <h5 className="text-xs font-medium text-stone-300 mb-2">Grabación Solo Usuario</h5>
      <p className="text-[11px] text-stone-400 mb-2">Graba solo tu voz (sin transcribir ni enviar al agente) y guarda como WAV.</p>
      <div className="flex gap-2">
        {!isRec ? (
          <button onClick={start} className="px-3 py-2 text-xs modern-button text-stone-900 rounded">
            Iniciar Grabación
          </button>
        ) : (
          <>
            <button onClick={stopAndSave} disabled={saving} className="px-3 py-2 text-xs bg-green-600 hover:bg-green-700 rounded disabled:opacity-50">
              {saving ? 'Guardando…' : 'Detener y Guardar'}
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
