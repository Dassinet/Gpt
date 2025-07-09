import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const FolderSelectionDialog = ({ isOpen, onClose, onConfirm, existingFolders = [] }) => {
  const [newFolderName, setNewFolderName] = useState('');

  const handleConfirm = () => {
    onConfirm(newFolderName);
    setNewFolderName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Enter folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          {existingFolders.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Existing Folders:</p>
              <div className="flex flex-wrap gap-2">
                {existingFolders.map((folder) => (
                  <Button
                    key={folder}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewFolderName(folder);
                    }}
                  >
                    {folder}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!newFolderName.trim()}>
            Add to Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FolderSelectionDialog; 