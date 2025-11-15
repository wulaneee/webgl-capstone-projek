'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { StitchingVersion } from '@/lib/types'

export default function ViewerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session') || 'session_01'
  const initialVersion = (searchParams.get('version') as StitchingVersion) || 'original'

  const [currentVersion, setCurrentVersion] = useState<StitchingVersion>(initialVersion)
  const [webglLoading, setWebglLoading] = useState(false)
  const [webglError, setWebglError] = useState('')
  const [imageCount, setImageCount] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<any>(null)

  // Initialize WebGL on mount
  useEffect(() => {
    initWebGL()

    return () => {
      // Cleanup on unmount
      if (rendererRef.current && rendererRef.current.dispose) {
        rendererRef.current.dispose()
      }
    }
  }, [])

  // Handle version toggle
  const toggleVersion = async () => {
    const newVersion: StitchingVersion = currentVersion === 'original' ? 'segmented' : 'original'
    setCurrentVersion(newVersion)

    // Reload textures with new version
    if (rendererRef.current && rendererRef.current.reloadTextures) {
      setWebglLoading(true)
      try {
        await rendererRef.current.reloadTextures(sessionId, newVersion)
        setWebglLoading(false)
      } catch (error) {
        console.error('Failed to reload textures:', error)
        setWebglError('Failed to switch version')
        setWebglLoading(false)
      }
    }
  }

  const initWebGL = async () => {
    const scriptsAlreadyLoaded = typeof (window as any).Renderer !== 'undefined'

    const loadScripts = async () => {
      try {
        if (scriptsAlreadyLoaded) {
          console.log('Scripts already loaded, skipping...')
          await initializeWebGL()
          return
        }

        console.log('Loading WebGL scripts...')

        // Remove any old script tags from wrong paths
        const oldScriptPaths = [
          '/webgl/js/',
          '/app/scripts/webgl/js/'
        ]

        oldScriptPaths.forEach(oldPath => {
          document.querySelectorAll(`script[src^="${oldPath}"]`).forEach(script => {
            console.log(`Removing old script: ${script.getAttribute('src')}`)
            script.remove()
          })
        })

        const scripts = [
          '/scripts/webgl/js/webgl-utils.js',
          '/scripts/webgl/js/shaders.js',
          '/scripts/webgl/js/geometry.js',
          '/scripts/webgl/js/grid.js',
          '/scripts/webgl/js/camera.js',
          '/scripts/webgl/js/texture-loader.js',
          '/scripts/webgl/js/config.js',
          '/scripts/webgl/js/renderer.js',
        ]

        // Cache busting timestamp
        const cacheBuster = Date.now()

        for (const src of scripts) {
          // Check without cache buster
          const existingScript = document.querySelector(`script[src^="${src}"]`)

          if (existingScript) {
            console.log(`Script already exists: ${src}`)
            continue
          }

          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            // Add cache buster to force reload
            script.src = `${src}?v=${cacheBuster}`
            script.async = false // Ensure sequential loading
            script.onload = () => {
              console.log(`✅ Loaded: ${src}`)
              resolve(null)
            }
            script.onerror = (e) => {
              console.error(`❌ Failed to load ${src}`, e)
              reject(new Error(`Failed to load ${src}`))
            }
            document.body.appendChild(script)
          })
        }

        // Verify all required globals are loaded
        const requiredGlobals = [
          'WebGLUtils',
          'Shaders',
          'Geometry',
          'Grid',
          'Matrix4',
          'Camera',
          'TextureLoader',
          'Config',
          'Renderer'
        ]

        const missing = requiredGlobals.filter(name => typeof (window as any)[name] === 'undefined')
        if (missing.length > 0) {
          throw new Error(`Missing required globals: ${missing.join(', ')}`)
        }

        console.log('✅ All WebGL scripts loaded successfully')

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

        // Debug: Check what's actually loaded
        console.log('Checking loaded globals:')
        console.log('- WebGLUtils:', typeof (window as any).WebGLUtils)
        console.log('- Shaders:', typeof (window as any).Shaders)
        console.log('- Geometry:', typeof (window as any).Geometry)
        console.log('- Grid:', typeof (window as any).Grid)
        console.log('- Matrix4:', typeof (window as any).Matrix4)
        console.log('- Camera:', typeof (window as any).Camera)
        console.log('- TextureLoader:', typeof (window as any).TextureLoader)
        console.log('- Config:', typeof (window as any).Config)
        console.log('- Renderer:', typeof (window as any).Renderer)

        if (typeof (window as any).Renderer === 'undefined') {
          throw new Error('Renderer class not found. Make sure all scripts are loaded.')
        }

        // Pass session and version to renderer
        const renderer = new (window as any).Renderer(canvas, {
          sessionId,
          version: currentVersion,
        })
        rendererRef.current = renderer

        console.log('Loading textures...')
        const texturesLoaded = await renderer.loadTextures(sessionId, currentVersion)

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
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Overlay Controls */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-auto">
          {/* Left Panel - Info */}
          <div className="bg-black/70 backdrop-blur-lg p-4 rounded-lg">
            <h3 className="text-green-500 font-bold mb-2">Penampil Panorama WebGL</h3>
            <div className="text-white text-sm space-y-1">
              <div>Sesi: <span className="text-blue-400">{sessionId}</span></div>
              <div>Versi: <span className="text-purple-400">{currentVersion}</span></div>
              <div>
                {webglLoading ? 'Memuat gambar...' : `${imageCount} gambar panorama dimuat`}
              </div>
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="bg-black/70 backdrop-blur-lg p-4 rounded-lg space-y-2">
            <button
              onClick={toggleVersion}
              disabled={webglLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-5 py-2 rounded transition-colors mb-2"
            >
              {webglLoading ? 'Mengalihkan...' : `Ganti ke ${currentVersion === 'original' ? 'Segmented' : 'Original'}`}
            </button>

            <button
              onClick={() => router.push(`/session/${sessionId}`)}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded transition-colors"
            >
              Kembali ke Sesi
            </button>

            {webglLoading && (
              <div className="text-green-500 font-bold flex items-center justify-end gap-2 mt-2">
                <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                Menginisialisasi WebGL...
              </div>
            )}

            {webglError && (
              <div className="text-red-500 font-bold mt-2">Error: {webglError}</div>
            )}
          </div>
        </div>

        {/* Bottom Instructions */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-lg px-6 py-3 rounded-full text-gray-300 text-sm pointer-events-none">
          🖱️ Kiri: Rotasi • 🖱️ Tengah: Geser • 🔄 Scroll: Zoom
        </div>
      </div>
    </div>
  )
}
