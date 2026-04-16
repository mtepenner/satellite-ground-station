package decoder

import (
	"encoding/binary"
	"errors"
	"fmt"
)

// AX25Frame represents a decoded AX.25 packet frame.
type AX25Frame struct {
	DestCallsign   string
	SrcCallsign    string
	ControlField   byte
	ProtocolID     byte
	Payload        []byte
}

// AX25MinFrameSize is the minimum number of bytes in a valid AX.25 frame
// (14 bytes for dest+src callsign fields + 1 control + 1 PID).
const AX25MinFrameSize = 16

// DecodeAX25 strips AX.25 protocol headers and returns the inner payload.
// The AX.25 frame layout used here:
//
//	Destination callsign : 7 bytes (6 chars + SSID)
//	Source callsign      : 7 bytes (6 chars + SSID)
//	Control field        : 1 byte
//	Protocol ID          : 1 byte
//	Information field    : variable (the payload)
func DecodeAX25(raw []byte) (*AX25Frame, error) {
	if len(raw) < AX25MinFrameSize {
		return nil, fmt.Errorf("ax25: frame too short (%d bytes, need %d)", len(raw), AX25MinFrameSize)
	}

	destCallsign, err := decodeCallsign(raw[0:7])
	if err != nil {
		return nil, fmt.Errorf("ax25: invalid dest callsign: %w", err)
	}

	srcCallsign, err := decodeCallsign(raw[7:14])
	if err != nil {
		return nil, fmt.Errorf("ax25: invalid src callsign: %w", err)
	}

	controlField := raw[14]
	protocolID := raw[15]
	payload := make([]byte, len(raw)-AX25MinFrameSize)
	copy(payload, raw[AX25MinFrameSize:])

	return &AX25Frame{
		DestCallsign: destCallsign,
		SrcCallsign:  srcCallsign,
		ControlField: controlField,
		ProtocolID:   protocolID,
		Payload:      payload,
	}, nil
}

// decodeCallsign reads a 7-byte AX.25 callsign field.
// Each character is right-shifted by 1 bit per the AX.25 spec;
// the 7th byte contains the SSID and flags.
func decodeCallsign(b []byte) (string, error) {
	if len(b) != 7 {
		return "", errors.New("callsign field must be exactly 7 bytes")
	}
	chars := make([]byte, 6)
	for i := 0; i < 6; i++ {
		c := b[i] >> 1
		if c == 0x20 {
			// Padding space – stop here
			chars = chars[:i]
			break
		}
		chars[i] = c
	}
	ssid := (b[6] >> 1) & 0x0F
	_ = binary.BigEndian // keep import used
	if ssid == 0 {
		return string(chars), nil
	}
	return fmt.Sprintf("%s-%d", string(chars), ssid), nil
}
