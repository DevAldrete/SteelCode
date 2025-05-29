/**
 * @file App.tsx
 * This is the main application component for the webview UI.
 * It sets up the overall layout, including the header, main content area with a file explorer
 * and an outlet for TanStack Router to render different views, and a status bar.
 * It also handles global logic such as listening for messages from the VS Code extension.
 */
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Header from './components/Header';
import FileExplorerPanel from './components/FileExplorerPanel';
// AnalysisResultsView (if it was a direct child) is now rendered by a route, not directly by App.
import StatusBar from './components/StatusBar';
import CssBaseline from '@mui/material/CssBaseline';
import { Outlet } from '@tanstack/react-router';
import { addMessageListener, postMessageToExtension, WebviewMessage } from './vscodeApi';

// TODO: Define these styles more robustly, perhaps in a theme file or using styled-components/emotion.
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
  // TODO: Make panel height calculation more dynamic and less brittle.
  // This calculation `calc(100vh - 120px)` assumes fixed heights for Header (e.g., 64px) and StatusBar (e.g., 56px).
  // Consider using flexbox for better height distribution or CSS variables.
  height: 'calc(100vh - 120px)', // Adjust based on Header/StatusBar height, example value
  overflowY: 'auto',
};

// App.tsx now serves as the main layout.
// Components like DummyDataFetcher and AnalysisResultsView are rendered via routes (HomeView, AnalysisView).

/**
 * Defines the structure of the context object provided to child routes via TanStack Router's `<Outlet context={...} />`.
 * This allows child routes (like HomeView) to access shared state or functions from App.tsx.
 */
export interface AppRouterContext {
  /** The last general message received from the VS Code extension. */
  lastGeneralMessage: WebviewMessage | null;
  /** 
   * Function to update `lastGeneralMessage`.
   * TODO: Evaluate if child routes truly need to set this; typically, only App would set it based on extension messages.
   */
  setLastGeneralMessage: React.Dispatch<React.SetStateAction<WebviewMessage | null>>;
}

/**
 * The main App component.
 * It sets up the overall structure of the webview UI, including:
 * - A header for navigation.
 * - A main content area with a file explorer panel and an area for routed views.
 * - A status bar.
 * It also initializes message listening from the extension and provides context to routes.
 * @returns {React.ReactElement} The rendered App component.
 */
function App() {
  /** State to store the last general message received from the extension. */
  const [lastGeneralMessage, setLastGeneralMessage] = useState<WebviewMessage | null>(null);

  useEffect(() => {
    // Set up a listener for general messages (e.g., notifications) from the VS Code extension.
    // This listener updates the `lastGeneralMessage` state.
    const disposeListener = addMessageListener((message) => {
      console.log('[App.tsx] General message received from extension:', message);
      setLastGeneralMessage(message);

      // Example: Handle specific types of general messages.
      if (message.type === 'webviewReady') {
        // This message indicates the extension has set up the webview and is ready.
        // This is different from the 'webviewUiReady' message sent from here to the extension.
        console.log('[App.tsx] Extension signaled that webview is ready.');
        // TODO: Perform any actions needed when the extension confirms webview readiness.
      }
    });

    // Send a "webview UI is ready" message to the extension when the App component mounts.
    // This informs the extension that the React UI has loaded and can process messages.
    // TODO: Ensure this message type 'webviewUiReady' is handled by `extension.ts`.
    const readyMessage: WebviewMessage = {
      type: 'webviewUiReady',
      payload: 'Webview UI is mounted and ready to receive data or router commands.',
    };
    console.log('[App.tsx] Sending webviewUiReady message to extension:', readyMessage);
    postMessageToExtension(readyMessage);

    // Cleanup function for the useEffect hook.
    // This will be called when the App component unmounts.
    return () => {
      // Dispose of the message listener to prevent memory leaks.
      if (typeof disposeListener === 'function') {
        disposeListener();
      }
      // TODO: Add any other cleanup logic needed when the App unmounts.
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount.

  // Prepare the context object to be passed to child routes via the <Outlet />.
  // This makes `lastGeneralMessage` (and its setter) available to components rendered by the router.
  const routerContext: AppRouterContext = {
    lastGeneralMessage,
    setLastGeneralMessage, // TODO: Re-evaluate if child routes should be able to call setLastGeneralMessage.
                           // It's generally better for state to be updated where it's defined (here in App.tsx).
  };

  return (
    <Box sx={appContainerStyles}>
      <CssBaseline /> {/* Applies Material UI's baseline styles. */}
      <Header /> {/* Renders the application header, typically containing navigation links. */}
      
      <Box sx={mainContentStyles}>
        <Grid container spacing={1} sx={{ flexGrow: 1 }}>
          {/* File Explorer Panel - part of the main layout */}
          <Grid item xs={12} md={3}> {/* TODO: Make column width (md={3}) configurable or responsive. */}
            <Box sx={panelStyles}>
              <FileExplorerPanel />
              {/* TODO: Implement functionality for FileExplorerPanel (e.g., listing files, opening files). */}
            </Box>
          </Grid>
          
          {/* Main Content Area for Routed Views */}
          <Grid item xs={12} md={9}> {/* TODO: Make column width (md={9}) configurable or responsive. */}
            <Box sx={panelStyles}>
              {/* TanStack Router's <Outlet /> renders the component for the matched child route. */}
              {/* The `routerContext` is passed down, making it available to the routed components. */}
              <Outlet context={routerContext} />
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <StatusBar /> {/* Renders the application status bar. */}
      {/* TODO: Implement dynamic content or status updates for StatusBar. */}
    </Box>
  );
}

export default App;
