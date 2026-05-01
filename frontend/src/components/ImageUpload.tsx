import { useState, useCallback, useRef } from 'react'
import { api } from '../lib/api'

interface ImageUploadProps {
  value?: string
  onUploaded: (url: string) => void
  label?: string
}

export default function ImageUpload({ value, onUploaded, label = 'Cover Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const item = await api.admin.media.upload(file)
      onUploaded(item.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUploaded])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-rust bg-rust/5' : 'border-ink/20 hover:border-ink/40'
        }`}
      >
        {uploading ? (
          <p className="text-sm text-muted">Uploading...</p>
        ) : value ? (
          <div className="space-y-2">
            <img src={value} alt="Preview" className="max-h-32 mx-auto rounded" />
            <p className="text-xs text-muted">Click or drop to replace</p>
          </div>
        ) : (
          <p className="text-sm text-muted">Drop an image or click to upload</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
