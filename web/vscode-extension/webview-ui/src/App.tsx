import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

// TODO: Set up message listeners to receive data from the VS Code extension
// TODO: Implement functions to post messages to the VS Code extension
import Header from './components/Header';
import FileExplorerPanel from './components/FileExplorerPanel';
import AnalysisResultsView from './components/AnalysisResultsView';
import StatusBar from './components/StatusBar';
import CssBaseline from '@mui/material/CssBaseline'; // Already in index.tsx, but good for context

// Optional: Define a main container style for App
const appContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh', // Full viewport height
  overflow: 'hidden', // Prevent scrollbars on the main app container
};

const mainContentStyles = {
  flexGrow: 1,
  p: 1, // Padding for the main content area
  display: 'flex',
  flexDirection: 'column', // Ensure it can grow
  overflowY: 'auto', // Allow scrolling for content if it overflows
};

const panelStyles = {
  height: 'calc(100vh - 120px)', // Adjust based on Header/StatusBar height, example value
  overflowY: 'auto',
};

function App() {
  return (
    <Box sx={appContainerStyles}>
      <CssBaseline /> {/* Ensure baseline styles are applied */}
      <Header />
      <Box sx={mainContentStyles}>
        <Grid container spacing={1} sx={{ flexGrow: 1 }}>
          <Grid item xs={12} md={3}>
            <Box sx={panelStyles}>
              <FileExplorerPanel />
            </Box>
          </Grid>
          <Grid item xs={12} md={9}>
            <Box sx={panelStyles}>
              <AnalysisResultsView />
            </Box>
          </Grid>
        </Grid>
      </Box>
      <StatusBar />
    </Box>
  );
}

export default App;
