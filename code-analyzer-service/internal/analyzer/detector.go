package analyzer

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/user/code-analyzer-service/internal/models"
)

// supportedLanguages maps file extensions to language names.
var supportedLanguages = map[string]string{
	".py": "python",
	".go": "go",
	".js": "javascript",
	".ts": "typescript",
}

// languageIsSupported checks if a given language (by name, not extension) is supported.
func languageIsSupported(lang string) bool {
	for _, supportedLang := range supportedLanguages {
		if supportedLang == lang {
			return true
		}
	}
	// Also allow "python", "go", "javascript", "typescript" if provided directly
	// This is a bit redundant with the map values but covers cases where a language name is directly provided
	// without an extension.
	switch lang {
	case "python", "go", "javascript", "typescript":
		return true
	}
	return false
}

// DetectLanguageFunc is a variable for DetectLanguage to allow mocking in tests.
var DetectLanguageFunc = DetectLanguage

// DetectLanguage determines the programming language from the analysis request.
// Priority:
// 1. Explicitly provided language in request.Language.
// 2. File extension from request.CodeSnippet (if it appears to be a filename).
// 3. Returns an error or "unknown" if not determinable.
func DetectLanguage(request models.AnalysisRequest) (string, error) {
	// Priority 1: Explicitly provided language
	if request.Language != "" {
		trimmedLang := strings.ToLower(strings.TrimSpace(request.Language))
		if languageIsSupported(trimmedLang) {
			return trimmedLang, nil
		}
		return "", fmt.Errorf("language '%s' is not supported", request.Language)
	}

	// Priority 2: Filename from code_snippet (if applicable)
	// This is a simple check; a more robust solution might involve checking if
	// CodeSnippet is a path or actual code content.
	if request.CodeSnippet != "" {
		ext := strings.ToLower(filepath.Ext(request.CodeSnippet))
		if lang, ok := supportedLanguages[ext]; ok {
			return lang, nil
		}
	}

	// Priority 3: (Future) Content-based detection or default
	// For now, if language is not explicit and no clear extension is found:
	return "", fmt.Errorf("unable to detect language from request and code_snippet does not have a recognized extension")
}
