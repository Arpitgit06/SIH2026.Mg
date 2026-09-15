# MOIL AI Command Center

The **MOIL AI Command Center** is a state-of-the-art, Palantir-inspired Tactical HUD designed to revolutionize manganese reserve management, anomaly detection, and operational safety monitoring across India. Built for the SIH 2026 Hackathon, this platform fuses satellite telemetry, a local AI Small Language Model (SLM), and dynamic Geographic Information Systems (GIS) to provide real-time, prescriptive directives for mining operations.

---

## 🌟 Key Features

1. **Tactical GIS HUD Interface**
   - Full-screen interactive map acting as the primary interface (`z-index: 0`).
   - Floating, collapsible data panels featuring sharp-edged aesthetics, monospace typography, and transparent glassmorphism for a "military command center" feel.
   - Live toggles for Data Sync, State Filtering, and WXR (Weather) overlays.

2. **Synthetic Satellite Telemetry & Danger Matrix**
   - Monitors operational conditions based on synthetic Sentinel-2 data (NDVI, Soil Moisture Saturation, Land Surface Temperature).
   - The **Danger Matrix Chart** provides a 7-day forecast assessing hazard indices against precipitation and soil saturation, visualizing the risk of pit inundation or haul road slip hazards.

3. **Local AI Prescriptive Directives (FLAN-T5-SMALL)**
   - Integrates a locally run HuggingFace `google/flan-t5-small` SLM.
   - The SLM engine reads the synthetic telemetry and autonomously generates human-readable safety directives (e.g., *"Re-schedule deep hole blasting to dry window"*, or *"Re-route dumpers and reduce speed limit"*).
   - This local inference ensures high operational security and zero latency dependency on external cloud APIs.

4. **Dynamic Weather Holograms (WXR Layer)**
   - Simulates regional weather systems including Heavy Monsoons, Heatwaves, Cyclone Warnings, and High Wind/Dust Storms.
   - Utilizes advanced HTML/CSS hybrid animations wrapped in Leaflet `DivIcon` markers to render stunning, fluid representations of weather systems (e.g., falling rain particles, translating heat ripples, spinning vortices) directly onto the map.

---

## 🏗️ System Architecture & Workflow

This project is divided into a robust Python Backend and a Next.js Frontend.

### 1. Backend Service (FastAPI + Python)
The backend acts as the central data nervous system and AI inference hub.
- **`download_data.py`**: The data generator. When executed, it generates the synthetic benchmark dataset representing India's Manganese reserves and dynamically spawns random regional weather zones to ensure the dashboard always has "live" data.
- **`main.py`**: The FastAPI server.
  - Exposes RESTful endpoints (`/api/reserves`, `/api/danger-risk-matrix`, `/api/actions`, `/api/weather-zones`).
  - Upon startup, it lazily loads the HuggingFace `google/flan-t5-small` model into memory. When data is requested, it processes the numerical satellite telemetry and feeds it into the LLM to generate the `flan_t5_assessment` and actionable safety directives.

### 2. Frontend Dashboard (Next.js + React Leaflet)
The frontend consumes the FastAPI endpoints and renders the Tactical HUD.
- **`page.tsx`**: The main controller. It manages state (selected region, loading, UI collapse toggles), executes `fetchDashboardData()` to hit the backend, and orchestrates the layering of the UI panels over the map.
- **`MapComponent.tsx`**: The core GIS visualizer built on `react-leaflet`.
  - Renders the `World_Dark_Gray_Base` Esri tile layer.
  - Dynamically calculates circle radii based on ore tonnage and color-codes markers based on shortfall risk.
  - Mounts custom CSS animations for the WXR weather zones to provide literal, organic weather visualizations.
- **`globals.css`**: Contains the complex `@keyframes` and CSS classes (`weather-rain`, `heat-wave-path`) responsible for the premium holographic weather animations.

---

## 🚀 Setup & Execution

Setting up the project is fully automated via included batch scripts, ensuring a seamless experience for developers and judges.

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Git

### Installation & Startup

1. **Run Setup Script**
   Open a terminal in the root directory and execute:
   ```cmd
   .\setup.bat
   ```
   *What this does:* Creates a Python virtual environment, installs backend dependencies (`FastAPI`, `torch`, `transformers`), pre-downloads the AI model weights, generates the initial synthetic data, and runs `npm install` for the frontend.

2. **Launch Servers**
   Execute the start script:
   ```cmd
   .\start.bat
   ```
   *What this does:* 
   - Re-runs `download_data.py` to spawn fresh, dynamic weather zones and telemetry.
   - Spawns a terminal window running the Uvicorn FastAPI backend on `http://localhost:8000`.
   - Spawns a terminal window running the Next.js development server on `http://localhost:3000`.
   - Automatically opens your default web browser to the dashboard.

### Shutting Down
Simply close the two terminal windows spawned by `start.bat` to terminate both the backend and frontend servers.

---

## 🛠️ Built With

* **Frontend**: Next.js, React, Tailwind CSS, React Leaflet, Recharts, Framer Motion, Lucide Icons.
* **Backend**: Python, FastAPI, Uvicorn, HuggingFace Transformers.
* **AI Model**: `google/flan-t5-small`.

---
*Developed for SIH 2026*
