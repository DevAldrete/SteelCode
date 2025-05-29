import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton'; // Changed from ListItem for click behavior
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; // For files
// import FolderIcon from '@mui/icons-material/Folder'; // For folders if added
import { FileItem } from '../types'; // Import FileItem

const mockFiles: FileItem[] = [
  { id: 'file1', name: 'example.py', path: 'src/example.py' },
  { id: 'file2', name: 'utils.js', path: 'src/utils.js' },
  { id: 'file3', name: 'main.go', path: 'cmd/main.go' },
  { id: 'file4', name: 'README.md', path: 'README.md' },
  { id: 'file5', name: 'package.json', path: 'package.json' },
];

const FileExplorerPanel: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const handleFileClick = (fileId: string) => {
    setSelectedFileId(fileId);
    // TODO: Add logic to inform other components or fetch analysis for this file
    // TODO: Send selected file path to the VS Code extension to trigger analysis
    // TODO: Potentially clear existing analysis results or show a loading state
    console.log('Selected file:', fileId);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h6" gutterBottom>File Explorer</Typography>
      {mockFiles.length === 0 ? (
        <Typography variant="body1">No files found.</Typography>
      ) : (
        <List component="nav" dense>
          {mockFiles.map((file) => (
            <ListItemButton
              key={file.id}
              selected={selectedFileId === file.id}
              onClick={() => handleFileClick(file.id)}
            >
              <ListItemIcon sx={{minWidth: '32px'}}> {/* Adjusted minWidth */}
                <InsertDriveFileIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={file.name} 
                secondary={file.path}
                primaryTypographyProps={{ sx: { textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' } }}
                secondaryTypographyProps={{ sx: { textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' } }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default FileExplorerPanel;
