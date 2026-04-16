package decoder

import (
	"encoding/binary"
	"errors"
	"fmt"
	"math"
)

// CSPHeader represents the decoded CubeSat Space Protocol header.
type CSPHeader struct {
	Priority    uint8
	Source      uint8
	Destination uint8
	DestPort    uint8
	SrcPort     uint8
	Flags       CSPFlags
}

// CSPFlags holds the boolean flag states decoded from the CSP header.
type CSPFlags struct {
	HMAC       bool // Header-based HMAC authentication
	XTEA       bool // XTEA encryption
	RDP        bool // Reliable Datagram Protocol
	CRC        bool // CRC32 checksum appended
}

// TelemetryFrame is the fully decoded, human-readable representation of a
// single telemetry packet obtained from a CSP payload.
type TelemetryFrame struct {
	SatelliteID     string   `json:"satellite_id"`
	Priority        uint8    `json:"priority"`
	Source          uint8    `json:"source"`
	Destination     uint8    `json:"destination"`
	Mode            string   `json:"mode"`
	Latitude        float64  `json:"latitude"`
	Longitude       float64  `json:"longitude"`
	AltitudeKm      float64  `json:"altitude_km"`
	VelocityKmS     float64  `json:"velocity_km_s"`
	SignalStrengthDB float64  `json:"signal_strength_dbm"`
	BatteryVoltage  float64  `json:"battery_voltage"`
	TemperatureC    float64  `json:"temperature_c"`
	Flags           CSPFlags `json:"flags"`
}

// CSP header is 4 bytes (32 bits), laid out as:
//
//	[31:30] Priority (2 bits)
//	[29:25] Source  (5 bits)
//	[24:20] Destination (5 bits)
//	[19:14] DestPort (6 bits)
//	[13:8]  SrcPort  (6 bits)
//	[7:4]   Reserved (4 bits)
//	[3]     HMAC flag
//	[2]     XTEA flag
//	[1]     RDP flag
//	[0]     CRC flag
const CSPHeaderSize = 4

// TelemetryPayloadSize is the fixed-size binary telemetry body (after the CSP
// header) in bytes:
//   - 4 bytes SatID (uint32)
//   - 1 byte  Mode
//   - 8 bytes Latitude  (float64)
//   - 8 bytes Longitude (float64)
//   - 8 bytes Altitude  (float64)
//   - 8 bytes Velocity  (float64)
//   - 8 bytes Signal    (float64)
//   - 8 bytes Battery   (float64)
//   - 8 bytes Temp      (float64)
const TelemetryPayloadSize = 4 + 1 + 8*7

// operationModes maps the mode byte to a human-readable string.
var operationModes = map[byte]string{
	0x00: "NOMINAL",
	0x01: "SAFE",
	0x02: "ECLIPSE",
	0x03: "DETUMBLE",
	0x04: "COMM_PASS",
	0xFF: "FAULT",
}

// DecodeCSP parses a raw CSP frame and translates binary flags into a
// human-readable TelemetryFrame.
func DecodeCSP(raw []byte) (*TelemetryFrame, error) {
	if len(raw) < CSPHeaderSize+TelemetryPayloadSize {
		return nil, fmt.Errorf("csp: frame too short (%d bytes)", len(raw))
	}

	hdr, err := parseCSPHeader(raw[:CSPHeaderSize])
	if err != nil {
		return nil, fmt.Errorf("csp: header parse error: %w", err)
	}

	frame, err := parseTelemetryPayload(raw[CSPHeaderSize:])
	if err != nil {
		return nil, fmt.Errorf("csp: payload parse error: %w", err)
	}

	frame.Priority = hdr.Priority
	frame.Source = hdr.Source
	frame.Destination = hdr.Destination
	frame.Flags = hdr.Flags

	return frame, nil
}

func parseCSPHeader(b []byte) (*CSPHeader, error) {
	if len(b) < CSPHeaderSize {
		return nil, errors.New("csp header requires 4 bytes")
	}
	word := binary.BigEndian.Uint32(b[:4])
	hdr := &CSPHeader{
		Priority:    uint8((word >> 30) & 0x03),
		Source:      uint8((word >> 25) & 0x1F),
		Destination: uint8((word >> 20) & 0x1F),
		DestPort:    uint8((word >> 14) & 0x3F),
		SrcPort:     uint8((word >> 8) & 0x3F),
		Flags: CSPFlags{
			HMAC: (word>>3)&1 == 1,
			XTEA: (word>>2)&1 == 1,
			RDP:  (word>>1)&1 == 1,
			CRC:  (word>>0)&1 == 1,
		},
	}
	return hdr, nil
}

func parseTelemetryPayload(b []byte) (*TelemetryFrame, error) {
	if len(b) < TelemetryPayloadSize {
		return nil, fmt.Errorf("telemetry payload requires %d bytes, got %d", TelemetryPayloadSize, len(b))
	}

	offset := 0
	satID := binary.BigEndian.Uint32(b[offset : offset+4])
	offset += 4

	modeByte := b[offset]
	offset++

	lat := math.Float64frombits(binary.BigEndian.Uint64(b[offset : offset+8]))
	offset += 8
	lon := math.Float64frombits(binary.BigEndian.Uint64(b[offset : offset+8]))
	offset += 8
	alt := math.Float64frombits(binary.BigEndian.Uint64(b[offset : offset+8]))
	offset += 8
	vel := math.Float64frombits(binary.BigEndian.Uint64(b[offset : offset+8]))
	offset += 8
	sig := math.Float64frombits(binary.BigEndian.Uint64(b[offset : offset+8]))
	offset += 8
	bat := math.Float64frombits(binary.BigEndian.Uint64(b[offset : offset+8]))
	offset += 8
	tmp := math.Float64frombits(binary.BigEndian.Uint64(b[offset : offset+8]))

	modeStr, ok := operationModes[modeByte]
	if !ok {
		modeStr = fmt.Sprintf("UNKNOWN(0x%02X)", modeByte)
	}

	return &TelemetryFrame{
		SatelliteID:     fmt.Sprintf("SAT-%04d", satID),
		Mode:            modeStr,
		Latitude:        lat,
		Longitude:       lon,
		AltitudeKm:      alt,
		VelocityKmS:     vel,
		SignalStrengthDB: sig,
		BatteryVoltage:  bat,
		TemperatureC:    tmp,
	}, nil
}
