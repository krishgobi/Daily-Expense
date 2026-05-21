import React, { useEffect } from 'react'
import { X, Download, ExternalLink, FileText, Image } from 'lucide-react'

interface MediaViewerProps {
  url:      string
  name:     string
  fileType: string   // 'image' | 'pdf' | 'document' | anything
  onClose:  () => void
}

function isPdf(fileType: string, name: string) {
  return fileType === 'pdf' || name.toLowerCase().endsWith('.pdf')
}

function isImage(fileType: string, name: string) {
  if (fileType === 'image') return true
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ url, name, fileType, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const pdf   = isPdf(fileType, name)
  const image = isImage(fileType, name)

  const handleDownload = () => {
    const a    = document.createElement('a')
    a.href     = url
    a.download = name
    a.target   = '_blank'
    a.rel      = 'noreferrer'
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 px-4 py-3 bg-black/60 backdrop-blur-sm">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
          {pdf ? <FileText className="h-4 w-4 text-white" /> : <Image className="h-4 w-4 text-white" />}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">{name}</p>
        <div className="flex items-center gap-1">
          {/* Open in browser (useful for PDF on iOS) */}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
            title="Open in browser"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={handleDownload}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {image && (
          <img
            src={url}
            alt={name}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        )}

        {pdf && (
          <iframe
            src={url}
            title={name}
            className="h-full w-full border-0 bg-white"
            allow="fullscreen"
          />
        )}

        {!image && !pdf && (
          <div className="flex flex-col items-center gap-4 text-white/70 px-6 text-center">
            <FileText className="h-16 w-16 opacity-40" />
            <p className="text-sm">This file type cannot be previewed.</p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition"
            >
              <Download className="h-4 w-4" />
              Download to view
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
