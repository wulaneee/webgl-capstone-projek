'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  {
    category: 'Memulai',
    question: 'Apa itu RELIEVA?',
    answer: 'RELIEVA (Relief Evaluation System) adalah sistem deteksi dan analisis penggaraman pada relief Candi Borobudur menggunakan teknologi stitching panorama dan visualisasi 3D WebGL.'
  },
  {
    category: 'Memulai',
    question: 'Bagaimana cara memulai menggunakan RELIEVA?',
    answer: '1. Pastikan folder sesi telah ditambahkan ke public/source/ atau unduh dari Azure\n2. Pilih sesi dari daftar yang tersedia\n3. Klik pada sesi untuk melihat detail gambar\n4. Jalankan proses stitching jika belum dilakukan\n5. Lihat hasil 3D di viewer panorama'
  },
  {
    category: 'Sesi',
    question: 'Bagaimana struktur folder yang diharapkan?',
    answer: 'Struktur folder yang diharapkan:\npublic/source/\n  └── session_01/\n      ├── images/\n      │   ├── 001.png\n      │   ├── 002.png\n      │   └── ...\n      └── metadatas/\n          ├── 001.json\n          ├── 002.json\n          └── ...'
  },
  {
    category: 'Sesi',
    question: 'Apa perbedaan antara "Terproses" dan "Belum Diproses"?',
    answer: 'Sesi "Terproses" berarti proses stitching telah selesai dilakukan dan hasil panorama dapat dilihat. Sesi "Belum Diproses" masih memerlukan proses stitching sebelum dapat melihat hasil 3D.'
  },
  {
    category: 'Azure',
    question: 'Bagaimana cara mengunduh sesi dari Azure?',
    answer: '1. Klik tombol "☁️ Unduh dari Azure" di halaman utama\n2. Pilih sesi yang ingin diunduh dari daftar\n3. Klik "Unduh" untuk mengunduh sesi ke lokal\n4. Tunggu proses unduh selesai\n5. Sesi akan otomatis tersedia di halaman utama'
  },
  {
    category: 'Azure',
    question: 'Apa itu caching otomatis?',
    answer: 'Caching otomatis menyimpan status sesi yang telah diperiksa selama 5 menit untuk mengurangi permintaan ke server dan meningkatkan performa loading.'
  },
  {
    category: 'Stitching',
    question: 'Apa itu proses stitching?',
    answer: 'Stitching adalah proses menggabungkan beberapa gambar menjadi satu panorama 360 derajat. Proses ini diperlukan untuk menciptakan pengalaman visualisasi 3D yang immersif.'
  },
  {
    category: 'Stitching',
    question: 'Berapa lama proses stitching biasanya berlangsung?',
    answer: 'Waktu proses stitching tergantung pada jumlah gambar dan kompleksitas scene. Biasanya memakan waktu beberapa menit hingga 30 menit untuk sesi dengan banyak gambar.'
  },
  {
    category: 'Viewer 3D',
    question: 'Bagaimana cara menggunakan viewer 3D?',
    answer: '• Klik dan drag untuk rotasi kamera\n• Scroll untuk zoom in/out\n• Klik kanan dan drag untuk pan\n• Gunakan tombol di overlay untuk beralih antara original dan segmented\n• Klik tombol fullscreen untuk mode layar penuh'
  },
  {
    category: 'Viewer 3D',
    question: 'Apa perbedaan antara Original dan Segmented?',
    answer: 'Original menampilkan panorama asli dari hasil stitching, sedangkan Segmented menampilkan panorama dengan hasil segmentasi yang menyoroti area-area dengan tingkat penggaraman tertentu.'
  },
  {
    category: 'Troubleshooting',
    question: 'Sesi tidak muncul di daftar, apa yang harus dilakukan?',
    answer: '1. Periksa kembali struktur folder\n2. Pastikan ada folder images dan metadatas\n3. Pastikan nama file gambar dan metadata sesuai\n4. Klik tombol "Muat Ulang Sesi" untuk memindai ulang\n5. Coba tambahkan sesi melalui Azure jika tersedia'
  },
  {
    category: 'Troubleshooting',
    question: 'Proses stitching gagal, bagaimana solusinya?',
    answer: '1. Periksa koneksi internet\n2. Pastikan semua gambar memiliki metadata yang valid\n3. Coba jalankan ulang proses stitching\n4. Periksa error message yang muncul\n5. Hubungi administrator jika masalah berlanjut'
  }
]

const guideSections = [
  {
    title: 'Persiapan Data',
    description: 'Siapkan data sesi dengan struktur yang benar',
    icon: '📁',
    steps: [
      'Buat folder sesi di public/source/',
      'Tambahkan subfolder images/ dan metadatas/',
      'Pastikan nama file gambar dan metadata sesuai',
      'Verifikasi format file (PNG untuk gambar, JSON untuk metadata)'
    ]
  },
  {
    title: 'Proses Stitching',
    description: 'Lakukan proses stitching untuk menggabungkan gambar',
    icon: '🔄',
    steps: [
      'Pilih sesi dari daftar',
      'Klik tombol "Proses Stitching"',
      'Tunggu proses selesai',
      'Verifikasi hasil stitching'
    ]
  },
  {
    title: 'Visualisasi 3D',
    description: 'Eksplorasi hasil 3D dengan WebGL viewer',
    icon: '🎮',
    steps: [
      'Klik "Lihat di 3D" pada sesi yang terproses',
      'Gunakan kontrol mouse untuk navigasi',
      'Beralih antara view original dan segmented',
      'Gunakan mode fullscreen untuk pengalaman penuh'
    ]
  },
  {
    title: 'Analisis Hasil',
    description: 'Analisis hasil deteksi penggaraman',
    icon: '🔍',
    steps: [
      'Periksa area yang dihighlight dalam view segmented',
      'Bandingkan dengan view original',
      'Catat area dengan tingkat penggaraman tinggi',
      'Export atau dokumentasikan temuan'
    ]
  }
]

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState<string>('Semua')
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const categories = ['Semua', ...Array.from(new Set(faqData.map(item => item.category)))]

  const filteredFAQ = activeCategory === 'Semua'
    ? faqData
    : faqData.filter(item => item.category === activeCategory)

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pusat Bantuan</h1>
          <p className="text-gray-400">
            Panduan lengkap untuk menggunakan sistem RELIEVA
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/"
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🏠</div>
            <div className="text-sm font-medium">Kembali ke Beranda</div>
          </Link>
          <Link
            href="/azure"
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors text-center"
          >
            <div className="text-2xl mb-2">☁️</div>
            <div className="text-sm font-medium">Unduh dari Azure</div>
          </Link>
          <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors text-center cursor-pointer">
            <div className="text-2xl mb-2">📞</div>
            <div className="text-sm font-medium">Hubungi Support</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors text-center cursor-pointer">
            <div className="text-2xl mb-2">📖</div>
            <div className="text-sm font-medium">Dokumentasi Teknis</div>
          </div>
        </div>

        {/* Guide Sections */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Panduan Langkah demi Langkah</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guideSections.map((section, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{section.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {section.description}
                    </p>
                  </div>
                </div>
                <ol className="space-y-2">
                  {section.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-3 text-sm">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {stepIndex + 1}
                      </span>
                      <span className="text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions (FAQ)</h2>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQ.map((item, index) => (
              <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs font-medium">
                      {item.category}
                    </span>
                    <span className="font-medium text-white">
                      {item.question}
                    </span>
                  </div>
                  <span className={`text-gray-400 transition-transform ${
                    expandedFAQ === index ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </span>
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 py-4 border-t border-gray-700">
                    <p className="text-gray-300 whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}