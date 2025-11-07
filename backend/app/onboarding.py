"""
Onboarding questionnaire and persona classification logic.

Persona Classification:
- Persona A (Starter): Low risk tolerance, beginner, wants simple index funds
- Persona B (Rebalance): Moderate risk, has portfolio, wants analysis and rebalancing
- Persona C (Moonshot): High risk tolerance, wants growth ideas and research
"""

from typing import Dict, List
from .schemas import OnboardingAnswer

# Questionnaire with scoring weights
QUESTIONNAIRE = [
    {
        "id": 1,
        "question": "What is your investment experience level?",
        "options": {
            "beginner": {"text": "Beginner - I'm just starting out", "risk_score": 1},
            "intermediate": {"text": "Intermediate - I have some experience", "risk_score": 3},
            "advanced": {"text": "Advanced - I'm very experienced", "risk_score": 5}
        }
    },
    {
        "id": 2,
        "question": "Do you currently have an investment portfolio?",
        "options": {
            "no": {"text": "No, I'm starting fresh", "risk_score": 1},
            "small": {"text": "Yes, a small portfolio", "risk_score": 3},
            "substantial": {"text": "Yes, a substantial portfolio", "risk_score": 4}
        }
    },
    {
        "id": 3,
        "question": "What is your risk tolerance?",
        "options": {
            "low": {"text": "Low - I prefer stable, safe investments", "risk_score": 1},
            "moderate": {"text": "Moderate - Balanced approach", "risk_score": 3},
            "high": {"text": "High - I'm comfortable with volatility", "risk_score": 5}
        }
    },
    {
        "id": 4,
        "question": "What is your primary investment goal?",
        "options": {
            "preservation": {"text": "Capital preservation", "risk_score": 1},
            "growth": {"text": "Long-term growth", "risk_score": 3},
            "aggressive": {"text": "Aggressive growth", "risk_score": 5}
        }
    },
    {
        "id": 5,
        "question": "How much time do you want to spend managing investments?",
        "options": {
            "minimal": {"text": "Minimal - Set and forget", "risk_score": 1},
            "moderate": {"text": "Moderate - Periodic reviews", "risk_score": 3},
            "active": {"text": "Active - Regular monitoring", "risk_score": 4}
        }
    },
    {
        "id": 6,
        "question": "What is your investment time horizon?",
        "options": {
            "short": {"text": "Short-term (< 3 years)", "risk_score": 1},
            "medium": {"text": "Medium-term (3-10 years)", "risk_score": 3},
            "long": {"text": "Long-term (10+ years)", "risk_score": 5}
        }
    },
    {
        "id": 7,
        "question": "How do you react to market downturns?",
        "options": {
            "panic": {"text": "I get nervous and want to sell", "risk_score": 1},
            "concerned": {"text": "I'm concerned but stay the course", "risk_score": 3},
            "opportunity": {"text": "I see it as a buying opportunity", "risk_score": 5}
        }
    },
    {
        "id": 8,
        "question": "What type of investment advice are you seeking?",
        "options": {
            "simple": {"text": "Simple recommendations (e.g., index funds)", "risk_score": 1},
            "analysis": {"text": "Portfolio analysis and rebalancing", "risk_score": 3},
            "ideas": {"text": "Growth ideas and research", "risk_score": 5}
        }
    },
    {
        "id": 9,
        "question": "How important is diversification to you?",
        "options": {
            "critical": {"text": "Critical - I want maximum diversification", "risk_score": 2},
            "important": {"text": "Important - Balanced diversification", "risk_score": 3},
            "flexible": {"text": "Flexible - Willing to concentrate", "risk_score": 4}
        }
    },
    {
        "id": 10,
        "question": "What is your age range?",
        "options": {
            "young": {"text": "Under 30", "risk_score": 5},
            "middle": {"text": "30-50", "risk_score": 3},
            "older": {"text": "Over 50", "risk_score": 2}
        }
    }
]


def calculate_risk_score(answers: List[OnboardingAnswer]) -> int:
    """Calculate total risk score from questionnaire answers."""
    total_score = 0

    for answer in answers:
        # Find the question
        question = next((q for q in QUESTIONNAIRE if q["id"] == answer.question_id), None)
        if not question:
            continue

        # Get the risk score for the selected option
        option = question["options"].get(answer.answer)
        if option:
            total_score += option["risk_score"]

    return total_score


def classify_persona(answers: List[OnboardingAnswer]) -> Dict[str, any]:
    """
    Classify user into persona based on answers.

    Scoring logic:
    - Total score range: 10-50
    - Persona A (Starter): score <= 20
    - Persona B (Rebalance): 21 <= score <= 35
    - Persona C (Moonshot): score >= 36

    Additional factors:
    - Q2 (has portfolio) influences B vs A/C
    - Q8 (advice type) is weighted heavily
    """
    risk_score = calculate_risk_score(answers)

    # Get specific answers for additional context
    has_portfolio = next((a.answer for a in answers if a.question_id == 2), None)
    advice_type = next((a.answer for a in answers if a.question_id == 8), None)

    # Classification logic
    if advice_type == "simple" or risk_score <= 20:
        persona = "A"
        reasoning = "Low risk tolerance and preference for simple index fund recommendations."
    elif advice_type == "analysis" or (has_portfolio in ["small", "substantial"] and 21 <= risk_score <= 35):
        persona = "B"
        reasoning = "Existing portfolio with moderate risk tolerance seeking analysis and rebalancing."
    elif advice_type == "ideas" or risk_score >= 36:
        persona = "C"
        reasoning = "High risk tolerance seeking aggressive growth ideas and research-backed opportunities."
    else:
        # Default based on score
        if risk_score <= 20:
            persona = "A"
            reasoning = "Conservative risk profile suitable for starter guidance."
        elif risk_score <= 35:
            persona = "B"
            reasoning = "Moderate risk profile with portfolio management needs."
        else:
            persona = "C"
            reasoning = "Aggressive risk profile seeking high-growth opportunities."

    # Calculate confidence based on answer consistency
    confidence = min(0.95, 0.6 + (abs(risk_score - 25) / 50))

    return {
        "persona": persona,
        "risk_score": risk_score,
        "confidence": round(confidence, 2),
        "reasoning": reasoning
    }


def get_questionnaire():
    """Get the full questionnaire for the frontend."""
    return [
        {
            "id": q["id"],
            "question": q["question"],
            "options": [
                {"value": key, "text": value["text"]}
                for key, value in q["options"].items()
            ]
        }
        for q in QUESTIONNAIRE
    ]
