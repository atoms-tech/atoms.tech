'use client';

import React, { useCallback, useState } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AttachedFile {
    id: string;
    file: File;
    preview?: string;
    type: 'image' | 'document' | 'other';
}

interface FileAttachmentProps {
    onFilesChange: (files: AttachedFile[]) => void;
    maxFiles?: number;
    maxSizeMB?: number;
    acceptedTypes?: string[];
    className?: string;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
    onFilesChange,
    maxFiles = 5,
    maxSizeMB = 10,
    acceptedTypes = ['image/*', 'application/pdf', 'text/*'],
    className,
}) => {
    const [files, setFiles] = useState<AttachedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processFiles = useCallback(
        async (fileList: FileList) => {
            setError(null);
            const newFiles: AttachedFile[] = [];

            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];

                // Check file size
                if (file.size > maxSizeMB * 1024 * 1024) {
                    setError(`File ${file.name} is too large (max ${maxSizeMB}MB)`);
                    continue;
                }

                // Check max files
                if (files.length + newFiles.length >= maxFiles) {
                    setError(`Maximum ${maxFiles} files allowed`);
                    break;
                }

                // Determine file type
                const type = file.type.startsWith('image/')
                    ? 'image'
                    : file.type === 'application/pdf' || file.type.startsWith('text/')
                      ? 'document'
                      : 'other';

                // Create preview for images
                let preview: string | undefined;
                if (type === 'image') {
                    preview = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.readAsDataURL(file);
                    });
                }

                newFiles.push({
                    id: `${Date.now()}-${i}`,
                    file,
                    preview,
                    type,
                });
            }

            const updatedFiles = [...files, ...newFiles];
            setFiles(updatedFiles);
            onFilesChange(updatedFiles);
        },
        [files, maxFiles, maxSizeMB, onFilesChange],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            processFiles(e.dataTransfer.files);
        },
        [processFiles],
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                processFiles(e.target.files);
            }
        },
        [processFiles],
    );

    const removeFile = useCallback(
        (id: string) => {
            const updatedFiles = files.filter((f) => f.id !== id);
            setFiles(updatedFiles);
            onFilesChange(updatedFiles);
        },
        [files, onFilesChange],
    );

    return (
        <div className={cn('space-y-2', className)}>
            {/* Drop Zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    'relative rounded-lg border-2 border-dashed p-4 transition-colors',
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                )}
            >
                <input
                    type="file"
                    multiple
                    accept={acceptedTypes.join(',')}
                    onChange={handleFileInput}
                    className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">
                            Drop files here or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Max {maxFiles} files, {maxSizeMB}MB each
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((attachedFile) => (
                        <FilePreview
                            key={attachedFile.id}
                            file={attachedFile}
                            onRemove={() => removeFile(attachedFile.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface FilePreviewProps {
    file: AttachedFile;
    onRemove: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
    const Icon = file.type === 'image' ? ImageIcon : file.type === 'document' ? FileText : File;

    return (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
            {file.preview ? (
                <img
                    src={file.preview}
                    alt={file.file.name}
                    className="h-12 w-12 rounded object-cover"
                />
            ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
            )}

            <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{file.file.name}</p>
                <p className="text-xs text-muted-foreground">
                    {(file.file.size / 1024).toFixed(1)} KB
                </p>
            </div>

            <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
};

