"""
RAG (Retrieval-Augmented Generation) system for Persona C.

This module provides:
- Document ingestion into Chroma vector store
- Semantic search for relevant research
- Context-aware query responses
"""

import os
from typing import List, Dict, Optional
import chromadb
from chromadb.config import Settings

CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")

# Initialize Chroma client
chroma_client = chromadb.Client(Settings(
    persist_directory=CHROMA_PERSIST_DIRECTORY,
    anonymized_telemetry=False
))

# Get or create collection
collection = chroma_client.get_or_create_collection(
    name="research_documents",
    metadata={"description": "Investment research documents for RAG"}
)


def ingest_document(doc_id: int, title: str, content: str, category: Optional[str] = None):
    """
    Ingest a document into the vector store.

    Args:
        doc_id: Database document ID
        title: Document title
        content: Document content (will be chunked)
        category: Optional category for filtering
    """
    # Chunk content into smaller pieces (simplified - would use better chunking in production)
    chunks = _chunk_text(content, chunk_size=500, overlap=50)

    # Prepare data for Chroma
    ids = [f"doc_{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "doc_id": doc_id,
            "title": title,
            "category": category or "general",
            "chunk_index": i,
            "total_chunks": len(chunks)
        }
        for i in range(len(chunks))
    ]

    # Add to collection
    collection.add(
        ids=ids,
        documents=chunks,
        metadatas=metadatas
    )


def search_documents(query: str, n_results: int = 5) -> List[Dict]:
    """
    Search for relevant documents using semantic similarity.

    Args:
        query: User query
        n_results: Number of results to return

    Returns:
        List of relevant document chunks with metadata and relevance scores
    """
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )

    # Format results
    formatted_results = []
    if results['ids'] and len(results['ids'][0]) > 0:
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                "document_id": results['metadatas'][0][i]['doc_id'],
                "title": results['metadatas'][0][i]['title'],
                "excerpt": results['documents'][0][i],
                "category": results['metadatas'][0][i]['category'],
                "relevance_score": 1.0 - results['distances'][0][i] if results.get('distances') else 0.5
            })

    return formatted_results


def generate_rag_response(query: str, context: Optional[str] = None) -> Dict:
    """
    Generate a RAG response with source citations.

    Args:
        query: User investment question
        context: Optional additional context

    Returns:
        Dict with answer, sources, and confidence
    """
    # Search for relevant documents
    relevant_docs = search_documents(query, n_results=3)

    if not relevant_docs:
        return {
            "answer": "I don't have enough research documents to answer this question confidently. Please try a different query or add more research documents.",
            "sources": [],
            "confidence": 0.0
        }

    # Build context from relevant docs
    context_text = "\n\n".join([
        f"[{doc['title']}]: {doc['excerpt']}"
        for doc in relevant_docs
    ])

    # Generate answer (simplified - would use LLM in production)
    answer = _generate_answer_from_context(query, context_text, context)

    # Calculate confidence based on relevance scores
    avg_relevance = sum(doc['relevance_score'] for doc in relevant_docs) / len(relevant_docs)
    confidence = min(0.95, avg_relevance)

    return {
        "answer": answer,
        "sources": [
            {
                "document_id": doc["document_id"],
                "title": doc["title"],
                "excerpt": doc["excerpt"][:200] + "..." if len(doc["excerpt"]) > 200 else doc["excerpt"],
                "relevance_score": round(doc["relevance_score"], 2)
            }
            for doc in relevant_docs
        ],
        "confidence": round(confidence, 2)
    }


def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Split text into overlapping chunks.

    Args:
        text: Text to chunk
        chunk_size: Size of each chunk in characters
        overlap: Overlap between chunks

    Returns:
        List of text chunks
    """
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        # Try to break at sentence boundary
        if end < len(text):
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)

            if break_point > chunk_size // 2:  # Only break if it's reasonable
                chunk = chunk[:break_point + 1]
                end = start + break_point + 1

        chunks.append(chunk.strip())
        start = end - overlap

    return [c for c in chunks if c]  # Remove empty chunks


def _generate_answer_from_context(query: str, context: str, user_context: Optional[str]) -> str:
    """
    Generate answer from context (simplified version).

    In production, this would use an LLM like GPT-4 or Claude.
    For MVP, we return a summary of the context.

    Args:
        query: User question
        context: Retrieved context from documents
        user_context: Additional user-provided context

    Returns:
        Generated answer
    """
    # Simplified response - in production, would call LLM API
    answer = f"Based on the research documents, here's what I found regarding '{query}':\n\n"

    # Extract key points from context
    lines = context.split('\n')
    relevant_lines = [line for line in lines if line.strip() and not line.startswith('[')][:5]

    answer += "\n".join(f"• {line.strip()}" for line in relevant_lines)

    answer += "\n\nNote: This is a simplified response. In production, this would provide more comprehensive analysis using AI."

    return answer


def delete_document(doc_id: int):
    """
    Delete all chunks of a document from the vector store.

    Args:
        doc_id: Database document ID
    """
    # Query for all chunks of this document
    results = collection.get(
        where={"doc_id": doc_id}
    )

    if results['ids']:
        collection.delete(ids=results['ids'])


def get_collection_stats() -> Dict:
    """
    Get statistics about the vector store.

    Returns:
        Dict with document count and collection info
    """
    count = collection.count()

    return {
        "total_chunks": count,
        "collection_name": collection.name,
        "persist_directory": CHROMA_PERSIST_DIRECTORY
    }
