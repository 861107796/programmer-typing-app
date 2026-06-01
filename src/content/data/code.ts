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
  if (prompt.length < 58) {
    return "short";
  }

  if (prompt.length < 104) {
    return "medium";
  }

  return "long";
}

function classifyDifficulty(prompt: string): PracticeDifficulty {
  const symbolCount = (prompt.match(/[{}()[\]=><;:,_./\\'"`|-]/g) ?? []).length;

  if (prompt.length > 104 || symbolCount > 16) {
    return "hard";
  }

  if (prompt.length < 56 && symbolCount < 9) {
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
    id: `code-${prefix}-${String(index + 1).padStart(3, "0")}`,
    category: "code",
    topic,
    difficulty: classifyDifficulty(seed.prompt),
    length: classifyLength(seed.prompt),
    label: seed.label,
    prompt: seed.prompt,
  }));
}

const typeScriptPrompts = toPrompts(
  "typescript",
  "ts",
  [
    {
      label: "Typed formatter",
      prompt: "const formatPrice = (value: number) => value.toFixed(2);",
    },
    {
      label: "Readonly props",
      prompt: "type ButtonProps = Readonly<{ label: string; disabled?: boolean }>; ",
    },
    {
      label: "Record mapper",
      prompt: "const userById: Record<string, User> = Object.fromEntries(users.map((user) => [user.id, user]));",
    },
    {
      label: "Async loader",
      prompt: "async function loadProject(id: string): Promise<Project> { return api.get(`/projects/${id}`); }",
    },
    {
      label: "Guard clause",
      prompt: "if (!session?.token) throw new Error(\"Missing authenticated session token\");",
    },
    {
      label: "Reducer state",
      prompt: "const nextState = { ...state, loading: false, items: state.items.filter((item) => item.active) };",
    },
    {
      label: "Union narrowing",
      prompt: "return response.kind === \"error\" ? response.message : response.payload.data;",
    },
    {
      label: "Tuple return",
      prompt: "const useToggle = (initial = false): [boolean, () => void] => [initial, () => setOpen((value) => !value)];",
    },
    {
      label: "Parser signature",
      prompt: "function parseConfig(input: string): Result<Config, ParseError> { return schema.safeParse(JSON.parse(input)); }",
    },
    {
      label: "Memoized selector",
      prompt: "const visibleTasks = tasks.filter((task) => task.ownerId === currentUser.id && !task.archived);",
    },
    {
      label: "Optional chaining",
      prompt: "const city = customer?.profile?.address?.city ?? \"Unknown city\";",
    },
    {
      label: "Map response",
      prompt: "const rows = response.items.map((item) => ({ id: item.id, status: item.status.toUpperCase() }));",
    },
    {
      label: "Constraint generic",
      prompt: "function pickId<T extends { id: string }>(entity: T) { return entity.id; }",
    },
    {
      label: "Enum lookup",
      prompt: "const severityLabel = severityMap[alert.severity] ?? \"Unclassified\";",
    },
    {
      label: "Start transition",
      prompt: "startTransition(() => setFilters((current) => ({ ...current, query: nextQuery.trim() })));",
    },
    {
      label: "Deferred search",
      prompt: "const deferredQuery = useDeferredValue(searchText);",
    },
    {
      label: "Error boundary",
      prompt: "throw new Error(`Unexpected invoice status: ${invoice.status}`);",
    },
    {
      label: "Token payload",
      prompt: "const payload = { sub: user.id, scope: [\"read:projects\", \"write:tasks\"], exp: expiresAt };",
    },
    {
      label: "Promise batch",
      prompt: "const [users, teams] = await Promise.all([fetchUsers(), fetchTeams()]);",
    },
    {
      label: "Hook event",
      prompt: "const onResize = useEffectEvent(() => setViewportWidth(window.innerWidth));",
    },
    {
      label: "Sort comparator",
      prompt: "items.sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));",
    },
    {
      label: "Date formatting",
      prompt: "const formatted = new Intl.DateTimeFormat(\"en-US\", { dateStyle: \"medium\", timeStyle: \"short\" }).format(date);",
    },
    {
      label: "Route params",
      prompt: "const route = `/teams/${team.slug}/projects/${project.id}/settings`;",
    },
    {
      label: "Form validation",
      prompt: "const isValid = email.trim().length > 0 && password.length >= 12;",
    },
    {
      label: "Nested config",
      prompt: "const headers = { Authorization: `Bearer ${token}`, \"X-Trace-Id\": traceId, \"Content-Type\": \"application/json\" };",
    },
    {
      label: "Mutation updater",
      prompt: "setTasks((current) => current.map((task) => task.id === updated.id ? updated : task));",
    },
    {
      label: "Query serializer",
      prompt: "const query = new URLSearchParams({ status: activeStatus, owner: selectedOwner ?? \"all\" }).toString();",
    },
    {
      label: "Batch normalizer",
      prompt: "const normalized = payload.items.map((item) => ({ ...item, slug: item.name.trim().toLowerCase().replace(/\\s+/g, '-') }));",
    },
  ],
);

const javaScriptPrompts = toPrompts(
  "javascript",
  "js",
  [
    {
      label: "Array flatten",
      prompt: "const tags = posts.flatMap((post) => post.tags.filter(Boolean));",
    },
    {
      label: "Fetch payload",
      prompt: "const response = await fetch('/api/search?q=' + encodeURIComponent(query));",
    },
    {
      label: "Console timer",
      prompt: "console.time('index-build'); await buildSearchIndex(); console.timeEnd('index-build');",
    },
    {
      label: "Safe parse",
      prompt: "const config = JSON.parse(localStorage.getItem('app:config') ?? '{}');",
    },
    {
      label: "Pipeline transform",
      prompt: "const summary = orders.filter((order) => order.paid).map((order) => order.total).reduce((sum, value) => sum + value, 0);",
    },
    {
      label: "Event listener",
      prompt: "window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDialog(); });",
    },
    {
      label: "URL params",
      prompt: "const params = new URLSearchParams({ page: String(page), sort: activeSort, filter: activeFilter });",
    },
    {
      label: "Retry loop",
      prompt: "for (let attempt = 0; attempt < 3; attempt += 1) { if (await pingHealthcheck()) break; }",
    },
    {
      label: "Optional fallback",
      prompt: "const avatar = profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}`;",
    },
    {
      label: "Node resolve",
      prompt: "const outputPath = path.resolve(process.cwd(), 'dist', 'reports', fileName);",
    },
    {
      label: "Headers object",
      prompt: "const headers = { authorization: `Bearer ${token}`, 'x-request-id': requestId };",
    },
    {
      label: "Deduplicate values",
      prompt: "const uniqueStatuses = [...new Set(records.map((record) => record.status))];",
    },
    {
      label: "Chunk batches",
      prompt: "const batches = Array.from({ length: Math.ceil(ids.length / 50) }, (_, index) => ids.slice(index * 50, index * 50 + 50));",
    },
    {
      label: "Read env",
      prompt: "const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:4000';",
    },
    {
      label: "File glob",
      prompt: "const files = await fg(['src/**/*.ts', '!src/**/*.test.ts'], { dot: false });",
    },
    {
      label: "Template literal",
      prompt: "const message = `Build completed in ${durationMs}ms with ${warningCount} warnings.`;",
    },
    {
      label: "Regex replace",
      prompt: "const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');",
    },
    {
      label: "Import map",
      prompt: "const modules = imports.map((entry) => `${entry.name}@${entry.version}`).join(', ');",
    },
    {
      label: "Error summary",
      prompt: "throw new Error(`Expected 2xx response but received ${response.status} ${response.statusText}`);",
    },
    {
      label: "Object merge",
      prompt: "const nextConfig = { ...defaults, ...fileConfig, features: { ...defaults.features, ...fileConfig.features } };",
    },
    {
      label: "Timestamp math",
      prompt: "const expiresAt = Date.now() + 1000 * 60 * 60 * 24;",
    },
    {
      label: "Sort newest",
      prompt: "records.sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf());",
    },
    {
      label: "Batch sender",
      prompt: "await Promise.allSettled(webhooks.map((hook) => sendWebhook(hook, payload)));",
    },
    {
      label: "Guard return",
      prompt: "if (!Array.isArray(input) || input.length === 0) return [];",
    },
    {
      label: "CLI args",
      prompt: "const args = process.argv.slice(2).filter((value) => !value.startsWith('--verbose'));",
    },
    {
      label: "Status map",
      prompt: "const stats = response.rows.reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {});",
    },
    {
      label: "Abort controller",
      prompt: "const controller = new AbortController(); setTimeout(() => controller.abort(), 5000);",
    },
    {
      label: "Persist filters",
      prompt: "localStorage.setItem('dashboard:filters', JSON.stringify({ search, status, assignee }));",
    },
  ],
);

const pythonPrompts = toPrompts(
  "python",
  "py",
  [
    {
      label: "List comprehension",
      prompt: "active_users = [user.email for user in users if user.is_active]",
    },
    {
      label: "Dictionary merge",
      prompt: "config = {**defaults, **env_overrides, 'timeout': int(os.getenv('APP_TIMEOUT', '30'))}",
    },
    {
      label: "Query filter",
      prompt: "recent_orders = [order for order in orders if order.created_at >= cutoff]",
    },
    {
      label: "Path builder",
      prompt: "report_path = Path('reports') / team_slug / f'{date.today().isoformat()}.json'",
    },
    {
      label: "Pydantic model",
      prompt: "class Settings(BaseModel): api_base_url: str; request_timeout: int = 30",
    },
    {
      label: "Async client",
      prompt: "async with httpx.AsyncClient(timeout=15.0) as client: response = await client.get(url, headers=headers)",
    },
    {
      label: "Sort key",
      prompt: "records.sort(key=lambda record: record.updated_at, reverse=True)",
    },
    {
      label: "SQLAlchemy filter",
      prompt: "stmt = select(User).where(User.team_id == team_id, User.deleted_at.is_(None))",
    },
    {
      label: "Dataclass default",
      prompt: "items: list[str] = field(default_factory=list)",
    },
    {
      label: "Exception chaining",
      prompt: "raise RuntimeError(f'failed to load snapshot: {snapshot_id}') from exc",
    },
    {
      label: "JSON response",
      prompt: "return JSONResponse({'status': 'ok', 'request_id': request_id}, status_code=200)",
    },
    {
      label: "Settings read",
      prompt: "debug_enabled = os.getenv('DEBUG', 'false').strip().lower() == 'true'",
    },
    {
      label: "Test assertion",
      prompt: "assert response.status_code == 201, response.text",
    },
    {
      label: "Group names",
      prompt: "projects_by_team = defaultdict(list)",
    },
    {
      label: "Regex cleanup",
      prompt: "slug = re.sub(r'[^a-z0-9]+', '-', title.strip().lower()).strip('-')",
    },
    {
      label: "Pandas column",
      prompt: "frame['latency_ms'] = frame['finished_at'] - frame['started_at']",
    },
    {
      label: "Enum lookup",
      prompt: "status_label = STATUS_LABELS.get(job.status, 'Unknown')",
    },
    {
      label: "FastAPI route",
      prompt: "@router.get('/teams/{team_id}/projects', response_model=list[ProjectSummary])",
    },
    {
      label: "Retry decorator",
      prompt: "@retry(wait=wait_exponential(multiplier=1, min=1, max=8), stop=stop_after_attempt(4))",
    },
    {
      label: "CSV writer",
      prompt: "writer.writerow({'email': user.email, 'last_login': user.last_login.isoformat()})",
    },
    {
      label: "Parse datetime",
      prompt: "parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))",
    },
    {
      label: "Conditional return",
      prompt: "return None if payload is None else payload.get('trace_id')",
    },
    {
      label: "Zip rows",
      prompt: "rows = [dict(zip(headers, values, strict=True)) for values in csv_rows]",
    },
    {
      label: "Healthcheck log",
      prompt: "logger.info('healthcheck completed', extra={'status': status, 'elapsed_ms': elapsed_ms})",
    },
    {
      label: "List flatten",
      prompt: "scopes = [scope for permission in permissions for scope in permission.scopes]",
    },
    {
      label: "Model dump",
      prompt: "payload = settings.model_dump(exclude_none=True, mode='json')",
    },
  ],
);

const sqlPrompts = toPrompts(
  "sql",
  "sql",
  [
    {
      label: "Basic select",
      prompt: "SELECT id, email, last_login_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC;",
    },
    {
      label: "Team count",
      prompt: "SELECT team_id, COUNT(*) AS project_count FROM projects GROUP BY team_id HAVING COUNT(*) > 3;",
    },
    {
      label: "Join invoices",
      prompt: "SELECT i.id, c.name, i.total_cents FROM invoices i JOIN customers c ON c.id = i.customer_id;",
    },
    {
      label: "Window rank",
      prompt: "SELECT id, status, ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY created_at DESC) AS row_num FROM jobs;",
    },
    {
      label: "Latest event",
      prompt: "SELECT MAX(created_at) AS latest_event_at FROM audit_events WHERE actor_id = $1;",
    },
    {
      label: "Search filter",
      prompt: "SELECT slug FROM repositories WHERE slug ILIKE '%' || $1 || '%' LIMIT 25;",
    },
    {
      label: "Insert row",
      prompt: "INSERT INTO deployments (environment, sha, started_at) VALUES ($1, $2, NOW()) RETURNING id;",
    },
    {
      label: "Update status",
      prompt: "UPDATE jobs SET status = 'completed', finished_at = NOW() WHERE id = $1;",
    },
    {
      label: "Delete sessions",
      prompt: "DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '7 days';",
    },
    {
      label: "JSON extract",
      prompt: "SELECT metadata ->> 'request_id' AS request_id FROM traces WHERE metadata ? 'request_id';",
    },
    {
      label: "CTE summary",
      prompt: "WITH recent AS (SELECT * FROM events WHERE created_at >= NOW() - INTERVAL '1 day') SELECT COUNT(*) FROM recent;",
    },
    {
      label: "Distinct statuses",
      prompt: "SELECT DISTINCT status FROM incidents ORDER BY status ASC;",
    },
    {
      label: "Failed jobs",
      prompt: "SELECT id, error_message FROM jobs WHERE status = 'failed' AND retried_at IS NULL;",
    },
    {
      label: "Date trunc",
      prompt: "SELECT DATE_TRUNC('hour', created_at) AS hour_bucket, COUNT(*) FROM requests GROUP BY hour_bucket;",
    },
    {
      label: "Coalesce total",
      prompt: "SELECT COALESCE(SUM(duration_ms), 0) AS total_duration FROM task_runs WHERE workflow_id = $1;",
    },
    {
      label: "Rollback note",
      prompt: "UPDATE deployments SET rolled_back_at = NOW(), rollback_reason = $2 WHERE id = $1;",
    },
    {
      label: "Exists clause",
      prompt: "SELECT id FROM teams t WHERE EXISTS (SELECT 1 FROM users u WHERE u.team_id = t.id AND u.admin = TRUE);",
    },
    {
      label: "Case expression",
      prompt: "SELECT id, CASE WHEN deleted_at IS NULL THEN 'active' ELSE 'archived' END AS lifecycle FROM projects;",
    },
    {
      label: "Subquery count",
      prompt: "SELECT id, (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count FROM posts p;",
    },
    {
      label: "Conflict upsert",
      prompt: "INSERT INTO feature_flags (key, enabled) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled;",
    },
    {
      label: "Latency p95",
      prompt: "SELECT percentile_disc(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency FROM http_requests;",
    },
    {
      label: "Schema inspect",
      prompt: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';",
    },
    {
      label: "Nulls last",
      prompt: "SELECT id, released_at FROM changelogs ORDER BY released_at DESC NULLS LAST;",
    },
    {
      label: "Filter window",
      prompt: "SELECT * FROM alerts WHERE created_at BETWEEN $1 AND $2 AND severity IN ('high', 'critical');",
    },
  ],
);

const shellCodePrompts = toPrompts(
  "shell",
  "sh",
  [
    {
      label: "Bash strict mode",
      prompt: "set -euo pipefail",
    },
    {
      label: "Loop files",
      prompt: "for file in ./logs/*.txt; do echo \"processing $file\"; done",
    },
    {
      label: "Export token",
      prompt: "export API_TOKEN=\"$(security find-generic-password -s app-token -w)\"",
    },
    {
      label: "Conditional exit",
      prompt: "[[ -z \"$DATABASE_URL\" ]] && echo \"DATABASE_URL is required\" && exit 1",
    },
    {
      label: "Function wrapper",
      prompt: "retry_command() { local attempts=0; until \"$@\"; do attempts=$((attempts + 1)); [[ $attempts -ge 3 ]] && return 1; sleep 2; done; }",
    },
    {
      label: "Pipe JSON",
      prompt: "cat report.json | jq '.items[] | { id: .id, status: .status }'",
    },
    {
      label: "Tar archive",
      prompt: "tar -czf backup-$(date +%Y-%m-%d).tar.gz ./data ./config ./scripts",
    },
    {
      label: "Check branch",
      prompt: "current_branch=$(git branch --show-current)",
    },
    {
      label: "Case statement",
      prompt: "case \"$NODE_ENV\" in production) echo \"optimized\" ;; development) echo \"verbose\" ;; esac",
    },
    {
      label: "Find cleanup",
      prompt: "find . -type f -name '*.log' -mtime +7 -print -delete",
    },
    {
      label: "Read config",
      prompt: "while IFS='=' read -r key value; do export \"$key=$value\"; done < .env.local",
    },
    {
      label: "Filter service",
      prompt: "ps aux | grep '[n]ode server.js' | awk '{print $2}'",
    },
    {
      label: "Guard command",
      prompt: "command -v jq >/dev/null 2>&1 || { echo 'jq is required'; exit 1; }",
    },
    {
      label: "Copy assets",
      prompt: "cp -R ./public/. ./dist/public/",
    },
    {
      label: "Resolve dir",
      prompt: "SCRIPT_DIR=\"$(cd \"$(dirname \"${BASH_SOURCE[0]}\")\" && pwd)\"",
    },
    {
      label: "Temp file",
      prompt: "tmp_file=$(mktemp /tmp/report.XXXXXX.json)",
    },
    {
      label: "Read args",
      prompt: "while [[ $# -gt 0 ]]; do case \"$1\" in --port) PORT=\"$2\"; shift 2 ;; *) shift ;; esac; done",
    },
    {
      label: "Print JSON",
      prompt: "printf '{\"service\":\"%s\",\"status\":\"%s\"}\\n' \"$SERVICE_NAME\" \"$STATUS\"",
    },
    {
      label: "Sync script",
      prompt: "rsync -av --delete ./dist/ deploy@server:/var/www/app/",
    },
    {
      label: "Parse status",
      prompt: "status_code=$(curl -s -o /dev/null -w '%{http_code}' \"$HEALTHCHECK_URL\")",
    },
    {
      label: "Join paths",
      prompt: "REPORT_PATH=\"$SCRIPT_DIR/output/$(date +%Y%m%d)-summary.txt\"",
    },
    {
      label: "Sed replace",
      prompt: "sed -i.bak 's/DEBUG=false/DEBUG=true/' ./config/app.env",
    },
    {
      label: "Trap cleanup",
      prompt: "trap 'rm -f \"$tmp_file\"' EXIT INT TERM",
    },
    {
      label: "Archive logs",
      prompt: "gzip -9 < ./logs/api.log > ./archives/api.log.gz",
    },
  ],
);

const jsonPrompts = toPrompts(
  "json",
  "json",
  [
    {
      label: "Package script",
      prompt: "{\"scripts\":{\"dev\":\"vite\",\"build\":\"tsc -b && vite build\",\"test\":\"vitest run\"}}",
    },
    {
      label: "API payload",
      prompt: "{\"teamId\":\"team_123\",\"filters\":{\"status\":[\"open\",\"blocked\"],\"owner\":\"alex\"}}",
    },
    {
      label: "Feature flags",
      prompt: "{\"flags\":{\"newDashboard\":true,\"betaSearch\":false},\"updatedAt\":\"2026-05-05T08:00:00Z\"}",
    },
    {
      label: "Trace envelope",
      prompt: "{\"requestId\":\"req_42\",\"service\":\"billing-api\",\"latencyMs\":184,\"cached\":false}",
    },
    {
      label: "Webhook event",
      prompt: "{\"event\":\"invoice.paid\",\"data\":{\"invoiceId\":\"inv_9001\",\"customerId\":\"cus_2003\"}}",
    },
    {
      label: "Nested settings",
      prompt: "{\"theme\":\"midnight\",\"shortcuts\":{\"save\":\"Ctrl+S\",\"commandPalette\":\"Ctrl+K\"}}",
    },
    {
      label: "Search config",
      prompt: "{\"index\":\"docs\",\"query\":\"cache invalidation\",\"limit\":20,\"highlight\":true}",
    },
    {
      label: "Deployment summary",
      prompt: "{\"environment\":\"production\",\"sha\":\"9f4c2be\",\"rolledBack\":false,\"durationSeconds\":412}",
    },
    {
      label: "Error payload",
      prompt: "{\"error\":{\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests\",\"retryAfterSeconds\":60}}",
    },
    {
      label: "Metrics record",
      prompt: "{\"metric\":\"http_request_duration_ms\",\"value\":93.4,\"labels\":{\"route\":\"/health\",\"method\":\"GET\"}}",
    },
    {
      label: "Lint config",
      prompt: "{\"extends\":[\"eslint:recommended\",\"plugin:react-hooks/recommended\"],\"rules\":{\"no-console\":\"warn\"}}",
    },
    {
      label: "Job status",
      prompt: "{\"id\":\"job_18\",\"status\":\"running\",\"progress\":0.63,\"worker\":\"queue-2\"}",
    },
    {
      label: "Table schema",
      prompt: "{\"table\":\"users\",\"columns\":[{\"name\":\"id\",\"type\":\"uuid\"},{\"name\":\"email\",\"type\":\"text\"}]}",
    },
    {
      label: "Alert config",
      prompt: "{\"name\":\"High error rate\",\"threshold\":0.05,\"windowMinutes\":10,\"severity\":\"critical\"}",
    },
    {
      label: "Cache entry",
      prompt: "{\"key\":\"user:42\",\"ttlSeconds\":900,\"value\":{\"name\":\"Mina\",\"plan\":\"pro\"}}",
    },
    {
      label: "Release note",
      prompt: "{\"version\":\"1.8.0\",\"breakingChanges\":[],\"improvements\":[\"faster search\",\"better logs\"]}",
    },
    {
      label: "Batch result",
      prompt: "{\"processed\":120,\"failed\":3,\"warnings\":[\"missing avatar\",\"invalid locale\"]}",
    },
    {
      label: "Validation issue",
      prompt: "{\"field\":\"email\",\"message\":\"must be a valid email address\",\"severity\":\"error\"}",
    },
    {
      label: "OAuth token",
      prompt: "{\"access_token\":\"abc123\",\"expires_in\":3600,\"scope\":\"read:teams write:projects\"}",
    },
    {
      label: "Graph node",
      prompt: "{\"id\":\"node-4\",\"kind\":\"service\",\"edges\":[\"queue-1\",\"database-primary\"]}",
    },
    {
      label: "Search facets",
      prompt: "{\"facets\":{\"status\":[\"open\",\"closed\"],\"priority\":[\"p1\",\"p2\",\"p3\"]}}",
    },
    {
      label: "Perf budget",
      prompt: "{\"route\":\"/dashboard\",\"budgetMs\":1200,\"currentP95Ms\":860,\"currentP99Ms\":1420}",
    },
    {
      label: "Audit record",
      prompt: "{\"actor\":\"sara\",\"action\":\"project.updated\",\"timestamp\":\"2026-05-05T08:31:00Z\"}",
    },
    {
      label: "Queue config",
      prompt: "{\"maxRetries\":5,\"retryDelayMs\":2000,\"visibilityTimeoutSeconds\":45}",
    },
    {
      label: "Command palette",
      prompt: "{\"commands\":[{\"id\":\"open-settings\",\"label\":\"Open Settings\"},{\"id\":\"run-tests\",\"label\":\"Run Tests\"}]}",
    },
    {
      label: "Webhook retries",
      prompt: "{\"attempt\":3,\"maxAttempts\":5,\"nextRetryAt\":\"2026-05-05T09:10:00Z\"}",
    },
  ],
);

const yamlPrompts = toPrompts(
  "yaml",
  "yaml",
  [
    {
      label: "Workflow name",
      prompt: "name: ci\non: [push, pull_request]",
    },
    {
      label: "Node step",
      prompt: "steps:\n  - uses: actions/setup-node@v4\n    with:\n      node-version: 20",
    },
    {
      label: "Docker service",
      prompt: "services:\n  postgres:\n    image: postgres:16\n    ports:\n      - \"5432:5432\"",
    },
    {
      label: "Kubernetes env",
      prompt: "env:\n  - name: DATABASE_URL\n    valueFrom:\n      secretKeyRef:\n        name: api-secrets\n        key: database-url",
    },
    {
      label: "Compose web",
      prompt: "web:\n  build: .\n  command: npm run dev -- --host 0.0.0.0\n  ports:\n    - \"5173:5173\"",
    },
    {
      label: "Helm values",
      prompt: "replicaCount: 3\nimage:\n  repository: ghcr.io/example/api\n  tag: 1.9.2",
    },
    {
      label: "Vercel route",
      prompt: "rewrites:\n  - source: /api/:path*\n    destination: https://api.example.com/:path*",
    },
    {
      label: "Lint rule",
      prompt: "rules:\n  no-console: warn\n  quote-props:\n    - error\n    - as-needed",
    },
    {
      label: "Prettier config",
      prompt: "semi: true\nsingleQuote: false\ntrailingComma: all\nprintWidth: 88",
    },
    {
      label: "GitHub matrix",
      prompt: "strategy:\n  matrix:\n    node-version: [18, 20]\n    os: [ubuntu-latest, windows-latest]",
    },
    {
      label: "Prometheus scrape",
      prompt: "scrape_configs:\n  - job_name: api\n    static_configs:\n      - targets: [\"api:9100\"]",
    },
    {
      label: "Alert threshold",
      prompt: "alerts:\n  error_rate:\n    threshold: 0.05\n    window: 10m\n    severity: critical",
    },
    {
      label: "Task runner",
      prompt: "tasks:\n  test:\n    cmds:\n      - npm run lint\n      - npm run test",
    },
    {
      label: "CI artifact",
      prompt: "artifacts:\n  paths:\n    - coverage/\n    - dist/\n  when: always",
    },
    {
      label: "Service monitor",
      prompt: "endpoints:\n  - port: metrics\n    interval: 30s\n    path: /metrics",
    },
    {
      label: "Ingress host",
      prompt: "hosts:\n  - host: app.example.com\n    paths:\n      - path: /\n        pathType: Prefix",
    },
    {
      label: "Worker concurrency",
      prompt: "worker:\n  command: python -m app.worker\n  environment:\n    CONCURRENCY: \"8\"",
    },
    {
      label: "Secrets reference",
      prompt: "secrets:\n  api-token:\n    external: true",
    },
    {
      label: "Build cache",
      prompt: "cache:\n  paths:\n    - .pnpm-store\n    - node_modules/.vite",
    },
    {
      label: "Coverage upload",
      prompt: "after_success:\n  - bash <(curl -s https://codecov.io/bash)",
    },
    {
      label: "Deploy job",
      prompt: "deploy:\n  stage: release\n  script:\n    - npm run build\n    - ./scripts/deploy.sh production",
    },
    {
      label: "Rate limit",
      prompt: "limits:\n  requests:\n    cpu: 250m\n    memory: 256Mi",
    },
    {
      label: "Log format",
      prompt: "logging:\n  level: info\n  format: json\n  includeTraceId: true",
    },
    {
      label: "Feature toggles",
      prompt: "features:\n  newDashboard: true\n  experimentalSearch: false\n  auditTrail: true",
    },
  ],
);

export const codePrompts: ContentItem[] = [
  ...typeScriptPrompts,
  ...javaScriptPrompts,
  ...pythonPrompts,
  ...sqlPrompts,
  ...shellCodePrompts,
  ...jsonPrompts,
  ...yamlPrompts,
];
