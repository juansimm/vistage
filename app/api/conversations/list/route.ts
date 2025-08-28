import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ConversationMeta } from "@/app/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") as "live" | "useronly" | "all" | null;
    
    // Ruta a la carpeta de conversaciones
    const conversationsDir = path.join(process.cwd(), "app", "conversaciones");
    
    // Verificar si la carpeta existe
    try {
      await fs.access(conversationsDir);
    } catch {
      // Si no existe, crear la carpeta
      await fs.mkdir(conversationsDir, { recursive: true });
      return NextResponse.json([]);
    }
    
    // Leer todos los archivos JSON
    const files = await fs.readdir(conversationsDir);
    const jsonFiles = files.filter(file => file.endsWith(".json"));
    
    const conversations: ConversationMeta[] = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(conversationsDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        const conversation = JSON.parse(content);
        
        // Extraer metadatos del archivo
        if (conversation.meta) {
          // Si ya tiene metadatos, usarlos
          conversations.push(conversation.meta);
        } else {
          // Si no tiene metadatos, generarlos del nombre del archivo
          const filename = path.basename(file, ".json");
          const parts = filename.split("_");
          
          if (parts.length >= 3) {
            const modeFromFilename = parts[1] as "live" | "useronly";
            const dateTime = parts.slice(2).join("_");
            
            // Convertir fecha del formato YYYYMMDD_HHmmss a ISO
            const year = dateTime.substring(0, 4);
            const month = dateTime.substring(4, 6);
            const day = dateTime.substring(6, 8);
            const hour = dateTime.substring(9, 11);
            const minute = dateTime.substring(11, 13);
            const second = dateTime.substring(13, 15);
            
            const startedAt = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISOString();
            
            const meta: ConversationMeta = {
              id: filename,
              mode: modeFromFilename,
              startedAt,
              endedAt: startedAt, // Aproximación
              phase: "descubrimiento", // Valor por defecto
              durationSec: conversation.duration || 0,
              language: "es",
              participants: ["Usuario", "Vistage AI"]
            };
            
            conversations.push(meta);
          }
        }
      } catch (error) {
        console.error(`Error procesando archivo ${file}:`, error);
        continue;
      }
    }
    
    // Filtrar por modo si se especifica
    let filteredConversations = conversations;
    if (mode && mode !== "all") {
      filteredConversations = conversations.filter(conv => conv.mode === mode);
    }
    
    // Ordenar por fecha de finalización (más reciente primero)
    filteredConversations.sort((a, b) => 
      new Date(b.endedAt).getTime() - new Date(a.startedAt).getTime()
    );
    
    return NextResponse.json(filteredConversations);
    
  } catch (error) {
    console.error("Error al listar conversaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
