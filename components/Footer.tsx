'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Github, Youtube, BookOpen } from 'lucide-react'

export default function Footer() {
  const [currentYear] = useState(new Date().getFullYear())

  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-2 rounded-lg">
                  <Image
                    src="/logo.png"
                    alt="Relieva Logo"
                    width={32}
                    height={32}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">RELIEVA</h3>
                  <p className="text-xs text-gray-400">Relief Evaluation System</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4 max-w-md">
                Sistem deteksi dan analisis penggaraman pada relief Candi Borobudur menggunakan teknologi stitching panorama dan visualisasi 3D WebGL.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-700 rounded-lg p-2 hover:bg-gray-600 transition-colors cursor-pointer"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5 text-white" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-700 rounded-lg p-2 hover:bg-gray-600 transition-colors cursor-pointer"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5 text-white" />
                </a>
                <a
                  href="#"
                  className="bg-gray-700 rounded-lg p-2 hover:bg-gray-600 transition-colors cursor-pointer"
                  aria-label="Documentation"
                >
                  <BookOpen className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Navigasi Cepat</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link href="/azure" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Azure Sessions
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Bantuan
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            {/* <div>
              <h4 className="text-sm font-semibold text-white mb-4">Sumber Daya</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Dokumentasi
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Tutorial
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div> */}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Copyright */}
              <div className="text-sm text-gray-400">
                © {currentYear} RELIEVA - Sistem Deteksi Penggaraman Relief Candi Borobudur
              </div>

              {/* Footer Links */}
              <div className="flex gap-6">
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Tentang
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}