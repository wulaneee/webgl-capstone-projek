import { NextResponse } from 'next/server';
import {
  downloadAndExtractSession,
  checkSessionExists,
} from '@/lib/azure-downloader';

/**
 * POST /api/azure/sessions/[sessionId]/download
 * Download session from Azure and extract to local storage
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Session ID is required',
        },
        { status: 400 }
      );
    }

    // Parse request body for overwrite option
    const body = await request.json();
    const { overwrite = false } = body;

    // Check if session exists locally (if not overwriting)
    if (!overwrite) {
      const exists = checkSessionExists(sessionId);
      if (exists) {
        return NextResponse.json(
          {
            success: false,
            message: 'Session already exists locally',
            requiresConfirmation: true,
            sessionId,
          },
          { status: 409 } // Conflict
        );
      }
    }

    // Download and extract
    const result = await downloadAndExtractSession(sessionId, overwrite);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      sessionId,
      sessionPath: result.sessionPath,
    });
  } catch (error) {
    console.error('Error downloading session from Azure:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to download session',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
