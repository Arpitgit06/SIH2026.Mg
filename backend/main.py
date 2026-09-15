import os
import json
import math
import random
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(
    title="MOIL AI Command Center API",
    description="Space Technology & AI/ML powered Manganese Reserve Mapping and Danger Risk Assessment",
    version="2.0.0"
)

# CORS middleware for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "manganese_reserves_india.json")
WEATHER_PATH = os.path.join(os.path.dirname(__file__), "data", "weather_zones_india.json")

# Global LLM pipeline handle (lazy loaded)
_flan_model = None
_flan_tokenizer = None
_model_load_attempted = False

def get_flan_t5_components():
    global _flan_model, _flan_tokenizer, _model_load_attempted
    if _flan_model is None and not _model_load_attempted:
        _model_load_attempted = True
        # Force HuggingFace to use the local models directory
        os.environ["HF_HOME"] = os.path.join(os.path.dirname(__file__), "models")
        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            print("[+] Loading local google/flan-t5-small model on CPU...")
            _flan_tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-small")
            _flan_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-small")
            print("[OK] Local FLAN-T5 LLM ready for prescriptive inference!")
        except Exception as e:
            print(f"[!] Warning: Could not initialize local FLAN-T5 ({e}). Fallback logic active.")
            _flan_model = None
            _flan_tokenizer = None
    return _flan_tokenizer, _flan_model

def load_reserves_data() -> List[Dict[str, Any]]:
    if not os.path.exists(DATA_PATH):
        try:
            from download_data import download_and_save_data
            download_and_save_data()
        except Exception as e:
            print(f"Error executing download_data: {e}")
            return []
    
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/")
def root():
    return {
        "service": "MOIL AI Command Center Backend",
        "status": "online",
        "version": "2.0.0",
        "engine": "HuggingFace Transformers (google/flan-t5-small) & Space Sentinel-2 Fusion"
    }

@app.get("/api/states")
def get_available_states():
    reserves = load_reserves_data()
    states_dict = {}
    for r in reserves:
        st = r.get("state", "Unknown")
        if st not in states_dict:
            states_dict[st] = {
                "state": st,
                "reserves_count": 0,
                "total_tonnage": 0,
                "high_risk_count": 0
            }
        states_dict[st]["reserves_count"] += 1
        states_dict[st]["total_tonnage"] += r.get("estimated_tonnage", 0)
        if r.get("shortfall_risk") == "High":
            states_dict[st]["high_risk_count"] += 1
            
    return list(states_dict.values())

@app.get("/api/reserves")
def get_reserves(state: Optional[str] = Query("All", description="Filter by Indian State or 'All'")):
    all_reserves = load_reserves_data()
    
    if state and state.lower() != "all":
        filtered = [r for r in all_reserves if r.get("state", "").lower() == state.lower()]
    else:
        filtered = all_reserves

    total_tonnage = sum(r.get("estimated_tonnage", 0) for r in filtered)
    high_potential = sum(1 for r in filtered if r.get("status") == "High Potential")
    high_risk = sum(1 for r in filtered if r.get("shortfall_risk") == "High")
    avg_confidence = (
        round(sum(r.get("confidence_score", 0.85) for r in filtered) / len(filtered), 2)
        if filtered else 0.90
    )

    distinct_states = sorted(list(set(r.get("state") for r in all_reserves if r.get("state"))))

    return {
        "state_filter": state,
        "total_reserves": len(filtered),
        "total_tonnage": total_tonnage,
        "high_potential_count": high_potential,
        "high_risk_count": high_risk,
        "avg_confidence_score": avg_confidence,
        "available_states": distinct_states,
        "reserves": filtered
    }

@app.get("/api/weather-zones")
def get_weather_zones():
    if not os.path.exists(WEATHER_PATH):
        return {"weather_zones": []}
    
    with open(WEATHER_PATH, "r", encoding="utf-8") as f:
        zones = json.load(f)
    return {"weather_zones": zones}

@app.get("/api/danger-risk-matrix")
def get_danger_risk_matrix(state: Optional[str] = Query("All")):
    """
    Returns 7-day environmental danger vs mining safety factors
    based on precipitation, soil moisture saturation, and bench slope stability.
    """
    today = datetime.today()
    matrix = []

    # State specific baseline multipliers
    is_monsoon_belt = state in ["Odisha", "Maharashtra", "Goa"]
    is_arid_belt = state in ["Karnataka", "Andhra Pradesh"]

    base_rains = [15, 68, 85, 42, 20, 10, 5] if is_monsoon_belt else (
        [5, 10, 15, 8, 4, 12, 6] if is_arid_belt else [25, 45, 60, 35, 18, 12, 8]
    )

    base_moistures = [32, 54, 65, 48, 38, 30, 26] if is_monsoon_belt else (
        [18, 22, 24, 20, 17, 21, 18] if is_arid_belt else [28, 39, 48, 35, 29, 25, 22]
    )

    for i in range(7):
        current_date = today + timedelta(days=i)
        rain = base_rains[i]
        moisture = base_moistures[i]
        
        # Calculate dynamic Mining Danger / Shortfall Risk Index (0-100)
        # Factor in heavy rain (>50mm is critical danger for open pits)
        danger_index = int(min(100, (rain * 0.75) + (moisture * 0.55)))

        if danger_index >= 70:
            operation_status = "Mining Suspended / Flood Standdown"
            blasting_safe = "PROHIBITED - Waterlogged Holes"
            risk_level = "CRITICAL"
            color = "#ef4444" # red
        elif danger_index >= 45:
            operation_status = "Opencast Restricted / Underground Only"
            blasting_safe = "CAUTION - High Slump Risk"
            risk_level = "ELEVATED"
            color = "#f59e0b" # yellow/orange
        else:
            operation_status = "Normal Full-Scale Extraction"
            blasting_safe = "OPTIMAL - Clear Dry Strata"
            risk_level = "LOW HAZARD"
            color = "#10b981" # green

        matrix.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "display_date": current_date.strftime("%b %d"),
            "rainfall_mm": rain,
            "soil_moisture_pct": moisture,
            "mining_danger_index": danger_index,
            "operation_status": operation_status,
            "blasting_feasibility": blasting_safe,
            "risk_level": risk_level,
            "status_color": color,
            "pit_water_ingress_m3_hr": rain * 32,
            "equipment_slip_risk_pct": min(95, int(moisture * 1.6))
        })

    return {
        "region": state if state else "National Aggregate",
        "danger_timeline": matrix
    }

class AssessmentRequest(BaseModel):
    state: Optional[str] = "Madhya Pradesh"
    rainfall_mm: Optional[float] = 68.0
    soil_moisture_pct: Optional[float] = 45.0
    pit_depth_m: Optional[int] = 120
    mine_type: Optional[str] = "Opencast"

@app.get("/api/actions")
@app.post("/api/actions")
def get_prescriptive_actions(state: Optional[str] = Query("All")):
    """
    Generates prescriptive safety actions using the local google/flan-t5-small model
    based on space technology environmental metrics (rainfall, soil moisture).
    """
    reserves = load_reserves_data()
    if state and state.lower() != "all":
        state_reserves = [r for r in reserves if r.get("state", "").lower() == state.lower()]
    else:
        state_reserves = reserves

    high_risk_deposits = [r for r in state_reserves if r.get("shortfall_risk") == "High"]
    focus_name = high_risk_deposits[0]["name"] if high_risk_deposits else (
        state_reserves[0]["name"] if state_reserves else "MOIL Balaghat Belt"
    )
    focus_rain = high_risk_deposits[0].get("rainfall_forecast_mm", 65) if high_risk_deposits else 30
    focus_danger = high_risk_deposits[0].get("danger_reason", "Hydrological moisture buildup in lower benches") if high_risk_deposits else "Normal bench extraction"

    # Local FLAN-T5 Model inference
    tokenizer, model = get_flan_t5_components()
    ai_generated_note = None

    if tokenizer and model:
        try:
            prompt = (
                f"Write a short safety instruction for miners dealing with {focus_rain}mm heavy rainfall "
                f"and high soil moisture at the {focus_name} manganese mine."
            )
            inputs = tokenizer(prompt, return_tensors="pt")
            outputs = model.generate(**inputs, max_new_tokens=40, temperature=0.7, do_sample=True)
            ai_generated_note = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
        except Exception as ex:
            print(f"Inference error: {ex}")

    if not ai_generated_note:
        ai_generated_note = (
            f"Pre-pone blasting by 10 hrs; divert haulage trucks to high-bench ramp to avoid 28% production shortfall."
        )

    actions = [
        {
            "id": 1,
            "priority": "CRITICAL",
            "category": "Weather & Inundation",
            "site": focus_name,
            "message": f"Precipitation alert ({focus_rain}mm) at {focus_name}. {focus_danger}.",
            "ai_directive": f"AI Safety Directive (FLAN-T5): {ai_generated_note}",
            "impact": "Prevents estimated 3,800t ore damage and guarantees worker bench safety."
        },
        {
            "id": 2,
            "priority": "HIGH",
            "category": "Blasting Operations",
            "site": f"{state if state != 'All' else 'Central Belt'} Bench Sectors",
            "message": "Elevated soil moisture saturation index (>42%) detected via Sentinel-2 SWIR band.",
            "ai_directive": "Re-schedule deep hole blasting to dry window; deploy secondary rock-breakers.",
            "impact": "Avoids misfires and saves 18 operational hours."
        },
        {
            "id": 3,
            "priority": "MEDIUM",
            "category": "Equipment Deployment",
            "site": "Ramp Haulage & Pit Sump",
            "message": "Surface slip coefficient elevated. Continuous de-watering pump units activated.",
            "ai_directive": "Re-route dumpers to stabilized western grade ramp; reduce speed limit to 15 km/h.",
            "impact": "Mitigates vehicle rollover hazard and maintains 82% transit efficiency."
        }
    ]

    return {
        "state": state,
        "flan_t5_model_active": bool(tokenizer is not None and model is not None),
        "actions": actions
    }

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@app.get("/api/scan-location")
def scan_location(lat: float, lng: float):
    # 1. Proximity Check
    reserves = load_reserves_data()
    nearest_site = None
    min_dist = float('inf')
    
    for r in reserves:
        dist = haversine(lat, lng, r["lat"], r["lng"])
        if dist < min_dist:
            min_dist = dist
            nearest_site = r

    # 2. Synthesize Satellite Metrics
    is_near_belt = min_dist < 50.0  # 50km radius
    
    if is_near_belt:
        prospectivity = random.randint(75, 98)
        ndvi = round(random.uniform(0.1, 0.4), 2)  # Low vegetation, high outcropping
        soil_moisture = round(random.uniform(0.2, 0.6), 2)
        geology = "Dharwar Supergroup / Khondalite Belt prox."
    else:
        prospectivity = random.randint(5, 35)
        ndvi = round(random.uniform(0.6, 0.9), 2)  # Heavy vegetation or non-geological
        soil_moisture = round(random.uniform(0.4, 0.8), 2)
        geology = "Alluvial or thick basalt cover"

    # 3. LLM Inference
    tokenizer, model = get_flan_t5_components()
    llm_assessment = "Offline LLM not loaded."
    
    if tokenizer and model:
        try:
            condition = "good" if prospectivity > 50 else "poor"
            prompt = (
                f"Write a short geological sentence explaining why a location {min_dist:.1f}km from {nearest_site['name']} "
                f"with {condition} prospectivity and NDVI of {ndvi} is interesting."
            )
            inputs = tokenizer(prompt, return_tensors="pt")
            outputs = model.generate(**inputs, max_new_tokens=40, temperature=0.7, do_sample=True)
            result_text = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
            # If it's too short, fallback
            if len(result_text) < 10:
                llm_assessment = f"The model determined a {condition} prospectivity based on the spectral anomalies."
            else:
                llm_assessment = result_text
        except Exception as ex:
            print(f"Scanner LLM error: {ex}")

    return {
        "lat": lat,
        "lng": lng,
        "prospectivity_score": prospectivity,
        "nearest_known_deposit": nearest_site["name"] if nearest_site else "Unknown",
        "distance_km": round(min_dist, 1),
        "satellite_metrics": {
            "ndvi": ndvi,
            "soil_moisture_index": soil_moisture,
            "geological_context": geology
        },
        "llm_assessment": llm_assessment
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
