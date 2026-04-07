"""
WorkflowTranslator — Bidirectional translator between React Flow (RF) and n8n workflow format.

RF → n8n: translate_to_n8n(rf_nodes, rf_edges, name)

n8n Connection Format (indexed):
  {
    "NodeName": {
      "main": [[{"node": "TargetNode", "type": "main", "index": 0}]]
    }
  }

Node Type Map:
  RF type         -> n8n type
  -----------------------------------------
  start           -> n8n-nodes-base.start
  trigger         -> n8n-nodes-base.webhook
  webhook_trigger -> n8n-nodes-base.webhook
  schedule_trigger-> n8n-nodes-base.scheduleTrigger
  ai_agent        -> n8n-nodes-base.openAi         (as specified)
  prompt          -> @n8n/n8n-nodes-langchain.agent
  llm             -> @n8n/n8n-nodes-langchain.lmChatOpenAi
  condition / if  -> n8n-nodes-base.if
  delay           -> n8n-nodes-base.wait
  http_request    -> n8n-nodes-base.httpRequest
  clickmassa      -> n8n-nodes-base.httpRequest
  skill_executor  -> @n8n/n8n-nodes-langchain.agent
  code            -> n8n-nodes-base.code
  set_variables   -> n8n-nodes-base.set
  output          -> n8n-nodes-base.set

MCP Future Note:
  This translator is the foundation for MCP-compatible tool protocol.
  Each node type maps to a tool provider schema in the MCP model.
  To add MCP nodes, extend N8N_NODE_MAP with mcp-compatible types.
"""

from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Node Type Registry
# ─────────────────────────────────────────────
N8N_NODE_MAP: Dict[str, Dict] = {
    "start": {
        "type": "n8n-nodes-base.start",
        "typeVersion": 1,
        "category": "trigger",
    },
    "trigger": {
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 1,
        "category": "trigger",
    },
    "webhook_trigger": {
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 1,
        "category": "trigger",
    },
    "schedule_trigger": {
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2,
        "category": "trigger",
    },
    "ai_agent": {
        "type": "n8n-nodes-base.openAi",           # as specified
        "typeVersion": 1,
        "category": "action",
    },
    "prompt": {
        "type": "@n8n/n8n-nodes-langchain.agent",
        "typeVersion": 1.7,
        "category": "action",
    },
    "llm": {
        "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        "typeVersion": 1.1,
        "category": "action",
    },
    "condition": {
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "category": "action",
    },
    "if": {
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "category": "action",
    },
    "delay": {
        "type": "n8n-nodes-base.wait",
        "typeVersion": 1.1,
        "category": "action",
    },
    "http_request": {
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "category": "action",
    },
    "clickmassa": {
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "category": "action",
    },
    "skill_executor": {
        "type": "@n8n/n8n-nodes-langchain.agent",
        "typeVersion": 1.7,
        "category": "action",
    },
    "code": {
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "category": "action",
    },
    "set_variables": {
        "type": "n8n-nodes-base.set",
        "typeVersion": 3.4,
        "category": "action",
    },
    "output": {
        "type": "n8n-nodes-base.set",
        "typeVersion": 3.4,
        "category": "action",
    },
}


class WorkflowTranslator:
    """
    Translates a React Flow graph into a valid n8n workflow JSON.

    Usage:
        translator = WorkflowTranslator()
        n8n_workflow = translator.translate_to_n8n(rf_nodes, rf_edges, "My Workflow")
    """

    def translate_to_n8n(
        self,
        rf_nodes: List[Dict],
        rf_edges: List[Dict],
        workflow_name: str = "AI Studio Workflow",
    ) -> Dict[str, Any]:
        """Full translation: RF graph → n8n workflow JSON."""
        n8n_nodes = [self._translate_node(n) for n in rf_nodes]
        connections = self._translate_edges(rf_edges, rf_nodes)

        return {
            "name": workflow_name,
            "nodes": n8n_nodes,
            "connections": connections,
            "active": False,
            "settings": {
                "executionOrder": "v1",
                "saveManualExecutions": True,
                "callerPolicy": "workflowsFromSameOwner",
            },
            "tags": ["ai-studio", "click-massa"],
        }

    # ─────────────────────────────────────────
    # Node Translation
    # ─────────────────────────────────────────

    def _translate_node(self, rf_node: Dict) -> Dict:
        """Translate a single RF node to n8n node format."""
        node_type = rf_node.get("type", "start")
        data = rf_node.get("data", {})
        position = rf_node.get("position", {"x": 100, "y": 100})
        node_name = data.get("label") or rf_node.get("id")

        mapping = N8N_NODE_MAP.get(node_type)
        if not mapping:
            logger.warning(f"Unknown node type '{node_type}', mapping to set")
            mapping = N8N_NODE_MAP["output"]

        return {
            "id": rf_node.get("id"),
            "name": node_name,
            "type": mapping["type"],
            "typeVersion": mapping["typeVersion"],
            "position": [int(position.get("x", 100)), int(position.get("y", 100))],
            "parameters": self._extract_params(node_type, data),
            "notes": data.get("description", ""),
        }

    def _extract_params(self, node_type: str, data: Dict) -> Dict:
        """Extract n8n parameters from RF node data."""
        extractors = {
            "trigger": lambda d: {
                "httpMethod": d.get("method", "POST"),
                "path": d.get("path", "webhook"),
                "responseMode": "lastNode",
            },
            "webhook_trigger": lambda d: {
                "httpMethod": d.get("method", "POST"),
                "path": d.get("path", "webhook"),
                "responseMode": "lastNode",
            },
            "schedule_trigger": lambda d: {
                "rule": {"interval": [{"field": "hours", "hoursInterval": d.get("interval_hours", 1)}]},
            },
            "ai_agent": lambda d: {
                "resource": "text",
                "operation": "message",
                "model": d.get("model", "gpt-4o"),
                "messages": {"values": [{"content": d.get("prompt", ""), "role": "user"}]},
            },
            "prompt": lambda d: {
                "systemMessage": d.get("system_instruction", ""),
                "text": d.get("prompt", ""),
            },
            "llm": lambda d: {
                "model": d.get("model", "gpt-4o"),
                "temperature": d.get("temperature", 0.7),
            },
            "condition": lambda d: {
                "conditions": {
                    "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                    "conditions": [{
                        "leftValue": f"={{{{ ${{{d.get('condition_field', 'value')}}}}} }}",
                        "rightValue": d.get("condition_value", ""),
                        "operator": {"operation": d.get("operator", "equal"), "type": "string"},
                    }],
                    "combinator": "and",
                },
            },
            "delay": lambda d: {
                "resume": "timeInterval",
                "unit": "hours",
                "amount": d.get("delay_hours", 1),
            },
            "http_request": lambda d: {
                "method": d.get("method", "GET"),
                "url": d.get("url", ""),
                "sendHeaders": bool(d.get("headers")),
                "sendBody": bool(d.get("body")),
                "bodyContentType": "json",
            },
            "clickmassa": lambda d: {
                "method": "POST",
                "url": "={{ $env.CLICKMASSA_API_URL }}",
                "sendHeaders": True,
                "headerParameters": {"parameters": [{"name": "Authorization", "value": "Bearer {{ $env.CLICKMASSA_API_KEY }}"}]},
                "sendBody": True,
                "bodyContentType": "json",
            },
            "skill_executor": lambda d: {
                "text": d.get("skill", ""),
            },
            "code": lambda d: {
                "language": d.get("language", "javaScript"),
                "jsCode": d.get("code", "return [{json: $input.item}];"),
            },
            "output": lambda d: {
                "mode": "manual",
                "assignments": {"assignments": [
                    {"id": "1", "name": "result", "value": "={{ $json }}", "type": "string"}
                ]},
            },
        }

        extractor = extractors.get(node_type)
        return extractor(data) if extractor else {}

    # ─────────────────────────────────────────
    # Edge / Connection Translation
    # ─────────────────────────────────────────

    def _translate_edges(self, rf_edges: List[Dict], rf_nodes: List[Dict]) -> Dict:
        """
        Translate RF edges to n8n connections format.

        n8n uses node NAMES (not IDs) in connections.
        Maps: source_name -> { "main": [[{ "node": target_name, "type": "main", "index": 0 }]] }

        For condition nodes with sourceHandle "yes"/"no":
          - "yes" → main[0] (true branch)
          - "no"  → main[1] (false branch)
        """
        # Build id→name map
        id_to_name = {
            n.get("id"): (n.get("data", {}).get("label") or n.get("id"))
            for n in rf_nodes
        }

        connections: Dict[str, Dict] = {}

        for edge in rf_edges:
            source_id = edge.get("source", "")
            target_id = edge.get("target", "")
            source_handle = edge.get("sourceHandle")

            source_name = id_to_name.get(source_id, source_id)
            target_name = id_to_name.get(target_id, target_id)

            if source_name not in connections:
                connections[source_name] = {"main": [[]]}

            # Condition node: yes → index 0, no → index 1
            if source_handle == "no":
                while len(connections[source_name]["main"]) < 2:
                    connections[source_name]["main"].append([])
                branch_idx = 1
            else:
                branch_idx = 0

            while len(connections[source_name]["main"]) <= branch_idx:
                connections[source_name]["main"].append([])

            connections[source_name]["main"][branch_idx].append({
                "node": target_name,
                "type": "main",
                "index": 0,
            })

        return connections

    def validate_graph(self, rf_nodes: List[Dict], rf_edges: List[Dict]) -> Dict:
        """Validate the RF graph before translation."""
        errors = []
        warnings = []

        if not rf_nodes:
            errors.append("O fluxo não contém nenhum nó.")

        trigger_types = {"start", "trigger", "webhook_trigger", "schedule_trigger"}
        has_trigger = any(n.get("type") in trigger_types for n in rf_nodes)
        if not has_trigger:
            warnings.append("Nenhum nó de gatilho (Start/Trigger) encontrado. O workflow pode não ser ativável.")

        # Check for disconnected nodes
        connected_ids = set()
        for e in rf_edges:
            connected_ids.add(e.get("source"))
            connected_ids.add(e.get("target"))
        all_ids = {n.get("id") for n in rf_nodes}
        isolated = all_ids - connected_ids
        if len(isolated) > 0 and len(rf_nodes) > 1:
            warnings.append(f"{len(isolated)} nó(s) desconectado(s): {', '.join(list(isolated)[:3])}")

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}
