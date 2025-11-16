import { NextResponse } from 'next/server';
import { getSessionDetails, getStitchedOutputs } from '@/lib/session-utils';

/**
 * GET /api/sessions/[sessionId]
 * Returns detailed information about a specific session
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = getSessionDetails(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
          message: `Session "${sessionId}" does not exist or is invalid`,
        },
        { status: 404 }
      );
    }

    // Get stitched outputs if available
    let outputs = null;
    if (session.status.hasOutput) {
      outputs = getStitchedOutputs(sessionId);
    }

    return NextResponse.json({
      success: true,
      session,
      outputs,
    });
  } catch (error) {
    console.error('Error fetching session details:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch session details',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
