import { NextResponse } from 'next/server';
import { fetchSessionStatus } from '@/lib/azure-downloader';

/**
 * GET /api/azure/sessions/[sessionId]/status
 * Fetch session status from Azure API
 */
export async function GET(
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

    const status = await fetchSessionStatus(sessionId);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error fetching session status from Azure:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch session status from Azure',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
