import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const conversationData = await request.json();
    
    // Crear la carpeta de conversaciones si no existe
    const conversationsDir = join(process.cwd(), 'app', 'conversaciones');
    await mkdir(conversationsDir, { recursive: true });
    
    // Crear el nombre del archivo
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `conversation_${conversationData.id}_${timestamp}.json`;
    const filePath = join(conversationsDir, fileName);
    
    // Guardar el archivo
    await writeFile(filePath, JSON.stringify(conversationData, null, 2), 'utf-8');
    
    console.log('Conversación guardada en servidor:', fileName);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Conversación guardada exitosamente',
      fileName: fileName
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
