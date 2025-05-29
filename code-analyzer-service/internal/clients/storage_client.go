package clients

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/user/code-analyzer-service/internal/logger"
	"github.com/user/code-analyzer-service/internal/models" // Assuming this is where AnalysisResponse is defined
	"go.uber.org/zap"
)

const (
	defaultTimeout = 10 * time.Second
	resultsPath    = "/results" // Path for the storage service's results endpoint
)

// StorageServiceClient is a client for interacting with the storage-service.
type StorageServiceClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewStorageServiceClient creates a new client for the storage-service.
func NewStorageServiceClient(baseURL string) *StorageServiceClient {
	return &StorageServiceClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: defaultTimeout,
		},
	}
}

// SaveAnalysisResult sends the analysis result to the storage-service.
// The AnalysisResponse model from code-analyzer-service is directly used as the payload.
// storage-service is expected to handle this structure at its POST /api/v1/results endpoint.
func (c *StorageServiceClient) SaveAnalysisResult(ctx context.Context, result models.AnalysisResponse) error {
	if c == nil {
		return fmt.Errorf("StorageServiceClient is nil")
	}
	
	payloadBytes, err := json.Marshal(result)
	if err != nil {
		logger.Log.Error("Failed to marshal AnalysisResponse for storage",
			zap.String("request_id", result.RequestID),
			zap.Error(err),
		)
		return fmt.Errorf("failed to marshal analysis result: %w", err)
	}

	storageURL := c.baseURL + resultsPath
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, storageURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		logger.Log.Error("Failed to create new HTTP request for storage service",
			zap.String("request_id", result.RequestID),
			zap.String("url", storageURL),
			zap.Error(err),
		)
		return fmt.Errorf("failed to create storage request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	logger.Log.Info("Attempting to save analysis result to storage service",
		zap.String("request_id", result.RequestID),
		zap.String("url", storageURL),
	)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		logger.Log.Error("Failed to send request to storage service",
			zap.String("request_id", result.RequestID),
			zap.String("url", storageURL),
			zap.Error(err),
		)
		return fmt.Errorf("failed to send request to storage service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusAccepted {
		// Log the body if there's an unexpected status code for more context
		var bodyBytes []byte
		// Best effort to read body, but don't let it shadow original error
		if b, readErr := io.ReadAll(resp.Body); readErr == nil {
			bodyBytes = b
		}

		logger.Log.Error("Storage service returned non-success status code",
			zap.String("request_id", result.RequestID),
			zap.String("url", storageURL),
			zap.Int("status_code", resp.StatusCode),
			zap.ByteString("response_body", bodyBytes),
		)
		return fmt.Errorf("storage service returned status %d", resp.StatusCode)
	}

	logger.Log.Info("Successfully saved analysis result to storage service",
		zap.String("request_id", result.RequestID),
		zap.String("url", storageURL),
		zap.Int("status_code", resp.StatusCode),
	)
	return nil
}
