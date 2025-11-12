import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Session from '@/lib/models/Session';

/**
 * GET /api/azure/sessions
 * Fetch all completed sessions from MongoDB
 */
export async function GET() {
  try {
    await connectDB();

    const sessions = await Session.find({ status: 'completed' })
      .sort({ completedAt: -1 }) // Most recent first
      .lean();

    return NextResponse.json({
      success: true,
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        completedAt: session.completedAt,
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
      count: sessions.length,
    });
  } catch (error) {
    console.error('Error fetching sessions from MongoDB:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch sessions from database',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
