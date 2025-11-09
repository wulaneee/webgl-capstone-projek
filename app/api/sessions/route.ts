import { NextResponse } from 'next/server';
import { getAllSessions } from '@/lib/session-utils';

/**
 * GET /api/sessions
 * Returns a list of all available sessions in public/source
 */
export async function GET() {
  try {
    const sessions = getAllSessions();

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
