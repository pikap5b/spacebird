import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  onUpload: (file: File) => Promise<string>
  onDelete?: () => Promise<void>
  maxSizeMB?: number
  acceptedFormats?: string[]
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  onDelete,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file format. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      return `File size exceeds ${maxSizeMB}MB limit`
    }

    return null
  }

  const handleFile = async (file: File) => {
    setError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      const url = await onUpload(file)
      onChange(url)
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    setError(null)
    try {
      await onDelete()
      setPreview(null)
      onChange(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete image')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">Space Image</Label>
      
      {preview ? (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Replace
              </Button>
              {onDelete && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
            isDragging
              ? 'border-[#0f172b] bg-[#0f172b]/5'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeMB}MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {isUploading && (
        <p className="text-sm text-gray-500">Uploading...</p>
      )}
    </div>
  )
}

