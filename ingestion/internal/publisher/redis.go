package publisher

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"

	"github.com/mtepenner/satellite-ground-station/ingestion/internal/decoder"
)

const TelemetryChannel = "telemetry"

// RedisPublisher pushes parsed telemetry JSON to a Redis Pub/Sub channel.
type RedisPublisher struct {
	client *redis.Client
}

// NewRedisPublisher creates a RedisPublisher connected to the given address.
func NewRedisPublisher(addr, password string, db int) (*RedisPublisher, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis: ping failed: %w", err)
	}
	log.Printf("[Redis] connected to %s", addr)
	return &RedisPublisher{client: rdb}, nil
}

// Publish serialises a TelemetryFrame as JSON and pushes it to the telemetry
// Pub/Sub channel.
func (p *RedisPublisher) Publish(frame *decoder.TelemetryFrame) error {
	data, err := json.Marshal(frame)
	if err != nil {
		return fmt.Errorf("redis: marshal frame: %w", err)
	}
	ctx := context.Background()
	if err := p.client.Publish(ctx, TelemetryChannel, data).Err(); err != nil {
		return fmt.Errorf("redis: publish: %w", err)
	}
	return nil
}

// Close gracefully closes the underlying Redis connection.
func (p *RedisPublisher) Close() error {
	return p.client.Close()
}
