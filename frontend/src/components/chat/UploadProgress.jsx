"use client";

import React from 'react';

const UploadProgress = ({ uploadedFiles, uploadProgress }) => {
  if (!uploadedFiles.length) return null;

  return (
    <div className="mb-2 px-2">
      <div className="flex items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {uploadedFiles.length === 1
              ? `Uploading ${uploadedFiles[0]?.name}`
              : `Uploading ${uploadedFiles.length} files`}
          </div>
          <div className="mt-1 relative h-1.5 w-full bg-blue-100 dark:bg-blue-800/40 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadProgress; 