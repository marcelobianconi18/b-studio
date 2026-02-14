import os
import logging
from typing import Dict, Any, Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_community.chat_models import ChatOllama
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# 1. Define the desired output structure (Type-safe)
class CommentAnalysis(BaseModel):
    sentiment: str = Field(description="positive, negative, or neutral")
    intent: str = Field(description="sales_lead, customer_support, spam, or other. 'sales_lead' for purchase intent, 'customer_support' for questions/problems.")
    suggested_reply: str = Field(description="A short, polite, and engaging reply in Portuguese (BR).")
    priority_score: int = Field(description="1 to 10, where 10 is an urgent sales opportunity or critical complaint.")

class InteractionsAI:
    """
    AI Service for analyzing social media interactions using LangChain.
    """
    def __init__(self):
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = os.getenv("BIA_AI_MODEL", "qwen2.5-coder:7b")
        
        logger.info(f"Initializing InteractionsAI with Local Ollama ({self.model_name})")
        # Enforce Open Source Qwen2.5
        self.llm = ChatOllama(model=self.model_name, base_url=self.ollama_base_url, temperature=0)

        # Initialize Parser
        self.parser = JsonOutputParser(pydantic_object=CommentAnalysis)

        # Define Prompt Template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "Você é o assistente de triagem de mídia social do B-Studio. Analise o comentário recebido com precisão. Responda APENAS em JSON."),
            ("user", "Comentário: {comment_text}\nContexto do Post: {post_context}\n\n{format_instructions}")
        ])

        # Create Chain
        self.analysis_chain = self.prompt | self.llm | self.parser

    async def analyze_interaction(self, comment_text: str, post_context: str = "Post genérico") -> Dict[str, Any]:
        """
        Analyzes a comment using the LangChain pipeline.
        Returns a dict with sentiment, intent, suggested_reply, and priority_score.
        """
        try:
            logger.info(f"Analyzing comment: {comment_text[:50]}...")
            result = await self.analysis_chain.ainvoke({
                "comment_text": comment_text,
                "post_context": post_context,
                "format_instructions": self.parser.get_format_instructions()
            })
            return result
        except Exception as e:
            logger.error(f"Error in AI analysis: {e}")
            # Fallback logic in case of AI failure
            return {
                "sentiment": "neutral",
                "intent": "other",
                "suggested_reply": "",
                "priority_score": 0,
                "error": str(e)
            }

# Singleton instance
interactions_ai_service = InteractionsAI()
