/**
 * @file AnalysisView.tsx
 * Component for the Analysis view of the webview UI.
 * This view is primarily responsible for allowing users to trigger and see the results of code analysis.
 * It currently renders the `AnalysisRunner` component.
 */
import React from 'react';
import AnalysisRunner from './AnalysisRunner'; // Import the component that handles analysis execution and display
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * @component AnalysisView
 * The main component for the "Analysis" screen.
 * It provides a section for users to input code and trigger an analysis,
 * which is handled by the `AnalysisRunner` component.
 * @returns {React.ReactElement} The rendered AnalysisView component.
 */
export default function AnalysisView() {
  // TODO: Add more descriptive text or instructions for the user on this page.
  // For example, explain what kind of code can be analyzed or what to expect.
  return (
    <Box>
      <Typography variant="h4" gutterBottom component="h2">
        Code Analysis
      </Typography>
      {/* 
        The original placeholder content of AnalysisView has been replaced by AnalysisRunner.
        If there were other elements specific to this view (e.g., settings for analysis,
        a history of analyses), they would be added here around AnalysisRunner.
      */}
      {/* TODO: Consider adding a section to display past analysis results or a summary. */}
      <AnalysisRunner />
    </Box>
  );
}
