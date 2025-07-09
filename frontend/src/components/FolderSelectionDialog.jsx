 "use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder, Plus } from 'lucide-react';

const FolderSelectionDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  existingFolders = [], 
  currentFolder = 'Uncategorized',
  isLoading = false 
}) => {
  const [selectedFolder, setSelectedFolder] = useState(currentFolder);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleConfirm = () => {
    const folderToUse = isCreatingNew ? newFolderName.trim() : selectedFolder;
    if (folderToUse) {
      onConfirm(folderToUse);
    }
  };

  const handleClose = () => {
    setSelectedFolder(currentFolder);
    setNewFolderName('');
    setIsCreatingNew(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Select Folder
          </DialogTitle>
          <DialogDescription>
            Choose a folder to organize your favourite GPT.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Folder Options</Label>
            <div className="flex gap-2">
              <Button
                variant={!isCreatingNew ? "default" : "outline"}
                size="sm"
                onClick={() => setIsCreatingNew(false)}
                className="flex items-center gap-1"
              >
                <Folder className="h-4 w-4" />
                Existing
              </Button>
              <Button
                variant={isCreatingNew ? "default" : "outline"}
                size="sm"
                onClick={() => setIsCreatingNew(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                New Folder
              </Button>
            </div>
          </div>

          {!isCreatingNew ? (
            <div className="space-y-2">
              <Label>Select Existing Folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                  {existingFolders.filter(folder => folder !== 'Uncategorized').map(folder => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>New Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                maxLength={50}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={
              isLoading || 
              (isCreatingNew && !newFolderName.trim()) ||
              (!isCreatingNew && !selectedFolder)
            }
          >
            {isLoading ? 'Adding...' : 'Add to Folder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FolderSelectionDialog;