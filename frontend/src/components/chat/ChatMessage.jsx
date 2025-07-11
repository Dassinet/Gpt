"use client";

import React, { useState, useRef } from 'react';
import { HiMiniPaperClip } from 'react-icons/hi2';
import { BsGlobe2 } from 'react-icons/bs';
import { IoSendSharp } from 'react-icons/io5';
import { X, FileText, File, Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

const ChatMessage = ({ 
  onSendMessage, 
  onFileUpload, 
  isLoading = false,
  uploadedFiles = [],
  onRemoveFile,
  webSearchEnabled = false,
  onToggleWebSearch,
  showWebSearchIcon = true,
  placeholder = "Ask anything...",
  disabled = false,
  isUploading = false,
  uploadProgress = 0
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || disabled) return;
    
    onSendMessage?.(inputMessage);
    setInputMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFileUpload?.(files);
    }
    // Reset file input
    e.target.value = '';
  };

  const handleUploadClick = () => {
    if (fileInputRef.current && !isLoading && !disabled) {
      fileInputRef.current.click();
    }
  };

  const toggleWebSearch = () => {
    onToggleWebSearch?.(!webSearchEnabled);
  };

  const handleTextareaChange = (e) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return <File size={12} className="sm:h-3.5 sm:w-3.5" />;
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText size={12} className="sm:h-3.5 sm:w-3.5 text-red-400" />;
      case 'doc':
      case 'docx':
        return <FileText size={12} className="sm:h-3.5 sm:w-3.5 text-blue-400" />;
      case 'txt':
        return <FileText size={12} className="sm:h-3.5 sm:w-3.5" />;
      default:
        return <File size={12} className="sm:h-3.5 sm:w-3.5" />;
    }
  };

  return (
    <div className="w-full p-2 sm:p-3 lg:p-4 bg-white dark:bg-black">
      {/* Upload Progress Display */}
      {isUploading && (
        <div className="mb-2 sm:mb-3 lg:mb-4">
          <div className="flex items-center p-2 sm:p-2.5 lg:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <div className="flex-shrink-0 mr-2 sm:mr-2.5 lg:mr-3">
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 animate-spin text-blue-500 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-xs lg:text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 sm:mb-1.5 lg:mb-2">
                {uploadedFiles.length === 1
                  ? `Uploading ${uploadedFiles[0]?.name}`
                  : `Uploading ${uploadedFiles.length} files`}
              </div>
              <Progress 
                value={uploadProgress} 
                className="h-1 sm:h-1.5 lg:h-2 bg-blue-100 dark:bg-blue-800/40"
              />
              <div className="text-[9px] sm:text-[10px] lg:text-xs text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1">
                {uploadProgress}% complete
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && !isUploading && (
        <div className="mb-2 sm:mb-3 lg:mb-4">
          <div className="flex flex-wrap gap-1 sm:gap-1.5 lg:gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 py-1 sm:py-1.5 lg:py-2 px-1.5 sm:px-2 lg:px-3 bg-gray-50 dark:bg-gray-800/50 rounded-md lg:rounded-lg border border-gray-200 dark:border-gray-700/50 max-w-fit"
              >
                <div className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {getFileIcon(file.name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[80px] sm:max-w-[100px] lg:max-w-[140px]">
                    {file.name}
                  </span>
                  {file.size && (
                    <span className="text-[8px] sm:text-[9px] lg:text-[10px] text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemoveFile?.(index)}
                  className="ml-0.5 sm:ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors flex-shrink-0"
                  aria-label="Remove file"
                >
                  <X size={10} className="sm:h-3 sm:w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700/50 relative group">
          <div className="flex flex-col px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent border-0 outline-none text-black dark:text-white resize-none overflow-hidden min-h-[32px] sm:min-h-[36px] lg:min-h-[40px] text-[11px] sm:text-xs lg:text-sm placeholder-gray-500 dark:placeholder-gray-400 custom-scrollbar-dark dark:custom-scrollbar"
              placeholder={placeholder}
              value={inputMessage}
              onChange={handleTextareaChange}
              rows={1}
              disabled={isLoading || disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              style={{ height: '36px' }}
            />

            <div className="flex justify-between items-center mt-1 sm:mt-1.5 lg:mt-2">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  multiple
                  disabled={isLoading || disabled}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                />

                <button
                  type="button"
                  onClick={handleUploadClick}
                  className={`text-gray-400 dark:text-gray-500 rounded-full w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors ${(isLoading || disabled) ? 'cursor-not-allowed opacity-50' : ''}`}
                  aria-label="Attach file"
                  disabled={isLoading || disabled}
                >
                  <HiMiniPaperClip size={12} className="sm:text-sm lg:text-base" />
                </button>

                {/* Web Search Toggle Button */}
                {showWebSearchIcon && (
                  <button
                    type="button"
                    onClick={toggleWebSearch}
                    className="text-gray-400 dark:text-gray-500 rounded-full w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <BsGlobe2 size={10} className={`sm:text-xs lg:text-sm ${webSearchEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className={`rounded-full w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex items-center justify-center transition-all duration-200 ${(!inputMessage.trim() || isLoading || disabled)
                  ? 'bg-white dark:bg-black text-black dark:text-white cursor-not-allowed'
                  : 'bg-white hover:bg-white/70 text-black'
                } flex-shrink-0`}
                disabled={!inputMessage.trim() || isLoading || disabled}
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 border-t border-b border-gray-400"></div>
                ) : (
                  <IoSendSharp size={10} className="sm:text-xs lg:text-sm translate-x-[1px]" />
                )}
              </button>
            </div>
          </div>      
        </div>
      </form>
    </div>
  );
};

export default ChatMessage;