import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ConversationFile } from "@/app/lib/types";

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
    
    // Ruta al archivo de conversación
    const conversationsDir = path.join(process.cwd(), "app", "conversaciones");
    const filePath = path.join(conversationsDir, `${id}.json`);
    
    // Verificar si el archivo existe
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: "Conversación no encontrada" },
        { status: 404 }
      );
    }
    
    // Leer y parsear el archivo
    const content = await fs.readFile(filePath, "utf-8");
    const conversation: ConversationFile = JSON.parse(content);
    
    // Validar estructura básica
    if (!conversation.meta || !conversation.messages) {
      return NextResponse.json(
        { error: "Formato de conversación inválido" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(conversation);
    
  } catch (error) {
    console.error("Error al cargar conversación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
