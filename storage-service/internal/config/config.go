package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port string `mapstructure:"port"`
}

// LoggingConfig holds logging-related configuration
type LoggingConfig struct {
	Level string `mapstructure:"level"`
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	URL string `mapstructure:"url"`
}

// AppConfig holds all application configuration
type AppConfig struct {
	Server   ServerConfig   `mapstructure:"server"`
	Logging  LoggingConfig  `mapstructure:"logging"`
	Database DatabaseConfig `mapstructure:"database"`
}

// LoadConfig loads configuration from file and environment variables
func LoadConfig() (*AppConfig, error) {
	v := viper.New()

	// Set default values
	v.SetDefault("server.port", "8081")
	v.SetDefault("logging.level", "info")
	v.SetDefault("database.url", "postgresql://user:password@localhost:5432/analysis_db?sslmode=disable")

	// Set config file path and name
	v.AddConfigPath("./configs") // Path to look for the config file in
	v.SetConfigName("config")    // Name of config file (without extension)
	v.SetConfigType("yaml")      // REQUIRED if the config file does not have the extension in the name

	// Attempt to read the config file
	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// Config file not found; ignore error, defaults and env vars will be used.
			fmt.Println("Config file not found at ./configs/config.yaml, using defaults and environment variables.")
		} else {
			// Config file was found but another error was produced
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
	}

	// Enable environment variable overriding
	// For nested keys, use "__" (double underscore) instead of "."
	// Example: SERVER__PORT or DATABASE__URL
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "__"))
	v.AutomaticEnv()

	var cfg AppConfig
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &cfg, nil
}
