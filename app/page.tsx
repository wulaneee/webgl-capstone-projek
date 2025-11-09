'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Session } from '@/lib/types'

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch sessions on page load
  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/sessions')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch sessions')
      }

      setSessions(data.sessions)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      setError((err as Error).message || 'Failed to fetch sessions')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">WebGL Panorama Stitcher</h1>
            <p className="text-gray-400">
              Select a session to view images, process stitching, and explore in 3D
            </p>
          </div>

          {/* Control Panel */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-1">Available Sessions</h2>
                <p className="text-gray-400 text-sm">
                  Sessions detected in <code className="bg-gray-700 px-2 py-1 rounded">public/source/</code>
                </p>
              </div>
              <button
                onClick={fetchSessions}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh Sessions'}
              </button>
            </div>

            {/* Loading Status */}
            {loading && (
              <div className="mt-4 text-blue-400 flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                Scanning for sessions...
              </div>
            )}

            {/* Error Status */}
            {error && (
              <div className="mt-4 text-red-400 bg-red-900/20 p-3 rounded">
                Error: {error}
              </div>
            )}
          </div>

          {/* Sessions Grid */}
          {!loading && sessions.length === 0 && (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-2xl font-bold mb-2">No Sessions Found</h3>
              <p className="text-gray-400 mb-6">
                Add session folders to <code className="bg-gray-700 px-2 py-1 rounded">public/source/</code>
              </p>
              <div className="bg-gray-900 rounded p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-400 mb-2">Expected structure:</p>
                <pre className="text-xs text-green-400">
{`public/source/
  └── session_01/
      ├── images/
      │   ├── 001.png
      │   ├── 002.png
      │   └── ...
      └── metadatas/
          ├── 001.json
          ├── 002.json
          └── ...`}
                </pre>
              </div>
            </div>
          )}

          {!loading && sessions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/session/${session.id}`}
                  className="block bg-gray-800 hover:bg-gray-750 rounded-lg overflow-hidden transition-all hover:shadow-xl hover:scale-105"
                >
                  <div className="p-6">
                    {/* Session Name */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">
                        {session.name}
                      </h3>
                      {session.status.hasOutput ? (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          Processed
                        </span>
                      ) : (
                        <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          Unprocessed
                        </span>
                      )}
                    </div>

                    {/* Session Stats */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>Images:</span>
                        <span className="font-semibold text-white">
                          {session.imageCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Groups:</span>
                        <span className="font-semibold text-white">
                          {session.groups.length}
                        </span>
                      </div>
                      {session.status.hasOutput && (
                        <>
                          <div className="flex justify-between text-gray-300">
                            <span>Original Stitched:</span>
                            <span className="font-semibold text-green-400">
                              {session.status.stitchedCount || 0}
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-300">
                            <span>Segmented Stitched:</span>
                            <span className="font-semibold text-green-400">
                              {session.status.stitchedSegmentationCount || 0}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Hint */}
                    <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
                      Click to {session.status.hasOutput ? 'view results' : 'process session'} →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Footer Info */}
          {sessions.length > 0 && (
            <div className="mt-8 text-center text-gray-400 text-sm">
              Total: <span className="text-white font-semibold">{sessions.length}</span> session(s) •{' '}
              <span className="text-green-400 font-semibold">
                {sessions.filter((s) => s.status.hasOutput).length}
              </span>{' '}
              processed •{' '}
              <span className="text-yellow-400 font-semibold">
                {sessions.filter((s) => !s.status.hasOutput).length}
              </span>{' '}
              unprocessed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
