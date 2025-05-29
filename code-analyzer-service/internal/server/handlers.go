package server

import (
	"net/http"
	"time"

	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	// "github.com/google/uuid" // Assumed to be available; will add fallback if not
	"github.com/user/code-analyzer-service/internal/analyzer" // Import the analyzer package
	"github.com/user/code-analyzer-service/internal/clients"  // For StorageServiceClient
	"github.com/user/code-analyzer-service/internal/logger"
	"github.com/user/code-analyzer-service/internal/models"
	"go.uber.org/zap"
)

// AppContext holds application-level dependencies for handlers.
type AppContext struct {
	StorageClient *clients.StorageServiceClient
}

// AnalyzeCodeHandler handles code analysis requests.
func (appCtx *AppContext) AnalyzeCodeHandler(c *gin.Context) {
	logger.Log.Info("Received request for /analyze endpoint")

	var apiRequest models.AnalysisRequest
	if err := c.ShouldBindJSON(&apiRequest); err != nil {
		logger.Log.Error("Failed to bind JSON request for /analyze", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body: " + err.Error()})
		return
	}

	logger.Log.Info("Successfully bound request JSON for /analyze",
		zap.String("language_provided", apiRequest.Language),
		zap.String("project_url", apiRequest.ProjectURL),
		zap.Any("config", apiRequest.Config),
	)

	// Call the core analysis logic
	analysisResponse, err := analyzer.AnalyzeCode(apiRequest, appCtx.StorageClient) // Pass client

	if err != nil {
		// This error means a critical failure in AnalyzeCode *before* a response could be formed.
		// This should be rare given AnalyzeCode's design to always return a response object.
		logger.Log.Error("Critical error during code analysis orchestration", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error during analysis"})
		return
	}

	// AnalyzeCode is designed to return a response object even if there are "user-level" errors.
	// Check the Error field in the response.
	if analysisResponse.Error != "" {
		logger.Log.Error("Analysis process reported an error",
			zap.String("request_id", analysisResponse.RequestID),
			zap.String("error_message", analysisResponse.Error),
		)
		// Determine status code based on error type
		// This is a simplified example; more sophisticated error type checking might be needed.
		if strings.Contains(analysisResponse.Error, "not supported") || strings.Contains(analysisResponse.Error, "failed to detect language") {
			c.JSON(http.StatusBadRequest, analysisResponse)
		} else if strings.Contains(analysisResponse.Error, "analysis error") || strings.Contains(analysisResponse.Error, "failed") { // e.g. Ruff execution failed
			c.JSON(http.StatusInternalServerError, analysisResponse)
		} else {
			c.JSON(http.StatusInternalServerError, analysisResponse) // Default to 500 for other errors
		}
		return
	}

	logger.Log.Info("Sending analysis response",
		zap.String("request_id", analysisResponse.RequestID),
		zap.Int("issues_found", len(analysisResponse.Issues)),
	)
	c.JSON(http.StatusOK, analysisResponse)
}
