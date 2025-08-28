"use client";
import React, { useState, useRef } from "react";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  url?: string;
  isProcessing?: boolean;
  transcript?: {
    text: string;
    confidence: number;
    metadata: any;
  };
}

export const KnowledgeBase: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingFileId, setPlayingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar tipos de archivo permitidos
      const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'audio/wav', 'audio/mpeg'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Tipo de archivo no permitido: ${file.name}`);
        continue;
      }

      // Validar tamaño (máximo 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert(`Archivo muy grande: ${file.name}. Máximo 50MB.`);
        continue;
      }

      try {
        // Crear URL temporal para el archivo
        const fileUrl = URL.createObjectURL(file);
        
        const uploadedFile: UploadedFile = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString(),
          url: fileUrl
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);
      } catch (error) {
        console.error('Error al procesar archivo:', error);
        alert(`Error al procesar archivo: ${file.name}`);
      }
    }

    setIsUploading(false);
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    if (type.includes('audio')) return '🎵';
    return '📎';
  };

  const playAudioFile = (file: UploadedFile) => {
    if (file.url && file.type.includes('audio')) {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
        setPlayingFileId(null);
      }
      
      const audio = new Audio(file.url);
      audio.addEventListener('ended', () => {
        setCurrentAudio(null);
        setPlayingFileId(null);
      });
      
      setCurrentAudio(audio);
      setPlayingFileId(file.id);
      audio.play().catch(console.error);
    }
  };

  const pauseAudioFile = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingFileId(null);
    }
  };

  const stopAudioFile = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setPlayingFileId(null);
    }
  };

  const processWithSTT = async (file: UploadedFile) => {
    if (!file.url || !file.type.includes('audio')) return;
    
    try {
      // Mark file as processing
      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, isProcessing: true } : f
      ));
      
      // Convert blob URL to File object for processing
      const response = await fetch(file.url);
      const blob = await response.blob();
      const audioFile = new File([blob], file.name, { type: file.type });
      
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      // Call Deepgram STT API endpoint (you'll need to implement this)
      const sttResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!sttResponse.ok) {
        throw new Error('STT processing failed');
      }
      
      const transcriptData = await sttResponse.json();
      
      // Create knowledge folder if it doesn't exist and save transcript
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
      const transcriptFilename = `${file.name.replace(/\.[^/.]+$/, '')}_${timestamp}.json`;
      
      const transcriptJson = {
        filename: file.name,
        uploadDate: file.uploadDate,
        processedDate: new Date().toISOString(),
        transcript: transcriptData.transcript,
        confidence: transcriptData.confidence || 0,
        metadata: {
          duration: transcriptData.metadata?.duration || 0,
          channels: transcriptData.metadata?.channels || 1,
          model: transcriptData.metadata?.model || 'deepgram-nova-2',
        }
      };
      
      // Save transcript (you'll need to implement the save endpoint)
      await fetch('/api/save-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: transcriptFilename,
          data: transcriptJson
        })
      });
      
      // Update file with transcript data
      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? {
          ...f, 
          isProcessing: false,
          transcript: {
            text: transcriptData.transcript,
            confidence: transcriptData.confidence || 0,
            metadata: transcriptData.metadata
          }
        } : f
      ));
      
      alert(`Transcripción completada y guardada como: ${transcriptFilename}`);
    } catch (error) {
      console.error('Error processing STT:', error);
      alert('Error al procesar el audio: ' + (error as Error).message);
      
      // Remove processing state
      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, isProcessing: false } : f
      ));
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4 text-center">
        📚 Knowledge Base
      </h3>

      {/* Upload Area */}
      <div className="mb-6">
        <div 
          className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.ppt,.pptx,.wav,.mp3"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          
          <div className="text-4xl mb-2">📤</div>
          <h4 className="text-white font-medium mb-2">
            Subir Materiales de Sesión
          </h4>
          <p className="text-gray-400 text-sm mb-3">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          <div className="text-xs text-gray-500">
            <p>Formatos soportados: PDF, PPT, PPTX, WAV, MP3</p>
            <p>Tamaño máximo: 50MB por archivo</p>
          </div>
          
          {isUploading && (
            <div className="mt-3 text-blue-400 text-sm">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-1"></div>
              Subiendo archivos...
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div>
          <h4 className="text-white font-medium mb-3 text-sm">
            📁 Archivos Subidos ({uploadedFiles.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-2xl flex-shrink-0">
                  {getFileIcon(file.type)}
                </span>
                
                <div className="flex-grow min-w-0">
                  <h5 className="text-white font-medium text-sm truncate">
                    {file.name}
                  </h5>
                  <p className="text-gray-400 text-xs">
                    {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {file.type.includes('audio') && (
                    <div className="flex items-center gap-1">
                      {playingFileId === file.id ? (
                        <>
                          <button
                            onClick={pauseAudioFile}
                            className="p-1 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30 rounded transition-colors text-xs"
                            title="Pausar audio"
                          >
                            ⏸️
                          </button>
                          <button
                            onClick={stopAudioFile}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors text-xs"
                            title="Detener audio"
                          >
                            ⏹️
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => playAudioFile(file)}
                          className="p-1 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded transition-colors text-xs"
                          title="Reproducir audio"
                        >
                          ▶️
                        </button>
                      )}
                      
                      <button
                        onClick={() => processWithSTT(file)}
                        disabled={file.isProcessing}
                        className={`p-1 text-xs rounded transition-colors ${
                          file.isProcessing
                            ? 'text-gray-500 cursor-not-allowed'
                            : file.transcript
                              ? 'text-green-400 hover:text-green-300 hover:bg-green-900/30'
                              : 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30'
                        }`}
                        title={file.isProcessing ? 'Procesando...' : file.transcript ? 'Reprocesar con STT' : 'Procesar con STT'}
                      >
                        {file.isProcessing ? '🔄' : file.transcript ? '✅' : '🎙️'}
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors text-xs"
                    title="Eliminar archivo"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Base Stats */}
      <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-600">
        <h4 className="text-white font-medium mb-2 text-sm">📊 Estadísticas</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="text-center">
            <div className="text-blue-400 font-bold text-lg">{uploadedFiles.length}</div>
            <div className="text-gray-400">Archivos</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-bold text-lg">
              {formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))}
            </div>
            <div className="text-gray-400">Tamaño Total</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
        <h4 className="text-blue-400 font-medium text-sm mb-2">💡 Instrucciones</h4>
        <ul className="text-xs text-blue-300 space-y-1">
          <li>• Los archivos PDF/PPT servirán como contexto para Vivi</li>
          <li>• Los archivos WAV se pueden reproducir como referencia</li>
          <li>• Los materiales se procesarán antes de la sesión</li>
        </ul>
      </div>
    </div>
  );
};