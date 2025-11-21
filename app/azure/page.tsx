'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '@/components/PageWrapper';

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

// API Functions
const fetchSessions = async (): Promise<{ success: boolean; sessions: AzureSession[]; count: number }> => {
  const response = await fetch('/api/azure/sessions');
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch sessions');
  }
  return data;
};

const fetchSessionStatus = async (sessionId: string): Promise<SessionStatus> => {
  const response = await fetch(`/api/azure/sessions/${sessionId}/status`);
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data.status;
};

const downloadSessionAPI = async ({ sessionId, overwrite }: { sessionId: string; overwrite: boolean }) => {
  const response = await fetch(`/api/azure/sessions/${sessionId}/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ overwrite }),
  });

  const data = await response.json();

  if (!data.success) {
    if (data.requiresConfirmation) {
      return { requiresConfirmation: true, sessionId };
    }
    throw new Error(data.message);
  }

  return data;
};

export default function AzureSessionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmSessionId, setConfirmSessionId] = useState<string | null>(null);
  const [statusLoadingMap, setStatusLoadingMap] = useState<Record<string, boolean>>({});

  // Track session mana yang sudah di-fetch statusnya (untuk display)
  const [displayedStatusMap, setDisplayedStatusMap] = useState<Record<string, SessionStatus>>({});

  // Query untuk fetch sessions
  const {
    data: response,
    isLoading: loading,
    error,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['azure-sessions'],
    queryFn: fetchSessions,
  });

  // Debug: log response structure
  console.log('Azure API Response:', response);

  const sessions = response?.sessions || [];

  // Mutation untuk download session
  const downloadMutation = useMutation({
    mutationFn: downloadSessionAPI,
    onSuccess: (data, variables) => {
      if (data.requiresConfirmation) {
        setConfirmSessionId(variables.sessionId);
        setShowConfirmModal(true);
        return;
      }
      alert(`✅ ${data.message}`);
      router.push(`/session/${variables.sessionId}`);
    },
    onError: (err: Error) => {
      alert(`❌ Error: ${err.message || 'Failed to download'}`);
    },
  });

  // Fungsi untuk fetch status individual session dengan caching
  const handleFetchSessionStatus = async (sessionId: string) => {
    setStatusLoadingMap(prev => ({ ...prev, [sessionId]: true }));

    try {
      // Cek cache dulu
      const cachedStatus = queryClient.getQueryData<SessionStatus>(['session-status', sessionId]);

      if (cachedStatus) {
        // Jika ada di cache, langsung gunakan tanpa fetch lagi
        console.log(`✓ Using cached status for session ${sessionId}`);
        setDisplayedStatusMap(prev => ({ ...prev, [sessionId]: cachedStatus }));
        setStatusLoadingMap(prev => ({ ...prev, [sessionId]: false }));
        return;
      }

      // Jika tidak ada di cache, fetch dari server
      console.log(`⟳ Fetching status from server for session ${sessionId}`);
      const status = await queryClient.fetchQuery({
        queryKey: ['session-status', sessionId],
        queryFn: () => fetchSessionStatus(sessionId),
        staleTime: 5 * 60 * 1000, // Cache selama 5 menit
      });

      // Simpan ke displayed map setelah fetch
      setDisplayedStatusMap(prev => ({ ...prev, [sessionId]: status }));
      console.log(`✓ Fetched and cached status for session ${sessionId}`, status);
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      setStatusLoadingMap(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  // Fungsi download
  const handleDownloadSession = (sessionId: string, overwrite = false) => {
    downloadMutation.mutate({ sessionId, overwrite });
  };

  // Handle overwrite confirmation
  const handleConfirmOverwrite = () => {
    if (confirmSessionId) {
      setShowConfirmModal(false);
      handleDownloadSession(confirmSessionId, true);
      setConfirmSessionId(null);
    }
  };

  const handleCancelOverwrite = () => {
    setShowConfirmModal(false);
    setConfirmSessionId(null);
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Memuat sesi dari database...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
            <h2 className="text-red-500 text-xl font-bold mb-2">Error</h2>
            <p className="text-gray-300 mb-4">{(error as Error).message}</p>
            <p className="text-gray-400 text-sm mb-4">
              Pastikan MongoDB telah dikonfigurasi dengan benar di environment variable MONGODB_URI.
            </p>
            <button
              onClick={() => refetchSessions()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sesi Azure</h1>
          <p className="text-gray-400">
            Unduh sesi dari Azure Storage ke lokal (dengan caching otomatis)
          </p>
        </div>

        {/* Main Content */}
        <div>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                Tidak ada sesi yang ditemukan di database
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => {
                const azureStatus = displayedStatusMap[session.sessionId];
                const isLoadingStatus = statusLoadingMap[session.sessionId];
                const isCached = !!queryClient.getQueryData(['session-status', session.sessionId]);

                return (
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
                      {azureStatus ? (
                        <>
                          <p className="font-medium mb-2 text-green-400 flex items-center gap-2">
                            {isCached && <span className="text-xs">⚡</span>}
                            Status Azure {isCached && <span className="text-xs opacity-70"></span>}:
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-gray-400 text-xs">
                            <div>
                              <span className="text-gray-500">Images:</span>{' '}
                              <span className="font-semibold text-white">
                                {azureStatus.image_count}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Metadata:</span>{' '}
                              <span className="font-semibold text-white">
                                {azureStatus.metadata_count}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Konsisten:</span>{' '}
                              {azureStatus.is_consistent ? (
                                <span className="text-green-400 font-semibold">
                                  ✅ Ya
                                </span>
                              ) : (
                                <span className="text-red-400 font-semibold">
                                  ❌ Tidak
                                </span>
                              )}
                            </div>
                            {!azureStatus.is_consistent && (
                              <div className="col-span-2 text-red-400 text-xs mt-1">
                                Hilang: {azureStatus.missing_images.length}{' '}
                                images, {azureStatus.missing_metadata.length}{' '}
                                metadata
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          {isLoadingStatus ? (
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
                          handleFetchSessionStatus(session.sessionId);
                        }}
                        disabled={isLoadingStatus}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 rounded text-sm transition"
                      >
                        {isLoadingStatus ? 'Memuat...' : isCached && azureStatus ? '⚡ Refresh (Cached)' : 'Lihat Detail'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSession(session.sessionId);
                        }}
                        disabled={downloadMutation.isPending && downloadMutation.variables?.sessionId === session.sessionId}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 px-3 py-2 rounded text-sm font-medium transition"
                      >
                        {downloadMutation.isPending && downloadMutation.variables?.sessionId === session.sessionId
                          ? 'Mengunduh...'
                          : 'Unduh'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
      </div>
    </PageWrapper>
  );
}