'use client'

import { useState, useEffect, useRef } from 'react'

interface ImageData {
  id: number
  filename: string
  path: string
}

export default function Home() {
  const [detectedImages, setDetectedImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showViewer, setShowViewer] = useState(false)
  
  // WebGL states
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [webglLoading, setWebglLoading] = useState(false)
  const [webglError, setWebglError] = useState('')
  const [imageCount, setImageCount] = useState(0)
  const rendererRef = useRef<any>(null)

  // Auto-detect images saat halaman dibuka
  useEffect(() => {
    detectImages()
  }, [])

  const detectImages = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('=== Starting Image Detection ===')
      
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

  const openViewer = async () => {
    if (detectedImages.length === 0) {
      setError('No images detected. Please detect images first.')
      return
    }
    
    setShowViewer(true)
    
    // Load WebGL setelah viewer ditampilkan
    setTimeout(() => {
      initWebGL()
    }, 100)
  }

  const closeViewer = () => {
    // Cleanup renderer
    if (rendererRef.current && rendererRef.current.dispose) {
      rendererRef.current.dispose()
    }
    
    setShowViewer(false)
    setWebglLoading(false)
    setWebglError('')
  }

  const initWebGL = async () => {
    // CEK APAKAH SCRIPT SUDAH DI-LOAD SEBELUMNYA
    const scriptsAlreadyLoaded = typeof (window as any).Renderer !== 'undefined'
    
    const loadScripts = async () => {
      try {
        // Jika script sudah di-load, skip loading
        if (scriptsAlreadyLoaded) {
          console.log('Scripts already loaded, skipping...')
          await initializeWebGL()
          return
        }

        console.log('Loading WebGL scripts...')
        
        const scripts = [
          '/webgl/js/webgl-utils.js',
          '/webgl/js/shaders.js',
          '/webgl/js/geometry.js',
          '/webgl/js/grid.js',
          '/webgl/js/texture-loader.js',
          '/webgl/js/camera.js',
          '/webgl/js/config.js',
          '/webgl/js/renderer.js'
        ]

        for (const src of scripts) {
          // CEK apakah script dengan src ini sudah ada
          const existingScript = document.querySelector(`script[src="${src}"]`)
          
          if (existingScript) {
            console.log(`Script already exists: ${src}`)
            continue
          }

          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = src
            script.onload = resolve
            script.onerror = () => reject(new Error(`Failed to load ${src}`))
            document.body.appendChild(script)
          })
          console.log(`Loaded: ${src}`)
        }

        await initializeWebGL()
        
      } catch (err) {
        console.error('Failed to load scripts:', err)
        setWebglError((err as Error).message || 'Failed to initialize WebGL')
        setWebglLoading(false)
      }
    }

    const initializeWebGL = async () => {
      if (!canvasRef.current) return

      try {
        setWebglLoading(true)
        console.log('Initializing WebGL renderer...')

        const canvas = canvasRef.current
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        if (typeof (window as any).Renderer === 'undefined') {
          throw new Error('Renderer class not found. Make sure all scripts are loaded.')
        }

        const renderer = new (window as any).Renderer(canvas)
        rendererRef.current = renderer
        
        console.log('Loading textures...')
        const texturesLoaded = await renderer.loadTextures()

        if (!texturesLoaded) {
          throw new Error('No textures could be loaded')
        }

        const textureCount = renderer.getTextureCount()
        setImageCount(textureCount)
        setWebglLoading(false)
        
        console.log('Starting render loop...')
        renderer.start()

        console.log(`WebGL panorama viewer started successfully with ${textureCount} images`)

        const handleResize = () => {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
          if (renderer) {
            renderer.resize()
          }
        }

        window.addEventListener('resize', handleResize)
        
      } catch (err) {
        console.error('Failed to start WebGL:', err)
        setWebglError((err as Error).message || 'Failed to start WebGL')
        setWebglLoading(false)
      }
    }

    loadScripts()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Preview Section - Hidden when viewer is open */}
      {!showViewer && (
        <div className="p-8">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
      )}

      {/* WebGL Viewer Section - Full screen */}
      {showViewer && (
        <div className="relative w-screen h-screen bg-black overflow-hidden">
          {/* Canvas */}
          <canvas 
            ref={canvasRef} 
            className="block w-full h-full"
          />

          {/* Overlay Controls */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-auto">
              {/* Left Panel - Info */}
              <div className="bg-black/70 backdrop-blur-lg p-4 rounded-lg">
                <h3 className="text-green-500 font-bold mb-2">WebGL Panorama Viewer</h3>
                <div className="text-white text-sm">
                  {webglLoading ? 'Loading images...' : `${imageCount} panorama images loaded`}
                </div>
              </div>

              {/* Right Panel - Status */}
              <div className="bg-black/70 backdrop-blur-lg p-4 rounded-lg text-right">
                <button
                  onClick={closeViewer}
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded mb-2 transition-colors"
                >
                  Close Viewer
                </button>
                
                {webglLoading && (
                  <div className="text-green-500 font-bold flex items-center justify-end gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                    Initializing WebGL...
                  </div>
                )}
                
                {webglError && (
                  <div className="text-red-500 font-bold">
                    Error: {webglError}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Instructions */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-lg px-6 py-3 rounded-full text-gray-300 text-sm pointer-events-none">
              🖱️ Left: Rotate • 🖱️ Middle: Pan • 🔄 Scroll: Zoom • ESC: Close
            </div>
          </div>
        </div>
      )}
    </div>
  )
}