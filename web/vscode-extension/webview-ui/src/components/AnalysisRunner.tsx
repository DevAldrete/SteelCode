/**
 * @file AnalysisRunner.tsx
 * Component that provides a UI for users to input code and trigger an analysis.
 * It uses TanStack Query's `useMutation` to handle the asynchronous analysis request
 * to the VS Code extension and displays loading, success, and error states.
 */
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postMessageWithResponse } from '../vscodeApi';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

// TODO: Define a more specific type for the analysis result payload if known.
// type AnalysisResult = { report: string; issues: Array<{line: number; message: string; type?: string}>; metrics?: any };
// type AnalysisError = { message: string; details?: any };


/**
 * @component AnalysisRunner
 * Provides a text area for code input and a button to trigger code analysis.
 * Displays the status and results of the analysis using `useMutation`.
 * @returns {React.ReactElement} The rendered AnalysisRunner component.
 */
export default function AnalysisRunner() {
  /** State for the code to be analyzed, initialized with some placeholder code. */
  const [codeToAnalyze, setCodeToAnalyze] = useState<string>(
    '// Enter your code here\nfunction example(a, b) {\n  if (a > b) {\n    console.log("a is greater");\n  } else {\n    // TODO: Handle other cases\n    return a + b;\n  }\n}'
  );

  /**
   * Mutation hook from TanStack Query to handle the 'runAnalysis' action.
   * It calls `postMessageWithResponse` to send the code to the extension
   * and processes the success or error response.
   */
  const runAnalysisMutation = useMutation<any, Error, string>({ // TODO: Replace 'any' with specific result/error types
    mutationFn: async (code: string) => {
      // TODO: Add more detailed logging for debugging.
      console.log('[AnalysisRunner] Sending runAnalysis request for code snippet.');
      // The `postMessageWithResponse` function handles the communication with the extension,
      // including matching the response by `requestId`. The extension is expected
      // to send back a message with either a `payload` (on success) or an `error` field.
      return postMessageWithResponse({
        type: 'runAnalysis', // Message type recognized by the extension
        payload: { codeToAnalyze: code },
      });
    },
    onSuccess: (data) => {
      // TODO: Implement more sophisticated success handling, e.g., displaying results in a structured way,
      // or triggering notifications.
      console.log('[AnalysisRunner] Analysis successful:', data);
    },
    onError: (error: any) => { // TODO: Type 'error' more specifically if possible
      // TODO: Implement more user-friendly error display or reporting.
      // For instance, show specific error messages if the error object has a known structure.
      console.error('[AnalysisRunner] Analysis error:', error);
    },
    // TODO: Consider adding `onMutate` for optimistic updates or `onSettled` for cleanup if needed.
  });

  /**
   * Handles the form submission (button click) to trigger the analysis.
   * It calls the `mutate` function from `useMutation` with the current code.
   */
  const handleSubmit = () => {
    // TODO: Add validation for `codeToAnalyze` before sending (e.g., not empty).
    if (!codeToAnalyze.trim()) {
        // TODO: Show a user-facing error message if the code is empty.
        console.warn('[AnalysisRunner] Attempted to run analysis on empty code.');
        return;
    }
    runAnalysisMutation.mutate(codeToAnalyze);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom component="h3">
        Run Code Analysis
      </Typography>
      {/* TODO: Add options for selecting analysis type or specific rules if applicable. */}
      <TextField
        label="Code to Analyze"
        multiline
        rows={10} // Increased rows for better usability
        value={codeToAnalyze}
        onChange={(e) => setCodeToAnalyze(e.target.value)}
        variant="outlined"
        fullWidth
        sx={{ mb: 2, fontFamily: 'monospace', fontSize: '0.9rem' }} // Monospace font for code
        placeholder="// Paste or type your code here..."
      />
      <Button
        onClick={handleSubmit}
        variant="contained"
        color="primary" // Explicitly set color
        disabled={runAnalysisMutation.isPending}
        startIcon={runAnalysisMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {runAnalysisMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
      </Button>

      {/* Displaying Mutation Status */}
      {runAnalysisMutation.isError && (
        <Alert severity="error" sx={{ mt: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <Typography variant="h6">Analysis Failed</Typography>
          <pre>
            {/* TODO: Improve error display. If `error.details` exists (as sent from extension), show it. */}
            {runAnalysisMutation.error?.message || JSON.stringify(runAnalysisMutation.error, null, 2)}
          </pre>
          {/* TODO: Add a retry button or suggestions for fixing the error. */}
        </Alert>
      )}

      {runAnalysisMutation.isSuccess && (
        <Alert severity="success" sx={{ mt: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <Typography variant="h6">Analysis Result</Typography>
          {/* TODO: Format the success data more meaningfully.
                      This might involve creating sub-components to render issues, metrics, etc. */}
          <pre>{JSON.stringify(runAnalysisMutation.data, null, 2)}</pre>
        </Alert>
      )}
      {/* TODO: Add a section for "no results yet" or initial placeholder before any mutation. */}
    </Box>
  );
}
