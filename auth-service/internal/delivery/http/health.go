package http

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// HealthHandler handles health and readiness checks
type HealthHandler struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *pgxpool.Pool, redis *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:    db,
		redis: redis,
	}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Service   string    `json:"service"`
	Version   string    `json:"version"`
}

// HealthHandler handles health check requests
func (h *HealthHandler) HealthHandler(c *gin.Context) {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Service:   "auth-service",
		Version:   "1.0.0",
	}

	c.JSON(http.StatusOK, response)
}

// ReadinessHandler handles readiness check requests
func (h *HealthHandler) ReadinessHandler(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	// Check database connectivity
	if err := h.db.Ping(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":    "not ready",
			"timestamp": time.Now(),
			"service":   "auth-service",
			"error":     "database connection failed",
		})
		return
	}

	// Check Redis connectivity
	if err := h.redis.Ping(ctx).Err(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":    "not ready",
			"timestamp": time.Now(),
			"service":   "auth-service",
			"error":     "redis connection failed",
		})
		return
	}

	response := HealthResponse{
		Status:    "ready",
		Timestamp: time.Now(),
		Service:   "auth-service",
		Version:   "1.0.0",
	}

	c.JSON(http.StatusOK, response)
}