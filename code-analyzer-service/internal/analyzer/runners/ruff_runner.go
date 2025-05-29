package runners

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/user/code-analyzer-service/internal/logger"
	"github.com/user/code-analyzer-service/internal/models"
	"go.uber.org/zap"
)

// execCommand is a variable to allow mocking of exec.Command in tests.
var execCommand = exec.Command

// RuffIssue defines the structure for a single issue reported by Ruff's JSON output.
// This is based on a typical Ruff JSON structure. Adjust if Ruff's output changes.
type RuffIssue struct {
	Code        string       `json:"code"`
	Message     string       `json:"message"`
	Location    RuffLocation `json:"location"`
	EndLocation RuffLocation `json:"end_location"`
	Filename    string       `json:"filename"`
	Fix         *RuffFix     `json:"fix"` // Pointer to allow null
}

// RuffLocation defines the start/end location of an issue.
type RuffLocation struct {
	Row    int `json:"row"`
	Column int `json:"column"`
}

// RuffFix defines the structure for a suggested fix by Ruff.
type RuffFix struct {
	Message string `json:"message"`
	// Edits   []RuffEdit `json:"edits"` // Edits are more complex, start with message
}

// RunRuffAnalysisFunc is a variable for RunRuffAnalysis to allow mocking in tests.
var RunRuffAnalysisFunc = RunRuffAnalysis

// RunRuffAnalysis executes Ruff on the provided Python code snippet.
// TODO: Ensure Ruff is installed in the execution environment (e.g., via Dockerfile).
func RunRuffAnalysis(codeSnippet string, config map[string]interface{}) ([]models.Issue, error) {
	logger.Log.Info("Starting Ruff analysis")

	tempFile, err := os.CreateTemp("", "ruff_*.py")
	if err != nil {
		logger.Log.Error("Failed to create temporary file for Ruff analysis", zap.Error(err))
		return nil, fmt.Errorf("failed to create temporary file: %w", err)
	}
	defer func() {
		if err := os.Remove(tempFile.Name()); err != nil {
			logger.Log.Warn("Failed to remove temporary file", zap.String("filename", tempFile.Name()), zap.Error(err))
		}
	}()

	if _, err := tempFile.Write([]byte(codeSnippet)); err != nil {
		logger.Log.Error("Failed to write to temporary file", zap.String("filename", tempFile.Name()), zap.Error(err))
		if closeErr := tempFile.Close(); closeErr != nil {
			logger.Log.Warn("Failed to close temporary file after write error", zap.String("filename", tempFile.Name()), zap.Error(closeErr))
		}
		return nil, fmt.Errorf("failed to write to temporary file: %w", err)
	}
	if err := tempFile.Close(); err != nil {
		logger.Log.Error("Failed to close temporary file", zap.String("filename", tempFile.Name()), zap.Error(err))
		return nil, fmt.Errorf("failed to close temporary file: %w", err)
	}

	logger.Log.Info("Code snippet written to temporary file", zap.String("filename", tempFile.Name()))

	// Command: ruff check --format json <path_to_temp_file.py>
	// Ruff's default behavior is to exit with 1 if issues are found, 0 otherwise.
	// stderr might contain informational messages even on successful runs with findings.
	cmd := execCommand("ruff", "check", "--format", "json", tempFile.Name())
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err = cmd.Run() // This will often return an error if issues are found due to exit code 1.

	// Log Ruff's stderr regardless, as it might contain useful info or warnings from Ruff.
	if stderr.Len() > 0 {
		logger.Log.Info("Ruff stderr output", zap.String("stderr", stderr.String()))
	}

	if err != nil {
		// Check if the error is an ExitError and if Ruff still produced JSON output.
		// Ruff exits with 1 if it finds issues, which is not a failure of the tool itself.
		if exitErr, ok := err.(*exec.ExitError); ok {
			if exitErr.ExitCode() == 1 && stdout.Len() > 0 {
				logger.Log.Info("Ruff found issues and exited with 1 (expected behavior)", zap.String("filename", tempFile.Name()))
				// Proceed to parse stdout
			} else {
				// Actual execution error (Ruff crashed, not found, wrong args etc.)
				logger.Log.Error("Ruff execution failed",
					zap.String("filename", tempFile.Name()),
					zap.Error(err),
					zap.String("stdout", stdout.String()),
					zap.String("stderr", stderr.String()), // Stderr already logged, but good for context here
				)
				return nil, fmt.Errorf("ruff execution failed: %w (stderr: %s)", err, stderr.String())
			}
		} else {
			// Other kinds of errors (e.g., ruff not found in PATH)
			logger.Log.Error("Failed to run ruff command", zap.Error(err))
			return nil, fmt.Errorf("failed to run ruff command: %w", err)
		}
	}
	
	logger.Log.Info("Ruff stdout output", zap.String("stdout", stdout.String()))


	var ruffIssues []RuffIssue
	if err := json.Unmarshal(stdout.Bytes(), &ruffIssues); err != nil {
		// This can happen if stdout is empty (no issues) and ruff exited 0,
		// or if ruff outputted something that isn't the expected JSON array.
		if stdout.Len() == 0 { // No issues found, Ruff exited 0
			logger.Log.Info("No issues found by Ruff.", zap.String("filename", tempFile.Name()))
			return []models.Issue{}, nil
		}
		logger.Log.Error("Failed to unmarshal Ruff JSON output",
			zap.Error(err),
			zap.String("stdout", stdout.String()),
		)
		return nil, fmt.Errorf("failed to unmarshal ruff JSON output: %w (stdout: %s)", err, stdout.String())
	}

	var issues []models.Issue
	for _, rIssue := range ruffIssues {
		severity := "warning" // Default severity
		if strings.HasPrefix(rIssue.Code, "F") || strings.HasPrefix(rIssue.Code, "E") { // 'F' for Pyflakes, 'E' for pycodestyle errors
			severity = "error"
		}

		suggestion := ""
		if rIssue.Fix != nil {
			suggestion = rIssue.Fix.Message
		}

		issues = append(issues, models.Issue{
			RuleID:      rIssue.Code,
			Message:     rIssue.Message,
			Severity:    severity,
			FilePath:    filepath.Base(rIssue.Filename), // Use base name from temp file path
			LineStart:   rIssue.Location.Row,
			LineEnd:     rIssue.EndLocation.Row,
			ColumnStart: rIssue.Location.Column,
			ColumnEnd:   rIssue.EndLocation.Column,
			Suggestion:  suggestion,
		})
	}

	logger.Log.Info("Successfully parsed Ruff output", zap.Int("issues_found", len(issues)))
	return issues, nil
}
