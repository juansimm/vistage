import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ConversationFile, ConversationMeta, ConvMessage } from '@/app/lib/types';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Crear la carpeta de conversaciones si no existe
    const conversationsDir = join(process.cwd(), 'app', 'conversaciones');
    await mkdir(conversationsDir, { recursive: true });
    
    let conversationFile: ConversationFile;
    let fileName: string;
    
    // Verificar si es el nuevo formato con metadatos
    if (data.meta && data.messages) {
      conversationFile = data;
      fileName = `${data.meta.id}.json`;
    } else {
      // Formato legacy - convertir al nuevo formato
      const mode = data.userTalkOnly ? "useronly" : "live";
      const now = new Date().toISOString();
      const startedAt = data.sessionState?.startTime || now;
      const endedAt = data.sessionState?.endTime || now;
      
      const meta: ConversationMeta = {
        id: `conversation_${mode}_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_')}`,
        mode,
        startedAt,
        endedAt,
        phase: data.sessionState?.currentPhase || 'descubrimiento',
        durationSec: data.sessionState?.totalDuration || 0,
        language: 'es',
        participants: []
      };
      
      const messages: ConvMessage[] = data.messages?.map((msg: any) => ({
        id: msg.id || Date.now().toString(),
        role: msg.role as "user" | "assistant" | "system",
        text: msg.content || msg.text || '',
        ts: msg.timestamp || new Date().toISOString(),
        audio: msg.audio,
        voice: msg.voice
      })) || [];
      
      conversationFile = { meta, messages };
      fileName = `${meta.id}.json`;
    }
    
    const filePath = join(conversationsDir, fileName);
    
    // Guardar el archivo
    await writeFile(filePath, JSON.stringify(conversationFile, null, 2), 'utf-8');
    
    console.log('Conversación guardada en servidor:', fileName);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conversación guardada exitosamente',
      fileName: fileName,
      meta: conversationFile.meta
    });
    
  } catch (error) {
    console.error('Error al guardar la conversación en servidor:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al guardar la conversación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
