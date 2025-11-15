'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Session, StitchingVersion } from '@/lib/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// API Functions
const fetchSessionDetails = async (sessionId: string) => {
  const response = await fetch(`/api/sessions/${sessionId}`)
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch session details')
  }

  return {
    session: data.session as Session,
    outputs: data.outputs as { original: string[]; segmented: string[] } | null
  }
}

const processStitching = async (sessionId: string) => {
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

  return data
}

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const sessionId = params.sessionId as string

  // Version selection
  const [selectedVersion, setSelectedVersion] = useState<StitchingVersion>('original')

  // Query untuk fetch session details dengan caching
  const {
    data,
    isLoading: loading,
    error,
    refetch: refetchSession
  } = useQuery({
    queryKey: ['session-detail', sessionId],
    queryFn: () => fetchSessionDetails(sessionId),
    staleTime: 3 * 60 * 1000, // Data fresh selama 3 menit
    gcTime: 10 * 60 * 1000, // Cache disimpan 10 menit
  })

  const session = data?.session
  const outputs = data?.outputs

  // Mutation untuk stitching
  const stitchingMutation = useMutation({
    mutationFn: () => processStitching(sessionId),
    onSuccess: () => {
      // Invalidate dan refetch session data setelah stitching berhasil
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['session-detail', sessionId] })
      }, 1000)
    },
  })

  const handleProcessStitching = () => {
    stitchingMutation.mutate()
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
          <h2 className="text-2xl font-bold mb-2">Sesi Tidak Ditemukan</h2>
          <p className="text-gray-400 mb-6">{(error as Error)?.message}</p>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold inline-block"
          >
            Kembali ke Beranda
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
              ← Kembali ke Daftar Sesi
            </Link>
            <div className="flex items-start justify-between mt-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{session.name}</h1>
                <p className="text-gray-400">
                  {session.imageCount} images • {session.groups.length} grup
                </p>
              </div>
              {session.status.hasOutput ? (
                <span className="bg-green-600 text-white px-4 py-2 rounded-full font-semibold">
                  ✓ Terproses
                </span>
              ) : (
                <span className="bg-yellow-600 text-white px-4 py-2 rounded-full font-semibold">
                  ⏳ Belum Diproses
                </span>
              )}
            </div>
          </div>

          {/* Processing Section */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Proses Stitching</h2>

            <div className="flex items-center gap-4">
              <button
                onClick={handleProcessStitching}
                disabled={session.status.hasOutput || stitchingMutation.isPending}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {stitchingMutation.isPending ? 'Memproses...' : 'Proses Stitching'}
              </button>

              {session.status.hasOutput && (
                <span className="text-gray-400 text-sm">
                  Sudah diproses. Hapus folder output untuk memproses ulang.
                </span>
              )}
            </div>

            {/* Progress Messages */}
            {stitchingMutation.isPending && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-600 rounded text-blue-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                  Processing...
                </div>
                <div className="text-sm">Starting stitching process...</div>
              </div>
            )}

            {stitchingMutation.isSuccess && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded text-green-300">
                <strong>✓ Success:</strong> Stitching completed successfully!
              </div>
            )}

            {stitchingMutation.isError && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-600 rounded text-red-300">
                <strong>Error:</strong> {(stitchingMutation.error as Error)?.message || 'Stitching failed'}
              </div>
            )}
          </div>

          {/* Images Gallery */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Images Sumber</h2>

            {/* Group by group_id */}
            {session.groups.map((group) => (
              <div key={group.group_id} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-blue-400">
                  Grup {group.group_id} ({group.images.length} images)
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
              <h2 className="text-2xl font-bold mb-6">Hasil Stitching</h2>

              {/* Version Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-400">
                  Pilih Versi untuk Viewer WebGL:
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
                    Stitching Original
                  </button>
                  <button
                    onClick={() => setSelectedVersion('segmented')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedVersion === 'segmented'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Stitching Segmentasi
                  </button>
                </div>
              </div>

              {/* Display Selected Version */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Original Version */}
                {outputs.original.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-400">
                      Versi Original ({outputs.original.length} images)
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
                            alt={`Stitched Original ${idx + 1}`}
                            className="w-full h-auto"
                          />
                          <div className="bg-gray-700 p-2 text-sm">
                            Grup {idx + 1}
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
                      Versi Segmentasi ({outputs.segmented.length} images)
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
                            alt={`Stitched Segmentasi ${idx + 1}`}
                            className="w-full h-auto"
                          />
                          <div className="bg-gray-700 p-2 text-sm">
                            Grup {idx + 1}
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
                  Buka Viewer WebGL ({selectedVersion === 'original' ? 'Original' : 'Segmentasi'})
                </button>
              </div>

              <p className="text-center text-gray-400 text-sm mt-4">
                Anda dapat berganti versi di dalam viewer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
