import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ConversationFile, ConversationMeta } from "@/app/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "ID de conversación requerido" },
        { status: 400 }
      );
    }
    
    const conversationsDir = path.join(process.cwd(), "app", "conversaciones");
    const filePath = path.join(conversationsDir, `${id}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const conversationData = JSON.parse(fileContent);
      
      let conversationFile: ConversationFile;
      
      if (conversationData.meta && conversationData.messages) {
        // Formato nuevo
        conversationFile = conversationData;
      } else {
        // Formato legacy - convertir
        const modeFromFilename = id.includes('useronly') ? 'useronly' : 'live';
        const startedAt = conversationData.sessionState?.startTime || new Date().toISOString();
        const endedAt = conversationData.sessionState?.endTime || new Date().toISOString();
        
        const meta: ConversationMeta = {
          id,
          mode: modeFromFilename as "live" | "useronly",
          startedAt,
          endedAt,
          phase: (conversationData.sessionState?.currentPhase || 'descubrimiento') as "descubrimiento" | "exploracion" | "plan_accion",
          durationSec: conversationData.sessionState?.totalDuration || 0,
          language: 'es' as const,
          participants: []
        };
        
        const messages = conversationData.messages?.map((msg: any) => ({
          id: msg.id || Date.now().toString(),
          role: msg.role as "user" | "assistant" | "system",
          text: msg.content || msg.text || '',
          ts: msg.timestamp || new Date().toISOString(),
          audio: msg.audio,
          voice: msg.voice
        })) || [];
        
        conversationFile = { meta, messages };
      }
      
      return NextResponse.json(conversationFile);
    } catch (fileError) {
      return NextResponse.json(
        { error: "Conversación no encontrada" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error cargando conversación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}