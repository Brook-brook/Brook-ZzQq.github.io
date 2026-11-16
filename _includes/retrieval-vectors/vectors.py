"""Original bounded lexical-vector exercise; stdlib only, no semantic model.

The feature registry is explicit. Its non-overlapping substring counter is not
a Chinese tokenizer. Fit fragment-level IDF on the complete snapshot, then filter.
"""
from copy import deepcopy
import json
import math
import re
import unicodedata

JS_WHITE = "\t\n\v\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"
WHITE_RE = re.compile("[" + JS_WHITE + "]+")
IDENTIFIER = re.compile(r"[a-z][a-z0-9-]{0,59}\Z")


def exact(value, fields):
    return type(value) is dict and set(value) == set(fields)


def well_formed(value):
    return not any(0xD800 <= ord(character) <= 0xDFFF for character in value)


def text(value, bound):
    return type(value) is str and bool(value.strip(JS_WHITE)) and len(value) <= bound and well_formed(value)


def normalize(value):
    return unicodedata.normalize("NFKC", value).lower()


def identifier(value):
    return type(value) is str and bool(IDENTIFIER.fullmatch(value))


def literal_terms(query):
    if type(query) is not str or len(query) > 200 or not well_formed(query):
        raise ValueError("vector_query")
    words = list(dict.fromkeys(word for word in WHITE_RE.split(normalize(query).strip(JS_WHITE)) if word))
    if len(words) > 6 or any(len(word) > 40 for word in words):
        raise ValueError("vector_query_terms")
    return words


def validate_corpus(corpus):
    if not exact(corpus, ["schema_version", "corpus_id", "title", "disclosure", "documents", "fragments", "tasks"]) or type(corpus["schema_version"]) is not int or corpus["schema_version"] != 1 or not identifier(corpus["corpus_id"]) or not text(corpus["title"], 200) or not text(corpus["disclosure"], 1000):
        raise ValueError("vector_corpus")
    for key, maximum in [("documents", 20), ("fragments", 100), ("tasks", 10)]:
        rows = corpus[key]
        if type(rows) is not list or not 1 <= len(rows) <= maximum or any(type(row) is not dict or not identifier(row.get("id")) for row in rows) or len({row["id"] for row in rows}) != len(rows):
            raise ValueError("vector_corpus_rows")
    for row in corpus["documents"]:
        if not exact(row, ["id", "title", "version"]) or not text(row["title"], 120) or type(row["version"]) is not str or not re.fullmatch(r"v[1-9][0-9]{0,2}", row["version"]):
            raise ValueError("vector_document")
    documents = {row["id"] for row in corpus["documents"]}
    for row in corpus["fragments"]:
        if not exact(row, ["id", "document_id", "section", "text"]) or type(row["document_id"]) is not str or row["document_id"] not in documents or not text(row["section"], 120) or not text(row["text"], 1500):
            raise ValueError("vector_fragment")
    fragments = {row["id"] for row in corpus["fragments"]}
    for row in corpus["tasks"]:
        if not exact(row, ["id", "title", "question", "query", "relevant_ids", "annotation_reason"]) or not text(row["title"], 120) or not text(row["question"], 300) or not text(row["annotation_reason"], 1000):
            raise ValueError("vector_task")
        literal_terms(row["query"])
        relevant = row["relevant_ids"]
        if relevant is not None and (type(relevant) is not list or any(not identifier(item) or item not in fragments for item in relevant) or len(set(relevant)) != len(relevant)):
            raise ValueError("vector_annotation")
    return corpus


def validate_registry(registry, corpus):
    validate_corpus(corpus)
    if not exact(registry, ["schema_version", "id", "source_kind", "corpus_id", "feature_policy", "description", "vocabulary"]) or type(registry["schema_version"]) is not int or registry["schema_version"] != 1 or registry["id"] != "brook-lexical-vectors-v1" or registry["source_kind"] != "original_feature_registry" or registry["corpus_id"] != corpus["corpus_id"] or registry["feature_policy"] != "nfkc-lower-nonoverlap-substrings-v1" or not text(registry["description"], 500):
        raise ValueError("vector_registry")
    words = registry["vocabulary"]
    if type(words) is not list or not 1 <= len(words) <= 32 or any(not text(word, 24) or any(character in JS_WHITE for character in word) or normalize(word) != word for word in words) or len(set(words)) != len(words):
        raise ValueError("vector_vocabulary")
    return deepcopy(registry)


def vector_counts(value, vocabulary):
    if type(value) is not str or len(value) > 4096 or not well_formed(value) or type(vocabulary) is not list or not 1 <= len(vocabulary) <= 32 or any(not text(word, 24) or any(character in JS_WHITE for character in word) or normalize(word) != word for word in vocabulary) or len(set(vocabulary)) != len(vocabulary):
        raise ValueError("vector_counts")
    normalized = normalize(value)
    if len(normalized) > 8192:
        raise ValueError("vector_text_size")
    return [normalized.count(term) for term in vocabulary]


def transformed(counts, weights):
    weighted = [count * weight for count, weight in zip(counts, weights)]
    norm = math.sqrt(math.fsum(value * value for value in weighted))
    return {"counts": counts, "weighted": weighted, "norm": norm,
            "unit_vector": [value / norm for value in weighted] if norm else None}


def fit_vector_index(corpus, registry, weighting="tfidf"):
    validate_corpus(corpus)
    checked = validate_registry(registry, corpus)
    if weighting not in ("count", "tfidf"):
        raise ValueError("vector_weighting")
    documents = {row["id"]: row for row in corpus["documents"]}
    counts = [vector_counts(documents[row["document_id"]]["title"] + "\n" + row["section"] + "\n" + row["text"], checked["vocabulary"]) for row in corpus["fragments"]]
    frequencies = [sum(row[column] > 0 for row in counts) for column in range(len(checked["vocabulary"]))]
    idf = [math.log((len(counts) + 1) / (value + 1)) + 1 for value in frequencies]
    applied = idf if weighting == "tfidf" else [1 for _ in idf]
    return {"document_count": len(counts), "fit_fragment_ids": [row["id"] for row in corpus["fragments"]],
            "document_frequency": frequencies, "inverse_document_frequency": idf, "applied_idf": applied,
            "rows": [{"id": source["id"], **transformed(row, applied)} for source, row in zip(corpus["fragments"], counts)]}


def checked_settings(settings, corpus):
    if not exact(settings, ["query", "weighting", "version", "k"]) or settings["weighting"] not in ("count", "tfidf") or settings["version"] not in ["all"] + [row["version"] for row in corpus["documents"]] or type(settings["k"]) is not int or not 1 <= settings["k"] <= 8:
        raise ValueError("vector_settings")
    literal_terms(settings["query"])
    return deepcopy(settings)


def create_vector_run(corpus, registry, settings):
    corpus = deepcopy(validate_corpus(corpus))
    registry = validate_registry(registry, corpus)
    settings = checked_settings(settings, corpus)
    index = fit_vector_index(corpus, registry, settings["weighting"])
    query = transformed(vector_counts(settings["query"], registry["vocabulary"]), index["applied_idf"])
    documents = {row["id"]: row for row in corpus["documents"]}
    scores, baseline = [], []
    terms = literal_terms(settings["query"])
    for source, row in zip(corpus["fragments"], index["rows"]):
        document = documents[source["document_id"]]
        included = settings["version"] == "all" or document["version"] == settings["version"]
        cosine = None if query["unit_vector"] is None or row["unit_vector"] is None else math.fsum(a * b for a, b in zip(query["unit_vector"], row["unit_vector"]))
        scores.append({"id": row["id"], "version": document["version"], "cosine": cosine, "included": included})
        haystack = normalize(document["title"] + "\n" + source["section"] + "\n" + source["text"])
        matched = [term for term in terms if term in haystack]
        if included and matched:
            baseline.append({"id": row["id"], "score": len(matched), "matched_terms": matched})
    candidates = sorted((row for row in scores if row["included"] and row["cosine"] is not None and row["cosine"] > 0), key=lambda row: (-row["cosine"], row["id"]))
    baseline.sort(key=lambda row: (-row["score"], row["id"]))
    return {"schema_version": 1, "kind": "brook-lexical-vector-run", "corpus": corpus, "registry": registry, "settings": settings,
            "index": index, "query": query, "scores": scores, "candidate_count": len(candidates),
            "ranked_ids": [row["id"] for row in candidates[:settings["k"]]],
            "literal_baseline": {"terms": terms, "candidate_count": len(baseline), "ranked": baseline[:settings["k"]]}}


def replay(run):
    if not exact(run, ["schema_version", "kind", "corpus", "registry", "settings", "index", "query", "scores", "candidate_count", "ranked_ids", "literal_baseline"]):
        raise ValueError("vector_record")
    actual = create_vector_run(run["corpus"], run["registry"], run["settings"])
    def same(expected, observed):
        if type(expected) in (int, float):
            return type(observed) in (int, float) and math.isfinite(observed) and expected == observed
        if type(expected) is dict:
            return type(observed) is dict and set(expected) == set(observed) and all(same(value, observed[key]) for key, value in expected.items())
        if type(expected) is list:
            return type(observed) is list and len(expected) == len(observed) and all(same(a, b) for a, b in zip(expected, observed))
        return type(expected) is type(observed) and expected == observed
    if not same(actual, run):
        raise ValueError("vector_record")
    return actual


def vector_evidence(run, fragment_id):
    run = replay(run)
    matches = [row for row in run["index"]["rows"] if row["id"] == fragment_id]
    if len(matches) != 1:
        raise ValueError("vector_fragment")
    row = matches[0]
    score = next(value for value in run["scores"] if value["id"] == fragment_id)
    query = run["query"]
    terms = []
    for column, term in enumerate(run["registry"]["vocabulary"]):
        q = query["unit_vector"][column] if query["unit_vector"] is not None else None
        d = row["unit_vector"][column] if row["unit_vector"] is not None else None
        terms.append({"term": term, "document_frequency": run["index"]["document_frequency"][column],
                      "idf": run["index"]["inverse_document_frequency"][column], "applied_idf": run["index"]["applied_idf"][column],
                      "query_count": query["counts"][column], "fragment_count": row["counts"][column],
                      "query_weight": query["weighted"][column], "fragment_weight": row["weighted"][column],
                      "query_unit": q, "fragment_unit": d, "contribution": None if q is None or d is None else q * d})
    return {"id": fragment_id, "cosine": score["cosine"], "terms": terms}


def vector_report(run):
    return {"schema_version": 1, "kind": "brook-lexical-vector-search", "model_called": False,
            "rules": {"features": "NFKC/lowercase; fixed registry; non-overlapping literal substring counts per feature; different features may overlap; title/section/text joined by newline",
                      "fit": "all source fragments are the rows; df counts rows containing the term; version is a post-fit candidate filter; query does not refit",
                      "idf": "ln((N+1)/(df+1))+1; count mode applies1 instead; no sublinear TF",
                      "normalization": "each weighted row/query is divided by its L2 norm; zero norm gives null unit vector and undefined cosine, distinct from zero similarity",
                      "ranking": "positive defined cosine only; descending cosine then ASCII fragment ID; take requested k; not semantic evidence or answer grading",
                      "baseline": "existing distinct whitespace-delimited literal presence rule, same query/version/k; its score is not cosine",
                      "export": "complete applied query/settings, public corpus/registry and actual calculations; no future drafts, viewing choice or browser journal"},
            "snapshot": replay(run)}


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate_name")
        result[key] = value
    return result


def read_json(value):
    if type(value) is not str or not well_formed(value) or len(value.encode("utf-8")) > 256 * 1024:
        raise ValueError("vector_json_size")
    def finite_float(source):
        result = float(source)
        if not math.isfinite(result):
            raise ValueError("nonfinite_number")
        return result
    return json.loads(value, object_pairs_hook=unique_object, parse_float=finite_float,
                      parse_constant=lambda _value: (_ for _ in ()).throw(ValueError("nonstandard_number")))
