"""
Three-Level Memory System for AI Dev Team Platform
===================================================
Level 1: Working Memory  — current conversation context (last N messages)
Level 2: Episodic Memory — auto-summaries of past conversations
Level 3: Semantic Memory  — extracted facts, decisions, user preferences

This module provides the core logic for building a "context package"
that is injected into every LLM call, ensuring the AI never forgets.
"""
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Optional, Any

logger = logging.getLogger("memory-layers")

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────
WORKING_MEMORY_MESSAGES = int(os.getenv("WORKING_MEMORY_MESSAGES", "30"))
EPISODIC_MEMORY_LIMIT = int(os.getenv("EPISODIC_MEMORY_LIMIT", "10"))
SEMANTIC_FACTS_LIMIT = int(os.getenv("SEMANTIC_FACTS_LIMIT", "20"))
SUMMARY_TRIGGER_MESSAGES = int(os.getenv("SUMMARY_TRIGGER_MESSAGES", "15"))
MAX_CONTEXT_TOKENS = int(os.getenv("MAX_CONTEXT_TOKENS", "6000"))


def build_context_package(
    db_conn,
    conversation_id: int,
    project_id: Optional[int],
    user_id: int,
    current_query: str,
    openai_client=None,
    embedding_fn=None,
    search_fn=None,
) -> dict:
    """
    Build a complete context package for LLM from all three memory levels.
    
    Returns:
        {
            "working_memory": str,       # Recent messages
            "episodic_memory": str,       # Summaries of past conversations
            "semantic_memory": str,       # Key facts and decisions
            "user_preferences": str,      # User-specific knowledge
            "relevant_solutions": str,    # Similar solved tasks
            "total_context_tokens": int,  # Approximate token count
        }
    """
    from sqlalchemy import text

    package = {
        "working_memory": "",
        "episodic_memory": "",
        "semantic_memory": "",
        "user_preferences": "",
        "relevant_solutions": "",
        "total_context_tokens": 0,
    }

    # ── Level 1: Working Memory ──────────────────────────────
    try:
        recent = db_conn.execute(text("""
            SELECT sender_type, content_text, created_at
            FROM messages
            WHERE conversation_id = :cid
            ORDER BY created_at DESC
            LIMIT :lim
        """), {"cid": conversation_id, "lim": WORKING_MEMORY_MESSAGES}).fetchall()

        if recent:
            msgs = []
            for m in reversed(recent):
                role = "User" if m[0] == "user" else "AI"
                text_content = (m[1] or "")[:500]
                msgs.append(f"[{role}]: {text_content}")
            package["working_memory"] = "\n".join(msgs)
    except Exception as e:
        logger.warning(f"Failed to load working memory: {e}")

    # ── Level 2: Episodic Memory ─────────────────────────────
    try:
        # Get summaries of other conversations in same project
        summaries = db_conn.execute(text("""
            SELECT cs.summary_text, cs.key_facts, cs.key_decisions,
                   c.title, cs.updated_at
            FROM conversation_summaries cs
            JOIN conversations c ON c.id = cs.conversation_id
            WHERE cs.conversation_id != :cid
              AND (c.project_id = :pid OR :pid IS NULL)
            ORDER BY cs.updated_at DESC
            LIMIT :lim
        """), {"cid": conversation_id, "pid": project_id, "lim": EPISODIC_MEMORY_LIMIT}).fetchall()

        if summaries:
            parts = []
            for s in summaries:
                summary_text = s[0] or ""
                key_facts = s[1] if isinstance(s[1], list) else []
                key_decisions = s[2] if isinstance(s[2], list) else []
                title = s[3] or "Untitled"
                date = s[4].strftime("%Y-%m-%d") if s[4] else ""

                entry = f"**{title}** ({date}):\n{summary_text[:300]}"
                if key_facts:
                    facts_str = "; ".join(str(f) for f in key_facts[:3])
                    entry += f"\nФакты: {facts_str}"
                if key_decisions:
                    dec_str = "; ".join(str(d) for d in key_decisions[:3])
                    entry += f"\nРешения: {dec_str}"
                parts.append(entry)
            package["episodic_memory"] = "\n---\n".join(parts)
    except Exception as e:
        logger.warning(f"Failed to load episodic memory: {e}")

    # ── Level 3: Semantic Memory ─────────────────────────────
    try:
        facts = db_conn.execute(text("""
            SELECT fact_type, subject, predicate, object_value, confidence
            FROM semantic_facts
            WHERE is_active = TRUE
              AND (project_id = :pid OR project_id IS NULL)
              AND (user_id = :uid OR user_id IS NULL)
            ORDER BY confidence DESC, updated_at DESC
            LIMIT :lim
        """), {"pid": project_id, "uid": user_id, "lim": SEMANTIC_FACTS_LIMIT}).fetchall()

        if facts:
            fact_lines = []
            for f in facts:
                fact_type, subject, predicate, obj, conf = f
                fact_lines.append(f"[{fact_type}] {subject} {predicate} {obj} (conf: {conf:.1f})")
            package["semantic_memory"] = "\n".join(fact_lines)
    except Exception as e:
        logger.warning(f"Failed to load semantic memory: {e}")

    # ── User Preferences ─────────────────────────────────────
    try:
        prefs = db_conn.execute(text("""
            SELECT pref_key, pref_value
            FROM user_preferences
            WHERE user_id = :uid
            ORDER BY updated_at DESC
            LIMIT 15
        """), {"uid": user_id}).fetchall()

        if prefs:
            pref_lines = [f"- {p[0]}: {p[1]}" for p in prefs]
            package["user_preferences"] = "\n".join(pref_lines)
    except Exception as e:
        logger.warning(f"Failed to load user preferences: {e}")

    # ── Relevant Solutions (from memory-service) ─────────────
    if search_fn and current_query:
        try:
            results = search_fn(current_query, limit=3)
            if results:
                sol_parts = []
                for r in results:
                    key = r.get("key", "")
                    value = str(r.get("value", ""))[:400]
                    score = r.get("composite_score", 0)
                    sol_parts.append(f"[{score:.2f}] {key}: {value}")
                package["relevant_solutions"] = "\n".join(sol_parts)
        except Exception as e:
            logger.warning(f"Failed to search relevant solutions: {e}")

    # Estimate tokens
    total_text = " ".join(v for v in package.values() if isinstance(v, str))
    package["total_context_tokens"] = len(total_text) // 4  # rough estimate

    return package


def format_context_for_llm(package: dict, max_tokens: int = None) -> str:
    """
    Format the context package into a string for injection into LLM system prompt.
    Respects token budget by trimming least important sections first.
    """
    if max_tokens is None:
        max_tokens = MAX_CONTEXT_TOKENS

    sections = []

    if package.get("working_memory"):
        sections.append(("РАБОЧАЯ ПАМЯТЬ (текущий диалог)", package["working_memory"], 1))

    if package.get("semantic_memory"):
        sections.append(("БАЗА ЗНАНИЙ (ключевые факты)", package["semantic_memory"], 2))

    if package.get("user_preferences"):
        sections.append(("ПРЕДПОЧТЕНИЯ ПОЛЬЗОВАТЕЛЯ", package["user_preferences"], 3))

    if package.get("episodic_memory"):
        sections.append(("ЭПИЗОДИЧЕСКАЯ ПАМЯТЬ (прошлые диалоги)", package["episodic_memory"], 4))

    if package.get("relevant_solutions"):
        sections.append(("РЕЛЕВАНТНЫЕ РЕШЕНИЯ", package["relevant_solutions"], 5))

    # Build context string, trimming from lowest priority if over budget
    result_parts = []
    remaining_tokens = max_tokens

    for title, content, priority in sections:
        content_tokens = len(content) // 4
        if content_tokens > remaining_tokens:
            # Trim content to fit
            max_chars = remaining_tokens * 4
            content = content[:max_chars] + "\n... (обрезано)"
            remaining_tokens = 0
        else:
            remaining_tokens -= content_tokens

        result_parts.append(f"### {title}\n{content}")

        if remaining_tokens <= 0:
            break

    return "\n\n".join(result_parts)


async def summarize_conversation(
    db_conn,
    conversation_id: int,
    openai_client,
    model: str = "gpt-4.1-nano",
) -> Optional[dict]:
    """
    Create or update a summary for a conversation.
    Called after every N messages or when conversation ends.
    
    Returns the summary dict or None on failure.
    """
    from sqlalchemy import text

    try:
        # Get all messages for this conversation
        messages = db_conn.execute(text("""
            SELECT sender_type, content_text, created_at
            FROM messages
            WHERE conversation_id = :cid
            ORDER BY created_at ASC
        """), {"cid": conversation_id}).fetchall()

        if not messages or len(messages) < 3:
            return None

        # Build conversation text for summarization
        conv_text = ""
        for m in messages:
            role = "User" if m[0] == "user" else "AI"
            conv_text += f"[{role}]: {(m[1] or '')[:300]}\n"

        # Trim to fit in context
        conv_text = conv_text[:8000]

        # Call LLM to summarize
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": """You are a conversation summarizer. 
Analyze the conversation and produce a JSON response with:
1. "summary" - a concise summary in Russian (2-4 sentences)
2. "key_facts" - array of key facts discovered (strings, max 5)
3. "key_decisions" - array of decisions made (strings, max 5)
4. "entities" - array of mentioned entities (project names, technologies, people)

Respond ONLY with valid JSON, no markdown."""},
                {"role": "user", "content": f"Summarize this conversation:\n\n{conv_text}"}
            ],
            max_tokens=500,
            temperature=0.3,
        )

        result_text = response.choices[0].message.content.strip()
        # Parse JSON
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        
        summary_data = json.loads(result_text)

        # Upsert into conversation_summaries
        existing = db_conn.execute(text(
            "SELECT id FROM conversation_summaries WHERE conversation_id = :cid"
        ), {"cid": conversation_id}).fetchone()

        if existing:
            db_conn.execute(text("""
                UPDATE conversation_summaries
                SET summary_text = :summary,
                    key_facts = :facts,
                    key_decisions = :decisions,
                    entities_mentioned = :entities,
                    message_count = :msg_count,
                    updated_at = NOW()
                WHERE conversation_id = :cid
            """), {
                "summary": summary_data.get("summary", ""),
                "facts": json.dumps(summary_data.get("key_facts", [])),
                "decisions": json.dumps(summary_data.get("key_decisions", [])),
                "entities": json.dumps(summary_data.get("entities", [])),
                "msg_count": len(messages),
                "cid": conversation_id,
            })
        else:
            db_conn.execute(text("""
                INSERT INTO conversation_summaries
                    (conversation_id, summary_text, key_facts, key_decisions,
                     entities_mentioned, message_count)
                VALUES (:cid, :summary, :facts, :decisions, :entities, :msg_count)
            """), {
                "cid": conversation_id,
                "summary": summary_data.get("summary", ""),
                "facts": json.dumps(summary_data.get("key_facts", [])),
                "decisions": json.dumps(summary_data.get("key_decisions", [])),
                "entities": json.dumps(summary_data.get("entities", [])),
                "msg_count": len(messages),
            })

        # Update conversation tracking
        db_conn.execute(text("""
            UPDATE conversations
            SET last_summarized_at = NOW(),
                message_count_since_summary = 0
            WHERE id = :cid
        """), {"cid": conversation_id})

        db_conn.commit()

        logger.info(f"Summarized conversation {conversation_id}: {len(messages)} messages")
        return summary_data

    except Exception as e:
        logger.error(f"Failed to summarize conversation {conversation_id}: {e}")
        return None


async def extract_facts_from_message(
    db_conn,
    conversation_id: int,
    user_id: int,
    project_id: Optional[int],
    message_text: str,
    sender_type: str,
    message_id: int,
    openai_client,
    model: str = "gpt-4.1-nano",
) -> list:
    """
    Extract semantic facts from a message and store them.
    Only processes messages that likely contain factual information.
    """
    from sqlalchemy import text

    # Quick filter - skip short messages and simple commands
    if len(message_text) < 50:
        return []
    
    skip_patterns = ["привет", "спасибо", "ок", "да", "нет", "понял", "хорошо"]
    if message_text.strip().lower() in skip_patterns:
        return []

    try:
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": """Extract factual information from this message.
Return a JSON array of facts. Each fact has:
- "fact_type": one of "requirement", "decision", "preference", "constraint", "technology", "architecture", "bug", "solution"
- "subject": what the fact is about (short)
- "predicate": the relationship (e.g., "uses", "requires", "prefers", "decided to")
- "object_value": the value/detail
- "confidence": 0.0-1.0

Only extract clear, factual statements. Return empty array [] if no facts found.
Respond ONLY with valid JSON array."""},
                {"role": "user", "content": message_text[:2000]}
            ],
            max_tokens=300,
            temperature=0.2,
        )

        result_text = response.choices[0].message.content.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]

        facts = json.loads(result_text)
        if not isinstance(facts, list):
            return []

        stored = []
        for fact in facts[:5]:  # Max 5 facts per message
            if not all(k in fact for k in ("fact_type", "subject", "predicate", "object_value")):
                continue

            # Check for duplicate facts
            existing = db_conn.execute(text("""
                SELECT id FROM semantic_facts
                WHERE subject = :subj AND predicate = :pred
                  AND (project_id = :pid OR (project_id IS NULL AND :pid IS NULL))
                LIMIT 1
            """), {
                "subj": fact["subject"][:500],
                "pred": fact["predicate"][:200],
                "pid": project_id,
            }).fetchone()

            if existing:
                # Update confidence
                db_conn.execute(text("""
                    UPDATE semantic_facts
                    SET object_value = :obj, confidence = LEAST(confidence + 0.1, 1.0),
                        updated_at = NOW()
                    WHERE id = :id
                """), {"obj": fact["object_value"], "id": existing[0]})
            else:
                db_conn.execute(text("""
                    INSERT INTO semantic_facts
                        (user_id, project_id, fact_type, subject, predicate,
                         object_value, confidence, source_conversation_id, source_message_id)
                    VALUES (:uid, :pid, :ftype, :subj, :pred, :obj, :conf, :cid, :mid)
                """), {
                    "uid": user_id,
                    "pid": project_id,
                    "ftype": fact["fact_type"],
                    "subj": fact["subject"][:500],
                    "pred": fact["predicate"][:200],
                    "obj": fact["object_value"],
                    "conf": fact.get("confidence", 0.8),
                    "cid": conversation_id,
                    "mid": message_id,
                })
            stored.append(fact)

        if stored:
            db_conn.commit()
            logger.info(f"Extracted {len(stored)} facts from message {message_id}")

        return stored

    except Exception as e:
        logger.warning(f"Failed to extract facts: {e}")
        return []


def should_summarize(db_conn, conversation_id: int) -> bool:
    """Check if a conversation needs summarization based on message count."""
    from sqlalchemy import text
    try:
        row = db_conn.execute(text("""
            SELECT message_count_since_summary, last_summarized_at
            FROM conversations WHERE id = :cid
        """), {"cid": conversation_id}).fetchone()

        if not row:
            return False

        count = row[0] or 0
        last_summary = row[1]

        # Summarize every N messages or if never summarized and has enough messages
        if count >= SUMMARY_TRIGGER_MESSAGES:
            return True
        if last_summary is None and count >= 5:
            return True

        return False
    except Exception:
        return False


def increment_message_counter(db_conn, conversation_id: int):
    """Increment the message counter for summary tracking."""
    from sqlalchemy import text
    try:
        db_conn.execute(text("""
            UPDATE conversations
            SET message_count_since_summary = COALESCE(message_count_since_summary, 0) + 1
            WHERE id = :cid
        """), {"cid": conversation_id})
        db_conn.commit()
    except Exception as e:
        logger.warning(f"Failed to increment message counter: {e}")
