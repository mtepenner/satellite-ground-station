package main

import (
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/mtepenner/satellite-ground-station/ingestion/internal/network"
	"github.com/mtepenner/satellite-ground-station/ingestion/internal/publisher"
)

func main() {
	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	redisPassword := getEnv("REDIS_PASSWORD", "")
	udpAddr := getEnv("UDP_ADDR", "0.0.0.0:10000")
	tcpAddr := getEnv("TCP_ADDR", "0.0.0.0:10001")

	pub, err := publisher.NewRedisPublisher(redisAddr, redisPassword, 0)
	if err != nil {
		log.Fatalf("failed to connect to Redis at %s: %v", redisAddr, err)
	}
	defer pub.Close()

	cfg := network.ListenerConfig{
		UDPAddr: udpAddr,
		TCPAddr: tcpAddr,
	}
	listener := network.NewListener(cfg, pub)

	stop := make(chan struct{})
	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := listener.ListenUDP(stop); err != nil {
			log.Printf("UDP listener error: %v", err)
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := listener.ListenTCP(stop); err != nil {
			log.Printf("TCP listener error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down ingestion server...")
	close(stop)
	wg.Wait()
	log.Println("ingestion server stopped")
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
