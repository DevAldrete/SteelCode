import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

const StatusBar: React.FC = () => {
  return (
    <Paper elevation={1} sx={{ p: 1, mt: 'auto', backgroundColor: 'action.disabledBackground' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption">Status: Ready</Typography>
        <Typography variant="caption">Issues: 0</Typography>
        {/* TODO: Update with dynamic status */}
      </Box>
    </Paper>
  );
};

export default StatusBar;
