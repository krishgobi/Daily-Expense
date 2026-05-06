import React, { useState } from 'react'
import { Upload, X, File, Image as ImageIcon, FileText } from 'lucide-react'
import { api } from '../../services/api'

interface FileUploadProps {
  entityId: string
  entityType: 'expense' | 'transaction'
  onFileUpload?: (media: any) => void
  onError?: (error: string) => void
  maxFiles?: number
  existingMedia?: any[]
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
  const [media, setMedia] = useState(existingMedia)
  const [dragActive, setDragActive] = useState(false)

  const endpoint = entityType === 'expense' ? `/expenses/${entityId}/upload-media` : `/transactions/${entityId}/upload-media`

  const handleFile = async (file: File) => {
    if (media.length >= maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      onError?.('File type not allowed. Use: JPG, PNG, GIF, PDF, or Word documents')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError?.('File size must be less than 10MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.status === 'success') {
        const newMedia = response.data.data
        setMedia([...media, newMedia])
        onFileUpload?.(newMedia)
      }
    } catch (error: any) {
      onError?.(error.response?.data?.detail || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDelete = async (mediaId: string) => {
    try {
      const deleteEndpoint = entityType === 'expense' ? `/expenses/${entityId}/media/${mediaId}` : `/transactions/${entityId}/media/${mediaId}`
      await api.delete(deleteEndpoint)
      setMedia(media.filter((m) => m.id !== mediaId))
    } catch (error: any) {
      onError?.(error.response?.data?.detail || 'Failed to delete media')
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE':
        return <ImageIcon className="w-4 h-4" />
      case 'PDF':
        return <FileText className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleChange}
          disabled={isUploading || media.length >= maxFiles}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />

        <label htmlFor="file-upload" className={isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isUploading ? 'Uploading...' : 'Drop files or click to upload'}
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, PDF or Word documents (Max 10MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Files List */}
      {media.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Files ({media.length})</h4>
          <div className="space-y-2">
            {media.map((file) => (
              <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="text-blue-600">{getFileIcon(file.file_type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                    <p className="text-xs text-gray-500">{(file.file_size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(file.id)}
                  className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Count Info */}
      {media.length < maxFiles && (
        <p className="text-xs text-gray-500 mt-2">
          {maxFiles - media.length} file{maxFiles - media.length !== 1 ? 's' : ''} remaining
        </p>
      )}
    </div>
  )
}

export default FileUpload
