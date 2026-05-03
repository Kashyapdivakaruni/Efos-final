import json
import httpx

OLLAMA_BASE = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2"


async def is_ollama_available() -> bool:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_BASE}/api/tags")
            return r.status_code == 200
    except Exception:
        return False


async def extract_metrics_from_text(text: str) -> dict:
    prompt = f"""Extract medical metrics from the following lab report or medical document. 
Return ONLY a valid JSON object with these exact keys if found (use null if not found):
"bp_systolic" (int), "bp_diastolic" (int), "heart_rate" (int), "glucose" (float), "cholesterol" (float), "weight" (float), "spo2" (float).

Document Text:
{text[:2000]}
"""
    if await is_ollama_available():
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{OLLAMA_BASE}/api/generate",
                    json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": "json"}
                )
                if response.status_code == 200:
                    return json.loads(response.json().get("response", "{}"))
        except Exception as e:
            print(f"Ollama extraction error: {e}")
    
    return {}



async def generate_health_report(patient: dict, checkin: dict, risks: dict, shap_json: str, language: str = "English") -> str:
    shap_data = json.loads(shap_json) if isinstance(shap_json, str) else shap_json

    top_drivers = []
    for disease, factors in shap_data.items():
        for feat, val in factors[:2]:
            top_drivers.append(f"{feat.replace('_', ' ')} (impact: {val:+.1f}%)")

    prompt = f"""You are a compassionate AI health assistant. Write a 3-paragraph personalised health report for a patient.

Patient Profile:
- Name: {patient.get('name', 'Patient')}
- Age: {patient.get('age', 40)}, Gender: {patient.get('gender', 'M')}
- Smoker: {patient.get('smoker', False)}, Family history diabetes: {patient.get('family_history_diabetes', False)}

Today's Vitals:
- Blood Pressure: {checkin.get('bp_systolic', 120)}/{checkin.get('bp_diastolic', 80)} mmHg
- Weight: {checkin.get('weight', 70)} kg
- Sleep: {checkin.get('sleep_hours', 7)} hours
- Mood: {checkin.get('mood', 7)}/10
- SpO2: {checkin.get('spo2', 97)}%
- Heart Rate: {checkin.get('heart_rate', 75)} bpm

Risk Scores Today:
- Diabetes Risk: {risks.get('diabetes_risk', 0):.0f}%
- Cardiac Risk: {risks.get('cardiac_risk', 0):.0f}%
- Hypertension Risk: {risks.get('hypertension_risk', 0):.0f}%
- Metabolic Risk: {risks.get('metabolic_risk', 0):.0f}%

Top Risk Drivers (from AI analysis):
{chr(10).join(f'- {d}' for d in top_drivers[:5])}

Write exactly 3 paragraphs:
1. What your health looks like today (specific to their numbers, encouraging tone)
2. The key risk drivers and why they matter for this patient specifically
3. Personalised actions for today — concrete, specific, achievable

Use plain language. No jargon. No bullet points. Be warm and direct.
IMPORTANT: You MUST respond entirely in the {language} language. Translate medical terms accurately or transliterate them clearly."""

    if await is_ollama_available():
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{OLLAMA_BASE}/api/generate",
                    json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
                )
                if response.status_code == 200:
                    return response.json().get("response", "").strip()
        except Exception as e:
            print(f"Ollama error: {e}")

    return _template_report(patient, checkin, risks)


async def chat_with_patient(patient: dict, checkin: dict, risks: dict, shap_json: str, user_message: str, language: str = "English") -> str:
    system_context = f"""You are a personal AI health assistant for {patient.get('name', 'the patient')}.
You have full access to their health data:
- Today's BP: {checkin.get('bp_systolic', 120)}/{checkin.get('bp_diastolic', 80)} mmHg
- Sleep: {checkin.get('sleep_hours', 7)} hours | Mood: {checkin.get('mood', 7)}/10
- Cardiac Risk: {risks.get('cardiac_risk', 0):.0f}% | Diabetes Risk: {risks.get('diabetes_risk', 0):.0f}%
- Hypertension Risk: {risks.get('hypertension_risk', 0):.0f}% | Metabolic Risk: {risks.get('metabolic_risk', 0):.0f}%

IMPORTANT EDGE CASE RULES:
1. If the user mentions severe symptoms (chest pain, shortness of breath, severe headache, sudden numbness), IMMEDIATELY advise them to call 911 or visit the emergency room. Do not diagnose.
2. If risk is high (e.g., >40%) and they ask about it, calmly suggest they consult a doctor and let them know they can book an appointment here. Use supportive language to avoid causing panic or tension.
Answer questions using their actual data. Be warm, specific, and medically responsible.
IMPORTANT: You MUST respond entirely in the {language} language."""

    prompt = f"{system_context}\n\nPatient asks: {user_message}\n\nAnswer:"

    if await is_ollama_available():
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    f"{OLLAMA_BASE}/api/generate",
                    json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
                )
                if response.status_code == 200:
                    return response.json().get("response", "").strip()
        except Exception as e:
            print(f"Ollama chat error: {e}")

    return _template_chat_response(user_message, risks)


def _template_report(patient: dict, checkin: dict, risks: dict) -> str:
    name = patient.get('name', 'there').split()[0]
    bp_s = checkin.get('bp_systolic', 120)
    cardiac = risks.get('cardiac_risk', 0)
    diabetes = risks.get('diabetes_risk', 0)

    bp_comment = "within the normal range" if bp_s < 130 else ("mildly elevated" if bp_s < 150 else "significantly elevated and needs attention")
    p1 = f"Hi {name}, your health check-in today shows your blood pressure is {bp_comment} at {bp_s}/{checkin.get('bp_diastolic', 80)} mmHg. Your SpO2 of {checkin.get('spo2', 97):.0f}% is healthy and your mood score of {checkin.get('mood', 7)}/10 tells us how you're feeling overall."

    risk_comment = "Your cardiac risk" if cardiac > diabetes else "Your diabetes risk"
    high_risk = max(cardiac, diabetes)
    p2 = f"{risk_comment} is currently at {high_risk:.0f}%. Your sleep of {checkin.get('sleep_hours', 7)} hours is a key driver — poor sleep directly raises cardiovascular and metabolic risk. Your age, family history, and BP pattern are also contributing factors our AI has identified."

    action = "Focus on rest and avoiding stress today." if bp_s > 140 else "A gentle 20-minute walk today would be ideal."
    p3 = f"For today: {action} Aim for 7–8 hours of sleep tonight. Drink 8 glasses of water and avoid high-sodium processed foods. Your doctor has been updated on your latest readings. Keep tracking — consistency is the most powerful medicine."

    return f"{p1}\n\n{p2}\n\n{p3}"


def _template_chat_response(message: str, risks: dict) -> str:
    msg = message.lower()
    cardiac = risks.get('cardiac_risk', 0)
    diabetes = risks.get('diabetes_risk', 0)

    if "chest pain" in msg or "shortness of breath" in msg or "emergency" in msg:
        return "⚠️ MEDICAL EMERGENCY: Please call 911 or go to the nearest emergency room immediately. Do not wait."
    elif "cardiac" in msg or "heart" in msg:
        return f"Your cardiac risk today is {cardiac:.0f}%. We recommend managing your blood pressure and consulting a Cardiologist. You can book an appointment via the dashboard."
    elif "diabetes" in msg or "sugar" in msg or "glucose" in msg:
        return f"Your diabetes risk is currently {diabetes:.0f}%. Consider a consultation with a Diabetologist if your numbers remain elevated. You can easily book a specialist here."
    elif "sleep" in msg:
        return "Sleep is one of the most powerful levers for your health. Poor sleep (under 6 hours) directly raises cardiac and metabolic risk. Tonight, aim for 7–8 hours — avoid screens 1 hour before bed."
    elif "bp" in msg or "blood pressure" in msg:
        return "Blood pressure is a critical daily metric. Elevated BP strains your heart and kidneys. Reduce sodium, stay hydrated, avoid caffeine, and practice deep breathing for 5 minutes."
    else:
        return f"Based on your health profile, your key focus areas today are managing your BP and ensuring adequate sleep. Your overall risk scores are: Cardiac {cardiac:.0f}%, Diabetes {diabetes:.0f}%. If you're feeling unwell, you can find recommended doctors on your dashboard."


async def recommend_doctor(patient: dict, history: list) -> dict:
    # History contains the last few checkins/risks
    history_str = json.dumps(history, default=str)
    
    prompt = f"""You are an AI triage assistant for a healthcare platform.
Analyze the patient's recent health history to determine if they need to see a doctor.

Patient Profile:
Name: {patient.get('name')}
Age: {patient.get('age')}, Gender: {patient.get('gender')}

Recent Health History (Last few check-ins):
{history_str}

Tasks:
1. Determine if the patient's vitals (BP, Heart Rate, Glucose) or Risk Scores (Cardiac, Diabetes) are concerning enough to warrant a doctor's visit.
2. If ALL vitals and risks are normal or stable, set "needs_doctor" to false.
3. If abnormal, set "needs_doctor" to true, identify the "specialty" needed (e.g. "Cardiologist", "Diabetologist", "General Physician"), and write a short, reassuring "reason" (e.g., "Based on your recent BP spikes, I recommend consulting a Cardiologist for a routine check.").

Return ONLY valid JSON with this exact schema:
{{
  "needs_doctor": boolean,
  "specialty": string | null,
  "reason": string | null
}}
"""
    if await is_ollama_available():
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    f"{OLLAMA_BASE}/api/generate",
                    json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": "json"}
                )
                if response.status_code == 200:
                    return json.loads(response.json().get("response", "{}"))
        except Exception as e:
            print(f"Ollama recommend_doctor error: {e}")

    # Fallback rules
    if not history:
        return {"needs_doctor": False, "specialty": None, "reason": None}
        
    latest = history[0]
    bp_s = latest.get("bp_systolic", 120)
    cardiac = latest.get("cardiac_risk", 0)
    diabetes = latest.get("diabetes_risk", 0)

    if cardiac > 50 or bp_s > 140:
        return {"needs_doctor": True, "specialty": "Cardiologist", "reason": "Your recent blood pressure and cardiac risk indicators suggest a consultation with a Cardiologist would be beneficial."}
    elif diabetes > 50:
        return {"needs_doctor": True, "specialty": "Diabetologist", "reason": "Your diabetes risk indicators are elevated. A consultation with a Diabetologist is recommended."}
    
    return {"needs_doctor": False, "specialty": None, "reason": None}
