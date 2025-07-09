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
      textareaRef.current.style.height = '40px';
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
      textareaRef.current.style.height = '40px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return <File size={14} />;
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText size={14} className="text-red-400" />;
      case 'doc':
      case 'docx':
        return <FileText size={14} className="text-blue-400" />;
      case 'txt':
        return <FileText size={14} />;
      default:
        return <File size={14} />;
    }
  };

  return (
    <div className="w-full p-2 sm:p-4 bg-white dark:bg-black">
      {/* Upload Progress Display - Made responsive with better spacing on mobile */}
      {isUploading && (
        <div className="mb-2 sm:mb-4">
          <div className="flex items-center p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <div className="flex-shrink-0 mr-2 sm:mr-3">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-500 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 sm:mb-2">
                {uploadedFiles.length === 1
                  ? `Uploading ${uploadedFiles[0]?.name}`
                  : `Uploading ${uploadedFiles.length} files`}
              </div>
              <Progress 
                value={uploadProgress} 
                className="h-1.5 sm:h-2 bg-blue-100 dark:bg-blue-800/40"
              />
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1">
                {uploadProgress}% complete
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Files Display - Improved for small screens */}
      {uploadedFiles.length > 0 && !isUploading && (
        <div className="mb-2 sm:mb-4">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-1 sm:gap-2 py-1 sm:py-2 px-2 sm:px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 max-w-fit"
              >
                <div className="text-gray-500 dark:text-gray-400">
                  {getFileIcon(file.name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px] sm:max-w-[140px]">
                    {file.name}
                  </span>
                  {file.size && (
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemoveFile?.(index)}
                  className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-0.5 sm:p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                  aria-label="Remove file"
                >
                  <X size={12} className="sm:h-3.5 sm:w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700/50 relative group">
          <div className="flex flex-col px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent border-0 outline-none text-black dark:text-white resize-none overflow-hidden min-h-[36px] sm:min-h-[40px] text-xs sm:text-sm md:text-base placeholder-gray-500 dark:placeholder-gray-400 custom-scrollbar-dark dark:custom-scrollbar"
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
              style={{ height: '40px' }}
            />

            <div className="flex justify-between items-center mt-1 sm:mt-1.5 md:mt-2">
              <div className="flex items-center">
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
                  className={`text-gray-400 dark:text-gray-500 rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors ${(isLoading || disabled) ? 'cursor-not-allowed opacity-50' : ''}`}
                  aria-label="Attach file"
                  disabled={isLoading || disabled}
                >
                  <HiMiniPaperClip size={16} className="sm:text-[18px] md:text-[20px]" />
                </button>

                {/* Web Search Toggle Button */}
                {showWebSearchIcon && (
                  <button
                    type="button"
                    onClick={toggleWebSearch}
                    className='ml-1'
                  >
                    {webSearchEnabled ? 
                      <BsGlobe2 size={14} className="sm:text-[16px] md:text-[18px] text-green-600 dark:text-green-400" /> : 
                      <BsGlobe2 size={14} className="sm:text-[16px] md:text-[18px] text-gray-400 dark:text-gray-500" />
                    }
                  </button>
                )}
              </div>

              <button
                type="submit"
                className={`rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center transition-all duration-200 ${(!inputMessage.trim() || isLoading || disabled)
                  ? 'bg-white dark:bg-black text-black dark:text-white cursor-not-allowed'
                  : 'bg-white hover:bg-white/70 text-black'
                }`}
                disabled={!inputMessage.trim() || isLoading || disabled}
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 border-t-2 border-b-2 border-gray-400"></div>
                ) : (
                  <IoSendSharp size={14} className="sm:text-[16px] md:text-[18px] translate-x-[1px]" />
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