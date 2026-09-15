"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet marker icon issue in Next.js
const highRiskIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const normalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const mediumIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const scannerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to smoothly re-center map when state filter changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const getWeatherIcon = (type: string) => {
  let htmlContent = "";

  if (type.includes("Rain") || type.includes("Monsoon")) {
    htmlContent = `
      <div style="position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; border-radius: 50%; background: radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%);">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="rgba(14,165,233,0.8)" stroke-width="1" style="animation: floatCloud 3s ease-in-out infinite; z-index: 10;">
          <path d="M17.5 19c2.485 0 4.5-2.015 4.5-4.5S19.985 10 17.5 10c-.17 0-.337.017-.5.05C16.14 7.155 13.3 5 10 5 6.134 5 3 8.134 3 12c0 .285.017.566.05.842C1.848 13.567 1 14.685 1 16c0 1.657 1.343 3 3 3h13.5z"></path>
        </svg>
        ${Array.from({length: 15}).map((_, i) => `<div class="raindrop" style="left: ${20 + Math.random()*60}%; animation-delay: ${Math.random()*0.8}s; animation-duration: ${0.6 + Math.random()*0.4}s;"></div>`).join('')}
      </div>
    `;
  } else if (type.includes("Heatwave")) {
    htmlContent = `
      <div style="position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 50%; background: radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%);">
        <svg width="200%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none" style="position: absolute; top: 0; left: 0;" class="heat-wave-path">
          <path d="M0,100 C150,200 250,0 400,100 C550,200 650,0 800,100 L800,200 L0,200 Z" fill="rgba(249,115,22,0.4)" />
        </svg>
        <svg width="200%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none" style="position: absolute; top: 0; left: 0;" class="heat-wave-path-2">
          <path d="M0,150 C150,50 250,250 400,150 C550,50 650,250 800,150 L800,200 L0,200 Z" fill="rgba(249,115,22,0.6)" />
        </svg>
      </div>
    `;
  } else if (type.includes("Cyclone")) {
    htmlContent = `
      <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 50%; background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%);">
        <svg width="150" height="150" viewBox="0 0 100 100" class="vortex-spin">
          <path d="M50 50 Q 80 20, 90 50 T 50 90 T 10 50 T 50 10" fill="none" stroke="rgba(139,92,246,0.8)" stroke-width="4" stroke-dasharray="10 5" />
          <path d="M50 50 Q 70 30, 80 50 T 50 80 T 20 50 T 50 20" fill="none" stroke="rgba(139,92,246,0.6)" stroke-width="3" stroke-dasharray="8 6" />
          <path d="M50 50 Q 60 40, 70 50 T 50 70 T 30 50 T 50 30" fill="none" stroke="rgba(139,92,246,0.4)" stroke-width="2" stroke-dasharray="5 5" />
        </svg>
      </div>
    `;
  } else if (type.includes("Wind") || type.includes("Dust")) {
    htmlContent = `
      <div style="position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 50%; background: radial-gradient(circle, rgba(234,179,8,0.1) 0%, transparent 70%);">
        ${Array.from({length: 12}).map((_, i) => `<div class="wind-streak" style="top: ${10 + Math.random()*80}%; left: ${Math.random()*20}%; width: ${40 + Math.random()*60}px; animation-delay: ${Math.random()}s; animation-duration: ${0.5 + Math.random()*0.5}s;"></div>`).join('')}
      </div>
    `;
  }
  
  return new L.DivIcon({
    html: htmlContent,
    className: "bg-transparent border-0",
    iconSize: [250, 250],
    iconAnchor: [125, 125],
  });
};

const STATE_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  All: { center: [21.5, 80.5], zoom: 5 },
  "Madhya Pradesh": { center: [21.85, 80.1], zoom: 8 },
  Maharashtra: { center: [21.45, 79.4], zoom: 8 },
  Odisha: { center: [21.2, 84.8], zoom: 7 },
  Karnataka: { center: [14.8, 76.2], zoom: 7 },
  "Andhra Pradesh": { center: [18.2, 83.4], zoom: 8 },
  Jharkhand: { center: [22.6, 85.7], zoom: 8 },
  Goa: { center: [15.3, 74.1], zoom: 9 },
};

export default function MapComponent({
  reserves,
  selectedState = "All",
  onMapClick,
  scannerLocation,
  fullscreen = false,
  weatherZones = [],
  showWeather = false,
}: {
  reserves: any[];
  selectedState: string;
  onMapClick?: (lat: number, lng: number) => void;
  scannerLocation?: { lat: number; lng: number } | null;
  fullscreen?: boolean;
  weatherZones?: any[];
  showWeather?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`${fullscreen ? "h-screen w-screen" : "h-[460px] w-full"} bg-[#040711] flex items-center justify-center text-cyan-400/60 font-mono text-xs uppercase tracking-widest`}>
        [ LOADING GIS LAYERS ]
      </div>
    );
  }

  const stateConfig = STATE_CENTERS[selectedState] || STATE_CENTERS["All"];

  const containerClass = fullscreen
    ? "fixed inset-0 z-0"
    : "relative h-[460px] w-full rounded-xl overflow-hidden border border-border/60 shadow-2xl";

  return (
    <div className={containerClass}>
      <MapContainer
        center={stateConfig.center}
        zoom={stateConfig.zoom}
        style={{ height: "100%", width: "100%", background: "#040711" }}
        zoomControl={!fullscreen}
      >
        <ChangeView center={stateConfig.center} zoom={stateConfig.zoom} />

        {/* Free, crisp dark-gray tiles with NO API key watermark */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        />

        {onMapClick && <MapEvents onMapClick={onMapClick} />}

        {scannerLocation && (
          <Marker position={[scannerLocation.lat, scannerLocation.lng]} icon={scannerIcon}>
            <Popup className="custom-map-popup">
              <div className="font-sans text-violet-900 font-bold p-1">
                🛰️ Satellite Scanner Target
                <div className="text-xs font-normal mt-1 text-gray-700">
                  {scannerLocation.lat.toFixed(4)}, {scannerLocation.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {reserves.map((reserve) => {
          const isHighRisk = reserve.shortfall_risk === "High";
          const isMediumRisk = reserve.shortfall_risk === "Medium";
          const icon = isHighRisk ? highRiskIcon : (isMediumRisk ? mediumIcon : normalIcon);
          const circleColor = isHighRisk ? "#ef4444" : (isMediumRisk ? "#f59e0b" : "#10b981");

          return (
            <div key={reserve.id}>
              <Marker position={[reserve.lat, reserve.lng]} icon={icon}>
                <Popup className="custom-map-popup">
                  <div className="p-2 font-sans min-w-[220px] text-gray-900">
                    <div className="flex items-center justify-between gap-2 border-b pb-1 mb-2">
                      <h3 className="font-bold text-sm text-gray-900">{reserve.name}</h3>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${
                          isHighRisk ? "bg-red-600" : isMediumRisk ? "bg-amber-500" : "bg-emerald-600"
                        }`}
                      >
                        {reserve.shortfall_risk} Risk
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-700">
                      <p><strong>District:</strong> {reserve.district}, {reserve.state}</p>
                      <p><strong>Operator:</strong> {reserve.operator}</p>
                      <p><strong>Type:</strong> {reserve.mine_type} ({reserve.depth_meters}m depth)</p>
                      <p><strong>Ore Grade:</strong> <span className="font-semibold text-blue-700">{reserve.grade_mn_pct}% Mn</span></p>
                      <p><strong>Estimated Ore:</strong> {(reserve.estimated_tonnage / 1000000).toFixed(2)}M Tonnes</p>
                      
                      {reserve.satellite_indicators && (
                        <div className="mt-2 pt-1 border-t border-gray-200 text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded">
                          <p className="font-semibold text-gray-800">Space Sentinel-2 Telemetry:</p>
                          <p>• Soil Moisture Sat: {reserve.satellite_indicators.soil_moisture_pct}%</p>
                          <p>• Surface NDVI: {reserve.satellite_indicators.ndvi}</p>
                          <p>• Land Surface Temp: {reserve.satellite_indicators.lst_celsius}°C</p>
                        </div>
                      )}

                      {reserve.danger_reason && (
                        <p className="text-[11px] mt-1 text-red-600 font-medium bg-red-50 p-1 rounded">
                          ⚠️ {reserve.danger_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>

              <Circle
                center={[reserve.lat, reserve.lng]}
                radius={Math.max(1500, Math.min(25000, reserve.estimated_tonnage / 1000))}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: isHighRisk ? 0.35 : 0.2,
                  weight: isHighRisk ? 2 : 1,
                }}
              />
            </div>
          );
        })}

        {/* Render Weather Zones */}
        {showWeather && weatherZones?.map((zone) => (
          <div key={zone.id}>
            {/* Animated Hologram Marker */}
            <Marker position={[zone.lat, zone.lng]} icon={getWeatherIcon(zone.type)}>
              <Tooltip direction="top" offset={[0, -100]} opacity={0.9}>
                <div className="p-1 font-mono text-[10px] text-gray-900 bg-white">
                  <p className="font-bold uppercase mb-0.5" style={{color: zone.color}}>{zone.type}</p>
                  <p>Severity: {zone.severity}</p>
                  <p>Impact: {zone.impact}</p>
                </div>
              </Tooltip>
            </Marker>
            
            {/* Delineation Circle for boundary */}
            <Circle
              center={[zone.lat, zone.lng]}
              radius={zone.radius_km * 1000}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.05,
                weight: 1,
                dashArray: "4 4"
              }}
            />
          </div>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className={`absolute bottom-3 left-3 ${fullscreen ? "z-[1000]" : "z-[1000]"} bg-[#040711]/90 backdrop-blur-sm px-3 py-2 border border-cyan-900/40 text-[10px] font-mono uppercase tracking-wider flex items-center gap-4 text-slate-300 pointer-events-none`}>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-emerald-500"></span>
          <span>SAFE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-amber-500"></span>
          <span>MODERATE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-red-500 animate-pulse"></span>
          <span>HIGH RISK</span>
        </div>
        <div className="h-4 w-px bg-cyan-900/50 mx-1"></div>
        <div className="flex items-center gap-1.5 opacity-70">
          <span className="h-2 w-2 rounded-full border border-blue-400 bg-blue-400/20"></span>
          <span>WXR SYSTEM</span>
        </div>
      </div>
    </div>
  );
}
