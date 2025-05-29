package logger

import (
	"fmt"
	"strings"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Log is a global variable to access the zap logger instance.
var Log *zap.Logger

// NewLogger creates and initializes a new Zap logger.
// It takes a log level string (e.g., "debug", "info", "warn", "error") as input.
func NewLogger(levelStr string) (*zap.Logger, error) {
	var zapLevel zapcore.Level
	switch strings.ToLower(levelStr) {
	case "debug":
		zapLevel = zap.DebugLevel
	case "info":
		zapLevel = zap.InfoLevel
	case "warn":
		zapLevel = zap.WarnLevel
	case "error":
		zapLevel = zap.ErrorLevel
	case "dpanic":
		zapLevel = zap.DPanicLevel
	case "panic":
		zapLevel = zap.PanicLevel
	case "fatal":
		zapLevel = zap.FatalLevel
	default:
		return nil, fmt.Errorf("unknown log level: %s", levelStr)
	}

	// Using NewProductionConfig for structured JSON logs, but you can customize it.
	// For development, zap.NewDevelopmentConfig() might be more readable.
	config := zap.NewProductionConfig()
	config.Level = zap.NewAtomicLevelAt(zapLevel)
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder // More standard time format
	config.EncoderConfig.TimeKey = "timestamp"                  // Standardize time key
	config.EncoderConfig.MessageKey = "message"                 // Standardize message key
	config.EncoderConfig.LevelKey = "level"                     // Standardize level key

	logger, err := config.Build()
	if err != nil {
		return nil, fmt.Errorf("failed to build zap logger: %w", err)
	}

	Log = logger // Set the global logger instance
	return logger, nil
}
