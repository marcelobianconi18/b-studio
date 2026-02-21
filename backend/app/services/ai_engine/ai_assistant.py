import os
import json
import logging
import asyncio
import re
import time
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from types import SimpleNamespace
import aiohttp
from openai import AsyncOpenAI  # Standard client for OpenRouter/DeepSeek/Ollama
try:
    from app.services.meta_engine.targeting import search_interests, search_behaviors, search_demographics
except Exception:
    # Compatibility when imported via backend.app.services.ai_assistant in tests
    from backend.app.services.meta_engine.targeting import search_interests, search_behaviors, search_demographics

logger = logging.getLogger("BIA_AI")

class BiaAIAssistant:
    def __init__(self):
        # Configuration from .env
        self.provider = os.getenv("BIA_AI_PROVIDER", "qwen-agent").lower()

        # Model selection
        self.model = os.getenv("BIA_AI_MODEL") or os.getenv("BIA_AI_MODEL_ID")
        if not self.model:
            self.model = "qwen2.5:7b" if self.provider == "ollama" else "deepseek/deepseek-r1"

        # API base URL
        self.base_url = os.getenv("BIA_AI_BASE_URL") or os.getenv("OPENROUTER_BASE_URL")
        if not self.base_url:
            self.base_url = "http://localhost:11434/v1" if self.provider == "ollama" else "https://openrouter.ai/api/v1"

        # Qwen-Agent HTTP endpoint (optional)
        self.qwen_agent_url = os.getenv("BIA_QWEN_AGENT_URL") or os.getenv("QWEN_AGENT_URL")
        self.qwen_agent_mode = os.getenv("BIA_QWEN_AGENT_MODE", "openai").lower()  # openai | query
        self.qwen_agent_candidates = [
            "http://qwen-agent:7860/v1/chat/completions",
            "http://localhost:8000/v1/chat/completions",
            "http://localhost:8001/v1/chat/completions",
            "http://localhost:7860/v1/chat/completions",
            "http://localhost:8080/v1/chat/completions",
            "http://127.0.0.1:8000/v1/chat/completions",
            "http://127.0.0.1:8001/v1/chat/completions",
        ]

        # API key (Ollama ignores but OpenAI SDK requires a non-empty string)
        self.api_key = os.getenv("BIA_AI_API_KEY") or os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            self.api_key = "ollama" if self.provider == "ollama" else ""
        
        self.client = None
        
        # Validation for non-local providers
        if self.provider not in ["ollama", "qwen-agent"] and not self.api_key:
             logger.warning("BIA AI: API Key not found for remote provider. AI features might fail.")
        
        try:
            if self.provider != "qwen-agent" or not self.qwen_agent_url:
                self.client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url,
                )
                key_suffix = self.api_key[-4:] if self.api_key and len(self.api_key) > 4 else "Local"
                logger.info(f"🧠 BIA AI ACTIVE: Provider={self.provider} | Model={self.model} | URL={self.base_url} (Key ...{key_suffix})")
            else:
                logger.info(f"🧠 BIA AI ACTIVE: Provider=qwen-agent | Model={self.model} | URL={self.qwen_agent_url} | Mode={self.qwen_agent_mode}")
        except Exception as e:
            logger.error(f"Failed to initialize AI Client: {e}")

        # Tag generation performance profile (fast by default)
        self.tags_fast_mode = os.getenv("BIA_TAGS_FAST_MODE", "1") == "1"
        self.tags_total_budget_sec = float(os.getenv("BIA_TAGS_TOTAL_BUDGET_SEC", "22"))
        self.tags_plan_timeout_sec = float(os.getenv("BIA_TAGS_PLAN_TIMEOUT_SEC", "6"))
        self.tags_mcp_timeout_sec = float(os.getenv("BIA_TAGS_MCP_TIMEOUT_SEC", "10"))
        self.tags_mcp_call_timeout_sec = float(os.getenv("BIA_TAGS_MCP_CALL_TIMEOUT_SEC", "4.5"))
        self.tags_synthesis_timeout_sec = float(os.getenv("BIA_TAGS_SYNTH_TIMEOUT_SEC", "12"))
        self.tags_refine_timeout_sec = float(os.getenv("BIA_TAGS_REFINE_TIMEOUT_SEC", "6"))
        self.tags_plan_max_tokens = int(os.getenv("BIA_TAGS_PLAN_MAX_TOKENS", "380"))
        self.tags_synthesis_max_tokens = int(os.getenv("BIA_TAGS_SYNTH_MAX_TOKENS", "1200"))
        self.tags_refine_max_tokens = int(os.getenv("BIA_TAGS_REFINE_MAX_TOKENS", "700"))
        self.tags_cache_ttl_sec = int(os.getenv("BIA_TAGS_CACHE_TTL_SEC", "180"))
        self.meta_cache_ttl_sec = int(os.getenv("BIA_META_EVIDENCE_CACHE_TTL_SEC", "180"))
        self.strategy_timeout_sec = float(os.getenv("BIA_STRATEGY_TIMEOUT_SEC", "40"))
        self.strategy_max_tokens = int(os.getenv("BIA_STRATEGY_MAX_TOKENS", "1400"))
        self.strategy_cache_ttl_sec = int(os.getenv("BIA_STRATEGY_CACHE_TTL_SEC", "300"))
        self._tags_cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        self._meta_evidence_cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        self._strategy_cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}

    async def _generate_content(
        self,
        prompt: str,
        system_instruction: str = None,
        timeout_seconds: Optional[float] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7
    ) -> Tuple[Any, str]:
        """
        Generic generator using OpenAI-compatible Chat Completions API.
        Works for DeepSeek, Llama, Ollama, etc.
        """
        if self.provider == "qwen-agent" and self.qwen_agent_url:
            response = await self._generate_content_qwen_agent(
                prompt,
                system_instruction,
                timeout_seconds=timeout_seconds,
                max_tokens=max_tokens,
                temperature=temperature
            )
            return response, self.model

        if not self.client:
            raise ValueError("AI Client not initialized")

        timeout_seconds = float(timeout_seconds or os.getenv("BIA_AI_TIMEOUT_SEC", "120")) # Ollama can be slow on CPU
        max_tokens = int(max_tokens or 2000)

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        
        messages.append({"role": "user", "content": prompt})

        try:
            # Extra headers for OpenRouter (ignored by Ollama)
            extra_headers = {}
            if "openrouter" in self.base_url:
                extra_headers = {
                    "HTTP-Referer": "https://biageo.com",
                    "X-Title": "BiaGeo"
                }

            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    extra_headers=extra_headers
                ),
                timeout=timeout_seconds
            )
            return response, self.model

        except Exception as exc:
            logger.error(f"AI Model '{self.model}' failed: {exc}")
            raise exc

    async def _generate_content_qwen_agent(
        self,
        prompt: str,
        system_instruction: str = None,
        timeout_seconds: Optional[float] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7
    ) -> Any:
        """
        Qwen-Agent HTTP adapter.
        Supports two modes:
        - openai: sends OpenAI-compatible payload
        - query: sends {query, system, model}
        """
        if not self.qwen_agent_url:
            # Try auto-discovery on localhost
            discovered = await self._discover_qwen_agent_url()
            if discovered:
                self.qwen_agent_url = discovered
                logger.info(f"🧠 Qwen-Agent auto-discovered at {self.qwen_agent_url}")
            else:
                raise ValueError("Qwen-Agent URL not configured.")

        timeout_seconds = float(timeout_seconds or os.getenv("BIA_AI_TIMEOUT_SEC", "120"))
        max_tokens = int(max_tokens or 2000)
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        if self.qwen_agent_mode == "query":
            payload = {
                "query": prompt,
                "system": system_instruction or "",
                "model": self.model,
                "temperature": temperature
            }
        else:
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout_seconds)) as session:
            async with session.post(self.qwen_agent_url, json=payload, headers=headers) as resp:
                text = await resp.text()
                if resp.status >= 400:
                    raise ValueError(f"Qwen-Agent error {resp.status}: {text[:200]}")
                try:
                    data = json.loads(text)
                except Exception:
                    data = {"output": text}

        # Normalize to OpenAI-like response
        if isinstance(data, dict) and "choices" in data:
            return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=choice["message"]["content"])) for choice in data["choices"]])

        content = data.get("output") if isinstance(data, dict) else None
        if not content:
            content = data.get("response") if isinstance(data, dict) else None
        if not content:
            content = data.get("text") if isinstance(data, dict) else None
        if not content:
            content = str(data)

        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    async def _discover_qwen_agent_url(self) -> Optional[str]:
        timeout_seconds = int(os.getenv("BIA_AI_TIMEOUT_SEC", "6"))
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": "ping"}],
            "temperature": 0
        }
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout_seconds)) as session:
            for candidate in self.qwen_agent_candidates:
                try:
                    async with session.post(candidate, json=payload, headers=headers) as resp:
                        if resp.status < 400:
                            return candidate
                except Exception:
                    continue
        return None

    async def check_qwen_agent_status(self) -> Dict[str, Any]:
        configured = bool(self.qwen_agent_url) or bool(self.qwen_agent_candidates)
        url = self.qwen_agent_url or ""
        reachable = False
        error = None
        try:
            if not url:
                discovered = await self._discover_qwen_agent_url()
                if discovered:
                    url = discovered
                    self.qwen_agent_url = discovered
            if url:
                timeout_seconds = int(os.getenv("BIA_AI_TIMEOUT_SEC", "6"))
                headers = {}
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"
                payload = {
                    "model": self.model,
                    "messages": [{"role": "user", "content": "ping"}],
                    "temperature": 0
                }
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout_seconds)) as session:
                    async with session.post(url, json=payload, headers=headers) as resp:
                        reachable = resp.status < 400
        except Exception as exc:
            error = str(exc)[:200]
        return {
            "configured": configured,
            "url": url,
            "reachable": reachable,
            "error": error
        }

    @staticmethod
    def _build_cache_key(payload: Dict[str, Any]) -> str:
        serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str)
        return hashlib.sha1(serialized.encode("utf-8")).hexdigest()

    def _cache_get(self, cache: Dict[str, Tuple[float, Dict[str, Any]]], key: str) -> Optional[Dict[str, Any]]:
        now = time.time()
        item = cache.get(key)
        if not item:
            return None
        expires_at, value = item
        if expires_at < now:
            cache.pop(key, None)
            return None
        try:
            return json.loads(json.dumps(value, ensure_ascii=False))
        except Exception:
            return value

    def _cache_set(
        self,
        cache: Dict[str, Tuple[float, Dict[str, Any]]],
        key: str,
        value: Dict[str, Any],
        ttl_seconds: int,
        max_entries: int = 256
    ) -> None:
        if len(cache) >= max_entries:
            # Drop oldest entries first
            oldest_keys = sorted(cache.items(), key=lambda item: item[1][0])[: max(1, len(cache) - max_entries + 1)]
            for stale_key, _ in oldest_keys:
                cache.pop(stale_key, None)
        cache[key] = (time.time() + ttl_seconds, value)

    def _should_refine_tag_output(self, data: Dict[str, Any], requested_limit: int) -> bool:
        if not isinstance(data, dict):
            return True
        raw_tags = data.get("tags")
        if not isinstance(raw_tags, list):
            return True
        cleaned: List[str] = []
        seen = set()
        for item in raw_tags:
            value = str(item or "").strip()
            if not value:
                continue
            key = value.lower()
            if key in seen:
                continue
            seen.add(key)
            cleaned.append(value)
        minimum_acceptable = max(4, min(int(requested_limit or 5), 7))
        if len(cleaned) < minimum_acceptable:
            return True
        reasoning = str(data.get("reasoning") or "").strip()
        return len(reasoning) < 16

    async def generate_tags(
        self,
        product_description: str,
        platform: str,
        objective: str,
        ticket: str = None,
        investment: str = None,
        location: str = None,
        tag_type: str = "general",
        limit: int = 5,
        context_tags: List[str] = None,
        exclusions: List[str] = None,
        previous_selections: dict = None,
        journey_context: dict = None,
        meta_research_required: bool = False,
        meta_seed_tags: List[str] = None,
        customer_profile: str = "auto",
        purchasing_power_primary: Optional[str] = "auto",
        purchasing_power_secondary: Optional[str] = None,
        suggestion_mode: str = "balanced",
        refinement_filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        filters = refinement_filters if isinstance(refinement_filters, dict) else {}
        filters = dict(filters)

        pp_primary_raw = purchasing_power_primary or filters.get("purchasing_power_primary") or "auto"
        pp_secondary_raw = purchasing_power_secondary or filters.get("purchasing_power_secondary") or None
        pp_primary = self._normalize_purchasing_power(pp_primary_raw)
        pp_secondary = self._normalize_purchasing_power(pp_secondary_raw) if pp_secondary_raw else "auto"
        if pp_primary == "auto" and pp_secondary != "auto":
            pp_primary, pp_secondary = pp_secondary, "auto"
        filters["purchasing_power_primary"] = pp_primary
        if pp_secondary != "auto":
            filters["purchasing_power_secondary"] = pp_secondary

        selected_profile = self._normalize_customer_profile(customer_profile)
        if selected_profile == "auto" and pp_primary != "auto":
            selected_profile = self._purchasing_power_to_customer_profile(pp_primary)

        ai_available = bool(self.client) or bool(self.provider == "qwen-agent" and self.qwen_agent_url)
        if not ai_available:
            logger.error("No AI Client configured.")
            return self._mock_fallback(
                product_description,
                platform,
                ticket,
                tag_type,
                limit,
                customer_profile=selected_profile,
                suggestion_mode=suggestion_mode,
                refinement_filters=filters
            )

        tags_cache_key = self._build_cache_key({
            "product_description": product_description,
            "platform": platform,
            "objective": objective,
            "ticket": ticket,
            "investment": investment,
            "location": location,
            "tag_type": tag_type,
            "limit": int(limit or 5),
            "context_tags": context_tags or [],
            "exclusions": exclusions or [],
            "previous_selections": previous_selections or {},
            "journey_context": journey_context or {},
            "meta_research_required": bool(meta_research_required),
            "meta_seed_tags": meta_seed_tags or [],
            "customer_profile": selected_profile,
            "purchasing_power_primary": pp_primary,
            "purchasing_power_secondary": pp_secondary,
            "suggestion_mode": suggestion_mode,
            "refinement_filters": filters
        })
        cached_tags_response = self._cache_get(self._tags_cache, tags_cache_key)
        if cached_tags_response:
            return cached_tags_response

        try:
            request_started_at = time.monotonic()

            def stage_timeout(default_seconds: float, minimum_seconds: float = 1.2) -> float:
                if not self.tags_fast_mode:
                    return max(minimum_seconds, float(default_seconds))
                remaining = self.tags_total_budget_sec - (time.monotonic() - request_started_at)
                if remaining <= minimum_seconds:
                    return minimum_seconds
                return max(minimum_seconds, min(float(default_seconds), remaining))

            # Stage 0: normalize flags
            tag_type_lower = (tag_type or "").lower()
            enable_agentic_meta_flow = bool(meta_research_required and "keyword" not in tag_type_lower)

            # Stage 1 & 2: planning + MCP evidence in parallel, each with bounded timeout
            agent_plan = {}
            meta_mcp_evidence = {}

            if enable_agentic_meta_flow:
                plan_task = asyncio.wait_for(
                    self._build_agent_plan_for_meta(
                        product_description=product_description,
                        platform=platform,
                        objective=objective,
                        tag_type=tag_type,
                        limit=limit,
                        ticket=ticket,
                        investment=investment,
                        location=location,
                        context_tags=context_tags,
                        meta_seed_tags=meta_seed_tags,
                        timeout_seconds=stage_timeout(self.tags_plan_timeout_sec),
                        max_tokens=self.tags_plan_max_tokens
                    ),
                    timeout=stage_timeout(self.tags_plan_timeout_sec)
                )

                evidence_task = asyncio.wait_for(
                    self._collect_meta_mcp_evidence(
                        product_description=product_description,
                        tag_type=tag_type,
                        limit=limit,
                        meta_seed_tags=meta_seed_tags,
                        agent_plan=None,
                        per_request_timeout_sec=self.tags_mcp_call_timeout_sec
                    ),
                    timeout=stage_timeout(self.tags_mcp_timeout_sec)
                )

                plan_result, evidence_result = await asyncio.gather(plan_task, evidence_task, return_exceptions=True)

                if isinstance(plan_result, Exception):
                    logger.warning(f"Tag planner timeout/failure. Using seed fallback. Error={plan_result}")
                    agent_plan = {
                        "meta_queries": self._seed_queries_from_product(product_description, meta_seed_tags),
                        "strategy_hint": "Plano direto por sementes.",
                        "constraints": []
                    }
                else:
                    agent_plan = plan_result if isinstance(plan_result, dict) else {}

                if isinstance(evidence_result, Exception):
                    logger.warning(f"Meta MCP evidence timeout/failure. Error={evidence_result}")
                    meta_mcp_evidence = {
                        "records_count": 0,
                        "queries_used": [],
                        "top_names": [],
                        "by_type": {},
                        "errors": [f"timeout:{str(evidence_result)[:120]}"]
                    }
                else:
                    meta_mcp_evidence = evidence_result if isinstance(evidence_result, dict) else {}

            # Stage 3: Qwen synthesis with full context + MCP evidence
            prompt = self._build_prompt(
                product_description,
                platform,
                objective,
                ticket,
                investment,
                location,
                tag_type,
                limit,
                context_tags,
                exclusions,
                previous_selections,
                journey_context,
                meta_research_required,
                meta_seed_tags,
                customer_profile=selected_profile,
                purchasing_power_primary=pp_primary,
                purchasing_power_secondary=pp_secondary,
                suggestion_mode=suggestion_mode,
                refinement_filters=filters,
                meta_mcp_evidence=meta_mcp_evidence,
                agent_plan=agent_plan
            )
            
            # Define System Instruction (Identity & Rules)
            system_instruction = self._build_system_instruction(platform, limit)

            model_name = self.model
            data: Dict[str, Any] = {"tags": [], "reasoning": ""}
            try:
                # Call AI (Synthesis)
                response, model_name = await self._generate_content(
                    prompt,
                    system_instruction,
                    timeout_seconds=stage_timeout(self.tags_synthesis_timeout_sec),
                    max_tokens=self.tags_synthesis_max_tokens,
                    temperature=0.55
                )

                # Extract, clean and parse JSON
                content = response.choices[0].message.content
                content = self._clean_ai_response(content)
                data = self._loads_llm_json(content)
            except Exception as synth_exc:
                logger.warning(f"Tag synthesis timeout/failure. Falling back to MCP evidence. Error={synth_exc}")
                data = {
                    "tags": self._fallback_from_meta_evidence(meta_mcp_evidence, tag_type, max(12, int(limit or 5) * 3)),
                    "reasoning": "Fallback por dados reais da taxonomia Meta Ads."
                }

            # Stage 4: refinement only when output is weak or in full-quality mode
            should_refine = (not self.tags_fast_mode) or self._should_refine_tag_output(data, int(limit or 5))
            if should_refine:
                data = await self._refine_tags_with_qwen(
                    current_data=data,
                    product_description=product_description,
                    platform=platform,
                    objective=objective,
                    tag_type=tag_type,
                    limit=limit,
                    meta_mcp_evidence=meta_mcp_evidence,
                    meta_seed_tags=meta_seed_tags,
                    timeout_seconds=stage_timeout(self.tags_refine_timeout_sec),
                    max_tokens=self.tags_refine_max_tokens
                )

            selected_variant = self._normalize_suggestion_mode(suggestion_mode)
            ranking_limit = max(18, int(limit or 5) * 3)
            tags_raw = self._postprocess_tags(data.get("tags", []), tag_type, ranking_limit)
            tags_ranked_primary = self._rank_tags_by_relevance(
                tags=tags_raw,
                product_description=product_description,
                tag_type=tag_type,
                customer_profile=selected_profile,
                refinement_filters=filters,
                meta_mcp_evidence=meta_mcp_evidence,
                limit=ranking_limit
            )
            if not tags_ranked_primary:
                fallback_tags = self._fallback_from_meta_evidence(meta_mcp_evidence, tag_type, ranking_limit)
                tags_ranked_primary = self._rank_tags_by_relevance(
                    tags=fallback_tags,
                    product_description=product_description,
                    tag_type=tag_type,
                    customer_profile=selected_profile,
                    refinement_filters=filters,
                    meta_mcp_evidence=meta_mcp_evidence,
                    limit=ranking_limit
                )

            tags_ranked_secondary: List[str] = []
            secondary_profile = self._normalize_customer_profile(self._purchasing_power_to_customer_profile(pp_secondary))
            if secondary_profile != "auto" and secondary_profile != selected_profile:
                tags_ranked_secondary = self._rank_tags_by_relevance(
                    tags=tags_raw,
                    product_description=product_description,
                    tag_type=tag_type,
                    customer_profile=secondary_profile,
                    refinement_filters=filters,
                    meta_mcp_evidence=meta_mcp_evidence,
                    limit=ranking_limit
                )
                if not tags_ranked_secondary:
                    fallback_tags = self._fallback_from_meta_evidence(meta_mcp_evidence, tag_type, ranking_limit)
                    tags_ranked_secondary = self._rank_tags_by_relevance(
                        tags=fallback_tags,
                        product_description=product_description,
                        tag_type=tag_type,
                        customer_profile=secondary_profile,
                        refinement_filters=filters,
                        meta_mcp_evidence=meta_mcp_evidence,
                        limit=ranking_limit
                    )

            variant_tags = self._build_tag_variants(
                ranked_tags=tags_ranked_primary,
                limit=int(limit or 5),
                tag_type=tag_type,
                suggestion_mode=selected_variant,
                secondary_ranked_tags=tags_ranked_secondary
            )

            tags = variant_tags.get(selected_variant) or variant_tags.get("balanced") or tags_ranked_primary[: int(limit or 5)]

            suggestions = self._build_tag_suggestions(
                tags=tags,
                product_description=product_description,
                objective=objective,
                location=location,
                tag_type=tag_type,
                customer_profile=selected_profile,
                refinement_filters=filters,
                suggestion_mode=selected_variant,
                meta_mcp_evidence=meta_mcp_evidence
            )

            variant_payload = {
                mode: self._build_tag_suggestions(
                    tags=variant_tags.get(mode, []),
                    product_description=product_description,
                    objective=objective,
                    location=location,
                    tag_type=tag_type,
                    customer_profile=selected_profile,
                    refinement_filters=filters,
                    suggestion_mode=mode,
                    meta_mcp_evidence=meta_mcp_evidence
                )
                for mode in ["conservative", "balanced", "aggressive"]
            }

            result_payload = {
                "success": True, 
                "source": f"{self.provider}:{model_name}",
                "tags": tags,
                "suggestions": suggestions,
                "selected_profile": selected_profile,
                "selected_variant": selected_variant,
                "variants": variant_payload,
                "reasoning": data.get("reasoning", "Generated by Bia Brain"),
                "agentic_flow": {
                    "enabled": enable_agentic_meta_flow,
                    "plan_queries": (agent_plan.get("meta_queries") or [])[:5] if isinstance(agent_plan, dict) else [],
                    "meta_mcp_records": int(meta_mcp_evidence.get("records_count", 0)) if isinstance(meta_mcp_evidence, dict) else 0,
                    "meta_mcp_errors": (meta_mcp_evidence.get("errors") or [])[:5] if isinstance(meta_mcp_evidence, dict) else []
                }
            }

            self._cache_set(self._tags_cache, tags_cache_key, result_payload, self.tags_cache_ttl_sec)
            return result_payload

        except Exception as e:
            logger.error(f"AI Generation failed: {e}")
            return self._mock_fallback(
                product_description,
                platform,
                ticket,
                tag_type,
                limit,
                customer_profile=selected_profile,
                suggestion_mode=suggestion_mode,
                refinement_filters=filters
            )

    def _clean_ai_response(self, content: str) -> str:
        """
        Cleans response from various models (DeepSeek R1, Llama, Qwen).
        Removes <think> blocks and Markdown code fences.
        """
        # DeepSeek-R1 "Thinking" blocks
        if "<think>" in content:
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
        
        # Markdown JSON blocks (Common in all models)
        if "```json" in content:
            content = content.replace("```json", "").replace("```", "")
        elif "```" in content:
             content = content.replace("```", "")
        
        return content.strip()

    @staticmethod
    def _extract_json(content: str) -> str:
        """
        Extract the first JSON object/array substring from a model response.
        Qwen/Ollama sometimes prepend/append commentary.
        """
        text = (content or "").strip()
        if not text:
            raise json.JSONDecodeError("Empty content", content, 0)

        # Prefer object; fallback to array.
        obj_start = text.find("{")
        arr_start = text.find("[")
        if obj_start == -1 and arr_start == -1:
            raise json.JSONDecodeError("No JSON start found", content, 0)

        if obj_start != -1 and (arr_start == -1 or obj_start < arr_start):
            start = obj_start
            end = text.rfind("}")
        else:
            start = arr_start
            end = text.rfind("]")

        if end == -1 or end <= start:
            raise json.JSONDecodeError("No JSON end found", content, start)

        return text[start:end + 1].strip()

    def _loads_llm_json(self, content: str) -> Dict[str, Any]:
        try:
            data = json.loads(content)
            return data if isinstance(data, dict) else {"tags": data if isinstance(data, list) else [], "reasoning": ""}
        except json.JSONDecodeError:
            extracted = self._extract_json(content)
            data = json.loads(extracted)
            return data if isinstance(data, dict) else {"tags": data if isinstance(data, list) else [], "reasoning": ""}

    def _seed_queries_from_product(self, product_description: str, meta_seed_tags: Optional[List[str]], max_queries: int = 4) -> List[str]:
        seeds: List[str] = []
        if isinstance(meta_seed_tags, list):
            for tag in meta_seed_tags:
                value = str(tag).strip()
                if value:
                    seeds.append(value)

        product = str(product_description or "")
        for chunk in re.split(r"[,\n;/|]", product):
            value = chunk.strip()
            if value:
                seeds.append(value)
        if product and len(seeds) == 0:
            seeds.append(product.strip())

        deduped: List[str] = []
        seen = set()
        for query in seeds:
            key = query.lower()
            if key in seen:
                continue
            seen.add(key)
            deduped.append(query)
            if len(deduped) >= max_queries:
                break
        return deduped or ["mercado"]

    async def _build_agent_plan_for_meta(
        self,
        product_description: str,
        platform: str,
        objective: str,
        tag_type: str,
        limit: int,
        ticket: Optional[str] = None,
        investment: Optional[str] = None,
        location: Optional[str] = None,
        context_tags: Optional[List[str]] = None,
        meta_seed_tags: Optional[List[str]] = None,
        timeout_seconds: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        fallback_queries = self._seed_queries_from_product(product_description, meta_seed_tags)
        prompt = f"""
        Você é o agente planejador da BIA para Meta Ads MCP.
        Produto: {product_description}
        Plataforma: {platform}
        Objetivo: {objective}
        Tipo de tag: {tag_type}
        Limite desejado: {limit}
        Ticket: {ticket or "N/A"}
        Verba: {investment or "N/A"}
        Local: {location or "N/A"}
        Context tags atuais: {", ".join(context_tags or []) if context_tags else "N/A"}
        Sementes Meta já disponíveis: {", ".join(meta_seed_tags or []) if meta_seed_tags else "N/A"}

        Gere um plano para consultar ferramentas Meta Ads MCP.
        Responda SOMENTE JSON:
        {{
          "meta_queries": ["consulta 1", "consulta 2"],
          "strategy_hint": "frase curta",
          "constraints": ["regra 1", "regra 2"]
        }}
        """

        try:
            response, _ = await self._generate_content(
                prompt,
                "Você é um planejador de ferramentas. Retorne apenas JSON válido em pt-BR.",
                timeout_seconds=timeout_seconds,
                max_tokens=max_tokens,
                temperature=0.35
            )
            content = self._clean_ai_response(response.choices[0].message.content)
            data = self._loads_llm_json(content)
            queries = data.get("meta_queries") if isinstance(data, dict) else None
            if not isinstance(queries, list):
                queries = []
            normalized = []
            for query in queries:
                value = str(query).strip()
                if value:
                    normalized.append(value)
            if not normalized:
                normalized = fallback_queries
            return {
                "meta_queries": normalized[:5],
                "strategy_hint": str(data.get("strategy_hint") or "").strip(),
                "constraints": data.get("constraints") if isinstance(data.get("constraints"), list) else []
            }
        except Exception as exc:
            logger.warning(f"Agent plan fallback: {exc}")
            return {
                "meta_queries": fallback_queries[:5],
                "strategy_hint": "Plano de contingência com sementes do briefing.",
                "constraints": []
            }

    def _normalize_meta_mcp_rows(self, raw_payload: Any, source_type: str) -> List[Dict[str, Any]]:
        parsed = raw_payload
        if isinstance(parsed, str):
            try:
                parsed = json.loads(parsed)
            except Exception:
                return []
        rows = []
        if isinstance(parsed, dict) and isinstance(parsed.get("data"), list):
            rows = parsed.get("data") or []
        elif isinstance(parsed, list):
            rows = parsed

        normalized: List[Dict[str, Any]] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            name = str(row.get("name") or row.get("label") or "").strip()
            if not name:
                continue
            normalized.append({
                "id": str(row.get("id") or row.get("key") or "").strip(),
                "name": name,
                "source_type": source_type,
                "audience_size": row.get("audience_size") or row.get("audience_size_lower_bound") or row.get("audience_size_upper_bound"),
                "path": row.get("path")
            })
        return normalized

    def _merge_meta_records(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        merged: List[Dict[str, Any]] = []
        seen = set()
        for record in records:
            name = str(record.get("name") or "").strip()
            source_type = str(record.get("source_type") or "").strip()
            if not name:
                continue
            key = f"{source_type}:{name.lower()}"
            if key in seen:
                continue
            seen.add(key)
            merged.append(record)
        return merged

    async def _collect_meta_mcp_evidence(
        self,
        product_description: str,
        tag_type: str,
        limit: int,
        meta_seed_tags: Optional[List[str]] = None,
        agent_plan: Optional[Dict[str, Any]] = None,
        per_request_timeout_sec: Optional[float] = None
    ) -> Dict[str, Any]:
        search_limit = max(12, min(40, int(limit or 5) * 4))
        queries: List[str] = []
        if isinstance(agent_plan, dict):
            raw_queries = agent_plan.get("meta_queries")
            if isinstance(raw_queries, list):
                queries = [str(query).strip() for query in raw_queries if str(query).strip()]
        seed_queries = self._seed_queries_from_product(product_description, meta_seed_tags)
        merged_queries: List[str] = []
        seen_queries = set()
        for query in [*queries, *seed_queries]:
            value = str(query).strip()
            if not value:
                continue
            key = value.lower()
            if key in seen_queries:
                continue
            seen_queries.add(key)
            merged_queries.append(value)
            if len(merged_queries) >= 8:
                break
        queries = merged_queries or ["mercado"]
        request_timeout = max(1.5, float(per_request_timeout_sec or self.tags_mcp_call_timeout_sec))

        evidence_cache_key = self._build_cache_key({
            "product_description": product_description,
            "tag_type": tag_type,
            "limit": int(limit or 5),
            "meta_seed_tags": meta_seed_tags or [],
            "queries": queries[:5]
        })
        cached_evidence = self._cache_get(self._meta_evidence_cache, evidence_cache_key)
        if cached_evidence:
            return cached_evidence

        tag_type_lower = (tag_type or "").lower()
        wants_behaviors = "behavior" in tag_type_lower
        wants_demographics = "demograph" in tag_type_lower
        wants_negative = "negative" in tag_type_lower or "exclude" in tag_type_lower
        wants_interests = not wants_behaviors and not wants_demographics

        collected: List[Dict[str, Any]] = []
        errors: List[str] = []

        try:
            if wants_interests or wants_negative:
                # Optimized: Execute up to 4 search queries in parallel with bounded latency
                search_tasks = [
                    asyncio.wait_for(search_interests(query=q, limit=search_limit), timeout=request_timeout)
                    for q in queries[:4]
                ]
                search_results = await asyncio.gather(*search_tasks, return_exceptions=True)
                for payload in search_results:
                    if isinstance(payload, Exception):
                        errors.append(f"interests_query_fail:{str(payload)[:80]}")
                        continue
                    collected.extend(self._normalize_meta_mcp_rows(payload, "interests"))
        except Exception as exc:
            errors.append(f"interests:{str(exc)[:120]}")

        try:
            if wants_behaviors or wants_negative:
                payload = await asyncio.wait_for(search_behaviors(limit=search_limit), timeout=request_timeout)
                collected.extend(self._normalize_meta_mcp_rows(payload, "behaviors"))
        except Exception as exc:
            errors.append(f"behaviors:{str(exc)[:120]}")

        try:
            if wants_demographics:
                payload = await asyncio.wait_for(search_demographics(limit=search_limit), timeout=request_timeout)
                collected.extend(self._normalize_meta_mcp_rows(payload, "demographics"))
        except Exception as exc:
            errors.append(f"demographics:{str(exc)[:120]}")

        merged = self._merge_meta_records(collected)
        by_type: Dict[str, List[str]] = {}
        for row in merged:
            source_type = str(row.get("source_type") or "unknown")
            by_type.setdefault(source_type, []).append(str(row.get("name")))

        top_names = [str(row.get("name")) for row in merged if str(row.get("name") or "").strip()][:60]
        evidence_payload = {
            "records_count": len(merged),
            "queries_used": queries[:5],
            "top_names": top_names,
            "by_type": by_type,
            "errors": errors
        }
        self._cache_set(self._meta_evidence_cache, evidence_cache_key, evidence_payload, self.meta_cache_ttl_sec)
        return evidence_payload

    def _fallback_from_meta_evidence(self, meta_mcp_evidence: Dict[str, Any], tag_type: str, limit: int) -> List[str]:
        if not isinstance(meta_mcp_evidence, dict):
            return []
        tag_type_lower = (tag_type or "").lower()
        by_type = meta_mcp_evidence.get("by_type") if isinstance(meta_mcp_evidence.get("by_type"), dict) else {}
        if "behavior" in tag_type_lower:
            candidates = by_type.get("behaviors") or meta_mcp_evidence.get("top_names") or []
        elif "demograph" in tag_type_lower:
            candidates = by_type.get("demographics") or meta_mcp_evidence.get("top_names") or []
        else:
            candidates = by_type.get("interests") or meta_mcp_evidence.get("top_names") or []
        deduped: List[str] = []
        seen = set()
        for candidate in candidates:
            value = str(candidate).strip()
            if not value:
                continue
            key = value.lower()
            if key in seen:
                continue
            seen.add(key)
            deduped.append(value)
            if len(deduped) >= limit:
                break
        return deduped[:limit]

    async def _refine_tags_with_qwen(
        self,
        current_data: Dict[str, Any],
        product_description: str,
        platform: str,
        objective: str,
        tag_type: str,
        limit: int,
        meta_mcp_evidence: Optional[Dict[str, Any]] = None,
        meta_seed_tags: Optional[List[str]] = None,
        timeout_seconds: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        if not isinstance(current_data, dict):
            current_data = {}
        evidence_names = (meta_mcp_evidence or {}).get("top_names") if isinstance(meta_mcp_evidence, dict) else []
        if not isinstance(evidence_names, list):
            evidence_names = []

        prompt = f"""
        Você é o refinador final da BIA.
        Produto: {product_description}
        Plataforma: {platform}
        Objetivo: {objective}
        Tipo de tag: {tag_type}
        Limite: {limit}

        Resultado parcial atual: {json.dumps(current_data, ensure_ascii=False)}
        Evidências Meta MCP: {json.dumps(evidence_names[:30], ensure_ascii=False)}
        Sementes Meta: {json.dumps(meta_seed_tags or [], ensure_ascii=False)}

        Ajuste o resultado para máxima precisão.
        Responda SOMENTE JSON:
        {{
          "tags": ["..."],
          "reasoning": "resumo curto em pt-BR"
        }}
        """

        try:
            response, _ = await self._generate_content(
                prompt,
                "Você faz refinamento final. Nunca responda fora de JSON.",
                timeout_seconds=timeout_seconds,
                max_tokens=max_tokens,
                temperature=0.45
            )
            content = self._clean_ai_response(response.choices[0].message.content)
            refined = self._loads_llm_json(content)
            if isinstance(refined.get("tags"), list) and len(refined.get("tags")) > 0:
                return refined
            return current_data
        except Exception:
            return current_data

    def _build_system_instruction(self, platform: str, limit: int) -> str:
        return f"""
        You are BIA, an expert Traffic Manager and Strategist specialized in High-Performance Ads.
        Your goal is to choose the BEST targeting options for a {platform} campaign.
        
        CRITICAL REASONING RULE (CONTEXTUAL VALUE):
        - You must analyze the relationship between PRODUCT CATEGORY and PRICE to determine the audience.
        - Example 1: R$ 300.00 for a PIZZA is extremely expensive (Ultra High End/Luxury audience).
        - Example 2: R$ 300.00 for a SMARTWATCH is cheap (Entry level/mass market audience).
        - Example 3: R$ 2.5MM for a HOUSE is High End.
        - DO NOT judge the price number in isolation. Judge it RELATIVE to the product.

        DEFINITIONS:
        - "Interests": Topics the user follows, likes, or consumes content about.
        - "Behaviors": Actions they take, devices they use, or purchase habits.
        - "Negative/Exclusions": The "Anti-Persona" (who cannot afford or doesn't fit).

        CRITICAL OUTPUT RULES:
        1. Return ONLY valid JSON. 
        2. NO introductory text.
        3. Format: {{ "tags": ["Option 1", "Option 2"], "reasoning": "Explain why these fit the specific class/purchasing power." }}
        4. Max {limit} options.
        5. Language: Portuguese (Brazil).
        6. Avoid generic tags with weak intent (ex: "Novidades", "Promocoes", "Geral").
        """

    def _build_prompt(
        self,
        product: str,
        platform: str,
        objective: str,
        ticket: str = None,
        investment: str = None,
        location: str = None,
        tag_type: str = "general",
        limit: int = 5,
        context_tags: List[str] = None,
        exclusions: List[str] = None,
        previous_selections: dict = None,
        journey_context: dict = None,
        meta_research_required: bool = False,
        meta_seed_tags: List[str] = None,
        customer_profile: str = "auto",
        suggestion_mode: str = "balanced",
        purchasing_power_primary: Optional[str] = None,
        purchasing_power_secondary: Optional[str] = None,
        refinement_filters: Optional[Dict[str, Any]] = None,
        meta_mcp_evidence: dict = None,
        agent_plan: dict = None
    ) -> str:
        # Context building
        context = f"PRODUCT: {product}\n"
        context += f"CAMPAIGN OBJECTIVE: {objective}\n"
        if ticket: context += f"TICKET PRICE: {ticket} (Consider purchasing power)\n"
        if location: context += f"LOCATION: {location} (Consider local culture/traits)\n"
        if investment: context += f"BUDGET: {investment}\n"
        context += f"CUSTOMER_PROFILE_PRIORITY: {self._normalize_customer_profile(customer_profile)}\n"
        context += f"SUGGESTION_MODE: {self._normalize_suggestion_mode(suggestion_mode)}\n"
        if purchasing_power_primary:
            context += f"PURCHASING_POWER_PRIMARY: {self._normalize_purchasing_power(purchasing_power_primary)}\n"
        if purchasing_power_secondary:
            p2 = self._normalize_purchasing_power(purchasing_power_secondary)
            if p2 != "auto":
                context += f"PURCHASING_POWER_SECONDARY: {p2}\n"
        if refinement_filters and isinstance(refinement_filters, dict):
            try:
                context += "REFINEMENT_FILTERS_JSON: " + json.dumps(refinement_filters, ensure_ascii=False) + "\n"
            except Exception:
                pass
        
        if context_tags:
            context += f"CURRENT_SELECTIONS: {', '.join([str(t) for t in context_tags if t])}\n"

        if exclusions:
             context += f"EXISTING EXCLUSIONS: {', '.join(exclusions)}\n"

        if previous_selections and isinstance(previous_selections, dict):
            try:
                context += "PREVIOUS_SELECTIONS_JSON: " + json.dumps(previous_selections, ensure_ascii=False) + "\n"
            except Exception:
                pass

        if journey_context and isinstance(journey_context, dict):
            journey_view = {
                "first_platform_choice": journey_context.get("first_platform_choice"),
                "meta_selected_on_first_card": journey_context.get("meta_selected_on_first_card"),
                "current_step": journey_context.get("current_step"),
                "selected_platforms": journey_context.get("selected_platforms"),
                "recent_events": (journey_context.get("events") or [])[-12:],
            }
            try:
                context += "USER_JOURNEY_CONTEXT_JSON: " + json.dumps(journey_view, ensure_ascii=False) + "\n"
            except Exception:
                pass

        if meta_seed_tags and isinstance(meta_seed_tags, list):
            seeds = [str(tag).strip() for tag in meta_seed_tags if str(tag).strip()]
            if seeds:
                context += f"META_SEED_TAGS: {', '.join(seeds[:12])}\n"

        if meta_research_required:
            context += "META_RESEARCH_REQUIRED: true (priorize taxonomia real de segmentação do Meta Ads)\n"

        if agent_plan and isinstance(agent_plan, dict):
            try:
                plan_view = {
                    "meta_queries": (agent_plan.get("meta_queries") or [])[:5],
                    "strategy_hint": agent_plan.get("strategy_hint"),
                    "constraints": (agent_plan.get("constraints") or [])[:5]
                }
                context += "QWEN_AGENT_PLAN_JSON: " + json.dumps(plan_view, ensure_ascii=False) + "\n"
            except Exception:
                pass

        if meta_mcp_evidence and isinstance(meta_mcp_evidence, dict):
            try:
                evidence_view = {
                    "records_count": meta_mcp_evidence.get("records_count", 0),
                    "top_names": (meta_mcp_evidence.get("top_names") or [])[:20],
                    "types": list((meta_mcp_evidence.get("by_type") or {}).keys())[:5]
                }
                context += "META_MCP_EVIDENCE_JSON: " + json.dumps(evidence_view, ensure_ascii=False) + "\n"
            except Exception:
                pass

        # Specialized Prompts based on Tag Type
        tag_type_lower = (tag_type or "").lower()

        if "negative" in tag_type_lower or "exclude" in tag_type_lower:
            return f"""
            {context}
            TASK: Generate {limit} NEGATIVE targeting options (Exclusions) for {platform}.
            STRATEGY: Who is the "Anti-Persona"? Who cannot afford this, is irrelevant, or will waste budget?
            Examples: curiosos, caçadores de desconto/grátis, baixa intenção, concorrentes, fora da região.
            Constraint: Return formatted JSON only.
            """
        
        if "behavior" in tag_type_lower or tag_type_lower == "behaviors":
            return f"""
            {context}
            TASK: Generate {limit} precise BEHAVIORS (Digital Activities/Demographics) for {platform}.
            STRATEGY: Focus on purchase behavior, device usage, travel history, or expensive hobbies.
            Avoid generic interests. Focus on ACTIONS.
            Constraint: Return formatted JSON only.
            """

        if "demograph" in tag_type_lower:
            return f"""
            {context}
            TASK: Generate {limit} DEMOGRAPHIC targeting options for {platform}.
            STRATEGY: Focus on education level, family status, job seniority/roles, income proxies, life events.
            Avoid brand interests. Keep it demographic.
            Constraint: Return formatted JSON only.
            """

        if "keyword" in tag_type_lower:
            return f"""
            {context}
            TASK: Generate {limit} HIGH-INTENT KEYWORDS for Google Search.
            STRATEGY: Prefer transactional/commercial terms, include qualifiers like "preço", "perto de mim", "orçamento", "agendar", "comprar".
            Output must be keywords/phrases (not interests).
            Constraint: Return formatted JSON only.
            """

        # Default to Interests
        return f"""
        {context}
        TASK: Generate {limit} high-affinity INTERESTS for {platform}.
        STRATEGY: What does the ideal buyer read, watch, or follow?
        Think about niche brands, specific magazines, or lifestyle markers related to the price point.
        Constraint: Return formatted JSON only.
        """

    @staticmethod
    def _infer_category(text: str) -> str:
        value = (text or "").lower()
        if any(k in value for k in ["confeitaria", "pizza", "lanche", "restaurante", "comida", "bolo", "café", "cafe"]):
            return "food"
        if any(k in value for k in ["imóvel", "imovel", "casa", "apto", "apartamento"]):
            return "real_estate"
        if any(k in value for k in ["academia", "tênis", "tenis", "corrida", "fitness"]):
            return "fitness"
        return "general"

    def _normalize_customer_profile(self, customer_profile: Optional[str]) -> str:
        raw = str(customer_profile or "auto").strip().lower()
        aliases = {
            "auto": "auto",
            "automatico": "auto",
            "automatic": "auto",
            "premium": "premium",
            "high_ticket": "premium",
            "alto_padrao": "premium",
            "luxo": "premium",
            "middle": "middle",
            "mid": "middle",
            "medio": "middle",
            "mid_market": "middle",
            "entry": "entry",
            "entrada": "entry",
            "value": "entry",
            "popular": "entry",
            "baixo_ticket": "entry",
        }
        return aliases.get(raw, "auto")

    def _normalize_suggestion_mode(self, suggestion_mode: Optional[str]) -> str:
        raw = str(suggestion_mode or "balanced").strip().lower()
        aliases = {
            "conservative": "conservative",
            "conservador": "conservative",
            "safe": "conservative",
            "balanced": "balanced",
            "equilibrado": "balanced",
            "default": "balanced",
            "aggressive": "aggressive",
            "agressivo": "aggressive",
            "scale": "aggressive",
        }
        return aliases.get(raw, "balanced")

    def _normalize_purchasing_power(self, value: Optional[str]) -> str:
        raw = str(value or "auto").strip().lower()
        aliases = {
            "auto": "auto",
            "automatico": "auto",
            "automatic": "auto",
            "elite": "elite",
            "a": "a",
            "classe a": "a",
            "classe_a": "a",
            "b": "b",
            "classe b": "b",
            "classe_b": "b",
            "c": "c",
            "classe c": "c",
            "classe_c": "c",
            "d": "d",
            "classe d": "d",
            "classe_d": "d",
            # Classe E fica oculta e soma em D (D+E)
            "e": "d",
            "classe e": "d",
            "classe_e": "d",
        }
        return aliases.get(raw, "auto")

    def _purchasing_power_to_customer_profile(self, purchasing_power: str) -> str:
        pp = self._normalize_purchasing_power(purchasing_power)
        if pp in {"elite", "a", "b"}:
            return "premium"
        if pp == "c":
            return "middle"
        if pp == "d":
            return "entry"
        return "auto"

    def _extract_context_tokens(self, text: str) -> List[str]:
        stop = {
            "para", "com", "sem", "por", "uma", "uns", "umas", "dos", "das", "que", "como", "mais",
            "alto", "padrao", "de", "da", "do", "em", "na", "no", "os", "as", "um", "ao", "e", "ou",
            "produto", "servico", "servicos"
        }
        tokens = re.findall(r"[a-zA-Z0-9]{4,}", (text or "").lower())
        cleaned: List[str] = []
        seen = set()
        for token in tokens:
            if token in stop:
                continue
            if token in seen:
                continue
            seen.add(token)
            cleaned.append(token)
        return cleaned[:20]

    def _is_generic_tag(self, tag: str, tag_type: str) -> bool:
        value = str(tag or "").strip().lower()
        if not value:
            return True

        generic_core = {
            "novidades",
            "promocoes",
            "promoções",
            "compras online",
            "marcas premium",
            "luxo",
            "interesse",
            "geral",
        }
        behavior_generic = {
            "primeiros adeptos de tecnologia",
            "admin de paginas",
            "administrador de paginas",
        }
        tag_type_lower = (tag_type or "").lower()

        if value in generic_core:
            return True
        if "interest" in tag_type_lower and len(value) <= 4:
            return True
        if "behavior" in tag_type_lower and value in behavior_generic:
            return True
        return False

    def _rank_tags_by_relevance(
        self,
        tags: List[str],
        product_description: str,
        tag_type: str,
        customer_profile: str,
        refinement_filters: Optional[Dict[str, Any]] = None,
        meta_mcp_evidence: Optional[Dict[str, Any]] = None,
        limit: int = 5
    ) -> List[str]:
        if not isinstance(tags, list):
            return []
        evidence_names = []
        if isinstance(meta_mcp_evidence, dict):
            evidence_names = [str(name).strip().lower() for name in (meta_mcp_evidence.get("top_names") or []) if str(name).strip()]
        evidence_set = set(evidence_names)
        context_tokens = self._extract_context_tokens(product_description)
        category = self._infer_category(product_description)
        profile = self._normalize_customer_profile(customer_profile)
        filters = refinement_filters or {}
        audience_type = str(filters.get("audience_type") or "auto").strip().lower()
        price_band = str(filters.get("price_band") or "auto").strip().lower()
        sales_channel = str(filters.get("sales_channel") or "auto").strip().lower()
        geo_scope = str(filters.get("geo_scope") or "").strip().lower()

        premium_markers = ["luxo", "premium", "alto", "condominio", "arquitetura", "invest", "executiv", "renda"]
        entry_markers = ["desconto", "promoc", "popular", "barato", "econom"]
        b2b_markers = ["b2b", "gestao", "negocios", "empresa", "empreendedor", "diretor", "c-level"]
        b2c_markers = ["familia", "lifestyle", "decoracao", "viagens", "consumo", "compras"]
        online_markers = ["online", "ecommerce", "pagamentos", "digital", "facebook"]
        offline_markers = ["loja", "bairro", "regiao", "local", "condominio"]

        scored: List[Tuple[int, str]] = []
        for raw in tags:
            tag = str(raw or "").strip()
            if not tag:
                continue
            lower = tag.lower()
            if self._is_generic_tag(tag, tag_type):
                continue

            score = 0
            if lower in evidence_set:
                score += 8
            if any(token in lower for token in context_tokens):
                score += 5

            if profile == "premium" and any(marker in lower for marker in premium_markers):
                score += 4
            if profile == "entry" and any(marker in lower for marker in entry_markers):
                score += 4
            if price_band in {"high", "premium", "alto"} and any(marker in lower for marker in premium_markers):
                score += 3
            if price_band in {"low", "entry", "baixo"} and any(marker in lower for marker in entry_markers):
                score += 3
            if audience_type == "b2b" and any(marker in lower for marker in b2b_markers):
                score += 4
            if audience_type == "b2c" and any(marker in lower for marker in b2c_markers):
                score += 4
            if sales_channel == "online" and any(marker in lower for marker in online_markers):
                score += 3
            if sales_channel == "offline" and any(marker in lower for marker in offline_markers):
                score += 3
            if geo_scope in {"city", "local"} and any(marker in lower for marker in ["curitiba", "bairro", "regional", "condominio"]):
                score += 2

            if "behavior" in (tag_type or "").lower() and category == "real_estate":
                if any(marker in lower for marker in ["windows", "macos", "sistema operacional", "primeiros usuarios", "primeiros adeptos", "tecnologia"]):
                    # For high-ticket real estate, OS/early-adopter behaviors tend to be noisy.
                    continue
                if "compradores engajados" in lower:
                    score += 3

            # Slight boost to specific long-tail phrases over single broad terms.
            if len(lower.split()) >= 2:
                score += 1

            scored.append((score, tag))

        scored.sort(key=lambda item: (-item[0], item[1].lower()))
        ranked = [tag for _, tag in scored]

        # If everything was filtered out, keep original order as last resort.
        if not ranked:
            fallback = []
            seen = set()
            for raw in tags:
                tag = str(raw or "").strip()
                if not tag:
                    continue
                key = tag.lower()
                if key in seen:
                    continue
                seen.add(key)
                fallback.append(tag)
                if len(fallback) >= limit:
                    break
            return fallback
        return ranked[:limit]

    def _build_tag_variants(
        self,
        ranked_tags: List[str],
        limit: int,
        tag_type: str,
        suggestion_mode: str,
        secondary_ranked_tags: Optional[List[str]] = None
    ) -> Dict[str, List[str]]:
        primary_pool = [str(tag).strip() for tag in (ranked_tags or []) if str(tag).strip()]
        if not primary_pool:
            return {
                "conservative": [],
                "balanced": [],
                "aggressive": [],
            }

        def _dedupe(values: List[str]) -> List[str]:
            out: List[str] = []
            seen_local = set()
            for value in values or []:
                tag = str(value or "").strip()
                if not tag:
                    continue
                key = tag.lower()
                if key in seen_local:
                    continue
                seen_local.add(key)
                out.append(tag)
            return out

        primary = _dedupe(primary_pool)
        secondary = _dedupe([str(tag).strip() for tag in (secondary_ranked_tags or []) if str(tag).strip()])

        if not secondary:
            return {
                "conservative": primary[:limit],
                "balanced": primary[:limit],
                "aggressive": primary[:limit],
            }

        def _mix(primary_ratio: float) -> List[str]:
            primary_count = int(round(limit * primary_ratio)) if limit else 0
            primary_count = max(1, min(limit, primary_count))
            secondary_count = max(0, limit - primary_count)

            out: List[str] = []
            seen_local = set()

            for tag in primary[:primary_count]:
                key = tag.lower()
                if key in seen_local:
                    continue
                seen_local.add(key)
                out.append(tag)
                if len(out) >= limit:
                    return out[:limit]

            if secondary_count:
                for tag in secondary:
                    key = tag.lower()
                    if key in seen_local:
                        continue
                    seen_local.add(key)
                    out.append(tag)
                    if len(out) >= primary_count + secondary_count:
                        break

            if len(out) < limit:
                for tag in primary[primary_count:]:
                    key = tag.lower()
                    if key in seen_local:
                        continue
                    seen_local.add(key)
                    out.append(tag)
                    if len(out) >= limit:
                        break

            if len(out) < limit:
                for tag in secondary:
                    key = tag.lower()
                    if key in seen_local:
                        continue
                    seen_local.add(key)
                    out.append(tag)
                    if len(out) >= limit:
                        break

            return out[:limit]

        # Primary guides 70-80% by default; aggressive opens more secondary.
        return {
            "conservative": _mix(0.85),
            "balanced": _mix(0.75),
            "aggressive": _mix(0.65),
        }

    def _confidence_for_tag(
        self,
        tag: str,
        product_description: str,
        tag_type: str,
        customer_profile: str,
        refinement_filters: Optional[Dict[str, Any]] = None,
        meta_mcp_evidence: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        lower = str(tag or "").strip().lower()
        score = 55
        reasons = []
        evidence_names = set()
        if isinstance(meta_mcp_evidence, dict):
            evidence_names = {str(name).strip().lower() for name in (meta_mcp_evidence.get("top_names") or []) if str(name).strip()}
        if lower in evidence_names:
            score += 18
            reasons.append("validado na taxonomia Meta")
        if any(token in lower for token in self._extract_context_tokens(product_description)):
            score += 12
            reasons.append("aderente ao produto")
        profile = self._normalize_customer_profile(customer_profile)
        if profile == "premium" and any(marker in lower for marker in ["luxo", "premium", "alto", "condominio", "renda"]):
            score += 8
            reasons.append("coerente com perfil premium")
        if self._is_generic_tag(tag, tag_type):
            score -= 15
            reasons.append("tag muito ampla")
        filters = refinement_filters or {}
        audience = str(filters.get("audience_type") or "auto").lower()
        if audience == "b2b" and any(marker in lower for marker in ["empresa", "negocios", "gestao", "diretor"]):
            score += 6
        if audience == "b2c" and any(marker in lower for marker in ["compras", "familia", "lifestyle"]):
            score += 6
        score = max(10, min(95, score))
        if score >= 75:
            level = "high"
        elif score >= 55:
            level = "medium"
        else:
            level = "low"
        return {"level": level, "score": score, "reasons": reasons}

    def _build_tag_suggestions(
        self,
        tags: List[str],
        product_description: str,
        objective: str,
        location: Optional[str],
        tag_type: str,
        customer_profile: str,
        refinement_filters: Optional[Dict[str, Any]] = None,
        suggestion_mode: str = "balanced",
        meta_mcp_evidence: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        if not isinstance(tags, list):
            return []

        evidence_names = set()
        if isinstance(meta_mcp_evidence, dict):
            evidence_names = {str(name).strip().lower() for name in (meta_mcp_evidence.get("top_names") or []) if str(name).strip()}

        profile = self._normalize_customer_profile(customer_profile)
        profile_label = {
            "premium": "premium",
            "middle": "middle",
            "entry": "entry",
            "auto": "auto",
        }.get(profile, "auto")

        mode = self._normalize_suggestion_mode(suggestion_mode)

        suggestions: List[Dict[str, Any]] = []
        for tag in tags:
            value = str(tag or "").strip()
            if not value:
                continue
            from_meta = value.lower() in evidence_names
            confidence = self._confidence_for_tag(
                tag=value,
                product_description=product_description,
                tag_type=tag_type,
                customer_profile=customer_profile,
                refinement_filters=refinement_filters,
                meta_mcp_evidence=meta_mcp_evidence
            )
            if from_meta:
                reason = "Taxonomia Meta valida afinidade com intencao de compra."
            elif confidence.get("level") == "high":
                reason = "Alta aderencia ao produto, objetivo e perfil selecionado."
            elif confidence.get("level") == "medium":
                reason = "Boa aderencia ao contexto e objetivo da campanha."
            else:
                reason = "Aderencia moderada; validar com testes A/B no publico."

            suggestions.append({
                "tag": value,
                "profile": profile_label,
                "reason": reason,
                "source": "meta_mcp" if from_meta else "bia_inference",
                "confidence": confidence.get("level"),
                "confidence_score": confidence.get("score"),
                "variant": mode,
            })
        return suggestions[: max(1, len(tags))]

    def _postprocess_tags(self, tags: List[str], tag_type: str, limit: int) -> List[str]:
        if not isinstance(tags, list):
            return []

        tag_type_lower = (tag_type or "").lower()

        # Normalize, de-duplicate (preserve order)
        cleaned: List[str] = []
        seen = set()
        for t in tags:
            if not t:
                continue
            s = str(t).strip().replace("_", " ")
            s = re.sub(r"\s+", " ", s).strip()
            if not s:
                continue
            key = s.lower()
            if key in seen:
                continue
            seen.add(key)
            cleaned.append(s)

        # Filter behaviors out of interests when models mix categories
        behavior_markers = [
            "compradores engajados",
            "admin de páginas",
            "administrador de páginas",
            "acesso via smartphone",
            "acesso via 4g",
            "acesso via 5g",
            "ios",
            "android",
        ]

        if "interest" in tag_type_lower:
            cleaned = [s for s in cleaned if s.lower() not in behavior_markers]

        return cleaned[:limit]

    def _mock_fallback(
        self,
        product: str,
        platform: str,
        ticket: str,
        tag_type: str,
        limit: int,
        customer_profile: str = "auto",
        suggestion_mode: str = "balanced",
        refinement_filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Fallback deterministic tags if AI fails"""
        logger.warning("Using fallback Mock tags due to AI failure.")
        tag_type_lower = (tag_type or "").lower()
        selected_profile = self._normalize_customer_profile(customer_profile)
        selected_variant = self._normalize_suggestion_mode(suggestion_mode)
        filters = refinement_filters or {}
        audience_type = str(filters.get("audience_type") or "auto").strip().lower()
        sales_channel = str(filters.get("sales_channel") or "auto").strip().lower()
        price_band = str(filters.get("price_band") or "auto").strip().lower()
        category = self._infer_category(product)
        base = (product or "produto").strip()

        def _dedupe(values: List[str]) -> List[str]:
            out: List[str] = []
            seen = set()
            for item in values:
                tag = str(item or "").strip()
                if not tag:
                    continue
                key = tag.lower()
                if key in seen:
                    continue
                seen.add(key)
                out.append(tag)
            return out

        if "negative" in tag_type_lower or "exclude" in tag_type_lower:
            tags = [
                "Curiosos sem intencao de compra",
                "Cacadores de desconto extremo",
                "Perfis fora da regiao de atendimento",
                "Publico sem aderencia ao ticket",
                "Concorrentes diretos"
            ]
        elif "behavior" in tag_type_lower:
            if category == "real_estate":
                tags = [
                    "Compradores engajados",
                    "Usuarios dos Pagamentos do Facebook (90 dias)",
                    "Viajantes frequentes",
                    "Interacao com paginas de imobiliarias",
                    "Pesquisa recente por mudanca de residencia",
                    "Usuarios ativos em anuncios de imoveis"
                ]
            elif category == "food":
                tags = [
                    "Compradores engajados",
                    "Usuarios ativos em apps de entrega",
                    "Interacao com restaurantes locais",
                    "Pesquisa por cupons e promocoes locais",
                    "Usuarios de pagamentos digitais"
                ]
            elif category == "fitness":
                tags = [
                    "Compradores engajados",
                    "Assinantes de apps de treino",
                    "Interacao com marcas esportivas",
                    "Usuarios ativos em compras de suplementos",
                    "Usuarios dos Pagamentos do Facebook (90 dias)"
                ]
            else:
                tags = [
                    "Compradores engajados",
                    "Usuarios dos Pagamentos do Facebook (90 dias)",
                    "Usuarios ativos em compras online",
                    "Interacao com anunciantes recentes",
                    "Visitantes frequentes de paginas do nicho"
                ]
        elif "keyword" in tag_type_lower:
            tags = [f"comprar {base}", f"{base} preco", f"{base} perto de mim", f"orcamento {base}", f"melhor {base}"]
        elif "demograph" in tag_type_lower:
            if category == "real_estate":
                tags = [
                    "Renda alta (proxy)",
                    "Profissionais liberais",
                    "Executivos e gestores",
                    "Familias em fase de mudanca",
                    "Investidores pessoa fisica"
                ]
            else:
                tags = [
                    "Profissionais liberais",
                    "Empreendedores",
                    "Gestores e decisores",
                    "Renda media alta (proxy)",
                    "Publico com interesse em crescimento profissional"
                ]
        else:
            if category == "real_estate":
                tags = [
                    "Investimento imobiliario",
                    "Condominios fechados",
                    "Arquitetura moderna",
                    "Decoracao de interiores",
                    "Mercado imobiliario de luxo",
                    "Imoveis de alto padrao"
                ]
            elif category == "food":
                tags = [
                    "Gastronomia local",
                    "Restaurantes da cidade",
                    "Experiencias culinarias",
                    "Comida artesanal",
                    "Lazer e gastronomia"
                ]
            elif category == "fitness":
                tags = [
                    "Treinamento funcional",
                    "Vida saudavel",
                    "Academias premium",
                    "Suplementacao esportiva",
                    "Bem-estar e performance"
                ]
            else:
                tags = [
                    f"Interesse em {base}",
                    "Conteudos especializados do segmento",
                    "Comparacao entre marcas do nicho",
                    "Publico com intencao ativa de compra",
                    "Afinidade com solucao principal"
                ]

        is_behavior = "behavior" in tag_type_lower

        if audience_type == "b2b":
            if is_behavior:
                tags.extend(["Administradores de paginas", "Proprietarios de pequenas empresas"])
            else:
                tags.extend(["Gestao de negocios", "Empreendedorismo", "Lideranca empresarial"])
        elif audience_type == "b2c":
            if is_behavior:
                tags.extend(["Usuarios ativos em compras online", "Interacao com anunciantes recentes"])
            else:
                tags.extend(["Consumo qualificado", "Estilo de vida relacionado ao produto"])

        if sales_channel == "online":
            if is_behavior:
                tags.extend(["Interacao com anunciantes recentes", "Usuarios ativos em compras online"])
            else:
                tags.extend(["Compras online", "Ecommerce"])
        elif sales_channel == "offline":
            if is_behavior:
                tags.extend(["Frequentadores de centros comerciais", "Interacao com negocios locais"])
            else:
                tags.extend(["Consumo local", "Bairros de maior poder aquisitivo"])

        if price_band in {"high", "premium", "alto"} or selected_profile == "premium":
            if is_behavior:
                tags.extend(["Viajantes frequentes", "Usuarios dos Pagamentos do Facebook (90 dias)"])
            else:
                tags.extend(["Renda alta (proxy)", "Produtos e servicos premium"])
        elif price_band in {"low", "entry", "baixo"} or selected_profile == "entry":
            if is_behavior:
                tags.extend(["Busca recorrente por promocoes", "Interacao com anuncios de desconto"])
            else:
                tags.extend(["Busca por custo-beneficio", "Promocoes relevantes"])

        tags = _dedupe(tags)
        ranked_tags_primary = self._rank_tags_by_relevance(
            tags=tags,
            product_description=product,
            tag_type=tag_type,
            customer_profile=selected_profile,
            refinement_filters=filters,
            meta_mcp_evidence={},
            limit=max(12, int(limit or 5) * 3)
        )
        tags_ranked_primary = ranked_tags_primary or tags

        ranked_tags_secondary: List[str] = []
        pp_secondary = self._normalize_purchasing_power(filters.get("purchasing_power_secondary") or "auto")
        secondary_profile = self._normalize_customer_profile(self._purchasing_power_to_customer_profile(pp_secondary))
        if secondary_profile != "auto" and secondary_profile != selected_profile:
            ranked_tags_secondary = self._rank_tags_by_relevance(
                tags=tags,
                product_description=product,
                tag_type=tag_type,
                customer_profile=secondary_profile,
                refinement_filters=filters,
                meta_mcp_evidence={},
                limit=max(12, int(limit or 5) * 3)
            )

        variant_tags = self._build_tag_variants(
            tags_ranked_primary,
            int(limit or 5),
            tag_type,
            selected_variant,
            secondary_ranked_tags=ranked_tags_secondary
        )
        final_tags = variant_tags.get(selected_variant) or tags_ranked_primary[: int(limit or 5)]
        variant_payload = {
            mode: self._build_tag_suggestions(
                tags=variant_tags.get(mode, []),
                product_description=product,
                objective="sales",
                location=None,
                tag_type=tag_type,
                customer_profile=selected_profile,
                refinement_filters=filters,
                suggestion_mode=mode,
                meta_mcp_evidence={}
            )
            for mode in ["conservative", "balanced", "aggressive"]
        }
        return {
            "success": False,
            "source": "fallback_mock",
            "tags": final_tags,
            "suggestions": self._build_tag_suggestions(
                tags=final_tags,
                product_description=product,
                objective="sales",
                location=None,
                tag_type=tag_type,
                customer_profile=selected_profile,
                refinement_filters=filters,
                suggestion_mode=selected_variant,
                meta_mcp_evidence={}
            ),
            "selected_profile": selected_profile,
            "selected_variant": selected_variant,
            "variants": variant_payload,
            "reasoning": "AI Service Unavailable - Using Backup"
        }

    async def generate_campaign_strategy(self, briefing: Dict[str, Any], channel: str) -> Dict[str, Any]:
        """
        Generates a comprehensive campaign strategy analysis.
        Returns JSON with:
        - bia_score: { total, market_score, product_score, budget_score, explanation }
        - anti_persona: { profiles: [] }
        - strategy_map: { source: [], signals: [], target: [], connections: [] } (For the visual mapper)
        - decision_trail: [] (For timeline)
        - mind_map: { nodes: [], edges: [] } (For analysis mind map)
        """
        ai_available = bool(self.client) or bool(self.provider == "qwen-agent" and self.qwen_agent_url)
        if not ai_available:
            logger.error("No AI Client configured.")
            return self._mock_strategy_fallback(briefing, channel)

        strategy_cache_key = self._build_cache_key({
            "channel": channel,
            "briefing": {
                "products": briefing.get("products"),
                "objective": briefing.get("objective"),
                "ticket": briefing.get("ticket"),
                "budget": briefing.get("budget"),
                "platforms": briefing.get("platforms"),
                "geoMode": briefing.get("geoMode"),
                "selectedStates": briefing.get("selectedStates"),
                "selectedCities": briefing.get("selectedCities"),
                "metaInterests": briefing.get("metaInterests"),
                "googleInterests": briefing.get("googleInterests"),
                "tiktokTags": briefing.get("tiktokTags"),
                "linkedinRoles": briefing.get("linkedinRoles"),
                "negativeTags": briefing.get("negativeTags"),
                "purchasingPowerPrimary": briefing.get("purchasingPowerPrimary") or briefing.get("purchasing_power_primary"),
                "purchasingPowerSecondary": briefing.get("purchasingPowerSecondary") or briefing.get("purchasing_power_secondary"),
                "metaResearchRequired": briefing.get("meta_research_required"),
                "marketContext": briefing.get("market_context"),
            },
        })
        cached_strategy = self._cache_get(self._strategy_cache, strategy_cache_key)
        if cached_strategy:
            cached = dict(cached_strategy)
            cached["mode"] = "cache"
            cached["source"] = cached.get("source") or "strategy_cache"
            return cached

        try:
            # 1. Build Prompt
            product = briefing.get("products", "Produto")
            if isinstance(product, list): product = product[0]
            location_label = self._build_location_label(briefing)
            platforms = briefing.get("platforms") or ([channel] if channel else [])
            meta_interests = self._compact_list(briefing.get("metaInterests"))
            google_interests = self._compact_list(briefing.get("googleInterests"))
            tiktok_tags = self._compact_list(briefing.get("tiktokTags"))
            linkedin_roles = self._compact_list(briefing.get("linkedinRoles"))
            negative_tags = self._compact_list(briefing.get("negativeTags"))
            market_context = briefing.get("market_context") or {}
            journey_context = self._coerce_journey_context(briefing.get("journey_context") or briefing.get("journeyContext") or {})
            journey_summary = self._summarize_journey_context(journey_context)
            purchasing_power_primary = self._normalize_purchasing_power(
                briefing.get("purchasingPowerPrimary") or briefing.get("purchasing_power_primary") or "auto"
            )
            purchasing_power_secondary = self._normalize_purchasing_power(
                briefing.get("purchasingPowerSecondary") or briefing.get("purchasing_power_secondary") or "auto"
            )
            if purchasing_power_primary == "auto" and purchasing_power_secondary != "auto":
                purchasing_power_primary, purchasing_power_secondary = purchasing_power_secondary, "auto"
            purchasing_power_label = purchasing_power_primary
            if purchasing_power_secondary != "auto":
                purchasing_power_label = f"{purchasing_power_primary} + {purchasing_power_secondary}"
            journey_events_raw = journey_context.get("events") if isinstance(journey_context, dict) else []
            if not isinstance(journey_events_raw, list):
                journey_events_raw = []
            strategy_meta_flow = bool(
                briefing.get("meta_research_required")
                or (isinstance(journey_context, dict) and journey_context.get("meta_selected_on_first_card"))
            )
            meta_seed_tags = briefing.get("metaInterests") or []
            strategy_agent_plan = {}
            strategy_meta_mcp_evidence = {}
            if strategy_meta_flow:
                if not (isinstance(meta_seed_tags, list) and len(meta_seed_tags) >= 6):
                    strategy_agent_plan = await self._build_agent_plan_for_meta(
                        product_description=str(product),
                        platform=channel or "meta",
                        objective=str(briefing.get("objective") or ""),
                        tag_type="interests",
                        limit=8,
                        ticket=str(briefing.get("ticket") or ""),
                        investment=str(briefing.get("budget") or ""),
                        location=location_label,
                        context_tags=briefing.get("metaInterests") or [],
                        meta_seed_tags=meta_seed_tags if isinstance(meta_seed_tags, list) else []
                    )
                strategy_meta_mcp_evidence = await self._collect_meta_mcp_evidence(
                    product_description=str(product),
                    tag_type="interests",
                    limit=12,
                    meta_seed_tags=meta_seed_tags if isinstance(meta_seed_tags, list) else [],
                    agent_plan=strategy_agent_plan
                )
            
            prompt = f"""
            CONTEXT:
            Product: {product}
            Location: {location_label}
            Budget: {briefing.get("budget", "N/A")}
            Objective: {briefing.get("objective", "Sales")}
            Ticket: {briefing.get("ticket", "N/A")}
            Purchasing Power (Proxy): {purchasing_power_label}
            Platforms: {", ".join([str(p) for p in platforms]) if platforms else "N/A"}
            Segmentation (Meta): {meta_interests}
            Segmentation (Google): {google_interests}
            Segmentation (TikTok): {tiktok_tags}
            Segmentation (LinkedIn): {linkedin_roles}
            Exclusions (Anti-Persona): {negative_tags}
            Journey Context: {journey_summary}
            Journey Events Raw: {json.dumps(journey_events_raw[:12], ensure_ascii=False) if journey_events_raw else "N/A"}
            Meta MCP Research Enabled: {"true" if strategy_meta_flow else "false"}
            Meta Agent Plan: {json.dumps(strategy_agent_plan, ensure_ascii=False) if strategy_agent_plan else "N/A"}
            Meta MCP Evidence: {json.dumps((strategy_meta_mcp_evidence or {}).get("top_names", [])[:30], ensure_ascii=False) if strategy_meta_mcp_evidence else "N/A"}

            TASK:
            Act as a Senior Traffic Strategist. Analyze this campaign and return a JSON strategy.
            
            REQUIREMENTS:
            1. 'bia_score': Calculate a viability score (0-100) based on budget vs ticket vs location saturation.
               - Consider segmentation quality: if tags are too generic or missing, reduce score.
               - Consider exclusions: if anti-persona is coherent and specific, increase confidence.
               - Ensure the score is consistent with the briefing details.
               - market_score: Saturation/Competition level.
               - product_score: Appeal/Offer strength.
               - budget_score: Is the budget realistic for the objective?
               - explanation: 1 short sentence summary.
            
            2. 'anti_persona': List 3 types of people who are NOT the target (to exclude).
            
            3. 'strategy_map': Visual mapping data in 3 layers.
               - source: 3-5 input items (produto, local, verba, objetivo, ticket). Include "category".
                 Example: {{ "id": "src-prod", "label": "{product}", "category": "Oferta" }}
               - signals: 3-6 inferred signals/insights (ex: "Decisão consultiva", "Alto poder aquisitivo", "Alta intenção").
               - target: 3-6 tactical outputs (canal, audiência, criativo, oferta, funil).
               - connections: link source->signals and signals->target with {{"sourceId","targetId","reason","weight"}}.
                 Reason is short (<= 8 words). weight 0-100.

            4. 'decision_trail': ordered list of steps with:
               {{ "id","stage","input","output","rationale","confidence" }}

            5. 'mind_map': nodes + edges for a mental map.
               - nodes: {{ "id","label","group" }} where group in ["core","inputs","signals","decisions"]
               - edges: {{ "sourceId","targetId","weight","label" }}

            OUTPUT FORMAT (JSON ONLY):
            {{
              "bia_score": {{ "total": 85, "market_score": 80, "product_score": 90, "budget_score": 85, "explanation": "..." }},
              "anti_persona": {{ "profiles": ["...", "...", "..."] }},
              "strategy_map": {{
                "source": [ ... ],
                "signals": [ ... ],
                "target": [ ... ],
                "connections": [ ... ]
              }},
              "decision_trail": [ ... ],
              "mind_map": {{ "nodes": [ ... ], "edges": [ ... ] }}
            }}
            """

            # 2. System Instruction
            system_instruction = "You are BIA, the best AI Marketing Strategist. Return only valid JSON. Language: Portuguese (Brazil)."

            # 3. Call AI
            response, model_name = await self._generate_content(
                prompt,
                system_instruction,
                timeout_seconds=self.strategy_timeout_sec,
                max_tokens=self.strategy_max_tokens
            )
            content = self._clean_ai_response(response.choices[0].message.content)
            data = json.loads(content)
            data = self._normalize_strategy_payload(data, briefing, channel)
            data = self._apply_deterministic_score(data, briefing, market_context)

            strategy_payload = {
                "success": True,
                "mode": "ai",
                "source": f"{self.provider}:{model_name}",
                "data": data,
                "agentic_flow": {
                    "enabled": strategy_meta_flow,
                    "plan_queries": (strategy_agent_plan.get("meta_queries") or [])[:5] if isinstance(strategy_agent_plan, dict) else [],
                    "meta_mcp_records": int(strategy_meta_mcp_evidence.get("records_count", 0)) if isinstance(strategy_meta_mcp_evidence, dict) else 0,
                    "meta_mcp_errors": (strategy_meta_mcp_evidence.get("errors") or [])[:5] if isinstance(strategy_meta_mcp_evidence, dict) else []
                }
            }
            self._cache_set(self._strategy_cache, strategy_cache_key, strategy_payload, self.strategy_cache_ttl_sec)
            return strategy_payload

        except Exception as e:
            logger.error(f"Strategy Generation failed: {e}")
            return self._mock_strategy_fallback(briefing, channel)

    async def orchestrate_multi_agent_strategy(self, briefing: Dict[str, Any], channel: str) -> Dict[str, Any]:
        """
        🧠 ORQUESTRAÇÃO MULTI-AGENTE (Arquitetura Melhorada)
        
        Fluxo:
        1. Qwen 2.5 (Ollama) → Interpreta briefing e extrai parâmetros estruturados
        2. Qwen Agent → Aciona MCP Meta Ads com múltiplas chamadas paralelas
        3. Qwen 2.5 (Ollama) → Processa dados do MCP e formata resposta ao usuário
        
        Retorna:
        - orchestration_trace: log do fluxo multi-agente
        - qwen_interpretation: análise inicial do Qwen 2.5
        - mcp_data: dados brutos do Meta Ads MCP
        - final_strategy: estratégia formatada pelo Qwen 2.5
        """
        logger.info("🔄 [Multi-Agent] Iniciando orquestração multi-agente...")
        
        orchestration_trace = []
        
        try:
            # ========================================================
            # FASE 1: QWEN 2.5 INTERPRETA O BRIEFING
            # ========================================================
            logger.info("🧠 [Multi-Agent] Fase 1: Qwen 2.5 interpretando briefing...")
            orchestration_trace.append({
                "phase": "interpretation",
                "agent": "qwen_2.5",
                "status": "started",
                "timestamp": time.time()
            })
            
            product = briefing.get("products", "Produto")
            if isinstance(product, list):
                product = product[0]
            
            location_label = self._build_location_label(briefing)
            
            interpretation_prompt = f"""
            Você é a BIA, assistente de marketing. Analise este briefing e extraia informações estruturadas:
            
            BRIEFING:
            - Produto: {product}
            - Localização: {location_label}
            - Budget: {briefing.get("budget", "N/A")}
            - Objetivo: {briefing.get("objective", "N/A")}
            - Ticket Médio: {briefing.get("ticket", "N/A")}
            - Plataformas: {briefing.get("platforms", [])}
            - Interesses Meta: {briefing.get("metaInterests", [])}
            
            TAREFA:
            Retorne um JSON com:
            1. "niche": nicho do produto (ex: "imobiliario", "ecommerce", "servicos")
            2. "target_audience": descrição do público-alvo (1 frase)
            3. "campaign_objective": objetivo da campanha (leads, vendas, tráfego)
            4. "budget_analysis": análise do budget vs ticket (1 frase)
            5. "mcp_queries": lista de 3-5 queries para buscar no Meta Ads MCP
            
            Retorne APENAS o JSON, sem explicações.
            """
            
            interpretation_response, _ = await self._generate_content(
                interpretation_prompt,
                system_instruction="Você é BIA. Retorne apenas JSON válido em português.",
                timeout_seconds=15,
                max_tokens=500,
                temperature=0.3
            )
            
            interpretation_content = self._clean_ai_response(interpretation_response.choices[0].message.content)
            qwen_interpretation = json.loads(interpretation_content)
            
            orchestration_trace.append({
                "phase": "interpretation",
                "agent": "qwen_2.5",
                "status": "completed",
                "output": qwen_interpretation,
                "timestamp": time.time()
            })
            
            logger.info(f"✅ [Multi-Agent] Qwen 2.5 interpretou: {qwen_interpretation.get('niche', 'N/A')}")
            
            # ========================================================
            # FASE 2: QWEN AGENT ACIONA MCP META ADS (PARALELO)
            # ========================================================
            logger.info("🤖 [Multi-Agent] Fase 2: Qwen Agent acionando MCP Meta Ads...")
            orchestration_trace.append({
                "phase": "mcp_execution",
                "agent": "qwen_agent",
                "status": "started",
                "timestamp": time.time()
            })
            
            # Busca dados do MCP em paralelo
            mcp_queries = qwen_interpretation.get("mcp_queries", [])
            if not mcp_queries:
                mcp_queries = [product, qwen_interpretation.get("target_audience", "")]
            
            # Coleta evidências do Meta MCP
            meta_seed_tags = briefing.get("metaInterests", [])
            mcp_evidence = await self._collect_meta_mcp_evidence(
                product_description=str(product),
                tag_type="interests",
                limit=15,
                meta_seed_tags=meta_seed_tags if isinstance(meta_seed_tags, list) else [],
                agent_plan={"meta_queries": mcp_queries[:5]}
            )
            
            orchestration_trace.append({
                "phase": "mcp_execution",
                "agent": "qwen_agent",
                "status": "completed",
                "mcp_records": mcp_evidence.get("records_count", 0) if mcp_evidence else 0,
                "timestamp": time.time()
            })
            
            logger.info(f"✅ [Multi-Agent] MCP retornou {mcp_evidence.get('records_count', 0) if mcp_evidence else 0} registros")
            
            # ========================================================
            # FASE 3: QWEN 2.5 PROCESSA E FORMATA RESPOSTA
            # ========================================================
            logger.info("🧠 [Multi-Agent] Fase 3: Qwen 2.5 processando dados do MCP...")
            orchestration_trace.append({
                "phase": "synthesis",
                "agent": "qwen_2.5",
                "status": "started",
                "timestamp": time.time()
            })
            
            mcp_top_interests = (mcp_evidence.get("top_names", [])[:20] if mcp_evidence else [])
            
            synthesis_prompt = f"""
            Você é a BIA. Você recebeu dados do Meta Ads MCP. Agora crie uma estratégia de campanha.
            
            INTERPRETAÇÃO INICIAL:
            {json.dumps(qwen_interpretation, ensure_ascii=False, indent=2)}
            
            DADOS DO META ADS MCP:
            - Total de interesses encontrados: {mcp_evidence.get('records_count', 0) if mcp_evidence else 0}
            - Top interesses: {json.dumps(mcp_top_interests, ensure_ascii=False)}
            
            BRIEFING ORIGINAL:
            - Produto: {product}
            - Budget: {briefing.get("budget", "N/A")}
            - Objetivo: {briefing.get("objective", "N/A")}
            
            TAREFA:
            Crie uma estratégia completa em JSON com:
            1. "bia_score": {{total, market_score, product_score, budget_score, explanation}}
            2. "recommended_interests": lista dos 10 melhores interesses do MCP
            3. "campaign_insights": 3-5 insights estratégicos (array de strings)
            4. "next_steps": 3-4 próximos passos recomendados (array de strings)
            5. "orchestration_summary": resumo do processo multi-agente (1 parágrafo)
            
            Retorne APENAS JSON válido.
            """
            
            synthesis_response, model_name = await self._generate_content(
                synthesis_prompt,
                system_instruction="Você é BIA. Retorne apenas JSON válido em português.",
                timeout_seconds=30,
                max_tokens=1200,
                temperature=0.5
            )
            
            synthesis_content = self._clean_ai_response(synthesis_response.choices[0].message.content)
            final_strategy = json.loads(synthesis_content)
            
            orchestration_trace.append({
                "phase": "synthesis",
                "agent": "qwen_2.5",
                "status": "completed",
                "timestamp": time.time()
            })
            
            logger.info("✅ [Multi-Agent] Orquestração concluída com sucesso!")
            
            # ========================================================
            # RETORNO FINAL
            # ========================================================
            return {
                "success": True,
                "mode": "multi_agent_orchestration",
                "source": f"{self.provider}:qwen2.5+qwen_agent+mcp",
                "orchestration_trace": orchestration_trace,
                "qwen_interpretation": qwen_interpretation,
                "mcp_data": {
                    "records_count": mcp_evidence.get("records_count", 0) if mcp_evidence else 0,
                    "top_interests": mcp_top_interests,
                    "queries_used": mcp_queries[:5]
                },
                "final_strategy": final_strategy,
                "data": final_strategy  # Para compatibilidade com frontend
            }
            
        except Exception as e:
            logger.error(f"❌ [Multi-Agent] Orquestração falhou: {e}")
            orchestration_trace.append({
                "phase": "error",
                "error": str(e),
                "timestamp": time.time()
            })
            
            # Fallback para estratégia normal
            return await self.generate_campaign_strategy(briefing, channel)

    def _apply_deterministic_score(self, data: Dict[str, Any], briefing: Dict[str, Any], market_context: Dict[str, Any]) -> Dict[str, Any]:
        bia_score = data.get("bia_score") or {}
        ai_total = bia_score.get("total")
        det = self._deterministic_score(briefing, market_context)

        if ai_total is None:
            ai_total = det["total"]

        blended = round((det["total"] * 0.7) + (float(ai_total) * 0.3))
        blended = max(0, min(100, blended))

        scenario = det.get("scenario")
        explanation = det.get("explanation") or bia_score.get("explanation") or "Análise baseada no briefing."
        if blended >= 81:
            explanation = f"Cenário Oceano Azul: oportunidade acima da média. {explanation}"
        elif scenario == "oceano_azul":
            explanation = f"Cenário Oceano Azul: baixa concorrência e alta demanda potencial. {explanation}"

        data["bia_score"] = {
            "total": blended,
            "market_score": det["market_score"],
            "product_score": det["product_score"],
            "budget_score": det["budget_score"],
            "explanation": explanation,
            "deterministic": det,
            "ai_total": ai_total
        }
        return data

    def _deterministic_score(self, briefing: Dict[str, Any], market_context: Dict[str, Any]) -> Dict[str, Any]:
        budget_val = self._parse_money(briefing.get("budget"))
        ticket_val = self._parse_money(briefing.get("ticket"))
        objective = str(briefing.get("objective") or "").lower()
        geo_mode = briefing.get("geoMode")

        # Segmentation & anti-persona
        meta = briefing.get("metaInterests") or []
        google = briefing.get("googleInterests") or []
        tiktok = briefing.get("tiktokTags") or []
        linkedin = briefing.get("linkedinRoles") or []
        negative = briefing.get("negativeTags") or []
        seg_total = sum(len(v) for v in [meta, google, tiktok, linkedin] if isinstance(v, list))
        platforms_used = sum(1 for v in [meta, google, tiktok, linkedin] if isinstance(v, list) and len(v) > 0)

        # Market context
        competitors = market_context.get("competitors_count")
        tam = market_context.get("tam")
        population = market_context.get("population")

        # Budget score
        budget_score = 50
        if budget_val is not None and ticket_val:
            ratio = budget_val / max(ticket_val, 1)
            if ratio >= 30: budget_score = 90
            elif ratio >= 10: budget_score = 80
            elif ratio >= 5: budget_score = 70
            elif ratio >= 2: budget_score = 60
            else: budget_score = 45
        elif budget_val is not None:
            budget_score = 60 if budget_val >= 1000 else 45

        if objective in ["branding", "brand"] and (budget_val or 0) < 500:
            budget_score = max(35, budget_score - 10)

        # Product score (proxy)
        product_score = 55
        product_label = str(briefing.get("products") or "")
        if len(product_label) > 40:
            product_score += 5
        if ticket_val:
            product_score += 5 if ticket_val >= 1000 else 0

        # Market score
        market_score = 50
        if geo_mode == "national":
            market_score -= 5
        if competitors is not None:
            if competitors <= 3: market_score += 25
            elif competitors <= 6: market_score += 15
            elif competitors <= 10: market_score += 5
            else: market_score -= 5
        if tam:
            if tam >= 1_000_000: market_score += 15
            elif tam >= 300_000: market_score += 10
            elif tam >= 100_000: market_score += 5
        elif population:
            if population >= 1_000_000: market_score += 10
            elif population >= 300_000: market_score += 6

        # Segmentation quality
        seg_bonus = 0
        if seg_total >= 10: seg_bonus += 10
        elif seg_total >= 5: seg_bonus += 6
        elif seg_total >= 1: seg_bonus += 2
        else: seg_bonus -= 6
        if platforms_used >= 2: seg_bonus += 4
        if platforms_used == 0: seg_bonus -= 2

        # Anti-persona quality
        anti_bonus = 0
        if isinstance(negative, list):
            if len(negative) >= 3: anti_bonus += 6
            elif len(negative) >= 1: anti_bonus += 3
            else: anti_bonus -= 3

        market_score = max(0, min(100, market_score + seg_bonus + anti_bonus))
        product_score = max(0, min(100, product_score))
        budget_score = max(0, min(100, budget_score))

        total = round((market_score * 0.5) + (product_score * 0.25) + (budget_score * 0.25))

        scenario = None
        if competitors is not None and competitors <= 3 and (tam and tam >= 300_000):
            scenario = "oceano_azul"

        explanation = "Score determinístico baseado em verba, mercado e segmentação."
        return {
            "total": total,
            "market_score": market_score,
            "product_score": product_score,
            "budget_score": budget_score,
            "scenario": scenario,
            "explanation": explanation
        }

    def _compact_list(self, values: Any, max_items: int = 8) -> str:
        if not values:
            return "N/A"
        if isinstance(values, str):
            values = [values]
        if not isinstance(values, list):
            return "N/A"
        cleaned = [str(v).strip() for v in values if str(v).strip()]
        if not cleaned:
            return "N/A"
        head = cleaned[:max_items]
        rest = len(cleaned) - len(head)
        return ", ".join(head) + (f" (+{rest} outros)" if rest > 0 else "")

    def _summarize_journey_context(self, journey_context: Dict[str, Any]) -> str:
        if not isinstance(journey_context, dict) or not journey_context:
            return "N/A"
        first_platform = journey_context.get("first_platform_choice") or "N/A"
        meta_first = "sim" if journey_context.get("meta_selected_on_first_card") else "não"
        selected_platforms = journey_context.get("selected_platforms") or []
        if not isinstance(selected_platforms, list):
            selected_platforms = []
        events = journey_context.get("events") or []
        if not isinstance(events, list):
            events = []
        summaries: List[str] = []
        for event in events[-6:]:
            if not isinstance(event, dict):
                continue
            summary = str(event.get("summary") or "").strip()
            if summary:
                summaries.append(summary)
        events_text = " | ".join(summaries) if summaries else "N/A"
        platforms_text = ", ".join([str(p) for p in selected_platforms if str(p).strip()]) or "N/A"
        return f"Primeira plataforma: {first_platform}; Meta no primeiro card: {meta_first}; Plataformas atuais: {platforms_text}; Eventos recentes: {events_text}"

    def _coerce_journey_context(self, journey_context: Any) -> Dict[str, Any]:
        if not isinstance(journey_context, dict):
            return {}
        selected_platforms = journey_context.get("selected_platforms")
        if not isinstance(selected_platforms, list):
            selected_platforms = journey_context.get("selectedPlatforms")
        events = journey_context.get("events")
        if not isinstance(events, list):
            events = []
        return {
            "session_id": journey_context.get("session_id") or journey_context.get("sessionId"),
            "started_at": journey_context.get("started_at") or journey_context.get("startedAt"),
            "updated_at": journey_context.get("updated_at") or journey_context.get("updatedAt"),
            "first_platform_choice": journey_context.get("first_platform_choice") or journey_context.get("firstPlatformChoice"),
            "meta_selected_on_first_card": bool(
                journey_context.get("meta_selected_on_first_card")
                if journey_context.get("meta_selected_on_first_card") is not None
                else journey_context.get("metaSelectedOnFirstCard")
            ),
            "current_step": (
                journey_context.get("current_step")
                if journey_context.get("current_step") is not None
                else journey_context.get("currentStep")
            ),
            "selected_platforms": selected_platforms if isinstance(selected_platforms, list) else [],
            "events": events
        }

    def _build_location_label(self, briefing: Dict[str, Any]) -> str:
        geo_mode = briefing.get("geoMode")
        if geo_mode == "national":
            return "Brasil"
        if geo_mode == "state":
            states = briefing.get("selectedStates") or []
            if states:
                return "Estados: " + ", ".join([str(s) for s in states])
            return "Estado"
        if geo_mode == "city":
            cities = briefing.get("selectedCities") or []
            if cities:
                names = []
                for c in cities:
                    if isinstance(c, dict):
                        names.append(c.get("label") or c.get("name") or "")
                    else:
                        names.append(str(c))
                names = [n for n in names if n]
                if names:
                    return "Cidades: " + ", ".join(names[:5]) + (" (+mais)" if len(names) > 5 else "")
            return "Cidade"
        # fallback legacy
        legacy = briefing.get("selectedCities", [{}])
        if isinstance(legacy, list) and legacy:
            if isinstance(legacy[0], dict):
                return legacy[0].get("name", "Brasil")
        return "Brasil"

    def _parse_money(self, value: Any) -> Optional[float]:
        if value is None:
            return None
        try:
            raw = str(value)
            raw = re.sub(r"[^\d,.-]", "", raw)
            if raw.count(",") > 0 and raw.count(".") == 0:
                raw = raw.replace(",", ".")
            raw = raw.replace(".", "").replace(",", ".") if raw.count(",") > 0 else raw
            return float(raw)
        except Exception:
            return None

    def _ensure_ids(self, items: List[Dict[str, Any]], prefix: str) -> List[Dict[str, Any]]:
        seen = set()
        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                continue
            if not item.get("id"):
                item["id"] = f"{prefix}-{idx+1}"
            if item["id"] in seen:
                item["id"] = f"{item['id']}-{idx+1}"
            seen.add(item["id"])
        return items

    def _normalize_strategy_payload(self, data: Dict[str, Any], briefing: Dict[str, Any], channel: str) -> Dict[str, Any]:
        data = data or {}
        strategy_map = data.get("strategy_map") or {}

        product = briefing.get("products", "Produto")
        if isinstance(product, list):
            product = product[0] if product else "Produto"
        location = self._build_location_label(briefing)
        budget = briefing.get("budget", "N/A")
        objective = briefing.get("objective", "Sales")
        ticket = briefing.get("ticket", "N/A")

        source = strategy_map.get("source") or []
        if not source:
            source = [
                {"id": "src-prod", "label": str(product), "category": "Oferta"},
                {"id": "src-loc", "label": str(location), "category": "Local"},
                {"id": "src-bud", "label": f"Verba {budget}", "category": "Verba"}
            ]
        for item in source:
            item.setdefault("category", "Entrada")
        source = self._ensure_ids(source, "src")

        signals = strategy_map.get("signals") or []
        if not signals:
            budget_val = self._parse_money(budget)
            ticket_val = self._parse_money(ticket)
            obj = str(objective).lower()
            signals = [
                {"id": "sig-1", "label": "Segmentação geográfica precisa", "category": "Insight"},
                {"id": "sig-2", "label": "Decisão consultiva e comparativa", "category": "Insight"},
                {"id": "sig-3", "label": "Oferta exige prova social", "category": "Insight"}
            ]
            if "brand" in obj or "branding" in obj:
                signals.insert(0, {"id": "sig-0", "label": "Reconhecimento de marca", "category": "Objetivo"})
            elif "digital" in obj or "sales" in obj or "venda" in obj:
                signals.insert(0, {"id": "sig-0", "label": "Alta intenção de compra", "category": "Objetivo"})
            if budget_val is not None:
                signals.append({"id": "sig-4", "label": "Verba enxuta, foco em eficiência" if budget_val < 1000 else "Verba saudável para testes", "category": "Verba"})
            if ticket_val is not None:
                signals.append({"id": "sig-5", "label": "Ticket elevado exige confiança" if ticket_val > 1000 else "Ticket acessível e escala", "category": "Ticket"})
        for item in signals:
            item.setdefault("category", "Insight")
        signals = self._ensure_ids(signals, "sig")

        target = strategy_map.get("target") or []
        if not target:
            if str(channel).lower() == "google":
                target = [
                    {"id": "tgt-1", "label": "Search com palavras-chave quentes", "category": "Canal"},
                    {"id": "tgt-2", "label": "Extensões de chamada e local", "category": "Criativo"},
                    {"id": "tgt-3", "label": "Campanha de conversão direta", "category": "Estratégia"}
                ]
            else:
                target = [
                    {"id": "tgt-1", "label": "Stories Ads com oferta direta", "category": "Criativo"},
                    {"id": "tgt-2", "label": "Lookalike 1% + interesses premium", "category": "Audiência"},
                    {"id": "tgt-3", "label": "Campanha de conversão (CPA)", "category": "Estratégia"}
                ]
        for item in target:
            item.setdefault("category", "Saída")
        target = self._ensure_ids(target, "tgt")

        connections = strategy_map.get("connections") or []
        if not connections:
            for i, sig in enumerate(signals[:max(1, len(signals))]):
                src = source[min(i, len(source) - 1)]
                connections.append({
                    "sourceId": src["id"],
                    "targetId": sig["id"],
                    "reason": "Indício direto do briefing",
                    "weight": 70
                })
            for i, tgt in enumerate(target[:max(1, len(target))]):
                sig = signals[min(i, len(signals) - 1)]
                connections.append({
                    "sourceId": sig["id"],
                    "targetId": tgt["id"],
                    "reason": "Transforma insight em ação",
                    "weight": 75
                })
        else:
            for conn in connections:
                if isinstance(conn, dict):
                    conn.setdefault("reason", "Conexão estratégica")
                    conn.setdefault("weight", 70)

        strategy_map = {
            "source": source,
            "signals": signals,
            "target": target,
            "connections": connections
        }

        data["strategy_map"] = strategy_map

        if not data.get("decision_trail"):
            data["decision_trail"] = [
                {
                    "id": "trail-1",
                    "stage": "Input",
                    "input": str(product),
                    "output": "Definição da oferta",
                    "rationale": "Produto define a promessa central.",
                    "confidence": 78
                },
                {
                    "id": "trail-2",
                    "stage": "Local",
                    "input": str(location),
                    "output": "Segmentação geográfica",
                    "rationale": "Contexto local orienta a mensagem.",
                    "confidence": 72
                },
                {
                    "id": "trail-3",
                    "stage": "Verba",
                    "input": str(budget),
                    "output": "Nível de teste e otimização",
                    "rationale": "Verba define ritmo de aprendizado.",
                    "confidence": 70
                },
                {
                    "id": "trail-4",
                    "stage": "Estratégia",
                    "input": str(objective),
                    "output": target[0]["label"] if target else "Estratégia de conversão",
                    "rationale": "Objetivo guia a tática principal.",
                    "confidence": 76
                }
            ]

        if not data.get("mind_map"):
            nodes = [{"id": "core", "label": "Estratégia BIA", "group": "core"}]
            for item in source:
                nodes.append({"id": item["id"], "label": item["label"], "group": "inputs"})
            for item in signals:
                nodes.append({"id": item["id"], "label": item["label"], "group": "signals"})
            for item in target:
                nodes.append({"id": item["id"], "label": item["label"], "group": "decisions"})

            edges = []
            for item in source:
                edges.append({"sourceId": "core", "targetId": item["id"], "weight": 60, "label": "input"})
            for item in signals:
                edges.append({"sourceId": "core", "targetId": item["id"], "weight": 70, "label": "insight"})
            for item in target:
                edges.append({"sourceId": "core", "targetId": item["id"], "weight": 80, "label": "decisão"})
            for conn in connections:
                edges.append({
                    "sourceId": conn.get("sourceId"),
                    "targetId": conn.get("targetId"),
                    "weight": conn.get("weight", 70),
                    "label": conn.get("reason", "")
                })

            data["mind_map"] = {"nodes": nodes, "edges": edges}

        return data

    def _mock_strategy_fallback(self, briefing: Dict[str, Any], channel: str) -> Dict[str, Any]:
        data = {
            "success": True,
            "mode": "fallback_mock",
            "source": "fallback_mock",
            "fallback": True,
            "data": {
                "bia_score": {
                    "total": 75, "market_score": 70, "product_score": 80, "budget_score": 75,
                    "explanation": "Análise preliminar indica bom potencial, mas requer otimização de criativos."
                },
                "anti_persona": { "profiles": ["Caçadores de Grátis", "Fora da Região", "Baixa Intenção"] },
                "strategy_map": {
                    "source": [
                        {"id": "src-prod", "label": "Produto"},
                        {"id": "src-loc", "label": "Local"},
                        {"id": "src-bud", "label": "Verba"}
                    ],
                    "signals": [
                        {"id": "sig-1", "label": "Segmentação precisa"},
                        {"id": "sig-2", "label": "Decisão comparativa"},
                        {"id": "sig-3", "label": "Oferta exige prova social"}
                    ],
                    "target": [
                        {"id": "tgt-1", "label": "Interesses Amplos"},
                        {"id": "tgt-2", "label": "Foco em Feed"},
                        {"id": "tgt-3", "label": "Oferta Direta"}
                    ],
                    "connections": [
                        {"sourceId": "src-prod", "targetId": "sig-1", "reason": "Produto define afinidades", "weight": 70},
                        {"sourceId": "src-loc", "targetId": "sig-2", "reason": "Local altera contexto", "weight": 68},
                        {"sourceId": "src-bud", "targetId": "sig-3", "reason": "Verba define testes", "weight": 72},
                        {"sourceId": "sig-1", "targetId": "tgt-1", "reason": "Afinidade vira segmentação", "weight": 75},
                        {"sourceId": "sig-2", "targetId": "tgt-2", "reason": "Contexto ajusta criativo", "weight": 70},
                        {"sourceId": "sig-3", "targetId": "tgt-3", "reason": "Prova social orienta oferta", "weight": 78}
                    ]
                },
                "decision_trail": [
                    {"id": "trail-1", "stage": "Input", "input": "Produto", "output": "Oferta principal", "rationale": "Define a promessa", "confidence": 75},
                    {"id": "trail-2", "stage": "Local", "input": "Local", "output": "Segmentação geográfica", "rationale": "Contexto regional", "confidence": 70},
                    {"id": "trail-3", "stage": "Verba", "input": "Verba", "output": "Nível de teste", "rationale": "Define ritmo", "confidence": 72},
                    {"id": "trail-4", "stage": "Estratégia", "input": "Objetivo", "output": "Oferta direta", "rationale": "Foco em conversão", "confidence": 74}
                ],
                "mind_map": {
                    "nodes": [
                        {"id": "core", "label": "Estratégia BIA", "group": "core"},
                        {"id": "src-prod", "label": "Produto", "group": "inputs"},
                        {"id": "src-loc", "label": "Local", "group": "inputs"},
                        {"id": "src-bud", "label": "Verba", "group": "inputs"},
                        {"id": "sig-1", "label": "Segmentação precisa", "group": "signals"},
                        {"id": "sig-2", "label": "Decisão comparativa", "group": "signals"},
                        {"id": "sig-3", "label": "Prova social", "group": "signals"},
                        {"id": "tgt-1", "label": "Interesses Amplos", "group": "decisions"},
                        {"id": "tgt-2", "label": "Foco em Feed", "group": "decisions"},
                        {"id": "tgt-3", "label": "Oferta Direta", "group": "decisions"}
                    ],
                    "edges": [
                        {"sourceId": "core", "targetId": "src-prod", "weight": 60, "label": "input"},
                        {"sourceId": "core", "targetId": "src-loc", "weight": 60, "label": "input"},
                        {"sourceId": "core", "targetId": "src-bud", "weight": 60, "label": "input"},
                        {"sourceId": "core", "targetId": "sig-1", "weight": 70, "label": "insight"},
                        {"sourceId": "core", "targetId": "sig-2", "weight": 70, "label": "insight"},
                        {"sourceId": "core", "targetId": "sig-3", "weight": 70, "label": "insight"},
                        {"sourceId": "core", "targetId": "tgt-1", "weight": 80, "label": "decisão"},
                        {"sourceId": "core", "targetId": "tgt-2", "weight": 80, "label": "decisão"},
                        {"sourceId": "core", "targetId": "tgt-3", "weight": 80, "label": "decisão"}
                    ]
                }
            }
        }
        data["data"] = self._normalize_strategy_payload(data["data"], briefing, channel)
        data["data"] = self._apply_deterministic_score(data["data"], briefing, briefing.get("market_context") or {})
        return data

# Instantiate the global assistant object
ai_assistant = BiaAIAssistant()
