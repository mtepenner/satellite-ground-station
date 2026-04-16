# 📡 Satellite Ground Station

A highly scalable, full-stack satellite ground station designed for high-throughput telemetry ingestion and real-time visualization. Built on a cloud-native microservices architecture, this system actively decodes radio hardware outputs, persists historical data into a time-series database, and streams live metrics to an interactive 3D orbital dashboard. 

## 📑 Table of Contents
- [Features](#-features)
- [Architecture & Technologies](#-architecture--technologies)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

* **⚡ High-Throughput Ingestion:** Strips protocol headers and translates binary flags into readable states using built-in AX.25 and CSP decoders.
* **🔄 Live Telemetry Streaming:** Pushes parsed JSON structs to a Redis Pub/Sub channel, which are then streamed to the frontend via WebSockets.
* **📊 Time-Series Storage:** Persists historical telemetry data using TimescaleDB and SQLAlchemy models for complex queries and aggregations.
* **🌍 3D Orbital Dashboard:** A React-based UI that plots live lat/lon coordinates on a 3D globe and provides a real-time HUD for velocity, altitude, and signal strength.
* **☸️ Production-Ready Orchestration:** Includes Kubernetes manifests for scaling pods, managing stateful time-series storage, and handling Nginx/Traefik ingress routing.

## 🛠️ Architecture & Technologies

The ground station is divided into three primary, decoupled microservices:

1. **Ingestion (Go):** Manages UDP/TCP network sockets for radio hardware outputs, extracts payloads, and acts as the initial message broker publisher.
2. **Backend (Python / FastAPI):** Exposes historical REST endpoints, handles WebSocket routing, and manages database sessions utilizing Pydantic schema validation.
3. **Frontend (React / TypeScript):** The operator interface, featuring reusable UI widgets like the `OrbitalMap`, `LiveMetrics`, and `TelemetryChart`.

## 📋 Prerequisites

* Docker and Docker Compose (for local development)
* Kubernetes cluster (for production deployment)
* Node.js, Go 1.20+, and Python 3.10+ (for bare-metal development)
* `make` utility (for build/run shortcuts)

## ⚙️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mtepenner/satellite-ground-station.git
   cd satellite-ground-station
   ```

2. **Deploy Locally via Docker Compose:**
   The included `docker-compose.yml` spins up all required services, including the backend, frontend, Redis broker, and TimescaleDB.
   ```bash
   make up # Or explicitly: docker-compose up --build -d
   ```

3. **Deploy via Kubernetes:**
   Apply the provided manifests to deploy the entire stack to your cluster.
   ```bash
   kubectl apply -f k8s/
   ```

## 💻 Usage

Once the local cluster or Kubernetes deployment is actively running:

1. Access the web dashboard by navigating your browser to the frontend ingress route (e.g., `http://localhost`).
2. The **Orbital Map** will automatically establish a WebSocket connection and begin plotting live telemetry data.
3. Monitor real-time spacecraft state via the **Live Metrics** HUD.
4. Analyze past passes using the **Telemetry Chart**, which queries the FastAPI historical REST endpoints.

## 🤝 Contributing

Contributions are welcome! Please ensure that any additions pass the automated CI/CD pipelines managed via GitHub Actions:
* `build-go.yml`: Tests and builds the Go ingestion binary.
* `build-python.yml`: Lints and builds the FastAPI container.
* `build-react.yml`: Builds the React static assets.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/NewDecoder`)
3. Commit your changes (`git commit -m 'Add a NewDecoder'`)
4. Push to the branch (`git push origin feature/NewDecoder`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
