package models

// Issue defines the structure for a single identified issue.
type Issue struct {
	RuleID      string `json:"rule_id"`
	Message     string `json:"message"`
	Severity    string `json:"severity"` // e.g., "error", "warning", "info"
	FilePath    string `json:"file_path,omitempty"`
	LineStart   int    `json:"line_start"`
	LineEnd     int    `json:"line_end"`
	ColumnStart int    `json:"column_start,omitempty"`
	ColumnEnd   int    `json:"column_end,omitempty"`
	Suggestion  string `json:"suggestion,omitempty"`
}

// AnalysisRequest defines the structure for an analysis request.
type AnalysisRequest struct {
	CodeSnippet string                 `json:"code_snippet"`
	Language    string                 `json:"language,omitempty"`
	ProjectURL  string                 `json:"project_url,omitempty"`
	Config      map[string]interface{} `json:"config,omitempty"`
}

// AnalysisResponse defines the structure for an analysis response.
type AnalysisResponse struct {
	RequestID string  `json:"request_id"`
	Language  string  `json:"language"`
	Issues    []Issue `json:"issues"`
	Summary   string  `json:"summary"`
	Error     string  `json:"error,omitempty"`
}
