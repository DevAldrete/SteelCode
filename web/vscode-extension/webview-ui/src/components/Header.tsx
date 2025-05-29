import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from '@tanstack/react-router';

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Code Analyzer
        </Typography>
        <Button color="inherit" component={Link} to="/" activeProps={{ style: { fontWeight: 'bold' } }} >
          Home
        </Button>
        <Button color="inherit" component={Link} to="/analysis" activeProps={{ style: { fontWeight: 'bold' } }}>
          Analysis
        </Button>
        {/* TODO: Add any action buttons here if needed */}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
