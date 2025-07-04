"use client";

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FaUpload } from 'react-icons/fa';
import { IoCloseOutline } from 'react-icons/io5';
import { toast } from 'sonner';

const ImageUploader = ({ imagePreview, onImageChange, onImageRemove }) => {
  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onImageChange(reader.result, file);
    };
    reader.readAsDataURL(file);
  }, [onImageChange]);

  return (
    <div className="space-y-2">
      <Label>Profile Image</Label>
      <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-4">
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-0 right-0 p-1"
              onClick={onImageRemove}
            >
              <IoCloseOutline size={20} />
            </Button>
          </div>
        ) : (
          <label className="cursor-pointer text-center">
            <FaUpload className="mx-auto mb-2" size={24} />
            <span className="text-sm">Upload Image</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUploader; 