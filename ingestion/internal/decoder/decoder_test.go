package decoder_test

import (
	"encoding/binary"
	"math"
	"testing"

	"github.com/mtepenner/satellite-ground-station/ingestion/internal/decoder"
)

// buildAX25Frame builds a minimal AX.25 frame wrapping the given payload.
func buildAX25Frame(dest, src string, payload []byte) []byte {
	encodeCallsign := func(s string) []byte {
		b := make([]byte, 7)
		for i := 0; i < 6; i++ {
			if i < len(s) {
				b[i] = s[i] << 1
			} else {
				b[i] = 0x20 << 1 // space padding
			}
		}
		b[6] = 0x00 // SSID byte, end-of-address bit not set for simplicity
		return b
	}

	frame := append(encodeCallsign(dest), encodeCallsign(src)...)
	frame = append(frame, 0x03) // control (UI frame)
	frame = append(frame, 0xF0) // PID (no layer 3)
	frame = append(frame, payload...)
	return frame
}

// buildCSPPayload builds a minimal CSP+telemetry binary frame.
func buildCSPPayload(satID uint32, mode byte, lat, lon, alt, vel, sig, bat, tmp float64) []byte {
	// 4 byte CSP header (all zeros → priority=0, src=0, dst=0, no flags)
	hdr := make([]byte, 4)
	binary.BigEndian.PutUint32(hdr, 0)

	body := make([]byte, 4+1+8*7)
	binary.BigEndian.PutUint32(body[0:4], satID)
	body[4] = mode
	binary.BigEndian.PutUint64(body[5:13], math.Float64bits(lat))
	binary.BigEndian.PutUint64(body[13:21], math.Float64bits(lon))
	binary.BigEndian.PutUint64(body[21:29], math.Float64bits(alt))
	binary.BigEndian.PutUint64(body[29:37], math.Float64bits(vel))
	binary.BigEndian.PutUint64(body[37:45], math.Float64bits(sig))
	binary.BigEndian.PutUint64(body[45:53], math.Float64bits(bat))
	binary.BigEndian.PutUint64(body[53:61], math.Float64bits(tmp))

	return append(hdr, body...)
}

func TestDecodeAX25_ValidFrame(t *testing.T) {
	payload := []byte("hello world")
	raw := buildAX25Frame("W1AW", "N0CALL", payload)

	frame, err := decoder.DecodeAX25(raw)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if string(frame.Payload) != string(payload) {
		t.Errorf("payload mismatch: got %q, want %q", frame.Payload, payload)
	}
	if frame.ControlField != 0x03 {
		t.Errorf("control field: got %02X, want 03", frame.ControlField)
	}
}

func TestDecodeAX25_TooShort(t *testing.T) {
	_, err := decoder.DecodeAX25([]byte{0x01, 0x02})
	if err == nil {
		t.Fatal("expected error for short frame, got nil")
	}
}

func TestDecodeCSP_ValidFrame(t *testing.T) {
	cspPayload := buildCSPPayload(1, 0x00, 45.5, -93.1, 550.0, 7.66, -85.0, 8.2, 21.3)
	raw := buildAX25Frame("W1AW", "N0CALL", cspPayload)

	ax25, err := decoder.DecodeAX25(raw)
	if err != nil {
		t.Fatalf("ax25 decode error: %v", err)
	}
	frame, err := decoder.DecodeCSP(ax25.Payload)
	if err != nil {
		t.Fatalf("csp decode error: %v", err)
	}

	if frame.SatelliteID != "SAT-0001" {
		t.Errorf("satellite ID: got %q, want SAT-0001", frame.SatelliteID)
	}
	if frame.Mode != "NOMINAL" {
		t.Errorf("mode: got %q, want NOMINAL", frame.Mode)
	}
	if math.Abs(frame.Latitude-45.5) > 1e-9 {
		t.Errorf("latitude: got %f, want 45.5", frame.Latitude)
	}
	if math.Abs(frame.AltitudeKm-550.0) > 1e-9 {
		t.Errorf("altitude: got %f, want 550.0", frame.AltitudeKm)
	}
}

func TestDecodeCSP_TooShort(t *testing.T) {
	_, err := decoder.DecodeCSP([]byte{0x00, 0x01})
	if err == nil {
		t.Fatal("expected error for short CSP frame, got nil")
	}
}

func TestDecodeCSP_UnknownMode(t *testing.T) {
	cspPayload := buildCSPPayload(42, 0xAB, 0, 0, 0, 0, 0, 0, 0)
	frame, err := decoder.DecodeCSP(cspPayload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if frame.Mode == "" {
		t.Error("mode should not be empty for unknown mode byte")
	}
}
