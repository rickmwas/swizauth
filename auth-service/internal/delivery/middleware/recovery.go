package middleware

import (
	"fmt"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// Recovery catches panics to prevent daemon crashes, logging stack traces and outputting the unified error response
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// Capture stack trace details
				stack := string(debug.Stack())

				// Bind error to Gin context so the custom JSON Logger middleware can output it
				_ = c.Error(fmt.Errorf("panic recovered: %v\n%s", err, stack))

				// Return unified error contract
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "INTERNAL_SERVER_ERROR",
						"message": "Internal server error",
					},
				},
				)
			}
		}()
		c.Next()
	}
}
