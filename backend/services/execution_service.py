"""
ExecutionEngine — executa fluxos React Flow nó a nó, streamando eventos via WebSocket.

Fluxo:
  1. Encontra nós de gatilho (start/trigger)
  2. BFS a partir do gatilho, executando cada nó
  3. Para condition nodes: segue o branch correto (yes/no)
  4. Envia eventos WebSocket: execution_start, node_start, node_done, node_error, execution_done
"""
import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import WebSocket
import httpx

from services.llm_service import run_llm

logger = logging.getLogger(__name__)

TRIGGER_TYPES = {"start", "trigger", "webhook_trigger", "schedule_trigger"}


class ExecutionEngine:
    async def run_flow(
        self,
        nodes: List[Dict],
        edges: List[Dict],
        input_text: str,
        websocket: WebSocket,
        session_id: str,
    ) -> Dict[str, Any]:
        """Execute the full flow and stream progress over WebSocket."""
        node_map = {n["id"]: n for n in nodes}

        # Build adjacency list (source → [(target_id, source_handle)])
        adj: Dict[str, List] = {n["id"]: [] for n in nodes}
        in_degree: Dict[str, int] = {n["id"]: 0 for n in nodes}
        for edge in edges:
            src, tgt = edge.get("source", ""), edge.get("target", "")
            handle = edge.get("sourceHandle")
            if src in adj and tgt in adj:
                adj[src].append((tgt, handle))
                in_degree[tgt] += 1

        # Find start nodes
        start_ids = [n["id"] for n in nodes if n.get("type") in TRIGGER_TYPES]
        if not start_ids:
            start_ids = [n["id"] for n in nodes if in_degree.get(n["id"], 0) == 0]
        if not start_ids and nodes:
            start_ids = [nodes[0]["id"]]

        total = len(nodes)
        results: Dict[str, Any] = {}
        visited: set = set()
        completed = 0

        context: Dict[str, Any] = {"input": input_text, "output": input_text}

        await self._send(websocket, {
            "type": "execution_start",
            "total_nodes": total,
            "input": input_text,
        })

        async def execute_node_recursive(node_id: str, ctx: Dict) -> Dict:
            nonlocal completed
            if node_id in visited:
                return ctx
            visited.add(node_id)

            node = node_map.get(node_id)
            if not node:
                return ctx

            node_name = node.get("data", {}).get("label") or node_id

            await self._send(websocket, {
                "type": "node_start",
                "node_id": node_id,
                "node_name": node_name,
                "node_type": node.get("type"),
            })

            t0 = asyncio.get_event_loop().time()
            try:
                result = await self._execute_node(node, ctx, session_id)
                duration_ms = int((asyncio.get_event_loop().time() - t0) * 1000)
                completed += 1

                results[node_id] = {
                    "status": "done",
                    "output": result.get("output"),
                    "duration_ms": duration_ms,
                }

                await self._send(websocket, {
                    "type": "node_done",
                    "node_id": node_id,
                    "node_name": node_name,
                    "output": result.get("output"),
                    "duration_ms": duration_ms,
                    "progress": f"{completed}/{total}",
                })

                # Determine next nodes
                next_list = adj.get(node_id, [])
                if node.get("type") in {"condition", "if"}:
                    branch = result.get("branch", "yes")
                    next_list = [
                        (t, h) for (t, h) in next_list
                        if h == branch or h is None
                    ]

                next_ctx = {**ctx, "output": result.get("output", ctx.get("output"))}
                for target_id, _ in next_list:
                    next_ctx = await execute_node_recursive(target_id, next_ctx)
                return next_ctx

            except Exception as e:
                results[node_id] = {"status": "error", "error": str(e)}
                await self._send(websocket, {
                    "type": "node_error",
                    "node_id": node_id,
                    "node_name": node_name,
                    "error": str(e),
                })
                return ctx

        try:
            final_ctx = context
            for start_id in start_ids:
                final_ctx = await execute_node_recursive(start_id, final_ctx)

            final_output = final_ctx.get("output", "")
            await self._send(websocket, {
                "type": "execution_done",
                "output": final_output,
                "node_results": results,
                "total_nodes": total,
                "completed": completed,
            })
            return {"output": final_output, "results": results}

        except Exception as e:
            await self._send(websocket, {"type": "execution_error", "error": str(e)})
            return {"error": str(e)}

    # ─── Node Executors ───────────────────────────────────────────────

    async def _execute_node(self, node: Dict, ctx: Dict, session_id: str) -> Dict:
        node_type = node.get("type", "output")
        data = node.get("data", {})
        prev_output = ctx.get("output", ctx.get("input", ""))

        if node_type in TRIGGER_TYPES:
            return {"output": ctx.get("input", {})}

        if node_type in {"ai_agent", "prompt", "llm", "skill_executor"}:
            prompt_text = data.get("prompt") or (
                f"Você recebeu os seguintes dados: {json.dumps(prev_output, ensure_ascii=False)}. "
                f"Processe e responda de forma útil."
            )
            system = data.get("system_instruction", "")
            model = data.get("model", "gpt-4o")
            response = await run_llm(
                prompt=prompt_text,
                system=system,
                model=model,
                session_id=f"{session_id}_{node['id']}",
            )
            return {"output": response}

        if node_type in {"condition", "if"}:
            field = data.get("condition_field", "")
            value = data.get("condition_value", "")
            operator = data.get("operator", "equal")
            actual = (
                prev_output.get(field, "")
                if isinstance(prev_output, dict)
                else str(prev_output)
            )
            met = self._eval_condition(actual, value, operator)
            return {
                "output": prev_output,
                "condition_met": met,
                "branch": "yes" if met else "no",
            }

        if node_type == "delay":
            hours = float(data.get("delay_hours", 0.5))
            await asyncio.sleep(min(hours * 0.1, 1.5))
            return {"output": prev_output, "simulated_delay_hours": hours}

        if node_type == "http_request":
            url = data.get("url", "")
            method = data.get("method", "GET").upper()
            if not url:
                return {"output": {"error": "URL não especificada"}}
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await getattr(client, method.lower())(url)
                    return {"output": {
                        "status_code": resp.status_code,
                        "body": resp.text[:800],
                    }}
            except Exception as e:
                return {"output": {"error": str(e)}}

        if node_type == "clickmassa":
            await asyncio.sleep(0.3)
            return {"output": {
                "provider": "ClickMassa Mock",
                "action": data.get("action", "send_message"),
                "status": "sent",
            }}

        if node_type == "code":
            await asyncio.sleep(0.2)
            return {"output": prev_output, "code_language": data.get("language", "javaScript"), "note": "Execução simulada"}

        # set_variables, output, unknown — pass through
        return {"output": prev_output}

    @staticmethod
    def _eval_condition(actual: Any, value: str, operator: str) -> bool:
        try:
            if operator == "equal":
                return str(actual) == str(value)
            if operator == "notEqual":
                return str(actual) != str(value)
            if operator == "contains":
                return str(value).lower() in str(actual).lower()
            if operator in {"greater", "greaterEqual"}:
                return float(actual) >= float(value) if "Equal" in operator else float(actual) > float(value)
            if operator in {"smaller", "smallerEqual"}:
                return float(actual) <= float(value) if "Equal" in operator else float(actual) < float(value)
        except Exception:
            pass
        return False

    @staticmethod
    async def _send(websocket: WebSocket, payload: Dict) -> None:
        try:
            await websocket.send_json(payload)
        except Exception:
            pass
