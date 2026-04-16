// Ambient module declaration for react-simple-maps (no bundled @types)
declare module 'react-simple-maps' {
  import type { ReactNode, CSSProperties } from 'react'

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    style?: CSSProperties
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: Array<{ rsmKey: string }> }) => ReactNode
  }

  export interface GeographyProps {
    geography: { rsmKey: string }
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: CSSProperties
      hover?: CSSProperties
      pressed?: CSSProperties
    }
    [key: string]: unknown
  }

  export interface MarkerProps {
    coordinates: [number, number]
    children?: ReactNode
  }

  export interface LineProps {
    coordinates: [number, number][]
    stroke?: string
    strokeWidth?: number
    strokeOpacity?: number
    strokeLinecap?: string
  }

  export const ComposableMap: React.FC<ComposableMapProps>
  export const Geographies: React.FC<GeographiesProps>
  export const Geography: React.FC<GeographyProps>
  export const Marker: React.FC<MarkerProps>
  export const Line: React.FC<LineProps>
}
