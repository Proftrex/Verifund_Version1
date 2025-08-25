import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (files: { uploadURL: string; name: string; size: number; type: string }[]) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simple file upload component that handles direct uploads to object storage.
 * 
 * Features:
 * - File selection with validation
 * - Direct upload to presigned URLs
 * - Progress tracking
 * - Error handling
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL)
 * @param props.onComplete - Callback function called when upload is complete
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Validate file count
    if (files.length > maxNumberOfFiles) {
      alert(`Maximum ${maxNumberOfFiles} files allowed`);
      return;
    }
    
    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      alert(`Files too large. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    
    setIsUploading(true);
    
    try {
      const uploadedFiles: { uploadURL: string; name: string; size: number; type: string }[] = [];
      
      for (const file of files) {
        try {
          console.log(`📤 ObjectUploader: Starting upload for ${file.name}`);
          // Get upload URL
          const uploadParams = await onGetUploadParameters();
          console.log(`🔗 ObjectUploader: Got upload parameters:`, uploadParams);
          
          const { url } = uploadParams;
          if (!url) {
            throw new Error('No upload URL received from server');
          }
          
          // Upload file directly
          console.log(`🚀 ObjectUploader: Making PUT request to ${url.substring(0, 100)}...`);
          const response = await fetch(url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });
          
          console.log(`📡 ObjectUploader: Response status for ${file.name}: ${response.status} ${response.statusText}`);
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unable to read error response');
            console.error(`❌ Upload failed for ${file.name}:`, {
              status: response.status,
              statusText: response.statusText,
              errorBody: errorText
            });
            throw new Error(`Upload failed (${response.status}): ${response.statusText} - ${errorText}`);
          }
          
          console.log(`✅ ObjectUploader: Successfully uploaded ${file.name}`);
          uploadedFiles.push({
            uploadURL: url,
            name: file.name,
            size: file.size,
            type: file.type,
          });
        } catch (error) {
          console.error(`❌ Error uploading ${file.name}:`, error);
          console.error('📊 Upload error details:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            error: error
          });
          alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      console.log("🔍 ObjectUploader: Upload process completed:", {
        totalFiles: files.length,
        uploadedFiles: uploadedFiles.length,
        onCompleteExists: !!onComplete
      });
      
      if (uploadedFiles.length > 0) {
        console.log("✅ ObjectUploader: Calling onComplete with files:", uploadedFiles);
        onComplete?.(uploadedFiles);
        console.log("📞 ObjectUploader: onComplete called successfully");
      } else {
        console.log("❌ ObjectUploader: No files uploaded successfully");
      }
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple={maxNumberOfFiles > 1}
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        id="file-upload-input"
      />
      <Button 
        asChild
        className={buttonClassName}
        disabled={isUploading}
      >
        <label htmlFor="file-upload-input" className="cursor-pointer">
          {isUploading ? "Uploading..." : children}
        </label>
      </Button>
    </div>
  );
}