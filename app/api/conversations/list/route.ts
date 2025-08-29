import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ConversationMeta } from "@/app/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") as "live" | "useronly" | "all" | null;
    
    const conversationsDir = path.join(process.cwd(), "app", "conversaciones");
    
    // Verificar que el directorio existe
    try {
      await fs.access(conversationsDir);
    } catch {
      return NextResponse.json([]);
    }
    
    const files = await fs.readdir(conversationsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const conversations: ConversationMeta[] = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(conversationsDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const conversationData = JSON.parse(fileContent);
        
        // Extraer metadatos del archivo
        let meta: ConversationMeta;
        
        if (conversationData.meta) {
          // Formato nuevo con metadatos
          meta = conversationData.meta;
        } else {
          // Formato legacy - generar metadatos
          const modeFromFilename = file.includes('useronly') ? 'useronly' : 'live';
          const startedAt = conversationData.sessionState?.startTime || new Date().toISOString();
          const endedAt = conversationData.sessionState?.endTime || new Date().toISOString();
          
          meta = {
            id: file.replace('.json', ''),
            mode: modeFromFilename,
            startedAt,
            endedAt,
            phase: conversationData.sessionState?.currentPhase || 'descubrimiento',
            durationSec: conversationData.sessionState?.totalDuration || 0,
            language: 'es',
            participants: []
          };
        }
        
        // Filtrar por modo si se especifica
        if (mode && mode !== "all" && meta.mode !== mode) {
          continue;
        }
        
        conversations.push(meta);
      } catch (error) {
        console.error(`Error procesando archivo ${file}:`, error);
        continue;
      }
    }
    
    // Ordenar por fecha de finalización (más reciente primero)
    conversations.sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
    
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error listando conversaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}