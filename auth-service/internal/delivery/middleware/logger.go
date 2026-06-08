package middleware

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// LogSchema defines the required structured JSON logging fields
type LogSchema struct {
	Timestamp      string `json:"timestamp"`
	Level          string `json:"level"`
	Service        string `json:"service"`
	RequestID      string `json:"request_id"`
	UserID         string `json:"user_id,omitempty"`
	OrganizationID string `json:"organization_id,omitempty"`
	Endpoint       string `json:"endpoint"`
	Status         int    `json:"status"`
	LatencyMs      int64  `json:"latency_ms"`
	Message        string `json:"message"`
	Error          string `json:"error,omitempty"`
}

// Logger intercepts requests to output high-fidelity JSON log format on stdout
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Execute next handlers
		c.Next()

		latency := time.Since(start).Milliseconds()

		// Extract context metadata
		reqIDVal, _ := c.Get(RequestIDKey)
		reqID, _ := reqIDVal.(string)

		userIDVal, _ := c.Get("user_id")
		userID, _ := userIDVal.(string)

		orgIDVal, _ := c.Get("organization_id")
		orgID, _ := orgIDVal.(string)

		status := c.Writer.Status()
		level := "INFO"
		if status >= 500 {
			level = "ERROR"
		} else if status >= 400 {
			level = "WARN"
		}

		errStr := ""
		if len(c.Errors) > 0 {
			errStr = c.Errors.String()
		}

		logEntry := LogSchema{
			Timestamp:      time.Now().UTC().Format(time.RFC3339),
			Level:          level,
			Service:        "auth-service",
			RequestID:      reqID,
			UserID:         userID,
			OrganizationID: orgID,
			Endpoint:       fmt.Sprintf("%s %s", c.Request.Method, c.Request.URL.Path),
			Status:         status,
			LatencyMs:      latency,
			Message:        fmt.Sprintf("Request completed with status %d", status),
			Error:          errStr,
		}

		logBytes, err := json.Marshal(logEntry)
		if err == nil {
			fmt.Fprintln(os.Stdout, string(logBytes))
		} else {
			// Fallback plain format to stderr
			fmt.Fprintf(os.Stderr, `{"timestamp":"%s","level":"ERROR","service":"auth-service","message":"Failed to marshal log entry: %v"}`+"\n", time.Now().UTC().Format(time.RFC3339), err)
		}
	}
}
