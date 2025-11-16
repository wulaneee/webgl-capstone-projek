import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Session from '@/lib/models/Session';

/**
 * GET /api/azure/sessions
 * Fetch all completed sessions from MongoDB
 */
export async function GET() {
  try {
    // Check if MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        success: false,
        message: 'MongoDB URI not configured. Please set MONGODB_URI environment variable.',
        sessions: [],
        count: 0,
      });
    }

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
        sessions: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
