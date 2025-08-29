import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '');
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for Deepgram
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        language: 'es',
        smart_format: true,
        punctuate: true,
        utterances: true,
        diarize: true,
      }
    );

    if (error) {
      console.error('Deepgram error:', error);
      return NextResponse.json(
        { error: 'STT processing failed', details: error },
        { status: 500 }
      );
    }

    // Extract transcript and confidence
    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript || '';
    const confidence = result.results?.channels[0]?.alternatives[0]?.confidence || 0;

    return NextResponse.json({
      transcript,
      confidence,
      metadata: {
        duration: result.metadata?.duration || 0,
        channels: result.metadata?.channels || 1,
        model: 'deepgram-nova-2',
        language: 'es',
        utterances: result.results?.utterances || [],
        words: result.results?.channels[0]?.alternatives[0]?.words || []
      }
    });

  } catch (error) {
    console.error('Error processing speech-to-text:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}