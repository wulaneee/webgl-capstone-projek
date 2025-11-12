'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AzureSession {
  sessionId: string;
  completedAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionStatus {
  session_id: string;
  image_count: number;
  metadata_count: number;
  is_consistent: boolean;
  missing_metadata: string[];
  missing_images: string[];
}

interface SessionWithStatus extends AzureSession {
  azureStatus?: SessionStatus;
  loadingStatus?: boolean;
}

export default function AzureSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmSessionId, setConfirmSessionId] = useState<string | null>(null);

  // Fetch sessions from MongoDB
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/azure/sessions');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Azure status for a specific session
  const fetchSessionStatus = async (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.sessionId === sessionId ? { ...s, loadingStatus: true } : s
      )
    );

    try {
      const response = await fetch(`/api/azure/sessions/${sessionId}/status`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId
            ? { ...s, azureStatus: data.status, loadingStatus: false }
            : s
        )
      );
    } catch (err) {
      console.error('Error fetching status:', err);
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId ? { ...s, loadingStatus: false } : s
        )
      );
    }
  };

  // Download session
  const downloadSession = async (sessionId: string, overwrite = false) => {
    try {
      setDownloading(sessionId);

      const response = await fetch(
        `/api/azure/sessions/${sessionId}/download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ overwrite }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        // Check if requires confirmation
        if (data.requiresConfirmation) {
          setConfirmSessionId(sessionId);
          setShowConfirmModal(true);
          setDownloading(null);
          return;
        }
        throw new Error(data.message);
      }

      // Success - redirect to session detail page
      alert(`✅ ${data.message}`);
      router.push(`/session/${sessionId}`);
    } catch (err) {
      alert(
        `❌ Error: ${err instanceof Error ? err.message : 'Failed to download'}`
      );
    } finally {
      setDownloading(null);
    }
  };

  // Handle overwrite confirmation
  const handleConfirmOverwrite = async () => {
    if (confirmSessionId) {
      setShowConfirmModal(false);
      await downloadSession(confirmSessionId, true);
      setConfirmSessionId(null);
    }
  };

  const handleCancelOverwrite = () => {
    setShowConfirmModal(false);
    setConfirmSessionId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat sesi dari database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-red-500 text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={fetchSessions}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sesi Azure</h1>
            <p className="text-gray-400">
              Unduh sesi dari Azure Storage ke lokal
            </p>
          </div>
          <Link
            href="/"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
          >
            ← Kembali
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Tidak ada sesi yang ditemukan di database
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className={`bg-gray-800 rounded-lg border ${
                  selectedSession === session.sessionId
                    ? 'border-blue-500'
                    : 'border-gray-700'
                } p-6 hover:border-gray-600 transition cursor-pointer flex flex-col h-[320px]`}
                onClick={() => setSelectedSession(session.sessionId)}
              >
                {/* Session Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-blue-400">
                    {session.sessionId}
                  </h3>
                  <span className="bg-green-600 text-xs px-2 py-1 rounded">
                    {session.status}
                  </span>
                </div>

                {/* Metadata */}
                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  <p>
                    <span className="font-medium">Selesai:</span>{' '}
                    {new Date(session.completedAt).toLocaleString('id-ID')}
                  </p>
                  <p>
                    <span className="font-medium">Dibuat:</span>{' '}
                    {new Date(session.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Azure Status - Always show space */}
                <div className="bg-gray-900 rounded p-3 mb-4 text-sm flex-grow">
                  {session.azureStatus ? (
                    <>
                      <p className="font-medium mb-2">Status Azure:</p>
                      <div className="grid grid-cols-2 gap-2 text-gray-400 text-xs">
                        <div>
                          <span className="text-gray-500">Images:</span>{' '}
                          <span className="font-semibold text-white">
                            {session.azureStatus.image_count}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Metadata:</span>{' '}
                          <span className="font-semibold text-white">
                            {session.azureStatus.metadata_count}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Konsisten:</span>{' '}
                          {session.azureStatus.is_consistent ? (
                            <span className="text-green-400 font-semibold">
                              ✅ Ya
                            </span>
                          ) : (
                            <span className="text-red-400 font-semibold">
                              ❌ Tidak
                            </span>
                          )}
                        </div>
                        {!session.azureStatus.is_consistent && (
                          <div className="col-span-2 text-red-400 text-xs mt-1">
                            Hilang: {session.azureStatus.missing_images.length}{' '}
                            images, {session.azureStatus.missing_metadata.length}{' '}
                            metadata
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      {session.loadingStatus ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                          <span>Memuat...</span>
                        </div>
                      ) : (
                        <span>Klik "Lihat Detail" untuk info lebih lanjut</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchSessionStatus(session.sessionId);
                    }}
                    disabled={session.loadingStatus}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 rounded text-sm transition"
                  >
                    {session.loadingStatus ? 'Memuat...' : 'Lihat Detail'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadSession(session.sessionId);
                    }}
                    disabled={downloading === session.sessionId}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 px-3 py-2 rounded text-sm font-medium transition"
                  >
                    {downloading === session.sessionId
                      ? 'Mengunduh...'
                      : 'Unduh'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Sesi Sudah Ada</h3>
            <p className="text-gray-400 mb-6">
              Sesi <span className="text-blue-400">{confirmSessionId}</span>{' '}
              sudah ada di lokal. Apakah Anda ingin menimpanya?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelOverwrite}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmOverwrite}
                className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
              >
                Timpa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
