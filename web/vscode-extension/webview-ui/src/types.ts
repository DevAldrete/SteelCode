export interface AnalysisIssue {
  id: string;
  fileName: string;
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  ruleId?: string;
  codeSnippet?: string;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  // type: 'file' | 'folder'; // Future enhancement
}
