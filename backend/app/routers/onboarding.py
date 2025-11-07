from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import OnboardingSubmission, PersonaResponse
from ..auth import get_current_user
from ..onboarding import classify_persona, get_questionnaire

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.get("/questionnaire")
def get_onboarding_questionnaire():
    """Get the onboarding questionnaire."""
    return {"questions": get_questionnaire()}


@router.post("/submit", response_model=PersonaResponse)
def submit_onboarding(
    submission: OnboardingSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit onboarding answers and get persona classification.

    This endpoint:
    1. Calculates risk score from answers
    2. Classifies user into Persona A, B, or C
    3. Updates user record with assigned persona
    4. Returns persona with confidence and reasoning
    """
    # Validate we have all 10 answers
    if len(submission.answers) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected 10 answers, received {len(submission.answers)}"
        )

    # Classify persona
    result = classify_persona(submission.answers)

    # Update user with persona
    current_user.persona = result["persona"]
    db.commit()
    db.refresh(current_user)

    return PersonaResponse(
        persona=result["persona"],
        confidence=result["confidence"],
        reasoning=result["reasoning"]
    )


@router.get("/persona", response_model=PersonaResponse)
def get_user_persona(current_user: User = Depends(get_current_user)):
    """Get the current user's persona classification."""
    if not current_user.persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has not completed onboarding"
        )

    return PersonaResponse(
        persona=current_user.persona,
        confidence=1.0,
        reasoning="Previously classified persona"
    )
