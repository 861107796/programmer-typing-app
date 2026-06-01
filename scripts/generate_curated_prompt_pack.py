from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from itertools import product
from pathlib import Path


@dataclass(frozen=True)
class PromptItem:
    category: str
    topic: str
    difficulty: str
    length: str
    label: str
    prompt: str


class PromptBuilder:
    def __init__(self) -> None:
        self.items: list[PromptItem] = []
        self.seen_prompts: set[str] = set()
        self.seen_labels: set[str] = set()

    def add(
        self,
        category: str,
        topic: str,
        difficulty: str,
        length: str,
        label: str,
        prompt: str,
    ) -> None:
        normalized_prompt = prompt.strip()
        normalized_label = label.strip()
        if not normalized_prompt or normalized_prompt in self.seen_prompts:
            return

        final_label = normalized_label
        suffix = 2
        while final_label in self.seen_labels:
            final_label = f"{normalized_label} {suffix}"
            suffix += 1

        self.seen_prompts.add(normalized_prompt)
        self.seen_labels.add(final_label)
        self.items.append(
            PromptItem(
                category=category,
                topic=topic,
                difficulty=difficulty,
                length=length,
                label=final_label,
                prompt=normalized_prompt,
            )
        )

    def export(self) -> list[dict[str, object]]:
        exported: list[dict[str, object]] = []
        for item in self.items:
            exported.append(
                {
                    "id": f"curated-{item.category}-{item.topic}-{uuid.uuid4()}",
                    "category": item.category,
                    "topic": item.topic,
                    "difficulty": item.difficulty,
                    "length": item.length,
                    "label": item.label,
                    "prompt": item.prompt,
                    "isActive": True,
                }
            )
        return exported


def build_code_prompts(builder: PromptBuilder) -> None:
    services = [
        "auth",
        "progress",
        "leaderboard",
        "content",
        "challenge",
        "session",
    ]
    entities = ["snapshot", "payload", "assignment", "result", "record", "entry"]
    fields = ["score", "status", "label", "source", "rank", "createdAt"]
    environments = ["dev", "staging", "prod", "canary", "local"]
    collections = ["sessions", "entries", "prompts", "users", "alerts", "records"]

    for service, entity in product(services, entities[:3]):
        builder.add(
            "code",
            "typescript",
            "medium",
            "short",
            f"{service.title()} {entity} fallback",
            f"const {entity}Key = {service}{entity.title()}?.id ?? `missing-{service}-{entity}`;",
        )
    for collection, field in product(collections, fields[:4]):
        builder.add(
            "code",
            "javascript",
            "medium",
            "medium",
            f"{collection.title()} reduce by {field}",
            f"const grouped{collection.title()} = {collection}.reduce((acc, item) => {{\n  acc[item.{field}] ??= [];\n  acc[item.{field}].push(item.id);\n  return acc;\n}}, {{}});",
        )
    for collection, field in product(collections, fields[:4]):
        builder.add(
            "code",
            "python",
            "medium",
            "short",
            f"{collection.title()} sort by {field}",
            f"sorted_{collection} = sorted({collection}, key=lambda item: item['{field}'])",
        )
    java_pairs = [
        ("ResponseEntity", "body"),
        ("Optional", "orElse"),
        ("Map", "computeIfAbsent"),
        ("List", "stream"),
        ("Objects", "requireNonNull"),
        ("Comparator", "comparingInt"),
    ]
    for left, right in java_pairs:
        builder.add(
            "code",
            "java",
            "medium",
            "medium",
            f"{left} {right} usage",
            f"var nextValue = {left}.{right}(payload -> payload.id());",
        )
    for env, service in product(environments, services[:5]):
        builder.add(
            "code",
            "c",
            "medium",
            "short",
            f"{env.title()} {service} buffer",
            f"snprintf(buffer, sizeof(buffer), \"{env}:{service}:%s\", request_id);",
        )
    for service, field in product(services, fields[:4]):
        builder.add(
            "code",
            "cpp",
            "hard",
            "medium",
            f"{service.title()} compare {field}",
            f"std::sort({service}Entries.begin(), {service}Entries.end(), [](const auto& left, const auto& right) {{\n    return left.{field} > right.{field};\n}});",
        )
    for service, field in product(services, fields[:4]):
        builder.add(
            "code",
            "go",
            "medium",
            "medium",
            f"{service.title()} format {field}",
            f"{field}Value := fmt.Sprintf(\"%s:%s\", {service}.{field}, requestID)",
        )
    for service, field in product(services, fields[:4]):
        builder.add(
            "code",
            "rust",
            "hard",
            "medium",
            f"{service.title()} map {field}",
            f"let {field}_line = format!(\"{{}}:{{}}\", {service}.{field}, request_id);",
        )
    sql_windows = [
        "ROW_NUMBER() OVER (ORDER BY wpm DESC)",
        "COUNT(*) FILTER (WHERE valid = 1)",
        "MAX(accuracy)",
        "AVG(duration_ms)",
        "SUM(error_count)",
    ]
    for service, metric in product(services, sql_windows):
        builder.add(
            "code",
            "sql",
            "hard",
            "medium",
            f"{service.title()} metric query",
            f"SELECT user_id, {metric} AS metric_value\nFROM {service}_sessions\nGROUP BY user_id\nORDER BY metric_value DESC\nLIMIT 10;",
        )
    for env, collection in product(environments, collections[:4]):
        builder.add(
            "code",
            "shell",
            "easy",
            "short",
            f"{env.title()} archive {collection}",
            f"for file in ./{collection}/*; do echo \"{env}:$file\"; done",
        )
    json_shapes = [
        '{"kind":"challenge","mode":"daily","retry":2,"enabled":true}',
        '{"kind":"session","valid":true,"errorCount":0,"source":"manual"}',
        '{"kind":"leaderboard","window":"weekly","limit":100,"cached":false}',
        '{"kind":"content","category":"code","length":"medium","active":true}',
    ]
    for index, shape in enumerate(json_shapes, start=1):
        builder.add(
            "code",
            "json",
            "easy",
            "short",
            f"Structured payload {index}",
            shape,
        )
    yaml_blocks = [
        "jobs:\n  seed-content:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm run build:server",
        "service:\n  name: typing-api\n  port: 3001\n  healthcheck: /api/auth/me",
        "challenge:\n  source: manual\n  fallback: generated\n  retry_limit: 2",
        "leaderboard:\n  refresh: hourly\n  top_n: 100\n  cache_ttl: 60",
    ]
    for index, block in enumerate(yaml_blocks, start=1):
        builder.add(
            "code",
            "yaml",
            "medium",
            "medium",
            f"YAML config {index}",
            block,
        )


def build_command_prompts(builder: PromptBuilder) -> None:
    branches = [
        "feature/database-backed-content",
        "feature/content-admin",
        "feature/leaderboard",
        "fix/daily-challenge",
        "release/may-sync",
    ]
    paths = ["src/components", "src/hooks", "server/routes", "server/services", "data"]
    packages = ["typescript", "vitest", "tsx", "sqlite3", "jsonwebtoken", "react"]
    py_packages = ["pytest", "black", "ruff", "sqlalchemy", "requests", "fastapi"]
    files = ["src", "server", "data", "dist", "docs", "scripts"]
    patterns = [
        "AUTH_EXPIRED",
        "content_items",
        "daily challenge",
        "progress snapshot",
        "leaderboard",
        "typing input",
    ]
    images = ["node:22-alpine", "postgres:16", "redis:7", "python:3.12-slim"]
    endpoints = [
        "/api/auth/me",
        "/api/progress",
        "/api/content/session?mode=mixed",
        "/api/content/daily-challenge",
        "/api/leaderboard/global",
        "/api/admin/content",
    ]

    for branch, path in product(branches, paths):
        builder.add(
            "command",
            "git",
            "medium",
            "short",
            f"Fetch {branch.split('/')[-1]}",
            f"git fetch origin {branch} -- {path}",
        )
    for branch, path in product(branches[:4], paths[:4]):
        builder.add(
            "command",
            "git",
            "medium",
            "medium",
            f"Diff {branch.split('/')[-1]}",
            f"git diff origin/main...origin/{branch} -- {path}",
        )
    for package, flag in product(packages, ["", "-D"]):
        command = f"npm install {flag} {package}".replace("  ", " ").strip()
        label_suffix = "dev" if flag == "-D" else "prod"
        builder.add(
            "command",
            "npm",
            "easy",
            "short",
            f"Install {package} {label_suffix}",
            command,
        )
    for package, flag in product(py_packages, ["--upgrade", "--quiet"]):
        builder.add(
            "command",
            "pip",
            "easy",
            "short",
            f"Install {package} {flag[2:]}",
            f"python -m pip install {flag} {package}",
        )
    for action, target in product(["Get-ChildItem -Force", "Resolve-Path", "Get-Item"], files):
        builder.add(
            "command",
            "filesystem",
            "easy",
            "short",
            f"{action.split('-')[0]} {target}",
            f"{action} .\\{target}",
        )
    for pattern, target in product(patterns, ["src", "server", "docs"]):
        builder.add(
            "command",
            "search",
            "medium",
            "short",
            f"Search {pattern}",
            f"rg --line-number \"{pattern}\" {target}",
        )
    for image, name in product(images, ["typing-api", "content-admin", "rank-worker"]):
        builder.add(
            "command",
            "docker",
            "medium",
            "medium",
            f"Run {name} {image.split(':')[0]}",
            f"docker run --rm --name {name} -e APP_ENV=dev {image}",
        )
    for host, endpoint in product(["127.0.0.1:3001", "localhost:3001"], endpoints):
        builder.add(
            "command",
            "curl",
            "medium",
            "medium",
            f"Check {endpoint}",
            f"curl http://{host}{endpoint}",
        )


def build_technical_prompts(builder: PromptBuilder) -> None:
    api_topics = [
        "idempotency",
        "pagination",
        "authorization",
        "request tracing",
        "rate limiting",
        "webhook retries",
    ]
    db_topics = [
        "replica lag",
        "query planning",
        "write amplification",
        "lock contention",
        "migration order",
        "backup restore",
    ]
    logging_topics = [
        "correlation ids",
        "warning fanout",
        "error context",
        "sampling policy",
        "deployment versioning",
        "sensitive fields",
    ]
    deploy_topics = [
        "canary gates",
        "rollback checkpoints",
        "smoke tests",
        "health checks",
        "asset cache purge",
        "schema promotion",
    ]
    debugging_topics = [
        "minimal repros",
        "trace review",
        "state drift",
        "auth mismatch",
        "retry storms",
        "stale cache",
    ]
    docs_topics = [
        "runbooks",
        "incident timelines",
        "migration guides",
        "release notes",
        "operator checklists",
        "api changelogs",
    ]
    error_topics = [
        "timeout surfaces",
        "duplicate webhook handling",
        "missing env vars",
        "cookie expiry",
        "signature failures",
        "queue backpressure",
    ]

    for topic, style in product(api_topics, ["Document", "Validate", "Review", "Monitor"]):
        builder.add(
            "technical",
            "api",
            "medium",
            "medium",
            f"{style} {topic}",
            f"{style} the {topic} behavior before you change the contract that mobile and web clients both depend on.",
        )
    for topic, audience in product(db_topics, ["on-call engineer", "migration reviewer", "backend team", "release owner"]):
        builder.add(
            "technical",
            "database",
            "hard",
            "medium",
            f"{topic.title()} note",
            f"Explain how {topic} affects the {audience} when write traffic rises during a deployment window.",
        )
    for topic, level in product(logging_topics, ["info", "warn", "error", "debug"]):
        builder.add(
            "technical",
            "logging",
            "easy",
            "short",
            f"{topic.title()} {level}",
            f"Every {level} log should include enough {topic} context for someone outside the original team to debug it.",
        )
    for topic, env in product(deploy_topics, ["staging", "canary", "production"]):
        builder.add(
            "technical",
            "deploy",
            "medium",
            "medium",
            f"{env.title()} {topic}",
            f"Confirm the {topic} is complete before promoting the {env} build to all user traffic.",
        )
    for topic, action in product(debugging_topics, ["triage", "reproduce", "isolate", "mitigate"]):
        builder.add(
            "technical",
            "debugging",
            "hard",
            "medium",
            f"{topic.title()} {action}",
            f"Write down the shortest path to {action} the {topic} issue before changing code or refreshing the environment.",
        )
    for topic, quality in product(docs_topics, ["concise", "reviewable", "actionable", "searchable"]):
        builder.add(
            "technical",
            "docs",
            "easy",
            "short",
            f"{topic.title()} {quality}",
            f"Keep the {topic} {quality} so the next engineer can use it during an incident without extra context.",
        )
    for topic, action in product(error_topics, ["surface", "annotate", "summarize", "separate"]):
        builder.add(
            "technical",
            "errors",
            "medium",
            "medium",
            f"{topic.title()} {action}",
            f"When {topic} shows up in production, {action} the failure with enough context that the response team can act immediately.",
        )


def main() -> None:
    builder = PromptBuilder()
    build_code_prompts(builder)
    build_command_prompts(builder)
    build_technical_prompts(builder)

    exported = builder.export()
    output_path = (
        Path(__file__).resolve().parents[1]
        / "data"
        / "curated-pack-2026-05-06.json"
    )
    output_path.write_text(
        json.dumps(exported, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    summary = {
        "count": len(exported),
        "output": str(output_path),
    }
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
