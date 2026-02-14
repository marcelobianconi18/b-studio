import os
import logging
from typing import List, Dict, Any

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

class CreativeSearchService:
    """
    Semantic Search Engine for Ad Creatives.
    Uses ChromaDB (Local Vector Store) and Ollama Embeddings (nomic-embed-text).
    """

    def __init__(self):
        self.persist_directory = "./data/chroma_db"
        self.collection_name = "ad_creatives_v1"
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = "nomic-embed-text"  # Best open source embedding model
        
        logger.info(f"Initializing CreativeSearchService with {self.model_name}...")
        
        try:
            self.embeddings = OllamaEmbeddings(
                base_url=self.ollama_base_url,
                model=self.model_name
            )
            
            self.vector_store = Chroma(
                collection_name=self.collection_name,
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory
            )
            logger.info("ChromaDB initialized successfully.")
            
        except Exception as e:
            logger.error(f"Failed to initialize Vector Store: {e}")
            self.vector_store = None

    def index_creative(self, creative_id: str, description: str, metadata: Dict[str, Any] = None):
        """
        Adds a creative to the vector index.
        """
        if not self.vector_store:
            logger.warning("Vector Store not initialized. Skipping indexing.")
            return

        try:
            # Metadata must be simple types for Chroma
            safe_metadata = metadata or {}
            safe_metadata["creative_id"] = creative_id
            
            doc = Document(
                page_content=description,
                metadata=safe_metadata
            )
            
            self.vector_store.add_documents([doc])
            # self.vector_store.persist() # Chroma 0.4+ persists automatically or on close usually, but helpful to be aware
            logger.info(f"Indexed creative {creative_id}")
            
        except Exception as e:
            logger.error(f"Error indexing creative {creative_id}: {e}")

    def search_creatives(self, query: str, k: int = 5) -> List[Dict]:
        """
        Semantic search for creatives.
        """
        if not self.vector_store:
            return []

        try:
            logger.info(f"Searching for: {query}")
            results = self.vector_store.similarity_search_with_score(query, k=k)
            
            formatted_results = []
            for doc, score in results:
                formatted_results.append({
                    "creative_id": doc.metadata.get("creative_id"),
                    "description": doc.page_content,
                    "metadata": doc.metadata,
                    "similarity_score": score
                })
                
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error during search: {e}")
            return []

creative_search_service = CreativeSearchService()
