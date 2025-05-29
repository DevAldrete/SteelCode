package analyzer

import (
	"testing"

	"github.com/user/code-analyzer-service/internal/models"
)

func TestDetectLanguage(t *testing.T) {
	testCases := []struct {
		name          string
		request       models.AnalysisRequest
		expectedLang  string
		expectError   bool
		errorContains string // Substring to check in error message
	}{
		{
			name: "Explicitly provided valid language - python",
			request: models.AnalysisRequest{
				Language:    "python",
				CodeSnippet: "print('hello')",
			},
			expectedLang: "python",
			expectError:  false,
		},
		{
			name: "Explicitly provided valid language - go",
			request: models.AnalysisRequest{
				Language:    "go",
				CodeSnippet: "package main",
			},
			expectedLang: "go",
			expectError:  false,
		},
		{
			name: "Explicitly provided valid language - javascript (uppercase)",
			request: models.AnalysisRequest{
				Language:    "JavaScript",
				CodeSnippet: "console.log('test');",
			},
			expectedLang: "javascript",
			expectError:  false,
		},
		{
			name: "Explicitly provided unsupported language",
			request: models.AnalysisRequest{
				Language:    "rust",
				CodeSnippet: "fn main() {}",
			},
			expectedLang:  "",
			expectError:   true,
			errorContains: "language 'rust' is not supported",
		},
		{
			name: "Detection by file extension - .py",
			request: models.AnalysisRequest{
				CodeSnippet: "main.py", // Assuming CodeSnippet can be a filename
			},
			expectedLang: "python",
			expectError:  false,
		},
		{
			name: "Detection by file extension - .go",
			request: models.AnalysisRequest{
				CodeSnippet: "server/main.go",
			},
			expectedLang: "go",
			expectError:  false,
		},
		{
			name: "Detection by file extension - .js",
			request: models.AnalysisRequest{
				CodeSnippet: "scripts/app.JS", // Mixed case extension
			},
			expectedLang: "javascript",
			expectError:  false,
		},
		{
			name: "Detection by file extension - .ts",
			request: models.AnalysisRequest{
				CodeSnippet: "src/component.ts",
			},
			expectedLang: "typescript",
			expectError:  false,
		},
		{
			name: "No language provided, unrecognized extension",
			request: models.AnalysisRequest{
				CodeSnippet: "README.md",
			},
			expectedLang:  "",
			expectError:   true,
			errorContains: "unable to detect language",
		},
		{
			name: "No language provided, no extension in snippet",
			request: models.AnalysisRequest{
				CodeSnippet: "some code without extension",
			},
			expectedLang:  "",
			expectError:   true,
			errorContains: "unable to detect language",
		},
		{
			name: "Empty code snippet and no language provided",
			request: models.AnalysisRequest{
				CodeSnippet: "",
			},
			expectedLang:  "",
			expectError:   true,
			errorContains: "unable to detect language",
		},
		{
			name: "Language provided, but snippet has different extension (language takes precedence)",
			request: models.AnalysisRequest{
				Language:    "python",
				CodeSnippet: "test.js",
			},
			expectedLang: "python",
			expectError:  false,
		},
		{
			name: "Unsupported language even with supported extension in snippet",
			request: models.AnalysisRequest{
				Language:    "java",
				CodeSnippet: "MyClass.java",
			},
			expectedLang:  "",
			expectError:   true,
			errorContains: "language 'java' is not supported",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			lang, err := DetectLanguage(tc.request)

			if tc.expectError {
				if err == nil {
					t.Errorf("Expected an error, but got nil")
				} else if tc.errorContains != "" && !strings.Contains(err.Error(), tc.errorContains) {
					t.Errorf("Expected error to contain '%s', but got: %v", tc.errorContains, err)
				}
			} else {
				if err != nil {
					t.Errorf("Did not expect an error, but got: %v", err)
				}
			}

			if lang != tc.expectedLang {
				t.Errorf("Expected language '%s', but got '%s'", tc.expectedLang, lang)
			}
		})
	}
}

// Helper function for TestDetectLanguage to check string contents (already used strings.Contains)
// No specific testify assertions are strictly needed here with standard library.
func TestLanguageIsSupported(t *testing.T) {
	tests := []struct {
		lang string
		want bool
	}{
		{"python", true},
		{"PYTHON", true}, // Test case-insensitivity if DetectLanguage handles it before this
		{"go", true},
		{"javascript", true},
		{"typescript", true},
		{"java", false},
		{"", false},
	}
	for _, tt := range tests {
		t.Run(tt.lang, func(t *testing.T) {
			// Note: DetectLanguage itself handles case normalization for the explicit language.
			// This test directly tests languageIsSupported which is case-sensitive as currently written.
			// To make languageIsSupported case-insensitive, it would also need strings.ToLower.
			// For the purpose of DetectLanguage, the current setup is fine as DetectLanguage normalizes.
			got := languageIsSupported(strings.ToLower(tt.lang)) // Normalizing here to match DetectLanguage's behavior
			if got != tt.want {
				t.Errorf("languageIsSupported(%q) = %v, want %v", tt.lang, got, tt.want)
			}
		})
	}
}
