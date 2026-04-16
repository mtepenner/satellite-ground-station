import React from 'react'
import Dashboard from './pages/Dashboard'

const appStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b2e 100%)',
}

export default function App() {
  return (
    <div style={appStyle}>
      <Dashboard />
    </div>
  )
}
