'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Session } from '@/lib/types'
import { CloudDownload } from 'lucide-react';

const folderStructure = `public/source/
  └── session_01/
      ├── images/
      │   ├── 001.png
      │   ├── 002.png
      │   └── ...
      └── metadatas/
          ├── 001.json
          ├── 002.json
          └── ...`

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
    <div className="p-8 mb-16">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">RELIEVA</h1>
            <span className="text-xs font-semibold bg-blue-600 px-4 py-1.5 rounded-full">
              Relief Evaluation System
            </span>
          </div>
          <h2 className="text-2xl text-gray-300 mb-2 font-medium">
            Sistem Deteksi Penggaraman pada Relief Candi Borobudur
          </h2>
          <p className="text-gray-400">
            Pilih sesi untuk melihat hasil pindai, proses stitching, dan eksplorasi 3D
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Sesi Tersedia</h2>
              <p className="text-gray-400 text-sm">
                Sesi terdeteksi di <code className="bg-gray-700 text-gray-300 px-2 py-1 rounded font-mono text-xs">public/source/</code>
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/azure"
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
              >
                <CloudDownload className="inline w-5 h-5 mr-2" />
                Unduh dari Azure
              </Link>
              <button
                onClick={fetchSessions}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Memuat...' : 'Muat Ulang Sesi'}
              </button>
            </div>
          </div>

          {/* Loading Status */}
          {loading && (
            <div className="mt-4 text-blue-400 flex items-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              Memindai sesi...
            </div>
          )}

          {/* Error Status */}
          {error && (
            <div className="mt-4 text-red-400 bg-red-900/20 border border-red-600 p-3 rounded-lg">
              Error: {error}
            </div>
          )}
        </div>

        {/* Sessions Grid */}
        {!loading && sessions.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-2xl font-bold text-white mb-2">Tidak Ada Sesi Ditemukan</h3>
            <p className="text-gray-400 mb-6">
              Tambahkan folder sesi ke <code className="bg-gray-700 text-gray-300 px-2 py-1 rounded font-mono text-xs">public/source/</code>
            </p>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-sm text-gray-400 mb-2">Struktur yang diharapkan:</p>
              <pre className="text-xs text-blue-400">
{folderStructure}
              </pre>
            </div>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session, index) => (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className={`block bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all hover:-translate-y-1 hover-lift card-enter stagger-item`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-6">
                  {/* Session Name */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                      {session.name}
                    </h3>
                    {session.status.hasOutput ? (
                      <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                        Terproses
                      </span>
                    ) : (
                      <span className="bg-yellow-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                        Belum Diproses
                      </span>
                    )}
                  </div>

                  {/* Session Stats */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Images:</span>
                      <span className="font-semibold text-white">
                        {session.imageCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Grup:</span>
                      <span className="font-semibold text-white">
                        {session.groups.length}
                      </span>
                    </div>
                    {session.status.hasOutput && (
                      <>
                        <div className="flex justify-between text-gray-400">
                          <span>Stitched Original:</span>
                          <span className="font-semibold text-blue-400">
                            {session.status.stitchedCount || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Stitched Segmentasi:</span>
                          <span className="font-semibold text-blue-400">
                            {session.status.stitchedSegmentationCount || 0}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Hint */}
                  <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400 hover:text-blue-400 transition-colors">
                    Klik untuk {session.status.hasOutput ? 'lihat hasil' : 'proses sesi'} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer Info */}
        {sessions.length > 0 && (
          <div className="mt-8 text-center text-gray-400 text-sm">
            Total: <span className="text-white font-semibold">{sessions.length}</span> sesi •{' '}
            <span className="text-green-500 font-semibold">
              {sessions.filter((s) => s.status.hasOutput).length}
            </span>{' '}
            terproses •{' '}
            <span className="text-yellow-500 font-semibold">
              {sessions.filter((s) => !s.status.hasOutput).length}
            </span>{' '}
            belum diproses
          </div>
        )}
      </div>
    </div>
  )
}