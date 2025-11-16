'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  name: string
  href: string
  icon?: string
}

export default function Breadcrumbs() {
  const pathname = usePathname()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(path => path)
    const breadcrumbs: BreadcrumbItem[] = [
      {
        name: 'Beranda',
        href: '/',
        icon: '🏠'
      }
    ]

    if (paths.length === 0) return breadcrumbs

    // Path mappings
    const pathNames: Record<string, string> = {
      'azure': 'Azure',
      'session': 'Sesi',
      'viewer': 'Penampil 3D',
      'help': 'Bantuan'
    }

    const pathIcons: Record<string, string> = {
      'azure': '☁️',
      'session': '📁',
      'viewer': '🎮',
      'help': '❓'
    }

    // Build breadcrumb items
    let currentHref = ''
    paths.forEach((path, index) => {
      currentHref += `/${path}`

      if (path === 'session' && paths[index + 1]) {
        // Skip adding "session" and go directly to session detail
        return
      } else if (index > 0 && paths[index - 1] === 'session') {
        // This is a session ID, format it nicely
        const sessionId = path
        breadcrumbs.push({
          name: `Sesi ${sessionId.replace('session_', '')}`,
          href: currentHref,
          icon: '📸'
        })
      } else {
        breadcrumbs.push({
          name: pathNames[path] || path.charAt(0).toUpperCase() + path.slice(1),
          href: currentHref,
          icon: pathIcons[path]
        })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  // Don't show breadcrumbs on home page
  if (pathname === '/') {
    return null
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-1 text-sm py-3" aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => (
            <div key={item.href} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-500" aria-hidden="true">
                  /
                </span>
              )}

              {index === breadcrumbs.length - 1 ? (
                // Current page - not a link
                <span className="flex items-center gap-2 text-gray-300 font-medium">
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.name}</span>
                </span>
              ) : (
                // Navigation link
                <Link
                  href={item.href}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}