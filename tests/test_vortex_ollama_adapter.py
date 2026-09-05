#!/usr/bin/env python3
import unittest
from types import SimpleNamespace
from vortex_ollama_adapter import execution_proof, extract_structured_output, ollama_format_from_openai

SCHEMA={"type":"object","additionalProperties":False,"required":["version","file"],"properties":{"version":{"type":"string","const":"patch.v1"},"file":{"type":"string","enum":["src/fibonacci.js"]}}}
RF={"type":"json_schema","json_schema":{"name":"test","strict":True,"schema":SCHEMA}}

class AdapterTests(unittest.TestCase):
    def test_openai_schema_maps_to_ollama_format(self):
        self.assertEqual(ollama_format_from_openai(RF), SCHEMA)

    def test_structured_output_rejects_markdown_fence(self):
        with self.assertRaises(ValueError):
            extract_structured_output('```json {"version":"patch.v1","file":"src/fibonacci.js"} ```', RF)

    def test_structured_output_validates_schema(self):
        text='{"version":"patch.v1","file":"src/fibonacci.js"}'
        self.assertEqual(extract_structured_output(text, RF)[1]["version"], "patch.v1")

    def test_http_success_without_execution_telemetry_is_not_executed(self):
        evidence=execution_proof("inv-1", {"model":"qwen"}, {"done":True,"eval_count":0,"eval_duration":0}, 1.0, "qwen", "ok")
        self.assertFalse(evidence["executed"])
        self.assertEqual(evidence["exit_code"], 1)

    def test_completed_generation_is_executed(self):
        evidence=execution_proof("inv-1", {"model":"qwen"}, {"done":True,"eval_count":3,"eval_duration":1000}, 2.0, "qwen", "ok")
        self.assertTrue(evidence["executed"])
        self.assertEqual(evidence["exit_code"], 0)
        self.assertTrue(evidence["evidence_hash"])

if __name__ == "__main__":
    unittest.main()
