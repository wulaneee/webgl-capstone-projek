'use client'

import { useState, useEffect } from 'react'

interface ImageData {
  id: number
  filename: string
  path: string
}

export default function Home() {
  const [detectedImages, setDetectedImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Auto-detect images saat halaman dibuka
  useEffect(() => {
    detectImages()
  }, [])

  const detectImages = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('=== Starting Image Detection ===')
      
      // Manual image list - SEMUA 4 GAMBAR
      const manualImages: ImageData[] = [
        { 
          id: 1, 
          filename: 'stitched_group_1.jpg', 
          path: '/session_01/output/stitched_group_1.jpg' 
        },
        { 
          id: 2, 
          filename: 'stitched_group_2.jpg', 
          path: '/session_01/output/stitched_group_2.jpg' 
        },
        { 
          id: 3, 
          filename: 'stitched_group_3.jpg', 
          path: '/session_01/output/stitched_group_3.jpg' 
        },
        { 
          id: 4, 
          filename: 'stitched_group_4.jpg', 
          path: '/session_01/output/stitched_group_4.jpg' 
        }
      ]

      // Test apakah gambar bisa diload
      const testImage = new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => reject(new Error('Cannot access image files'))
        img.src = manualImages[0].path
      })

      await testImage
      
      console.log(`Found ${manualImages.length} images:`, manualImages)
      
      setDetectedImages(manualImages)
      setLoading(false)
      
    } catch (err) {
      console.error('Failed to detect images:', err)
      setError((err as Error).message || 'Failed to detect images')
      setLoading(false)
    }
  }

  const openViewer = () => {
    if (detectedImages.length === 0) {
      setError('No images detected. Please detect images first.')
      return
    }
    
    // Open viewer in new window
    window.open('/viewer', '_blank', 'width=1200,height=800')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">WebGL Panorama Viewer</h1>
          
          {/* Control Panel */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex gap-4">
              <button
                onClick={detectImages}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Refresh Images
              </button>
              
              {detectedImages.length > 0 && (
                <button
                  onClick={openViewer}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                >
                  Open WebGL Viewer
                </button>
              )}
            </div>
            
            {/* Loading Status */}
            {loading && (
              <div className="text-blue-400 flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                Detecting images...
              </div>
            )}
            
            {/* Error Status */}
            {error && (
              <div className="text-red-400 bg-red-900/20 p-3 rounded">
                Error: {error}
              </div>
            )}
          </div>
        </div>

        {/* Image Preview Section */}
        {detectedImages.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Available Stitched Images</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {detectedImages.map((img) => (
                <div key={img.id} className="bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={img.path}
                    alt={img.filename}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgemlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIxMDAiIHk9Ijc1IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+'
                    }}
                  />
                  <div className="p-3">
                    <div className="font-semibold">{img.filename}</div>
                    <div className="text-sm text-gray-400">Group ID: {img.id}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-gray-400">
              <span className="text-xl font-bold text-white">{detectedImages.length}</span> images found
            </div>
          </div>
        )}
      </div>
    </div>
  )
}