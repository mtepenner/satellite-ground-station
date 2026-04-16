import axios from 'axios'
import type { TelemetryPacket } from '../types/telemetry'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const http = axios.create({ baseURL: BASE_URL, timeout: 10_000 })

export interface TelemetryQueryParams {
  satellite_id?: string
  start?: string
  end?: string
  limit?: number
  offset?: number
}

export interface TelemetryRecord extends TelemetryPacket {
  id: number
  timestamp: string
}

export const api = {
  /** Fetch paginated historical telemetry records. */
  async getTelemetry(params: TelemetryQueryParams = {}): Promise<TelemetryRecord[]> {
    const { data } = await http.get<TelemetryRecord[]>('/api/telemetry/', { params })
    return data
  },

  /** Fetch a single telemetry record by ID. */
  async getTelemetryById(id: number): Promise<TelemetryRecord> {
    const { data } = await http.get<TelemetryRecord>(`/api/telemetry/${id}`)
    return data
  },

  /** Retrieve a list of known satellite IDs. */
  async listSatellites(): Promise<string[]> {
    const { data } = await http.get<string[]>('/api/telemetry/satellites/list')
    return data
  },
}
