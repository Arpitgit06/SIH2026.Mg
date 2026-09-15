"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CloudRain,
  Pickaxe,
  MapPin,
  Truck,
  Cpu,
  RefreshCw,
  Droplets,
  Layers,
  ShieldAlert,
  Compass,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import Leaflet Map to avoid SSR errors
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen bg-[#040711] flex flex-col items-center justify-center text-cyan-400/60 font-mono text-xs uppercase tracking-widest gap-2">
      <Compass className="h-8 w-8 animate-spin" />
      <span>[ LOADING GEOSPATIAL LAYERS ]</span>
    </div>
  ),
});

export default function Dashboard() {
  const [selectedState, setSelectedState] = useState("All");
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [reserves, setReserves] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total_reserves: 0,
    total_tonnage: 0,
    high_potential_count: 0,
    high_risk_count: 0,
    avg_confidence_score: 0.94,
  });
  const [dangerData, setDangerData] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [weatherZones, setWeatherZones] = useState<any[]>([]);
  const [showWeather, setShowWeather] = useState(true);
  const [flanT5Active, setFlanT5Active] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(1);
  const [initialLoad, setInitialLoad] = useState(true);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  // Scanner states
  const [scannerLocation, setScannerLocation] = useState<{lat: number, lng: number} | null>(null);
  const [scannerResult, setScannerResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setScannerLocation({ lat, lng });
    setScanning(true);
    try {
      const res = await fetch(`http://localhost:8000/api/scan-location?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        setScannerResult(data);
      }
    } catch (err) {
      console.error("Scanner error:", err);
    } finally {
      setScanning(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async (state: string) => {
    setLoading(true);
    try {
      const stateParam = state === "All" ? "All" : encodeURIComponent(state);

      const [reservesRes, dangerRes, actionsRes, weatherRes] = await Promise.all([
        fetch(`http://localhost:8000/api/reserves?state=${stateParam}`),
        fetch(`http://localhost:8000/api/danger-risk-matrix?state=${stateParam}`),
        fetch(`http://localhost:8000/api/actions?state=${stateParam}`),
        fetch(`http://localhost:8000/api/weather-zones`),
      ]);

      if (reservesRes.ok) {
        const resData = await reservesRes.json();
        setReserves(resData.reserves || []);
        setAvailableStates(resData.available_states || []);
        setSummary({
          total_reserves: resData.total_reserves || 0,
          total_tonnage: resData.total_tonnage || 0,
          high_potential_count: resData.high_potential_count || 0,
          high_risk_count: resData.high_risk_count || 0,
          avg_confidence_score: resData.avg_confidence_score || 0.94,
        });
      }

      if (dangerRes.ok) {
        const dangerJson = await dangerRes.json();
        setDangerData(dangerJson.danger_timeline || []);
      }

      if (actionsRes.ok) {
        const actJson = await actionsRes.json();
        setActions(actJson.actions || []);
        setFlanT5Active(actJson.flan_t5_model_active || false);
      }
      
      if (weatherRes.ok) {
        const weatherJson = await weatherRes.json();
        setWeatherZones(weatherJson.weather_zones || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard telemetry:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedState).then(() => {
      if (initialLoad) {
        setTimeout(() => setInitialLoad(false), 2200);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, fetchDashboardData]);

  // Resizing logic for right panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 250 && newWidth < 800) {
        setRightPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const activeDay = dangerData[selectedDayIndex] || dangerData[0] || {};

  return (
    <>
      {/* ═══ BOOT SCREEN ═══ */}
      <AnimatePresence>
        {initialLoad && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#040711]"
          >
            {/* Orbital rings */}
            <div className="relative flex items-center justify-center">
              <Compass className="h-14 w-14 text-cyan-400 animate-spin" />
              <div className="absolute h-24 w-24 border border-cyan-500/30 animate-[spin_3s_linear_infinite]" />
              <div className="absolute h-36 w-36 border border-teal-500/20 animate-[spin_5s_linear_infinite_reverse]" />
              <div className="absolute h-48 w-48 border border-cyan-800/10 animate-[spin_8s_linear_infinite]" />
            </div>
            <h2 className="mt-10 text-xl font-mono font-bold tracking-[0.3em] text-cyan-400 uppercase">
              MOIL COMMAND
            </h2>
            <p className="mt-2 text-[10px] font-mono text-cyan-600 uppercase tracking-[0.25em]">
              Geospatial Intelligence System v2.1
            </p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-mono text-cyan-400/70 animate-pulse tracking-widest">
              <span className="h-1.5 w-1.5 bg-cyan-400 animate-ping" />
              ESTABLISHING SATELLITE UPLINK
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ FULL-SCREEN MAP (z-0 Background) ═══ */}
      <MapComponent
        reserves={reserves}
        selectedState={selectedState}
        onMapClick={handleMapClick}
        scannerLocation={scannerLocation}
        fullscreen={true}
        weatherZones={weatherZones}
        showWeather={showWeather}
      />

      {/* ═══ HUD OVERLAY LAYER (z-10, pointer-events-none wrapper) ═══ */}
      <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">

        {/* ── TOP BAR ── */}
        <div className="pointer-events-auto absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5 bg-[#040711]/85 backdrop-blur-sm border-b border-cyan-900/40">
          {/* Left: Title block */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 border border-cyan-500/50 flex items-center justify-center">
                <Compass className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-sm font-mono font-bold tracking-wider text-cyan-400 uppercase leading-tight">
                  MOIL AI & SPACE COMMAND
                </h1>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Manganese Reserve Delineation • Shortfall Forecasting
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-cyan-900/50 mx-1" />

            {/* Badges */}
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
              SIH 2026 • 26009
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-teal-500/10 text-teal-500 border border-teal-500/30">
              Ministry of Steel
            </span>
          </div>

          {/* Center: Stats strip */}
          <div className="hidden lg:flex items-center gap-0 border border-cyan-900/40">
            <HudStat label="DEPOSITS" value={`${summary.total_reserves}`} icon={<Pickaxe className="h-3 w-3" />} />
            <HudStat label="ORE" value={`${(summary.total_tonnage / 1000000).toFixed(1)}MT`} icon={<Layers className="h-3 w-3" />} />
            <HudStat label="HIGH GRADE" value={`${summary.high_potential_count}`} icon={<CheckCircle2 className="h-3 w-3" />} color="text-teal-400" />
            <HudStat label="AI CONF" value={`${(summary.avg_confidence_score * 100).toFixed(0)}%`} icon={<Cpu className="h-3 w-3" />} color="text-emerald-400" />
            <HudStat label="HAZARD" value={`${summary.high_risk_count}`} icon={<AlertTriangle className="h-3 w-3" />} color={summary.high_risk_count > 0 ? "text-rose-400" : "text-slate-400"} urgent={summary.high_risk_count > 0} />
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            <select
              id="state-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-[#0a0e18] text-slate-300 text-[10px] font-mono uppercase tracking-wider px-2 py-1 border border-cyan-900/40 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="All">ALL INDIA</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st.toUpperCase()} {st === "Madhya Pradesh" || st === "Maharashtra" ? "• MOIL" : ""}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowWeather(!showWeather)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-all ${
                showWeather 
                  ? "bg-blue-600/20 text-blue-400 border-blue-600/40 hover:bg-blue-600/40" 
                  : "bg-slate-800/50 text-slate-500 border-slate-700 hover:bg-slate-800"
              }`}
            >
              <Droplets className="h-3 w-3" />
              WXR
            </button>

            <button
              onClick={() => fetchDashboardData(selectedState)}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 text-[10px] font-mono uppercase tracking-wider border border-cyan-600/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              SYNC
            </button>

            <div className="flex items-center gap-1.5 px-2 py-1 border border-cyan-900/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-[9px] font-mono text-teal-400 uppercase tracking-wider">
                FLAN-T5 LIVE
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: AI Directives + Scanner ── */}
        <div 
          className={`pointer-events-auto absolute top-[52px] right-0 bottom-0 z-10 flex flex-col ${!isResizing ? "transition-all duration-300" : ""} ${rightPanelCollapsed ? "w-10" : ""}`}
          style={{ width: rightPanelCollapsed ? undefined : `${rightPanelWidth}px` }}
        >
          {/* Resize Handle */}
          {!rightPanelCollapsed && (
            <div 
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-30 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            />
          )}
          {/* Collapse Toggle */}
          <button
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="absolute -left-6 top-4 z-20 w-6 h-10 bg-[#040711]/90 border border-cyan-900/40 border-r-0 flex items-center justify-center text-cyan-400 hover:bg-cyan-900/30 transition-colors"
            title={rightPanelCollapsed ? "Expand panel" : "Collapse panel"}
          >
            <span className="text-[10px] font-mono">{rightPanelCollapsed ? "◀" : "▶"}</span>
          </button>

          {!rightPanelCollapsed && (
            <div className="flex-1 overflow-y-auto bg-[#040711]/80 backdrop-blur-sm border-l border-cyan-900/40 p-3 space-y-3">
              {/* AI ENGINE HEADER */}
              <div className="border border-teal-900/50 bg-[#040711]/90 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <Cpu className="h-3 w-3" />
                    SLM ENGINE: FLAN-T5-SMALL
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-teal-500">
                    <span className="h-1.5 w-1.5 bg-teal-400 animate-pulse" />
                    LOCAL
                  </span>
                </div>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">
                  AI PRESCRIPTIVE SAFETY DIRECTIVES
                </p>
              </div>

              {/* AI DIRECTIVES FEED */}
              <AnimatePresence>
                {actions.map((act) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-slate-800/80 bg-[#040711]/90 p-2.5 hover:border-cyan-900/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider ${
                          act.priority === "CRITICAL"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : act.priority === "HIGH"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                        }`}
                      >
                        {act.priority}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                        {act.category.includes("Weather") ? (
                          <CloudRain className="h-3 w-3 text-cyan-500" />
                        ) : (
                          <Truck className="h-3 w-3 text-amber-500" />
                        )}
                        {act.site}
                      </span>
                    </div>

                    <p className="text-[10px] font-semibold text-slate-300 leading-snug mb-1.5">
                      {act.message}
                    </p>

                    <div className="p-1.5 bg-teal-950/30 border border-teal-900/30 text-[10px] text-teal-300 font-mono mb-1">
                      {act.ai_directive}
                    </div>

                    <p className="text-[9px] font-mono text-teal-500 flex items-center gap-1">
                      <span>→</span> {act.impact}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* ── SCANNER PANEL ── */}
              <div className="border border-cyan-900/50 bg-[#040711]/90 p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Compass className="h-3 w-3 text-cyan-400" />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                    SATELLITE PROSPECTIVITY SCANNER
                  </span>
                </div>

                {!scannerLocation && (
                  <div className="py-3 text-center border border-dashed border-slate-700/50 text-[10px] font-mono text-slate-600 uppercase tracking-wide">
                    <MapPin className="h-4 w-4 mx-auto mb-1 opacity-40" />
                    AWAITING TARGET — CLICK MAP
                  </div>
                )}

                {scanning && (
                  <div className="py-3 text-center text-[10px] font-mono text-cyan-400 animate-pulse uppercase tracking-wide border border-cyan-900/30">
                    <RefreshCw className="h-4 w-4 mx-auto mb-1 animate-spin" />
                    ACQUIRING ORBITAL TELEMETRY...
                  </div>
                )}

                {!scanning && scannerResult && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-[#0a0e18] p-1.5 border border-slate-800/60">
                        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">COORDS</p>
                        <p className="text-[11px] font-mono font-bold text-slate-200">{scannerResult.lat.toFixed(3)}, {scannerResult.lng.toFixed(3)}</p>
                      </div>
                      <div className="bg-[#0a0e18] p-1.5 border border-slate-800/60">
                        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">SCORE</p>
                        <p className={`text-[11px] font-mono font-bold ${scannerResult.prospectivity_score > 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {scannerResult.prospectivity_score}/100
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#0a0e18] p-1.5 border border-slate-800/60 space-y-0.5">
                      <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-800/40 pb-0.5 mb-0.5">MULTISPECTRAL DATA</p>
                      <p className="text-[10px] font-mono text-slate-400 flex justify-between"><span>NDVI</span> <span className="text-emerald-400">{scannerResult.satellite_metrics.ndvi}</span></p>
                      <p className="text-[10px] font-mono text-slate-400 flex justify-between"><span>SOIL MOISTURE</span> <span className="text-cyan-400">{scannerResult.satellite_metrics.soil_moisture_index}</span></p>
                      <p className="text-[10px] font-mono text-slate-400 flex justify-between"><span>NEAREST</span> <span className="text-slate-300">{scannerResult.distance_km}km</span></p>
                    </div>

                    <div className="bg-cyan-950/30 p-2 border border-cyan-900/40">
                      <p className="text-[8px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Cpu className="h-2.5 w-2.5" /> FLAN-T5 ASSESSMENT
                      </p>
                      <p className="text-[10px] text-slate-300 leading-relaxed italic font-mono">
                        "{scannerResult.llm_assessment}"
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM PANEL: Danger Matrix Chart (Docked) ── */}
        <div 
          className={`pointer-events-auto absolute bottom-0 left-0 z-10 ${!isResizing ? "transition-all duration-300" : ""} ${bottomPanelCollapsed ? "h-8" : "h-[280px]"}`}
          style={{ right: rightPanelCollapsed ? '40px' : `${rightPanelWidth}px` }}
        >
          {/* Collapse Toggle */}
          <button
            onClick={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
            className="absolute -top-6 left-4 z-20 h-6 w-10 bg-[#040711]/90 border border-cyan-900/40 border-b-0 flex items-center justify-center text-cyan-400 hover:bg-cyan-900/30 transition-colors"
            title={bottomPanelCollapsed ? "Expand chart" : "Collapse chart"}
          >
            <span className="text-[10px] font-mono">{bottomPanelCollapsed ? "▲" : "▼"}</span>
          </button>

          <div className="h-full bg-[#040711]/85 backdrop-blur-sm border-t border-r border-cyan-900/40 overflow-hidden">
            {bottomPanelCollapsed ? (
              <div className="h-full flex items-center px-4">
                <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="h-3 w-3" />
                  MINING DANGER & FEASIBILITY MATRIX — 7 DAY FORECAST
                </span>
              </div>
            ) : (
              <div className="h-full flex">
                {/* Chart */}
                <div className="flex-1 p-2">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-3 w-3 text-amber-400" />
                      DANGER MATRIX • 7D FORECAST
                    </span>

                    {/* Day Selector */}
                    <div className="flex items-center gap-0 border border-cyan-900/40">
                      {dangerData.map((d, idx) => (
                        <button
                          key={d.date}
                          onClick={() => setSelectedDayIndex(idx)}
                          className={`px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider transition-all ${
                            selectedDayIndex === idx
                              ? "bg-cyan-600/30 text-cyan-300"
                              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
                          }`}
                        >
                          {d.display_date}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height="85%">
                    <ComposedChart data={dangerData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0e1a2b" />
                      <XAxis dataKey="display_date" stroke="#334155" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                      <YAxis yAxisId="left" stroke="#334155" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#334155" tick={{ fontSize: 9, fontFamily: "monospace" }} domain={[0, 100]} />
                      <Tooltip content={<CustomDangerTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "9px", fontFamily: "monospace" }} />
                      <ReferenceLine
                        yAxisId="right"
                        y={70}
                        label={{ value: "CRITICAL", fill: "#ef4444", fontSize: 8, fontFamily: "monospace" }}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                      />
                      <Bar yAxisId="left" dataKey="rainfall_mm" name="RAINFALL (mm)" fill="#06b6d4" radius={[2, 2, 0, 0]} barSize={20} />
                      <Line yAxisId="right" type="monotone" dataKey="soil_moisture_pct" name="SOIL SAT (%)" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="right" type="monotone" dataKey="mining_danger_index" name="HAZARD IDX" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Feasibility Readout (right side of bottom panel) */}
                {activeDay.date && (
                  <div className="w-[220px] border-l border-cyan-900/40 p-2 space-y-2 flex flex-col justify-center">
                    <div className="bg-[#0a0e18] p-2 border border-slate-800/60">
                      <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">STATUS</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="h-2 w-2" style={{ backgroundColor: activeDay.status_color }} />
                        <p className="text-[10px] font-mono font-bold text-slate-200">{activeDay.display_date}</p>
                      </div>
                      <p className="text-[9px] font-mono font-bold mt-0.5" style={{ color: activeDay.status_color }}>
                        {activeDay.operation_status}
                      </p>
                    </div>

                    <div className="bg-[#0a0e18] p-2 border border-slate-800/60">
                      <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">BLASTING</p>
                      <p className="text-[10px] font-mono font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                        {activeDay.mining_danger_index >= 70 ? (
                          <XCircle className="h-3 w-3 text-rose-500" />
                        ) : activeDay.mining_danger_index >= 45 ? (
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        )}
                        {activeDay.blasting_feasibility}
                      </p>
                      <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                        H₂O: ~{activeDay.pit_water_ingress_m3_hr} m³/hr
                      </p>
                    </div>

                    <div className="bg-[#0a0e18] p-2 border border-slate-800/60">
                      <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">HAUL ROAD</p>
                      <p className="text-[10px] font-mono font-bold text-slate-200 mt-0.5">
                        {activeDay.equipment_slip_risk_pct}% SLIP RISK
                      </p>
                      <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                        {activeDay.rainfall_mm}mm • {activeDay.soil_moisture_pct}% SAT
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── TOP-LEFT: Coordinate readout (HUD feel) ── */}
        <div className="absolute top-[60px] left-3 z-10 pointer-events-none">
          <div className="text-[9px] font-mono text-cyan-600/60 uppercase tracking-wider space-y-0.5">
            <p>ZONE: {selectedState === "All" ? "ALL INDIA" : selectedState.toUpperCase()}</p>
            <p>DEPOSITS: {reserves.length}</p>
            {scannerLocation && (
              <p className="text-cyan-400">
                TGT: {scannerLocation.lat.toFixed(4)}°N {scannerLocation.lng.toFixed(4)}°E
              </p>
            )}
          </div>
        </div>

      </div>
    </>
  );
}

/* ═══ HUD STAT (Top Bar Metric Cell) ═══ */
function HudStat({
  label,
  value,
  icon,
  color = "text-cyan-400",
  urgent = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  urgent?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 border-r border-cyan-900/40 last:border-r-0 ${urgent ? "bg-rose-500/10" : ""}`}>
      <span className={`${color} opacity-70`}>{icon}</span>
      <div className="leading-none">
        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`text-[11px] font-mono font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

/* ═══ CHART TOOLTIP ═══ */
function CustomDangerTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#040711]/95 border border-cyan-900/50 p-2.5 shadow-2xl text-[10px] font-mono text-slate-300 min-w-[180px]">
        <p className="font-bold text-[11px] text-cyan-400 mb-1 border-b border-cyan-900/30 pb-1 uppercase">
          {data.display_date} ({data.date})
        </p>
        <p className="text-cyan-400">RAIN: {data.rainfall_mm}mm</p>
        <p className="text-teal-400">SOIL: {data.soil_moisture_pct}%</p>
        <p className="text-rose-400">HAZARD: {data.mining_danger_index}/100</p>
        <div className="mt-1 pt-1 border-t border-cyan-900/30">
          <p className="font-bold" style={{ color: data.status_color }}>
            {data.operation_status}
          </p>
          <p className="text-slate-500">BLAST: {data.blasting_feasibility}</p>
        </div>
      </div>
    );
  }
  return null;
}
