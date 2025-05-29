import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import the new App component
import CssBaseline from '@mui/material/CssBaseline'; // Recommended for Material UI
// If you plan to use a custom theme, import ThemeProvider and your theme here

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <CssBaseline /> {/* Ensures consistent baseline styling */}
      {/* <ThemeProvider theme={yourTheme}> */}
      <App />
      {/* </ThemeProvider> */}
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}
