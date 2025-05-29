package main

import (
	"fmt"
	"log" // Standard logger for initial config/logger setup errors
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/user/code-analyzer-service/internal/config"
	"github.com/user/code-analyzer-service/internal/clients"          // For StorageServiceClient
	appLogger "github.com/user/code-analyzer-service/internal/logger" // Renamed to avoid conflict with std log
	"github.com/user/code-analyzer-service/internal/server"           // Import server package for handlers
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err) // Use standard log before custom logger is up
	}

	// Initialize Zap logger
	_, err = appLogger.NewLogger(cfg.Logging.Level)
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err) // Use standard log if logger setup fails
	}
	defer appLogger.Log.Sync() // Flushes buffer, if any

	appLogger.Log.Info("Configuration loaded successfully",
		zap.String("port", cfg.Server.Port),
		zap.String("logging_level", cfg.Logging.Level),
	)

	// Set Gin mode based on logging level (optional, but good practice)
	if cfg.Logging.Level == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Initialize Storage Service Client
	storageClient := clients.NewStorageServiceClient(cfg.StorageService.URL)
	appLogger.Log.Info("StorageServiceClient initialized", zap.String("storage_service_url", cfg.StorageService.URL))

	// Create AppContext for handlers
	appCtx := &server.AppContext{
		StorageClient: storageClient,
	}

	// API v1 route group
	apiV1 := r.Group("/api/v1")
	{
		apiV1.POST("/analyze", appCtx.AnalyzeCodeHandler) // Use method from AppContext
	}

	// Health check endpoint (remains at the root)
	r.GET("/health", func(c *gin.Context) {
		appLogger.Log.Info("Health check endpoint hit (Info)", // Differentiate for testing
			zap.String("client_ip", c.ClientIP()),
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
		)
		// Temporary Warn log for testing log levels
		appLogger.Log.Warn("Health check endpoint hit (Warn)",
			zap.String("client_ip", c.ClientIP()),
			zap.String("warning_test", "This is a test warning"),
		)
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	serverAddr := fmt.Sprintf(":%s", cfg.Server.Port)
	appLogger.Log.Info("Starting server",
		zap.String("address", serverAddr),
	)

	if err := r.Run(serverAddr); err != nil {
		appLogger.Log.Fatal("Failed to run server", zap.Error(err))
	}
}
