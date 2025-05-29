package main

import (
	"fmt"
	"log" // Standard logger for initial setup errors
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/user/storage-service/internal/config"
	"github.com/user/storage-service/internal/database"
	appLogger "github.com/user/storage-service/internal/logger" // Renamed to avoid conflict
	"github.com/user/storage-service/internal/server"           // For API handlers
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("FATAL: Failed to load configuration: %v", err)
	}

	// Initialize Zap logger
	_, err = appLogger.NewLogger(cfg.Logging.Level)
	if err != nil {
		log.Fatalf("FATAL: Failed to initialize logger: %v", err)
	}
	defer func() {
		if syncErr := appLogger.Log.Sync(); syncErr != nil {
			// Log the sync error, but don't necessarily make it fatal
			// as the program is likely exiting anyway.
			fmt.Fprintf(os.Stderr, "Error syncing logger: %v\n", syncErr)
		}
	}()


	appLogger.Log.Info("Configuration and logger initialized successfully",
		zap.String("server_port", cfg.Server.Port),
		zap.String("logging_level", cfg.Logging.Level),
		zap.String("database_url_provided", cfg.Database.URL), // Be careful logging full DB URL in production
	)

	// "Connect" to the database (placeholder)
	_, dbErr := database.NewDBConnection(cfg.Database.URL)
	dbStatus := "connected_placeholder"
	if dbErr != nil {
		appLogger.Log.Error("Failed to establish placeholder database connection", zap.Error(dbErr))
		dbStatus = fmt.Sprintf("connection_error_placeholder: %v", dbErr)
	} else {
		appLogger.Log.Info("Placeholder database connection established")
	}

	// Set Gin mode
	if cfg.Logging.Level == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"db_status": dbStatus, // Reflects placeholder status
		})
	})

	// API v1 route group
	apiV1 := r.Group("/api/v1")
	{
		resultsGroup := apiV1.Group("/results")
		resultsGroup.POST("", server.CreateAnalysisResultHandler)
		resultsGroup.GET("/:request_id", server.GetAnalysisResultHandler)
	}

	serverAddr := fmt.Sprintf(":%s", cfg.Server.Port)
	appLogger.Log.Info("Starting storage-service server", zap.String("address", serverAddr))

	if err := r.Run(serverAddr); err != nil {
		appLogger.Log.Fatal("Failed to run storage-service server", zap.Error(err))
	}
}
