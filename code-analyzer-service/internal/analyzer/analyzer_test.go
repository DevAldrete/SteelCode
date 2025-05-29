package analyzer

import (
	"errors"
	"reflect"
	"strings"
	"testing"

	"github.com/user/code-analyzer-service/internal/analyzer/runners" // For runners.RunRuffAnalysisFunc
	"github.com/user/code-analyzer-service/internal/clients"
	"github.com/user/code-analyzer-service/internal/logger" // For logger initialization
	"github.com/user/code-analyzer-service/internal/models"
)

func TestAnalyzeCode(t *testing.T) {
	// Initialize logger for tests, as the functions use the global logger
	_, err := logger.NewLogger("error") // Initialize with a default level
	if err != nil {
		t.Fatalf("Failed to initialize logger for tests: %v", err)
	}

	// Original function references to restore after each test
	originalDetectLanguageFunc := DetectLanguageFunc
	originalRunRuffAnalysisFunc := runners.RunRuffAnalysisFunc
	
	// For this test suite, we're primarily testing the analyzer's orchestration logic,
	// not the storage client interaction directly. A nil client is sufficient.
	var nilStorageClient *clients.StorageServiceClient

	tests := []struct {
		name                string
		request             models.AnalysisRequest
		mockDetectLang      func(req models.AnalysisRequest) (string, error)
		mockRuffAnalysis    func(codeSnippet string, config map[string]interface{}) ([]models.Issue, error)
		// mockStorageClient can be set per test if specific client interactions were to be tested here
		wantResponseSummary string // Check for a substring in the summary
		wantResponseError   string // Check for a substring in the response's Error field
		wantIssuesCount     int
		wantLanguage        string
	}{
		{
			name:    "Successful Python analysis with issues",
			request: models.AnalysisRequest{CodeSnippet: "print('hello')", Language: "python"},
			mockDetectLang: func(req models.AnalysisRequest) (string, error) {
				return "python", nil
			},
			mockRuffAnalysis: func(codeSnippet string, config map[string]interface{}) ([]models.Issue, error) {
				return []models.Issue{{RuleID: "PY001", Message: "Test issue"}}, nil
			},
			wantResponseSummary: "Python analysis complete. Found 1 issues.",
			wantIssuesCount:    1,
			wantLanguage:       "python",
		},
		{
			name:    "Successful Python analysis with no issues",
			request: models.AnalysisRequest{CodeSnippet: "pass", Language: "python"},
			mockDetectLang: func(req models.AnalysisRequest) (string, error) {
				return "python", nil
			},
			mockRuffAnalysis: func(codeSnippet string, config map[string]interface{}) ([]models.Issue, error) {
				return []models.Issue{}, nil
			},
			wantResponseSummary: "Python analysis complete. Found 0 issues.",
			wantIssuesCount:    0,
			wantLanguage:       "python",
		},
		{
			name:    "Python analysis where Ruff runner fails",
			request: models.AnalysisRequest{CodeSnippet: "print('bad')", Language: "python"},
			mockDetectLang: func(req models.AnalysisRequest) (string, error) {
				return "python", nil
			},
			mockRuffAnalysis: func(codeSnippet string, config map[string]interface{}) ([]models.Issue, error) {
				return nil, errors.New("ruff execution error")
			},
			wantResponseSummary: "Python analysis encountered an error.",
			wantResponseError:  "Python analysis error: ruff execution error",
			wantIssuesCount:    0,
			wantLanguage:       "python",
		},
		{
			name:    "Language detection failure",
			request: models.AnalysisRequest{CodeSnippet: "unknown code"},
			mockDetectLang: func(req models.AnalysisRequest) (string, error) {
				return "", errors.New("unsupported language detected")
			},
			wantResponseSummary: "Failed to detect language from request.",
			wantResponseError:  "Language detection failed: unsupported language detected",
			wantIssuesCount:    0,
			wantLanguage:       "", 
		},
		{
			name:    "Analysis for Go (not yet implemented)",
			request: models.AnalysisRequest{CodeSnippet: "package main", Language: "go"},
			mockDetectLang: func(req models.AnalysisRequest) (string, error) {
				return "go", nil
			},
			wantResponseSummary: "Analysis for go is not yet implemented.",
			wantIssuesCount:    0,
			wantLanguage:       "go",
		},
		{
			name:    "Analysis for JavaScript (not yet implemented)",
			request: models.AnalysisRequest{CodeSnippet: "console.log('test')", Language: "javascript"},
			mockDetectLang: func(req models.AnalysisRequest) (string, error) {
				return "javascript", nil
			},
			wantResponseSummary: "Analysis for javascript is not yet implemented.",
			wantIssuesCount:    0,
			wantLanguage:       "javascript",
		},
		{
			name:    "Analysis for TypeScript (not yet implemented)",
			request: models.AnalysisRequest{CodeSnippet: "let x: string = 'test';", Language: "typescript"},
			mockDetectLang: func(req models.AnalysisRequest) (string, error) {
				return "typescript", nil
			},
			wantResponseSummary: "Analysis for typescript is not yet implemented.",
			wantIssuesCount:    0,
			wantLanguage:       "typescript",
		},
		{
			name:    "Unsupported language (post-detection safeguard)",
			request: models.AnalysisRequest{CodeSnippet: "some code", Language: "ruby"}, 
			mockDetectLang: func(req models.AnalysisRequest) (string, error) {
				return "ruby", nil 
			},
			wantResponseSummary: "Language is not supported for analysis.",
			wantResponseError:  "Unsupported language for analysis: ruby",
			wantIssuesCount:    0,
			wantLanguage:       "ruby",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			DetectLanguageFunc = tt.mockDetectLang
			if tt.mockRuffAnalysis != nil {
				runners.RunRuffAnalysisFunc = tt.mockRuffAnalysis
			}

			response, err := AnalyzeCode(tt.request, nilStorageClient) // Pass nil client

			DetectLanguageFunc = originalDetectLanguageFunc
			runners.RunRuffAnalysisFunc = originalRunRuffAnalysisFunc

			if err != nil {
				t.Errorf("AnalyzeCode() returned an unexpected direct error: %v", err)
			}
			if response == nil {
				t.Fatalf("AnalyzeCode() response is nil")
			}

			if tt.wantResponseSummary != "" && !strings.Contains(response.Summary, tt.wantResponseSummary) {
				t.Errorf("AnalyzeCode() response.Summary = %q, want to contain %q", response.Summary, tt.wantResponseSummary)
			}

			if tt.wantResponseError != "" && !strings.Contains(response.Error, tt.wantResponseError) {
				t.Errorf("AnalyzeCode() response.Error = %q, want to contain %q", response.Error, tt.wantResponseError)
			} else if tt.wantResponseError == "" && response.Error != "" {
				t.Errorf("AnalyzeCode() response.Error = %q, want empty", response.Error)
			}

			if len(response.Issues) != tt.wantIssuesCount {
				t.Errorf("AnalyzeCode() len(response.Issues) = %d, want %d", len(response.Issues), tt.wantIssuesCount)
			}

			if response.Language != tt.wantLanguage {
				t.Errorf("AnalyzeCode() response.Language = %q, want %q", response.Language, tt.wantLanguage)
			}

			if response.RequestID == "" {
				t.Error("AnalyzeCode() response.RequestID is empty, should be generated")
			}
		})
	}
}
