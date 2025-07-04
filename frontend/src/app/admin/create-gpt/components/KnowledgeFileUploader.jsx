"use client";

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FaBox, FaUpload, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';

const KnowledgeFile = ({ file, index, onRemove }) => (
  <div className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded-lg">
    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
      <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/20 rounded shrink-0">
        <FaBox size={14} className="text-purple-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-medium truncate">{file.name}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
        </p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onRemove(index)}
      className="text-red-500 hover:text-red-700 p-1 h-auto"
    >
      <FaTrash size={12} />
    </Button>
  </div>
);

const KnowledgeFileUploader = ({ knowledgeFiles, onFilesChange }) => {
  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    const newFiles = validFiles.map((file, index) => ({
      name: file.name,
      size: file.size,
      file: file,
      id: Date.now() + index
    }));

    onFilesChange([...knowledgeFiles, ...newFiles]);
  }, [knowledgeFiles, onFilesChange]);

  const removeFile = useCallback((index) => {
    const updatedFiles = knowledgeFiles.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
  }, [knowledgeFiles, onFilesChange]);

  return (
    <div className="space-y-4">
      <Label>Knowledge Files</Label>
      <div className="border-2 border-dashed rounded-lg p-4">
        <label className="cursor-pointer text-center block">
          <FaUpload className="mx-auto mb-2" size={24} />
          <span className="text-sm">Upload Knowledge Files</span>
          <input
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.json,.csv"
            onChange={handleFileUpload}
          />
        </label>
      </div>
      
      {knowledgeFiles.length > 0 && (
        <div className="space-y-2">
          {knowledgeFiles.map((file, index) => (
            <KnowledgeFile
              key={file.id || index}
              file={file}
              index={index}
              onRemove={removeFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeFileUploader; 