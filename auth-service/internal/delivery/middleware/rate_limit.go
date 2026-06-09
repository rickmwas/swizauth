package middleware

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

const rateLimitLua = `
local key = KEYS[1]
local max_tokens = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2]) -- tokens per millisecond
local now = tonumber(ARGV[3]) -- current timestamp in milliseconds
local cost = tonumber(ARGV[4] or 1)

local bucket = redis.call('HMGET', key, 'tokens', 'last_refreshed')
local tokens = tonumber(bucket[1])
local last_refreshed = tonumber(bucket[2])

if not tokens then
    tokens = max_tokens
    last_refreshed = now
else
    local elapsed = now - last_refreshed
    if elapsed > 0 then
        local refill = elapsed * refill_rate
        tokens = math.min(max_tokens, tokens + refill)
        last_refreshed = now
    end
end

local allowed = 0
if tokens >= cost then
    tokens = tokens - cost
    allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'last_refreshed', last_refreshed)
redis.call('EXPIRE', key, 86400) -- Expire after 1 day

return {allowed, math.floor(tokens * 1000)}
`

// RateLimiter returns a GIN middleware that enforces rate limiting on a specific endpoint name using a Redis Token Bucket.
func RateLimiter(rdb *redis.Client, endpointName string, limit int, duration time.Duration) gin.HandlerFunc {
	refillRate := float64(limit) / duration.Seconds() // tokens per second
	refillRatePerMs := refillRate / 1000.0            // tokens per millisecond

	return func(c *gin.Context) {
		ctx := c.Request.Context()

		// Identify client by user_id if authenticated, else client IP
		var identity string
		if uid, exists := c.Get("user_id"); exists {
			if uidStr, ok := uid.(string); ok {
				identity = uidStr
			}
		}
		if identity == "" {
			identity = c.ClientIP()
		}

		key := fmt.Sprintf("ratelimit:%s:%s", identity, endpointName)
		nowMs := time.Now().UnixNano() / int64(time.Millisecond)

		// Execute Lua script in Redis
		res, err := rdb.Eval(ctx, rateLimitLua, []string{key}, limit, refillRatePerMs, nowMs, 1).Result()
		if err != nil {
			// Fail-open: allow request if Redis fails to prevent blocking users
			c.Error(fmt.Errorf("rate limiter redis error: %w", err))
			c.Next()
			return
		}

		resSlice, ok := res.([]interface{})
		if !ok || len(resSlice) < 2 {
			c.Next()
			return
		}

		allowed := resSlice[0].(int64) == 1
		remainingMs := resSlice[1].(int64)
		remaining := float64(remainingMs) / 1000.0

		// Calculate reset time (when bucket is fully refilled)
		resetTimeMs := nowMs + int64((float64(limit)-remaining)/refillRatePerMs)
		resetTimeSec := resetTimeMs / 1000

		// Set standard rate limit headers
		c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
		c.Header("X-RateLimit-Remaining", strconv.FormatFloat(math.Floor(remaining), 'f', 0, 64))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTimeSec, 10))

		if !allowed {
			// Calculate retry duration in seconds
			retryAfter := int64(math.Ceil((1.0 - remaining) / refillRate))
			if retryAfter < 1 {
				retryAfter = 1
			}

			c.Header("Retry-After", strconv.FormatInt(retryAfter, 10))
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "RATE_LIMIT_EXCEEDED",
					"message": "Rate limit exceeded. Please try again later.",
				},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
