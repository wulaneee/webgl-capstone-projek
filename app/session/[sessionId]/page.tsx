'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Session, StitchingVersion } from '@/lib/types'

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<Session | null>(null)
  const [outputs, setOutputs] = useState<{ original: string[]; segmented: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Stitching states
  const [stitching, setStitching] = useState(false)
  const [stitchingProgress, setStitchingProgress] = useState('')
  const [stitchingError, setStitchingError] = useState('')

  // Version selection
  const [selectedVersion, setSelectedVersion] = useState<StitchingVersion>('original')

  // Fetch session details
  useEffect(() => {
    fetchSessionDetails()
  }, [sessionId])

  const fetchSessionDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/sessions/${sessionId}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch session details')
      }

      setSession(data.session)
      setOutputs(data.outputs)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch session details:', err)
      setError((err as Error).message || 'Failed to fetch session details')
      setLoading(false)
    }
  }

  const handleProcessStitching = async () => {
    try {
      setStitching(true)
      setStitchingProgress('Starting stitching process...')
      setStitchingError('')

      const response = await fetch(`/api/sessions/${sessionId}/stitch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Stitching failed')
      }

      setStitchingProgress('Stitching completed successfully!')

      // Refresh session data to show outputs
      setTimeout(() => {
        fetchSessionDetails()
        setStitching(false)
        setStitchingProgress('')
      }, 1000)
    } catch (err) {
      console.error('Stitching error:', err)
      setStitchingError((err as Error).message || 'Stitching failed')
      setStitching(false)
    }
  }

  const openWebGLViewer = () => {
    // Navigate to viewer with session and version params
    router.push(`/viewer?session=${sessionId}&version=${selectedVersion}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl">Loading session...</div>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Back Button */}
          <div className="mb-8">
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 mb-4 inline-flex items-center gap-2"
            >
              ← Back to Sessions
            </Link>
            <div className="flex items-start justify-between mt-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{session.name}</h1>
                <p className="text-gray-400">
                  {session.imageCount} images • {session.groups.length} groups
                </p>
              </div>
              {session.status.hasOutput ? (
                <span className="bg-green-600 text-white px-4 py-2 rounded-full font-semibold">
                  ✓ Processed
                </span>
              ) : (
                <span className="bg-yellow-600 text-white px-4 py-2 rounded-full font-semibold">
                  ⏳ Unprocessed
                </span>
              )}
            </div>
          </div>

          {/* Processing Section */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Stitching Process</h2>

            <div className="flex items-center gap-4">
              <button
                onClick={handleProcessStitching}
                disabled={session.status.hasOutput || stitching}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {stitching ? 'Processing...' : 'Process Stitching'}
              </button>

              {session.status.hasOutput && (
                <span className="text-gray-400 text-sm">
                  Already processed. Delete output folder to reprocess.
                </span>
              )}
            </div>

            {/* Progress Messages */}
            {stitching && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-600 rounded text-blue-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                  Processing...
                </div>
                <div className="text-sm">{stitchingProgress}</div>
              </div>
            )}

            {stitchingError && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-600 rounded text-red-300">
                <strong>Error:</strong> {stitchingError}
              </div>
            )}
          </div>

          {/* Images Gallery */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Source Images</h2>

            {/* Group by group_id */}
            {session.groups.map((group) => (
              <div key={group.group_id} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-blue-400">
                  Group {group.group_id} ({group.images.length} images)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {group.images.map((image) => (
                    <div
                      key={image.filename}
                      className="bg-gray-700 rounded-lg overflow-hidden"
                    >
                      <img
                        src={image.path}
                        alt={image.filename}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src =
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgemlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIxMDAiIHk9Ijc1IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+'
                        }}
                      />
                      <div className="p-2">
                        <div className="text-xs font-semibold truncate">
                          {image.filename}
                        </div>
                        {image.metadata && (
                          <div className="text-xs text-gray-400">
                            Photo ID: {image.metadata.photo_id}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Stitching Results */}
          {session.status.hasOutput && outputs && (
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">Stitching Results</h2>

              {/* Version Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-400">
                  Select Version for WebGL Viewer:
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedVersion('original')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedVersion === 'original'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Original Stitching
                  </button>
                  <button
                    onClick={() => setSelectedVersion('segmented')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedVersion === 'segmented'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Segmented Stitching
                  </button>
                </div>
              </div>

              {/* Display Selected Version */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Original Version */}
                {outputs.original.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-400">
                      Original Version ({outputs.original.length} images)
                    </h3>
                    <div className="space-y-4">
                      {outputs.original.map((imgPath, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg overflow-hidden ${
                            selectedVersion === 'original'
                              ? 'ring-4 ring-blue-500'
                              : 'opacity-70'
                          }`}
                        >
                          <img
                            src={imgPath}
                            alt={`Original Stitched ${idx + 1}`}
                            className="w-full h-auto"
                          />
                          <div className="bg-gray-700 p-2 text-sm">
                            Group {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Segmented Version */}
                {outputs.segmented.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-purple-400">
                      Segmented Version ({outputs.segmented.length} images)
                    </h3>
                    <div className="space-y-4">
                      {outputs.segmented.map((imgPath, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg overflow-hidden ${
                            selectedVersion === 'segmented'
                              ? 'ring-4 ring-blue-500'
                              : 'opacity-70'
                          }`}
                        >
                          <img
                            src={imgPath}
                            alt={`Segmented Stitched ${idx + 1}`}
                            className="w-full h-auto"
                          />
                          <div className="bg-gray-700 p-2 text-sm">
                            Group {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* WebGL Viewer Button */}
              <div className="flex justify-center">
                <button
                  onClick={openWebGLViewer}
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition-colors flex items-center gap-3"
                >
                  <span>🎮</span>
                  Open WebGL Viewer ({selectedVersion === 'original' ? 'Original' : 'Segmented'})
                </button>
              </div>

              <p className="text-center text-gray-400 text-sm mt-4">
                You can toggle between versions inside the viewer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
