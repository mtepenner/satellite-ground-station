export interface TelemetryPacket {
  satellite_id: string
  timestamp: string | null
  latitude: number
  longitude: number
  altitude_km: number
  velocity_km_s: number
  signal_strength_dbm: number
  battery_voltage: number
  temperature_c: number
  mode: string
  priority?: number
  source?: number
  destination?: number
}
