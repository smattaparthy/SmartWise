from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, ResearchDoc
from ..schemas import RAGQuery, RAGResponse, RAGSource, ResearchDocument
from ..auth import get_current_user
from ..rag import generate_rag_response, ingest_document, get_collection_stats

router = APIRouter(prefix="/rag", tags=["RAG System"])


@router.post("/query", response_model=RAGResponse)
def query_research(
    query_data: RAGQuery,
    current_user: User = Depends(get_current_user)
):
    """
    Ask an investment question and get RAG-powered answer with sources.

    This endpoint:
    1. Performs semantic search on research documents
    2. Retrieves relevant context
    3. Generates answer with source citations
    4. Returns confidence score

    Only available for Persona C (Moonshot) users.
    """
    if current_user.persona != "C":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="RAG queries are only available for Persona C users"
        )

    if not query_data.question or len(query_data.question.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question must be at least 5 characters"
        )

    try:
        result = generate_rag_response(
            query=query_data.question,
            context=query_data.context
        )

        return RAGResponse(
            answer=result["answer"],
            sources=[RAGSource(**source) for source in result["sources"]],
            confidence=result["confidence"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing query: {str(e)}"
        )


@router.get("/documents", response_model=List[ResearchDocument])
def list_research_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all available research documents.

    Returns list of documents with metadata.
    """
    documents = db.query(ResearchDoc).order_by(ResearchDoc.created_at.desc()).all()
    return documents


@router.get("/stats")
def get_rag_stats(current_user: User = Depends(get_current_user)):
    """
    Get RAG system statistics.

    Returns information about the vector store and document count.
    """
    stats = get_collection_stats()
    return stats
