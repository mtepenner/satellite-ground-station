package network

import (
	"fmt"
	"log"
	"net"

	"github.com/mtepenner/satellite-ground-station/ingestion/internal/decoder"
	"github.com/mtepenner/satellite-ground-station/ingestion/internal/publisher"
)

// ListenerConfig holds configuration for the network listener.
type ListenerConfig struct {
	UDPAddr string // e.g. "0.0.0.0:10000"
	TCPAddr string // e.g. "0.0.0.0:10001"
}

// Listener manages both UDP and TCP sockets for incoming radio hardware frames.
type Listener struct {
	cfg       ListenerConfig
	publisher *publisher.RedisPublisher
}

// NewListener creates a new Listener with the given config and publisher.
func NewListener(cfg ListenerConfig, pub *publisher.RedisPublisher) *Listener {
	return &Listener{cfg: cfg, publisher: pub}
}

// ListenUDP starts the UDP socket and handles incoming packets until the
// provided channel is closed.
func (l *Listener) ListenUDP(stop <-chan struct{}) error {
	addr, err := net.ResolveUDPAddr("udp", l.cfg.UDPAddr)
	if err != nil {
		return fmt.Errorf("udp: resolve addr: %w", err)
	}
	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		return fmt.Errorf("udp: listen: %w", err)
	}
	defer conn.Close()
	log.Printf("[UDP] listening on %s", l.cfg.UDPAddr)

	buf := make([]byte, 4096)
	go func() {
		<-stop
		conn.Close()
	}()
	for {
		n, remote, err := conn.ReadFromUDP(buf)
		if err != nil {
			select {
			case <-stop:
				return nil
			default:
				log.Printf("[UDP] read error from %s: %v", remote, err)
				continue
			}
		}
		go l.handleFrame(buf[:n], "UDP", remote.String())
	}
}

// ListenTCP starts the TCP server and accepts connections until stop is closed.
func (l *Listener) ListenTCP(stop <-chan struct{}) error {
	ln, err := net.Listen("tcp", l.cfg.TCPAddr)
	if err != nil {
		return fmt.Errorf("tcp: listen: %w", err)
	}
	defer ln.Close()
	log.Printf("[TCP] listening on %s", l.cfg.TCPAddr)

	go func() {
		<-stop
		ln.Close()
	}()
	for {
		conn, err := ln.Accept()
		if err != nil {
			select {
			case <-stop:
				return nil
			default:
				log.Printf("[TCP] accept error: %v", err)
				continue
			}
		}
		go l.handleTCPConn(conn)
	}
}

func (l *Listener) handleTCPConn(conn net.Conn) {
	defer conn.Close()
	remote := conn.RemoteAddr().String()
	buf := make([]byte, 4096)
	for {
		n, err := conn.Read(buf)
		if err != nil {
			return
		}
		go l.handleFrame(buf[:n], "TCP", remote)
	}
}

// handleFrame decodes an AX.25-wrapped CSP frame and publishes the result.
func (l *Listener) handleFrame(raw []byte, proto, remote string) {
	ax25Frame, err := decoder.DecodeAX25(raw)
	if err != nil {
		log.Printf("[%s] ax25 decode error from %s: %v", proto, remote, err)
		return
	}

	telemetry, err := decoder.DecodeCSP(ax25Frame.Payload)
	if err != nil {
		log.Printf("[%s] csp decode error from %s: %v", proto, remote, err)
		return
	}

	if err := l.publisher.Publish(telemetry); err != nil {
		log.Printf("[%s] publish error: %v", proto, err)
	}
}
