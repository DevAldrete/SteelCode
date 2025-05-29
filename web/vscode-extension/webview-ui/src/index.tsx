import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './routes'; // Import the router instance
// If you plan to use a custom theme, import ThemeProvider and your theme here

const rootElement = document.getElementById('root');
const queryClient = new QueryClient();

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <CssBaseline /> {/* Ensures consistent baseline styling */}
        {/* <ThemeProvider theme={yourTheme}> */}
        <RouterProvider router={router} />
        {/* </ThemeProvider> */}
      </QueryClientProvider>
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}
