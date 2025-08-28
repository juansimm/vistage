"use client";
import React, { useEffect, useRef, useState } from "react";
import { AudioVisualizerData } from "../lib/types";

interface AudioVisualizerProps {
  isActive: boolean;
  microphoneOpen: boolean;
  currentSpeaker: string | null;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
  microphoneOpen,
  currentSpeaker
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [audioData, setAudioData] = useState<AudioVisualizerData[]>([]);

  useEffect(() => {
    if (!isActive || !microphoneOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize audio data with realistic pattern
    const initializeAudioData = () => {
      const data: AudioVisualizerData[] = [];
      for (let i = 0; i < 32; i++) {
        data.push({
          frequency: i * 2,
          amplitude: 0.1 + Math.sin(i * 0.3) * 0.3, // More realistic pattern
          timestamp: Date.now()
        });
      }
      setAudioData(data);
    };

    initializeAudioData();

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update audio data with subtle variations
      setAudioData(prevData => {
        const newData = prevData.map(data => ({
          ...data,
          amplitude: Math.max(0.05, Math.min(0.8, 
            data.amplitude + (Math.random() - 0.5) * 0.1
          ))
        }));

        // Draw audio bars
        const barWidth = canvas.width / newData.length;
        const maxHeight = canvas.height * 0.7;

        newData.forEach((data, index) => {
          const barHeight = data.amplitude * maxHeight;
          const x = index * barWidth;
          const y = (canvas.height - barHeight) / 2;

          // Color based on current speaker
          let color = "#3B82F6"; // Default blue
          if (currentSpeaker === "user") {
            color = "#10B981"; // Green for user
          } else if (currentSpeaker === "model") {
            color = "#8B5CF6"; // Purple for AI
          }

          // Create gradient effect
          const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, color + "80"); // Semi-transparent

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 1, barHeight);

          // Add subtle glow effect
          ctx.shadowColor = color;
          ctx.shadowBlur = 5;
          ctx.fillRect(x, y, barWidth - 1, barHeight);
          ctx.shadowBlur = 0;
        });

        return newData;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation with a delay to avoid immediate spamming
    const startDelay = setTimeout(() => {
      animate();
    }, 100);

    return () => {
      clearTimeout(startDelay);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, microphoneOpen, currentSpeaker]);

  if (!isActive || !microphoneOpen) {
    return (
      <div className="h-20 bg-gray-800/30 rounded-lg border border-gray-600 flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          {!isActive ? "Sesión no iniciada" : "Micrófono desactivado"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 text-center">
        Visualizador de Audio
      </h3>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={60}
          className="w-full h-16 bg-gray-900 rounded-lg border border-gray-600"
        />
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {currentSpeaker === "user" && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-900/50 rounded border border-green-500">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">Usuario</span>
            </div>
          )}
          {currentSpeaker === "model" && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/50 rounded border border-purple-500">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-purple-400 font-medium">IA</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
