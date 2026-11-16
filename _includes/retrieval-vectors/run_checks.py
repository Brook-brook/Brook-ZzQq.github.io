"""Independent tiny-matrix/contract checks for the actual stdlib project."""
from copy import deepcopy
import math
from pathlib import Path
import unittest
from vectors import create_vector_run, fit_vector_index, literal_terms, read_json, validate_registry, vector_counts, vector_evidence, vector_report

ROOT = Path(__file__).resolve().parent
CORPUS = read_json((ROOT / "corpus.json").read_text(encoding="utf-8"))
REGISTRY = read_json((ROOT / "registry.json").read_text(encoding="utf-8"))
SETTINGS = {"query": "保留 空间", "weighting": "tfidf", "version": "all", "k": 2}


def small():
    data = {"schema_version": 1, "corpus_id": "tiny-original", "title": "z", "disclosure": "Original test counts, not real evidence",
            "documents": [{"id": "tiny-doc", "title": "z", "version": "v1"}],
            "fragments": [{"id": f"row-{i}", "document_id": "tiny-doc", "section": "z", "text": value} for i, value in enumerate(["aa b", "b", "z"])],
            "tasks": [{"id": "free", "title": "z", "question": "z", "query": "a b", "relevant_ids": None, "annotation_reason": "No annotation"}]}
    return data, {**REGISTRY, "corpus_id": data["corpus_id"], "vocabulary": ["a", "b"]}


class VectorChecks(unittest.TestCase):
    def test_hand_matrix_and_smoothed_idf(self):
        data, registry = small()
        run = create_vector_run(data, registry, {**SETTINGS, "query": "a b"})
        self.assertEqual([row["counts"] for row in run["index"]["rows"]], [[2, 1], [0, 1], [0, 0]])
        self.assertEqual(run["index"]["document_frequency"], [1, 2])
        a, b = 1 + math.log(2), 1 + math.log(4 / 3)
        self.assertEqual(run["index"]["inverse_document_frequency"], [a, b])
        expected = (2 * a * a + b * b) / math.sqrt((a * a + b * b) * (4 * a * a + b * b))
        self.assertAlmostEqual(run["scores"][0]["cosine"], expected, places=13)

    def test_count_mode_and_unit_length(self):
        data, registry = small()
        run = create_vector_run(data, registry, {**SETTINGS, "query": "a b", "weighting": "count"})
        self.assertEqual(run["index"]["applied_idf"], [1, 1])
        self.assertAlmostEqual(run["scores"][0]["cosine"], 3 / math.sqrt(10), places=13)
        self.assertAlmostEqual(math.fsum(value * value for value in run["query"]["unit_vector"]), 1, places=13)

    def test_zero_vectors_are_not_orthogonality(self):
        data, registry = small()
        run = create_vector_run(data, registry, {**SETTINGS, "query": "a"})
        self.assertEqual(run["scores"][1]["cosine"], 0)
        self.assertIsNone(run["scores"][2]["cosine"])
        empty = create_vector_run(data, registry, {**SETTINGS, "query": "unknown"})
        self.assertIsNone(empty["query"]["unit_vector"])
        self.assertTrue(all(row["cosine"] is None for row in empty["scores"]))
        self.assertEqual(empty["ranked_ids"], [])

    def test_fixed_feature_counts_and_normalization(self):
        self.assertEqual(vector_counts("AAAA", ["a", "aa"]), [4, 2])
        self.assertEqual(vector_counts("Ａa e\u0301 🪻🪻", ["a", "é", "🪻"]), [2, 1, 2])
        self.assertEqual(literal_terms("保留\ufeff空间 保留"), ["保留", "空间"])
        for words in [[], [""], ["a", "a"], ["Ａ"], ["a b"]]:
            with self.assertRaises(ValueError): vector_counts("x", words)
        with self.assertRaises(ValueError): vector_counts("\ud800", ["a"])

    def test_display_filter_and_query_never_refit(self):
        original = create_vector_run(CORPUS, REGISTRY, SETTINGS)
        v2 = create_vector_run(CORPUS, REGISTRY, {**SETTINGS, "version": "v2"})
        changed = create_vector_run(CORPUS, REGISTRY, {**SETTINGS, "query": "预算 调用"})
        self.assertEqual(original["index"], v2["index"])
        self.assertEqual(original["index"], changed["index"])
        self.assertEqual(original["index"]["document_count"], 8)
        self.assertNotIn("a-retention-old", v2["ranked_ids"])

    def test_missing_feature_coverage_keeps_literal_hits(self):
        run = create_vector_run(CORPUS, REGISTRY, {**SETTINGS, "query": "7天"})
        self.assertEqual(run["ranked_ids"], [])
        self.assertGreater(run["literal_baseline"]["candidate_count"], 0)
        self.assertEqual(create_vector_run(CORPUS, REGISTRY, {**SETTINGS, "query": ""})["candidate_count"], 0)

    def test_contributions_sum_to_actual_score(self):
        run = create_vector_run(CORPUS, REGISTRY, SETTINGS)
        for row in run["scores"]:
            evidence = vector_evidence(run, row["id"])
            self.assertEqual(len(evidence["terms"]), 14)
            self.assertAlmostEqual(math.fsum(term["contribution"] for term in evidence["terms"]), row["cosine"], places=13)
        data, registry = small()
        undefined = vector_evidence(create_vector_run(data, registry, {**SETTINGS, "query": "unknown"}), "row-0")
        self.assertTrue(all(row["contribution"] is None for row in undefined["terms"]))

    def test_ties_and_absent_feature_df(self):
        data, registry = small()
        data["fragments"] = [{**data["fragments"][0], "id": "z-row", "text": "a"}, {**data["fragments"][1], "id": "a-row", "text": "a"}]
        run = create_vector_run(data, registry, {**SETTINGS, "query": "a", "k": 8})
        self.assertEqual(run["ranked_ids"], ["a-row", "z-row"])
        self.assertEqual(run["index"]["document_frequency"][1], 0)
        self.assertEqual(run["index"]["inverse_document_frequency"][1], 1 + math.log(3))

    def test_bounds_types_and_complete_record_replay(self):
        for fields in [{"k": True}, {"k": 0}, {"k": 9}, {"version": "v3"}, {"weighting": "semantic"}, {"query": "a" * 201}, {"query": "a b c d e f g"}, {"private_note": "not allowed"}]:
            with self.assertRaises(ValueError): create_vector_run(CORPUS, REGISTRY, {**SETTINGS, **fields})
        with self.assertRaises(ValueError): validate_registry({**REGISTRY, "corpus_id": "other"}, CORPUS)
        with self.assertRaises(ValueError): fit_vector_index(CORPUS, REGISTRY, "bad")
        run = create_vector_run(CORPUS, REGISTRY, SETTINGS)
        tampered = deepcopy(run); tampered["scores"][0]["cosine"] = 99
        with self.assertRaises(ValueError): vector_report(tampered)
        tampered = deepcopy(run); tampered["index"]["document_count"] = True
        with self.assertRaises(ValueError): vector_report(tampered)
        self.assertFalse(vector_report(run)["model_called"])
        self.assertEqual(CORPUS["corpus_id"], "brook-retrieval-teaching-v1")

    def test_json_duplicate_nonfinite_and_unicode_policy(self):
        for source in ['{"x":1,"x":2}', '{"x":NaN}', '{"x":Infinity}', '{"x":1e10000}']:
            with self.assertRaises(ValueError): read_json(source)
        self.assertEqual(read_json('{"x":"🪻"}'), {"x": "🪻"})
        with self.assertRaises(ValueError): literal_terms("\ud800")
        with self.assertRaises(ValueError): read_json("x" * (256 * 1024 + 1))


if __name__ == "__main__":
    unittest.main(verbosity=2)
