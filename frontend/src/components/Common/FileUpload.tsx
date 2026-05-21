import React, { useId, useState } from 'react'
import { Upload, X, File, Image as ImageIcon, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { api } from '../../services/api'

export interface MediaItem {
  id:          string
  file_name:   string
  file_type:   string
  file_size:   number
  file_url?:   string
  file_path?:  string
  uploaded_at: string
}

interface FileUploadProps {
  entityId:       string
  entityType:     'expense' | 'transaction'
  onFileUpload?:  (media: MediaItem) => void
  onError?:       (error: string) => void
  maxFiles?:      number
  existingMedia?: MediaItem[]
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function getFileIcon(fileType: string) {
  if (fileType === 'IMAGE') return <ImageIcon className="w-4 h-4" />
  if (fileType === 'PDF')   return <FileText   className="w-4 h-4" />
  return <File className="w-4 h-4" />
}

export const FileUpload: React.FC<FileUploadProps> = ({
  entityId,
  entityType,
  onFileUpload,
  onError,
  maxFiles = 5,
  existingMedia = [],
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [media, setMedia]             = useState<MediaItem[]>(existingMedia)
  const [dragActive, setDragActive]   = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const inputId = useId()

  const uploadEndpoint = entityType === 'expense'
    ? `/expenses/${entityId}/upload-media`
    : `/transactions/${entityId}/upload-media`

  const deleteEndpoint = (mediaId: string) => entityType === 'expense'
    ? `/expenses/${entityId}/media/${mediaId}`
    : `/transactions/${entityId}/media/${mediaId}`

  const handleFile = async (file: File) => {
    setUploadError('')
    setUploadSuccess('')

    if (media.length >= maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`)
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('File type not allowed. Use: JPG, PNG, GIF, PDF, or Word documents')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10 MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post(uploadEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (response.data?.status === 'success') {
        const newMedia: MediaItem = response.data.data
        setMedia(prev => [...prev, newMedia])
        setUploadSuccess(`${file.name} uploaded successfully`)
        onFileUpload?.(newMedia)
      } else {
        throw new Error(response.data?.message || 'Upload did not succeed')
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Upload failed. Please try again.'
      setUploadError(detail)
      onError?.(detail)
    } finally {
      setIsUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
    e.target.value = ''
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleDelete = async (item: MediaItem) => {
    try {
      await api.delete(deleteEndpoint(item.id))
      setMedia(prev => prev.filter(m => m.id !== item.id))
      setUploadSuccess('')
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to delete file')
    }
  }

  const canUpload = !isUploading && media.length < maxFiles

  return (
    <div className="w-full space-y-3">
      {/* Feedback */}
      {uploadError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
      {uploadSuccess && !uploadError && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Drop zone */}
      {canUpload && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
            dragActive
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800/40'
          }`}
        >
          <input
            type="file"
            id={inputId}
            className="hidden"
            onChange={handleChange}
            accept="image/*,.pdf,.doc,.docx"
            disabled={isUploading}
          />
          <label htmlFor={inputId} className={isUploading ? 'cursor-wait' : 'cursor-pointer'}>
            <div className="flex flex-col items-center gap-2">
              <Upload className={`w-7 h-7 ${dragActive ? 'text-brand-500' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isUploading ? 'Uploading…' : 'Drop file here or click to upload'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  JPG, PNG, PDF or Word · Max 10 MB
                </p>
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Uploaded files list */}
      {media.length > 0 && (
        <div className="space-y-2">
          {media.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
            >
              <span className="text-brand-600 dark:text-brand-400 shrink-0">
                {getFileIcon(item.file_type)}
              </span>
              <div className="min-w-0 flex-1">
                {item.file_url ? (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium text-gray-900 hover:underline dark:text-gray-100"
                  >
                    {item.file_name}
                  </a>
                ) : (
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.file_name}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(item.file_size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item)}
                className="shrink-0 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {media.length > 0 && media.length < maxFiles && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {media.length}/{maxFiles} files · {maxFiles - media.length} more allowed
        </p>
      )}
    </div>
  )
}

export default FileUpload
