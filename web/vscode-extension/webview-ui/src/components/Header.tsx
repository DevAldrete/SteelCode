import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Code Analyzer
        </Typography>
        {/* TODO: Add any action buttons here if needed */}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
