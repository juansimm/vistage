import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { filename, data } = await request.json();
    
    if (!filename || !data) {
      return NextResponse.json(
        { error: 'Missing filename or data' },
        { status: 400 }
      );
    }

    // Create knowledge directory if it doesn't exist
    const knowledgeDir = path.join(process.cwd(), 'knowledge');
    
    try {
      await mkdir(knowledgeDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Write transcript file
    const filePath = path.join(knowledgeDir, filename);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      filename,
      path: filePath
    });

  } catch (error) {
    console.error('Error saving transcript:', error);
    return NextResponse.json(
      { error: 'Failed to save transcript', details: error },
      { status: 500 }
    );
  }
}