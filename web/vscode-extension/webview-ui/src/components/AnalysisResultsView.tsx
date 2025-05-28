import React, { useRef } from 'react'; // Added useRef
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import CodeIcon from '@mui/icons-material/Code';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react'; // Import useGSAP
import { AnalysisIssue } from '../types'; // Import AnalysisIssue

// TODO: Replace mockIssues with data received from the VS Code extension
// TODO: Implement loading and error states based on data fetching
const mockIssues: AnalysisIssue[] = [
  { id: '1', fileName: 'example.py', line: 15, message: 'Undefined variable "my_var"', severity: 'error', ruleId: 'E001', codeSnippet: 'print(my_var)' },
  { id: '2', fileName: 'utils.js', line: 27, message: 'Unused function parameter "config"', severity: 'warning', ruleId: 'W002', codeSnippet: 'function setup(config, options) { return options; }' },
  { id: '3', fileName: 'example.py', line: 42, message: 'Consider using a list comprehension for clarity.', severity: 'info', ruleId: 'I003', codeSnippet: 'results = []\nfor i in range(10):\n  results.append(i*2)' },
  { id: '4', fileName: 'styles.css', line: 5, message: 'Avoid using !important.', severity: 'warning', ruleId: 'W004',}
];


const severityColors: Record<AnalysisIssue['severity'], 'error' | 'warning' | 'info'> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const AnalysisResultsView: React.FC = () => {
  const containerRef = useRef<HTMLUListElement>(null); // Ref for the List component

  // GSAP animation using the useGSAP hook
  useGSAP(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children, // Animate direct children of the List
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.1, // Stagger animation for each item
          ease: 'power2.out',
        }
      );
    }
  }, { scope: containerRef, dependencies: [mockIssues] }); // Re-run if mockIssues change

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h6" gutterBottom>Analysis Results</Typography>
      {mockIssues.length === 0 ? (
        <Typography variant="body1">No analysis results yet.</Typography>
      ) : (
        // Add the ref to the List component
        <List sx={{ width: '100%' }} ref={containerRef}> 
          {mockIssues.map((issue) => (
            // Each ListItem is a direct child and will be animated
            <ListItem key={issue.id} sx={{ mb: 2, p: 0, opacity: 0 /* Initial state for GSAP */ }}>
              <Card variant="outlined" sx={{ width: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" component="div">
                      {issue.fileName}:{issue.line}
                    </Typography>
                    <Chip
                      label={issue.severity.toUpperCase()}
                      color={severityColors[issue.severity]}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {issue.message}
                  </Typography>
                  {issue.ruleId && (
                    <Typography variant="caption" display="block" color="text.disabled" sx={{ mb: 0.5 }}>
                      Rule: {issue.ruleId}
                    </Typography>
                  )}
                  {issue.codeSnippet && (
                    <Paper variant="outlined" sx={{ p: 1, backgroundColor: 'grey.100', overflowX: 'auto', mt:1 }}>
                      <Box sx={{display: 'flex', alignItems: 'center', mb: 0.5}}>
                        <CodeIcon fontSize="small" sx={{mr: 0.5}}/>
                        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace'}}>
                          {issue.codeSnippet}
                        </Typography>
                      </Box>
                    </Paper>
                  )}
                </CardContent>
              </Card>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default AnalysisResultsView;
