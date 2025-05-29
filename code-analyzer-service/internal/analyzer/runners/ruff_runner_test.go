package runners

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"reflect"
	"strings"
	"testing"

	"github.com/user/code-analyzer-service/internal/logger" // Import for logger initialization
	"github.com/user/code-analyzer-service/internal/models"
)

// mockExecCommand is a helper function to mock exec.Command.
// It's a common pattern for testing external command execution.
func mockExecCommand(testName string, wantCommand []string, mockStdout string, mockStderr string, exitCode int) func(command string, args ...string) *exec.Cmd {
	return func(command string, args ...string) *exec.Cmd {
		cs := []string{command}
		cs = append(cs, args...)

		// Check if the command and args match what's expected for this specific mock.
		// This is a simple check; more sophisticated checks might be needed for complex scenarios.
		if !reflect.DeepEqual(cs, wantCommand) && len(wantCommand) > 0 { // len(wantCommand) > 0 allows a generic mock if needed
			// This error will be in the test's own execution, not from the code being tested.
			// For more robust testing, you might set a flag or use a channel.
			panic(fmt.Sprintf("Test %s: Unexpected command.\nGot: %v\nWant: %v", testName, cs, wantCommand))
		}

		cmd := exec.Command(os.Args[0], "-test.run=TestHelperProcess")
		cmd.Env = []string{
			"GO_WANT_HELPER_PROCESS=1",
			fmt.Sprintf("STDOUT=%s", mockStdout),
			fmt.Sprintf("STDERR=%s", mockStderr),
			fmt.Sprintf("EXIT_CODE=%d", exitCode),
		}
		return cmd
	}
}

// TestHelperProcess isn't a real test. It's used as a helper process
// for tests that mock exec.Command.
func TestHelperProcess(t *testing.T) {
	if os.Getenv("GO_WANT_HELPER_PROCESS") != "1" {
		return
	}
	//nolint:staticcheck // SA6002: The Exit OS function should be avoided
	defer os.Exit(0)

	fmt.Fprint(os.Stdout, os.Getenv("STDOUT"))
	fmt.Fprint(os.Stderr, os.Getenv("STDERR"))
	exitCode := 0
	fmt.Sscan(os.Getenv("EXIT_CODE"), &exitCode)
	os.Exit(exitCode)
}

func TestRunRuffAnalysis(t *testing.T) {
	// Initialize logger for tests, as the function uses the global logger
	// Use a simple console logger for tests, or a no-op logger if preferred.
	_, err := logger.NewLogger("error") // Initialize with a default level, e.g., error
	if err != nil {
		t.Fatalf("Failed to initialize logger for tests: %v", err)
	}

	// Common expected command for most tests
	// The last argument (filename) will vary, so we'll use a placeholder or check it separately.
	baseWantCommand := []string{"ruff", "check", "--format", "json"}


	tests := []struct {
		name            string
		codeSnippet     string
		config          map[string]interface{}
		mockStdout      string
		mockStderr      string
		mockExitCode    int
		wantIssues      []models.Issue
		wantErr         bool
		wantErrContains string
	}{
		{
			name:        "Successful analysis with issues",
			codeSnippet: "x = 1\nprint(x)", // Valid Python, but print might be flagged by some default ruff rules
			mockStdout: `[
                {
                    "code": "F841",
                    "message": "Local variable ` + "`x`" + ` is assigned to but never used",
                    "location": { "row": 1, "column": 1 },
                    "end_location": { "row": 1, "column": 2 },
                    "filename": "test_file.py",
                    "fix": null
                },
                {
                    "code": "RUF004",
                    "message": "Print statement found.",
                    "location": { "row": 2, "column": 1 },
                    "end_location": { "row": 2, "column": 8 },
                    "filename": "test_file.py",
                    "fix": {"message": "Consider using a logger."}
                }
            ]`,
			mockExitCode: 1, // Ruff exits 1 if issues are found
			wantIssues: []models.Issue{
				{RuleID: "F841", Message: "Local variable `x` is assigned to but never used", Severity: "error", FilePath: "ruff_*.py", LineStart: 1, LineEnd: 1, ColumnStart: 1, ColumnEnd: 2, Suggestion: ""},
				{RuleID: "RUF004", Message: "Print statement found.", Severity: "warning", FilePath: "ruff_*.py", LineStart: 2, LineEnd: 2, ColumnStart: 1, ColumnEnd: 8, Suggestion: "Consider using a logger."},
			},
			wantErr: false,
		},
		{
			name:         "Successful analysis with no issues",
			codeSnippet:  "def main():\n  pass",
			mockStdout:   `[]`, // Empty JSON array
			mockExitCode: 0,   // Ruff exits 0 if no issues
			wantIssues:   []models.Issue{},
			wantErr:      false,
		},
		{
			name:            "Ruff execution error - command not found",
			codeSnippet:     "print('hello')",
			mockStdout:      "",
			mockStderr:      "ruff: command not found",
			mockExitCode:    127, // Typical exit code for command not found
			wantErr:         true,
			wantErrContains: "failed to run ruff command",
		},
		{
			name:            "Ruff execution error - ruff crashes",
			codeSnippet:     "print('hello')",
			mockStdout:      "",
			mockStderr:      "Ruff panicked!",
			mockExitCode:    2, // Ruff internal error
			wantErr:         true,
			wantErrContains: "ruff execution failed",
		},
		{
			name:            "Invalid JSON output from Ruff",
			codeSnippet:     "print('hello')",
			mockStdout:      `not a json`,
			mockExitCode:    1, // Ruff might still exit 1 if it found issues but JSON was malformed
			wantErr:         true,
			wantErrContains: "failed to unmarshal ruff JSON output",
		},
		{
			name:         "Ruff finds issues, non-JSON output (e.g. human-readable)",
			codeSnippet:  "x = 1",
			mockStdout:   "test_file.py:1:1: F841 Local variable `x` is assigned to but never used",
			mockStderr:   "",
			mockExitCode: 1,
			wantErr:      true, // Expect error because we requested JSON
			wantErrContains: "failed to unmarshal ruff JSON output",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			originalExecCommand := execCommand
			// For this test, we don't strictly need to check the filename arg in mockExecCommand
			// as os.CreateTemp generates a unique name. We mostly care about "ruff check --format json".
			// So, we pass an empty wantCommand to mockExecCommand to skip the command check for simplicity here.
			// A more advanced mock would capture the temp filename.
			execCommand = mockExecCommand(tt.name, []string{}, tt.mockStdout, tt.mockStderr, tt.mockExitCode)
			defer func() { execCommand = originalExecCommand }()

			issues, err := RunRuffAnalysis(tt.codeSnippet, tt.config)

			if tt.wantErr {
				if err == nil {
					t.Errorf("RunRuffAnalysis() error = nil, wantErr %v", tt.wantErr)
				}
				if tt.wantErrContains != "" && (err == nil || !strings.Contains(err.Error(), tt.wantErrContains)) {
					t.Errorf("RunRuffAnalysis() error = %v, wantErr contains %q", err, tt.wantErrContains)
				}
			} else {
				if err != nil {
					t.Errorf("RunRuffAnalysis() unexpected error = %v", err)
				}
			}

			// Normalize FilePath for comparison as it's based on a temp file
			normalizedIssues := make([]models.Issue, len(issues))
			for i, issue := range issues {
				normalizedIssue := issue
				if normalizedIssue.FilePath != "" { // Only normalize if FilePath is set
					normalizedIssue.FilePath = "ruff_*.py" // Match the placeholder used in wantIssues
				}
				normalizedIssues[i] = normalizedIssue
			}
			
			// Sort slices before comparison if order is not guaranteed and matters.
			// For now, assume order is preserved or doesn't strictly matter for this test structure.
			if !reflect.DeepEqual(normalizedIssues, tt.wantIssues) {
				// For better diffs, you could marshal both to JSON and compare strings, or print them field by field.
				gotJSON, _ := json.MarshalIndent(normalizedIssues, "", "  ")
				wantJSON, _ := json.MarshalIndent(tt.wantIssues, "", "  ")
				t.Errorf("RunRuffAnalysis() issues mismatch:\nGot:\n%s\nWant:\n%s", gotJSON, wantJSON)
			}
		})
	}
}
