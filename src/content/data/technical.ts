import type {
  ContentItem,
  PracticeDifficulty,
  PracticeLength,
  PracticeTopic,
} from "../../domain/types";

type PromptSeed = {
  label: string;
  prompt: string;
};

function classifyLength(prompt: string): PracticeLength {
  if (prompt.length < 64) {
    return "short";
  }

  if (prompt.length < 110) {
    return "medium";
  }

  return "long";
}

function classifyDifficulty(prompt: string): PracticeDifficulty {
  const symbolCount = (prompt.match(/[{}()[\]=><;:,_./\\'"`|-]/g) ?? []).length;

  if (prompt.length > 108 || symbolCount > 14) {
    return "hard";
  }

  if (prompt.length < 66 && symbolCount < 8) {
    return "easy";
  }

  return "medium";
}

function toPrompts(
  topic: PracticeTopic,
  prefix: string,
  seeds: PromptSeed[],
): ContentItem[] {
  return seeds.map((seed, index) => ({
    id: `technical-${prefix}-${String(index + 1).padStart(3, "0")}`,
    category: "technical",
    topic,
    difficulty: classifyDifficulty(seed.prompt),
    length: classifyLength(seed.prompt),
    label: seed.label,
    prompt: seed.prompt,
  }));
}

const apiPrompts = toPrompts("api", "api", [
  { label: "Cached timeout", prompt: "Return the cached payload when the upstream API times out before the third retry finishes." },
  { label: "Idempotent write", prompt: "The create endpoint should remain idempotent when the same external request id is replayed." },
  { label: "Response contract", prompt: "Document the response schema so clients can distinguish validation errors from authorization failures." },
  { label: "Pagination note", prompt: "Cursor pagination is safer than offset pagination once the underlying dataset changes frequently." },
  { label: "Rate limit", prompt: "Expose the remaining request budget in response headers before clients begin to see 429 errors." },
  { label: "Webhook ack", prompt: "Acknowledge the webhook quickly, then move the expensive downstream processing onto the background queue." },
  { label: "Versioning", prompt: "If the payload shape changes, release a new API version instead of silently redefining the existing contract." },
  { label: "Trace id", prompt: "Every API response should echo the trace id so incident reviews can connect client failures to server logs." },
  { label: "Retry safety", prompt: "Only retry requests that are both transient and safe to repeat without duplicating side effects." },
  { label: "Contract test", prompt: "Add contract tests for the authorization middleware before changing the token parsing logic." },
  { label: "Partial failure", prompt: "A partial batch failure should return enough context for the client to retry only the failed records." },
  { label: "Upload flow", prompt: "Large file uploads should stream directly to object storage instead of proxying through the application server." },
  { label: "Healthcheck", prompt: "The healthcheck endpoint should fail fast when the database is unavailable, but it should not depend on third-party APIs." },
  { label: "Deprecation", prompt: "Mark deprecated fields explicitly in the API docs and include the expected removal window in the changelog." },
  { label: "Cache validator", prompt: "Support conditional requests with ETag and If-None-Match headers to reduce unnecessary payload transfer." },
  { label: "Polling backoff", prompt: "Clients that poll for long-running jobs should back off exponentially after the first few pending responses." },
]);

const databasePrompts = toPrompts("database", "db", [
  { label: "Index note", prompt: "Add a composite index on team_id and created_at before shipping the filtered activity feed query." },
  { label: "Migration order", prompt: "Run the backfill before enforcing the new non-null constraint or the migration will fail in production." },
  { label: "Replica lag", prompt: "Read replicas are useful for analytics, but stale replication can break strongly consistent user flows." },
  { label: "Query budget", prompt: "The dashboard should load inside the query budget even when the workspace contains millions of audit rows." },
  { label: "Deadlock retry", prompt: "If a transaction deadlocks under load, capture the lock graph and retry the unit of work safely." },
  { label: "Archival table", prompt: "Move year-old audit events to a colder table instead of letting the primary table grow without limits." },
  { label: "Unique key", prompt: "Use a database-level unique constraint for idempotency keys instead of trusting application memory." },
  { label: "Connection pool", prompt: "Tune the connection pool for bursty workloads so workers do not starve the web process." },
  { label: "Slow query", prompt: "The slow query log should include normalized SQL and bind value samples for debugging regressions." },
  { label: "Timezone policy", prompt: "Store timestamps in UTC and convert them only when presenting user-facing dates." },
  { label: "Backfill monitor", prompt: "Monitor replication lag during the backfill because bulk updates can overload standby instances." },
  { label: "Data retention", prompt: "Define the retention policy before collecting new event types that could grow faster than expected." },
  { label: "Vacuum health", prompt: "Table bloat will become visible long before storage is exhausted if autovacuum cannot keep up." },
  { label: "Transactional outbox", prompt: "A transactional outbox is often simpler than distributed transactions when events must mirror row changes." },
]);

const loggingPrompts = toPrompts("logging", "log", [
  { label: "Structured log", prompt: "Prefer structured JSON logs so request_id, tenant_id, and route can be filtered without parsing free text." },
  { label: "PII guard", prompt: "Never log raw access tokens, email bodies, or unhashed secrets even in temporary debugging output." },
  { label: "Noise reduction", prompt: "If the retry loop logs the same warning on every attempt, incident timelines become harder to read." },
  { label: "Sampling rule", prompt: "Sample verbose success logs aggressively, but never sample the error paths needed for incident response." },
  { label: "Trace field", prompt: "Include the trace id in both the application logs and the reverse proxy logs." },
  { label: "Context binding", prompt: "Bind request context once at the edge so downstream services inherit the same identifiers automatically." },
  { label: "Duration metric", prompt: "Elapsed time belongs in logs and metrics because it explains both user pain and infrastructure cost." },
  { label: "Fallback logger", prompt: "If the structured logger fails, the fallback path should still print enough context to diagnose the crash." },
  { label: "Field naming", prompt: "Keep field names stable across services so dashboards and alerts do not need service-specific parsing logic." },
  { label: "Deployment marker", prompt: "Emit a deployment marker so traffic shifts and error spikes can be correlated quickly." },
  { label: "Batch context", prompt: "Batch jobs should log the batch id and record counts at every stage transition." },
  { label: "Warn threshold", prompt: "Warn-level logs should still be actionable; otherwise engineers will stop paying attention to them." },
  { label: "Redaction", prompt: "Apply redaction before serialization so sensitive values never reach local buffers or third-party log sinks." },
  { label: "Searchability", prompt: "A short message plus strong key fields is easier to search than a large narrative paragraph." },
]);

const deployPrompts = toPrompts("deploy", "deploy", [
  { label: "Rollout gate", prompt: "Block the rollout automatically if the canary error rate climbs above the agreed safety threshold." },
  { label: "Migration sync", prompt: "Coordinate schema changes with the deploy window so old workers do not write incompatible payloads." },
  { label: "Rollback signal", prompt: "A fast rollback path matters more than a perfect rollout plan during a high-severity incident." },
  { label: "Smoke tests", prompt: "Run smoke tests against the deployed environment before marking the release as healthy." },
  { label: "Secret rotation", prompt: "Rotate secrets with overlapping validity windows so long-lived workers do not fail mid-release." },
  { label: "Traffic split", prompt: "Traffic shifting should be observable in dashboards before the rollout moves from ten percent to fifty percent." },
  { label: "Asset invalidation", prompt: "Purge stale CDN assets when the client bundle changes cache keys or users may see mixed versions." },
  { label: "Release notes", prompt: "Release notes should explain operational impact, not just list the pull requests included in the deploy." },
  { label: "Infra drift", prompt: "If the environment drifts from version-controlled configuration, the next deploy becomes much harder to reason about." },
  { label: "Background workers", prompt: "Drain the old workers cleanly before switching queues if the payload format changed." },
  { label: "Feature gate", prompt: "Use a feature flag for risky behavior changes so the deploy and the launch are not the same event." },
  { label: "Post deploy", prompt: "Schedule a short post-deploy review when a release included schema changes, queue migrations, and cache invalidation." },
  { label: "Readiness probe", prompt: "Readiness should depend on dependencies the process actually needs for user traffic, not just on process startup." },
  { label: "Capacity note", prompt: "If the release increases CPU usage, capacity planning should happen before the next growth cycle." },
]);

const debuggingPrompts = toPrompts("debugging", "debug", [
  { label: "Minimal repro", prompt: "Reduce the bug to the smallest reproducible case before changing three systems at once." },
  { label: "Boundary check", prompt: "The first debugging question is whether the wrong data entered this layer or was corrupted inside it." },
  { label: "Known good", prompt: "Compare the failing request against a known good request instead of inspecting the broken path in isolation." },
  { label: "State capture", prompt: "Capture the exact request, feature flags, and environment variables that triggered the unexpected behavior." },
  { label: "Hypothesis order", prompt: "Test the cheapest and most falsifiable hypotheses first so the investigation keeps moving." },
  { label: "Log before patch", prompt: "Add targeted instrumentation before patching blindly, or the same issue will come back harder to trace." },
  { label: "Time window", prompt: "If the bug started after a deploy, narrow the commit window before brainstorming unrelated root causes." },
  { label: "Isolation", prompt: "Disable background noise where possible so the failing signal is obvious in traces and logs." },
  { label: "Data mismatch", prompt: "A shape mismatch at one service boundary can look like a persistence bug two layers later." },
  { label: "Concurrency", prompt: "Intermittent failures under load often point to timing, retries, or shared mutable state." },
  { label: "Bisect note", prompt: "Git bisect is still one of the fastest ways to localize a regression when the repro is stable." },
  { label: "Cache branch", prompt: "Always ask whether cache invalidation or stale derived state could explain the discrepancy." },
  { label: "Error framing", prompt: "A stack trace tells you where the process noticed the problem, not always where the bug began." },
  { label: "Repeatability", prompt: "If the repro is not repeatable, tighten the environment until you can run the same failure on demand." },
]);

const docsPrompts = toPrompts("docs", "docs", [
  { label: "API guideline", prompt: "Document the required headers, example payloads, and expected failure modes for every public endpoint." },
  { label: "Architecture note", prompt: "A short diagram plus strong boundaries explains the system faster than a thousand lines of implementation detail." },
  { label: "Runbook step", prompt: "The incident runbook should tell on-call engineers what to verify before they attempt a rollback." },
  { label: "Decision record", prompt: "When you reject an approach, record the tradeoff so the same debate does not restart next month." },
  { label: "Setup clarity", prompt: "A setup guide should state the expected versions of Node, Python, and database tooling explicitly." },
  { label: "Scope warning", prompt: "Call out non-goals clearly so readers do not assume the document covers adjacent systems." },
  { label: "Example bias", prompt: "Examples should be realistic enough that engineers can adapt them without rewriting every line." },
  { label: "Naming note", prompt: "Use the same names in docs, dashboards, and code to reduce translation overhead during incidents." },
  { label: "Migration guide", prompt: "A migration guide should include rollback notes, expected downtime, and verification steps." },
  { label: "Testing note", prompt: "Describe how to verify the change locally before pointing readers at a large CI pipeline." },
  { label: "Change summary", prompt: "Good release notes explain user-visible impact, operational risk, and follow-up actions in one place." },
  { label: "Ownership", prompt: "Every service overview should name the owning team and the escalation path for high-severity failures." },
  { label: "Glossary", prompt: "If a term has a product-specific meaning, define it once and reuse the exact wording everywhere." },
  { label: "Maintenance tip", prompt: "Docs stay trusted only when stale instructions are corrected as quickly as stale code." },
]);

const errorsPrompts = toPrompts("errors", "errors", [
  { label: "Timeout summary", prompt: "The retry loop should stop after the third timeout and surface the last upstream error." },
  { label: "Validation detail", prompt: "Return field-level validation messages when possible so clients can correct bad input quickly." },
  { label: "Permission error", prompt: "Authorization failures should explain the missing scope without leaking tenant-sensitive details." },
  { label: "Queue overflow", prompt: "If the queue backlog exceeds the alert threshold, new jobs should fail fast instead of timing out silently." },
  { label: "Fallback path", prompt: "A fallback path is only useful when it preserves enough context to explain why the primary path failed." },
  { label: "Parse failure", prompt: "Malformed timestamps should raise a clear parsing error rather than defaulting to local server time." },
  { label: "Circuit breaker", prompt: "Open the circuit breaker only for proven downstream instability, not for every transient exception burst." },
  { label: "Partial write", prompt: "Detect partial writes explicitly or a later cleanup job may hide the original failure mode." },
  { label: "Message hygiene", prompt: "Error messages should be precise enough for engineers but safe enough to display to users when needed." },
  { label: "Dependency outage", prompt: "When a dependency is degraded, switch to reduced functionality before user requests pile up." },
  { label: "Id mismatch", prompt: "If two systems disagree on the primary identifier, the error path should log both values immediately." },
  { label: "Retry exhaustion", prompt: "Mark retries as exhausted in the final error event so alerts can separate new failures from noisy repeats." },
  { label: "Serialization bug", prompt: "A serialization bug at the queue boundary can make a perfectly valid in-memory object fail later." },
  { label: "Alert fatigue", prompt: "Grouping duplicate errors by fingerprint reduces alert fatigue without hiding new failure classes." },
]);

export const technicalPrompts: ContentItem[] = [
  ...apiPrompts,
  ...databasePrompts,
  ...loggingPrompts,
  ...deployPrompts,
  ...debuggingPrompts,
  ...docsPrompts,
  ...errorsPrompts,
];
