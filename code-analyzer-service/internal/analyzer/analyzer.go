package analyzer

import (
	"fmt"
	"time"

	// "github.com/google/uuid" // Would be used if `go get` worked
	"github.com/user/code-analyzer-service/internal/analyzer/runners"
	"github.com/user/code-analyzer-service/internal/logger"
	"github.com/user/code-analyzer-service/internal/models"
	"context" // Added for SaveAnalysisResult

	"github.com/user/code-analyzer-service/internal/clients" // Added for StorageServiceClient
	"go.uber.org/zap"
)

// AnalyzeCode orchestrates the code analysis process.
func AnalyzeCode(request models.AnalysisRequest, storageClient *clients.StorageServiceClient) (*models.AnalysisResponse, error) {
	// Generate Request ID
	// requestID := uuid.NewString() // Preferred, but `go get` issues
	requestID := fmt.Sprintf("req_%d", time.Now().UnixNano()) // Fallback request ID

	// Detect Language
	detectedLang, err := DetectLanguageFunc(request) // Using func variable for testability
	if err != nil {
		logger.Log.Error("Language detection failed", zap.Error(err), zap.String("request_id", requestID))
		return &models.AnalysisResponse{
			RequestID: requestID,
			Error:     fmt.Sprintf("Language detection failed: %v", err),
			Summary:   "Failed to detect language from request.",
		}, nil // Return response with error, not a function error, for handler to decide status code
	}

	logger.Log.Info("Language detected",
		zap.String("request_id", requestID),
		zap.String("detected_language", detectedLang),
		zap.String("provided_language", request.Language),
	)

	var issues []models.Issue
	var analysisSummary string
	var analysisError string

	switch detectedLang {
	case "python":
		logger.Log.Info("Dispatching to Python (Ruff) analyzer", zap.String("request_id", requestID))
		issues, err = runners.RunRuffAnalysisFunc(request.CodeSnippet, request.Config) // Using func variable
		if err != nil {
			logger.Log.Error("Python (Ruff) analysis failed", zap.Error(err), zap.String("request_id", requestID))
			analysisError = fmt.Sprintf("Python analysis error: %v", err)
			analysisSummary = "Python analysis encountered an error."
		} else {
			analysisSummary = fmt.Sprintf("Python analysis complete. Found %d issues.", len(issues))
		}
	case "go", "javascript", "typescript":
		logger.Log.Info("Language supported but analysis not yet implemented",
			zap.String("request_id", requestID),
			zap.String("language", detectedLang),
		)
		analysisSummary = fmt.Sprintf("Analysis for %s is not yet implemented.", detectedLang)
		// No issues, no error for "not implemented"
	default:
		// This case should ideally be rare if DetectLanguage is robust
		logger.Log.Warn("Unsupported language detected post-detection phase",
			zap.String("request_id", requestID),
			zap.String("language", detectedLang),
		)
		analysisError = fmt.Sprintf("Unsupported language for analysis: %s", detectedLang)
		analysisSummary = "Language is not supported for analysis."
	}

	response := &models.AnalysisResponse{
		RequestID: requestID,
		Language:  detectedLang,
		Issues:    issues,
		Summary:   analysisSummary,
		Error:     analysisError,
	}

	// Attempt to save the result to storage service
	if storageClient != nil {
		// Use context.Background() for now; a more specific context could be passed down if needed.
		err := storageClient.SaveAnalysisResult(context.Background(), *response)
		if err != nil {
			logger.Log.Error("Failed to save analysis result to storage service",
				zap.String("request_id", requestID),
				zap.Error(err),
			)
			// Optionally, update a field in the response to indicate storage failure
			// response.StorageStatus = "failed_to_save_results" 
			// For now, just logging as per requirement (do not fail the main operation).
		}
	} else {
		logger.Log.Warn("StorageServiceClient is nil, skipping save operation", zap.String("request_id", requestID))
	}

	return response, nil
}
