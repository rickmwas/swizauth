package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const RequestIDKey = "request_id"
const RequestIDHeader = "X-Request-ID"

// RequestID returns a middleware that injects a unique request ID (UUIDv7) into the request context and response headers
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		reqID := c.GetHeader(RequestIDHeader)
		if reqID == "" {
			u, err := uuid.NewV7()
			if err != nil {
				// Fallback to UUIDv4 in case of system time errors
				reqID = uuid.New().String()
			} else {
				reqID = u.String()
			}
		}

		// Inject into Gin context and response headers
		c.Set(RequestIDKey, reqID)
		c.Writer.Header().Set(RequestIDHeader, reqID)
		c.Next()
	}
}
