"""
LLM Service for AI-powered portfolio rebalancing suggestions.

This module handles interactions with Anthropic Claude to generate
intelligent, contextual reasoning for rebalancing recommendations.
"""

import os
from typing import Dict, Optional
from anthropic import Anthropic
import logging

logger = logging.getLogger(__name__)


class LLMService:
    """Service for generating AI-powered rebalancing reasoning."""

    def __init__(self):
        """Initialize the Anthropic client."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("ANTHROPIC_API_KEY not set. AI features will be disabled.")
            self.client = None
        else:
            self.client = Anthropic(api_key=api_key)

        # Simple in-memory cache for responses (could be enhanced with Redis/etc)
        self._cache = {}

    def _get_portfolio_complexity(self, total_holdings: int) -> str:
        """
        Determine portfolio complexity level.

        Args:
            total_holdings: Number of holdings in portfolio

        Returns:
            Complexity level: "simple", "medium", or "complex"
        """
        if total_holdings <= 5:
            return "simple"
        elif total_holdings <= 15:
            return "medium"
        else:
            return "complex"

    def _get_detail_level(self, complexity: str) -> str:
        """
        Get detail level instruction based on complexity.

        Args:
            complexity: Portfolio complexity level

        Returns:
            Detail level instruction for prompt
        """
        detail_map = {
            "simple": "concise (50-100 words)",
            "medium": "balanced (100-150 words)",
            "complex": "comprehensive (150-300 words)"
        }
        return detail_map.get(complexity, "balanced (100-150 words)")

    def _build_prompt(
        self,
        holding: Dict,
        recommendation: Dict,
        model_type: str,
        portfolio_context: Dict
    ) -> str:
        """
        Build the prompt for Claude based on portfolio context.

        Args:
            holding: Current holding information
            recommendation: Recommendation details
            portfolio_context: Portfolio metadata

        Returns:
            Formatted prompt string
        """
        complexity = self._get_portfolio_complexity(portfolio_context["total_holdings"])
        detail_level = self._get_detail_level(complexity)

        # Build concentrated sectors string
        concentrated_str = ", ".join(portfolio_context["concentrated_sectors"]) if portfolio_context["concentrated_sectors"] else "None"

        prompt = f"""You are a professional financial advisor helping with portfolio rebalancing.

Current Portfolio Context:
- Total Value: ${portfolio_context['total_value']:,.2f}
- Number of Holdings: {portfolio_context['total_holdings']}
- Diversification Score: {portfolio_context['diversification_score']:.2f}/1.0
- Concentrated Sectors (>30%): {concentrated_str}
- Target Model: {model_type.capitalize()}

Rebalancing Recommendation:
- Action: {recommendation['action'].upper()} {recommendation['shares']} shares of {recommendation['ticker']}
- Sector: {recommendation['sector']}
- Current {recommendation['sector']} Allocation: {recommendation['current_percentage']:.1f}%
- Target {recommendation['sector']} Allocation: {recommendation['target_percentage']:.1f}%
- Transaction Amount: ${recommendation['amount']:,.2f}

Please provide a {detail_level} explanation for why this rebalancing recommendation makes sense. Focus on:

1. Why this allocation adjustment improves the portfolio
2. How it addresses risk management (concentration, diversification)
3. How it aligns with the {model_type} investment strategy

Be professional, clear, and actionable. Do not include disclaimers or legal warnings. Just provide the investment reasoning."""

        return prompt

    def generate_rebalancing_reasoning(
        self,
        holding: Dict,
        recommendation: Dict,
        model_type: str,
        portfolio_context: Dict
    ) -> Optional[str]:
        """
        Generate AI-powered reasoning for a rebalancing recommendation.

        Args:
            holding: Current holding info (ticker, shares, value, sector)
            recommendation: Suggested action (buy/sell, shares, target allocation)
            model_type: Portfolio model (conservative/balanced/growth)
            portfolio_context: {
                'total_holdings': int,
                'diversification_score': float,
                'concentrated_sectors': List[str],
                'total_value': float
            }

        Returns:
            AI-generated reasoning string, or None if generation fails
        """
        if not self.client:
            logger.debug("Anthropic client not initialized. Skipping AI generation.")
            return None

        try:
            # Build cache key
            cache_key = (
                f"{recommendation['ticker']}_{recommendation['action']}_"
                f"{recommendation['shares']}_{model_type}"
            )

            # Check cache
            if cache_key in self._cache:
                logger.debug(f"Cache hit for {cache_key}")
                return self._cache[cache_key]

            # Build prompt
            prompt = self._build_prompt(holding, recommendation, model_type, portfolio_context)

            # Call Claude
            logger.info(f"Generating AI reasoning for {recommendation['ticker']}")
            message = self.client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=500,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Extract response
            reasoning = message.content[0].text.strip()

            # Cache the response
            self._cache[cache_key] = reasoning

            logger.info(f"Successfully generated AI reasoning for {recommendation['ticker']}")
            return reasoning

        except Exception as e:
            logger.error(f"Error generating AI reasoning: {str(e)}", exc_info=True)
            return None

    def clear_cache(self):
        """Clear the response cache."""
        self._cache.clear()
        logger.info("LLM cache cleared")


# Global LLM service instance
_llm_service = None


def get_llm_service() -> LLMService:
    """
    Get or create the global LLM service instance.

    Returns:
        LLMService instance
    """
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
