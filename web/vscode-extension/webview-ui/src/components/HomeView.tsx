/**
 * @file HomeView.tsx
 * Component for the Home view of the webview UI.
 * It displays a welcome message, an example of fetching data using TanStack Query (`DummyDataFetcher`),
 * and any general messages received from the VS Code extension.
 */
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { postMessageWithResponse, WebviewMessage } from '../vscodeApi';

/**
 * @component DummyDataFetcher
 * A component that demonstrates using `useQuery` from TanStack Query
 * to fetch data from the VS Code extension.
 * It displays loading, error, and success states for the data fetching operation.
 * TODO: This could be moved to its own file if it becomes more complex or reusable elsewhere.
 * @returns {React.ReactElement | null} The rendered component or null.
 */
function DummyDataFetcher() {
  const { data, isLoading, isError, error, fetchStatus } = useQuery({
    queryKey: ['dummyData'], // Unique key for this query
    queryFn: async () => {
      // TODO: Add more specific logging for debugging query states.
      console.log('[HomeView/DummyDataFetcher] Requesting dummy data from extension...');
      const response = await postMessageWithResponse({ type: 'getDummyData' });
      console.log('[HomeView/DummyDataFetcher] Received dummy data response:', response);
      // TODO: Add validation for the response structure.
      return response;
    },
    // TODO: Consider adding options like `staleTime`, `cacheTime` if appropriate for this data.
  });

  if (isLoading) {
    // TODO: Use a more visually appealing loading indicator (e.g., MUI Skeleton or CircularProgress).
    return <Typography>Loading dummy data... (Status: {fetchStatus})</Typography>;
  }

  if (isError) {
    // TODO: Provide more user-friendly error messages and potentially retry mechanisms.
    return (
      <Box sx={{ color: 'error.main', my: 2 }}>
        <Typography variant="h6">Error loading dummy data:</Typography>
        <pre>{error instanceof Error ? error.message : JSON.stringify(error, null, 2)}</pre>
      </Box>
    );
  }

  if (data) {
    return (
      <Box mt={2} p={2} bgcolor="lightgoldenrodyellow" sx={{ fontFamily: 'monospace', overflowX: 'auto' }}>
        <Typography variant="h6" gutterBottom>Dummy Data from Extension (via TanStack Query):</Typography>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Box>
    );
  }
  
  // TODO: Handle cases where data is null but not loading or error (e.g. after a successful fetch that returns null explicitly).
  return null; // Or some placeholder if data is expected but null
}

/**
 * Props for the `HomeView` component.
 */
interface HomeViewProps {
  /** 
   * The last general message received from the VS Code extension.
   * This is passed down from `App.tsx` via router context.
   */
  lastGeneralMessage: WebviewMessage | null;
}

/**
 * @component HomeView
 * The main component for the home screen of the Code Analyzer webview.
 * Displays a welcome message, the `DummyDataFetcher` example, and any general messages from the extension.
 * @param {HomeViewProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered HomeView component.
 */
export default function HomeView({ lastGeneralMessage }: HomeViewProps) {
  // TODO: Add more engaging content to the home view.
  return (
    <Box>
      <Typography variant="h4" gutterBottom component="h2">Home View</Typography>
      <Typography paragraph>
        Welcome to the Code Analyzer! This webview panel allows you to interact with various code analysis tools.
      </Typography>
      {/* TODO: Add instructions or quick actions for the user on this home page. */}
      
      <DummyDataFetcher />

      {lastGeneralMessage && (
        <Box mt={2} p={2} bgcolor="lightcyan" sx={{ fontFamily: 'monospace', overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>Last General Message from Extension:</Typography>
          {/* TODO: Format the display of `lastGeneralMessage` more nicely, perhaps based on its type or payload. */}
          <pre>{JSON.stringify(lastGeneralMessage, null, 2)}</pre>
        </Box>
      )}
    </Box>
  );
}
