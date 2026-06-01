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
  if (prompt.length < 44) {
    return "short";
  }

  if (prompt.length < 92) {
    return "medium";
  }

  return "long";
}

function classifyDifficulty(prompt: string): PracticeDifficulty {
  const symbolCount = (prompt.match(/[{}()[\]=><;:,_./\\'"`|-]/g) ?? []).length;

  if (prompt.length > 90 || symbolCount > 14) {
    return "hard";
  }

  if (prompt.length < 46 && symbolCount < 8) {
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
    id: `command-${prefix}-${String(index + 1).padStart(3, "0")}`,
    category: "command",
    topic,
    difficulty: classifyDifficulty(seed.prompt),
    length: classifyLength(seed.prompt),
    label: seed.label,
    prompt: seed.prompt,
  }));
}

const gitPrompts = toPrompts("git", "git", [
  { label: "Status check", prompt: "git status --short --branch" },
  { label: "Prune fetch", prompt: "git fetch origin --prune --tags" },
  { label: "Create branch", prompt: "git checkout -b feature/content-library-expansion" },
  { label: "Interactive log", prompt: "git log --oneline --decorate -10" },
  { label: "Diff staged", prompt: "git diff --cached --stat" },
  { label: "Restore file", prompt: "git restore --source=HEAD~1 src/content/contentLibrary.ts" },
  { label: "Rebase branch", prompt: "git pull --rebase origin feature/phase1-mvp" },
  { label: "Track remote", prompt: "git push -u origin feature/content-library-expansion" },
  { label: "Blame line", prompt: "git blame src/hooks/useTypingSession.ts -L 40,85" },
  { label: "Worktree list", prompt: "git worktree list --porcelain" },
  { label: "Show commit", prompt: "git show --stat --summary HEAD~2" },
  { label: "Delete branch", prompt: "git branch -d feature/old-search-polish" },
  { label: "Reset mixed", prompt: "git reset --mixed HEAD~1" },
  { label: "Clean dry run", prompt: "git clean -ndx" },
  { label: "Cherry pick", prompt: "git cherry-pick --no-commit 14d5430" },
  { label: "Commit amend", prompt: "git commit --amend --no-edit" },
  { label: "Remote verbose", prompt: "git remote -v" },
  { label: "Resolve merge", prompt: "git checkout --theirs package-lock.json && git add package-lock.json" },
  { label: "Tag release", prompt: "git tag -a v1.2.0 -m \"release: v1.2.0\"" },
  { label: "Count objects", prompt: "git count-objects -vH" },
  { label: "Search history", prompt: "git log -S \"getMixedPracticeSet\" -- src/content/contentLibrary.ts" },
  { label: "Move branch", prompt: "git branch -M main" },
  { label: "Push tags", prompt: "git push origin main --follow-tags" },
  { label: "Range diff", prompt: "git range-diff origin/main...HEAD" },
]);

const npmPrompts = toPrompts("npm", "npm", [
  { label: "Install deps", prompt: "npm.cmd install" },
  { label: "Run tests", prompt: "npm.cmd test -- src/content/contentIntegrity.test.ts" },
  { label: "Build project", prompt: "npm.cmd run build" },
  { label: "Dev server", prompt: "npm.cmd run dev -- --host 127.0.0.1 --port 5175" },
  { label: "Lint fix", prompt: "npm exec eslint src --ext .ts,.tsx --fix" },
  { label: "Install package", prompt: "npm install -D @testing-library/user-event" },
  { label: "Remove package", prompt: "npm uninstall left-pad" },
  { label: "Audit summary", prompt: "npm audit --omit=dev" },
  { label: "List package", prompt: "npm ls vite" },
  { label: "Create lockfile", prompt: "npm install --package-lock-only" },
  { label: "Pack module", prompt: "npm pack --json" },
  { label: "Cache clean", prompt: "npm cache clean --force" },
  { label: "Run preview", prompt: "npm run preview -- --host 0.0.0.0 --port 4173" },
  { label: "Exec prettier", prompt: "npm exec prettier src/content --write" },
  { label: "Show funding", prompt: "npm fund" },
  { label: "View scripts", prompt: "npm pkg get scripts" },
  { label: "Set package field", prompt: "npm pkg set engines.node=\">=20\"" },
  { label: "Run coverage", prompt: "npm test -- --coverage" },
]);

const pipPrompts = toPrompts("pip", "pip", [
  { label: "Install requirements", prompt: "pip install -r requirements.txt" },
  { label: "Upgrade package", prompt: "pip install --upgrade httpx" },
  { label: "Freeze deps", prompt: "pip freeze > requirements.lock.txt" },
  { label: "Create venv", prompt: "python -m venv .venv && .\\.venv\\Scripts\\activate" },
  { label: "Run formatter", prompt: "python -m black src tests" },
  { label: "Install editable", prompt: "pip install -e .[dev]" },
  { label: "List outdated", prompt: "python -m pip list --outdated" },
  { label: "Pytest filter", prompt: "pytest tests/test_api.py -k timeout -vv" },
  { label: "Mypy check", prompt: "python -m mypy app services --strict" },
  { label: "Build wheel", prompt: "python -m build --wheel" },
  { label: "Pip cache", prompt: "python -m pip cache purge" },
  { label: "Install extras", prompt: "pip install 'fastapi[all]' uvicorn[standard]" },
  { label: "Poetry export", prompt: "poetry export -f requirements.txt --output requirements.txt" },
  { label: "Ruff lint", prompt: "python -m ruff check app scripts tests --fix" },
]);

const filesystemPrompts = toPrompts("filesystem", "fs", [
  { label: "List tree", prompt: "Get-ChildItem -Recurse -File src\\content | Select-Object FullName" },
  { label: "Move report", prompt: "Move-Item -LiteralPath .\\reports\\latest.json -Destination .\\archives\\latest.json" },
  { label: "Read file", prompt: "Get-Content -Raw .\\src\\content\\contentLibrary.ts" },
  { label: "Find markdown", prompt: "Get-ChildItem -Recurse -Filter *.md | Select-Object FullName" },
  { label: "Create dir", prompt: "New-Item -ItemType Directory -Path .\\tmp\\exports -Force | Out-Null" },
  { label: "Touch file", prompt: "Set-Content -Path .\\logs\\healthcheck.log -Value \"service healthy\"" },
  { label: "Measure lines", prompt: "(Get-Content .\\src\\App.tsx | Measure-Object -Line).Lines" },
  { label: "Copy assets", prompt: "Copy-Item -Recurse .\\public\\* .\\dist\\public\\" },
  { label: "Show hidden", prompt: "Get-ChildItem -Force" },
  { label: "List env files", prompt: "Get-ChildItem -Path . -Filter *.env* -Force" },
  { label: "Delete temp", prompt: "Remove-Item -LiteralPath .\\tmp\\cache.json -Force" },
  { label: "Resolve path", prompt: "(Resolve-Path .\\src\\content\\data\\code.ts).Path" },
  { label: "Read top lines", prompt: "Get-Content .\\package.json -TotalCount 20" },
  { label: "Zip reports", prompt: "Compress-Archive -Path .\\reports\\* -DestinationPath .\\archives\\reports.zip -Force" },
  { label: "Find old files", prompt: "Get-ChildItem .\\logs -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }" },
  { label: "Dir size", prompt: "Get-ChildItem .\\src -Recurse -File | Measure-Object -Property Length -Sum" },
  { label: "Normalize line endings", prompt: "Get-Content .\\README.md | Set-Content -NoNewline .\\README.md" },
  { label: "List worktrees", prompt: "Get-ChildItem -Force .\\.worktrees" },
]);

const searchPrompts = toPrompts("search", "search", [
  { label: "Ripgrep symbol", prompt: "rg --glob '!dist' --glob '!node_modules' \"useTypingSession\" src" },
  { label: "Find heading", prompt: "Select-String -Path .\\docs\\**\\*.md -Pattern '^# ' -CaseSensitive" },
  { label: "Search TODO", prompt: "rg \"TODO|FIXME\" src docs" },
  { label: "Locate tests", prompt: "rg --files src | rg \"test|spec\"" },
  { label: "Match error", prompt: "Get-ChildItem -Recurse -File .\\logs | Select-String -Pattern 'ERROR|CRITICAL'" },
  { label: "Find imports", prompt: "rg '^import ' src/content src/hooks" },
  { label: "Search branch name", prompt: "git branch --all | Select-String 'phase1-mvp'" },
  { label: "List content ids", prompt: "rg 'id: \"code-|id: \"command-|id: \"technical-' src/content/data" },
  { label: "Find localhost", prompt: "rg '127\\.0\\.0\\.1|localhost' src" },
  { label: "Search requests", prompt: "rg 'fetch\\(|axios\\.|httpx\\.' src" },
  { label: "List markdown links", prompt: "rg '\\[[^\\]]+\\]\\(' docs src" },
  { label: "Trace env vars", prompt: "rg 'process\\.env|os\\.getenv|env\\[' ." },
  { label: "Search json field", prompt: "rg 'request_id|trace_id' src content" },
  { label: "Command history", prompt: "Get-Content (Get-PSReadLineOption).HistorySavePath | Select-String 'git push'" },
  { label: "List yaml files", prompt: "Get-ChildItem -Recurse -Include *.yml,*.yaml | Select-Object FullName" },
  { label: "Filter tsx", prompt: "rg --files src | rg '\\.tsx$'" },
  { label: "Search hooks", prompt: "rg 'use[A-Z][A-Za-z]+' src/hooks src/components" },
  { label: "Find console", prompt: "rg 'console\\.(log|error|warn)' src" },
]);

const dockerPrompts = toPrompts("docker", "docker", [
  { label: "Container logs", prompt: "docker logs api --tail 200 | grep \"UnhandledPromiseRejection\"" },
  { label: "List containers", prompt: "docker ps --format \"table {{.Names}}\\t{{.Status}}\\t{{.Ports}}\"" },
  { label: "Build image", prompt: "docker build -t programmer-typing-app:dev ." },
  { label: "Compose up", prompt: "docker compose up --build web redis postgres" },
  { label: "Compose down", prompt: "docker compose down --remove-orphans" },
  { label: "Inspect env", prompt: "docker inspect api --format '{{json .Config.Env}}'" },
  { label: "Exec shell", prompt: "docker exec -it postgres psql -U postgres -d app_db" },
  { label: "Prune images", prompt: "docker image prune -f --filter \"until=24h\"" },
  { label: "Copy file", prompt: "docker cp api:/app/logs/server.log .\\logs\\server.log" },
  { label: "Show stats", prompt: "docker stats --no-stream web api worker" },
  { label: "Restart service", prompt: "docker restart api worker" },
  { label: "Attach network", prompt: "docker network connect internal-tools redis" },
  { label: "Remove volume", prompt: "docker volume rm programmer-typing-app_postgres-data" },
  { label: "Inspect health", prompt: "docker inspect api --format '{{.State.Health.Status}}'" },
  { label: "Pull image", prompt: "docker pull ghcr.io/example/app:latest" },
  { label: "Compose logs", prompt: "docker compose logs --follow --tail=100 web" },
  { label: "Tag image", prompt: "docker tag programmer-typing-app:dev ghcr.io/example/programmer-typing-app:dev" },
  { label: "Push image", prompt: "docker push ghcr.io/example/programmer-typing-app:dev" },
]);

const curlPrompts = toPrompts("curl", "curl", [
  { label: "Healthcheck", prompt: "curl -sS http://127.0.0.1:5175/health" },
  { label: "JSON post", prompt: "curl -X POST https://api.example.com/search -H \"Content-Type: application/json\" -d '{\"query\":\"latency\"}'" },
  { label: "Auth request", prompt: "curl -H \"Authorization: Bearer $API_TOKEN\" https://api.example.com/v1/projects" },
  { label: "Verbose fetch", prompt: "curl -v https://example.com/api/status" },
  { label: "Download file", prompt: "curl -L -o report.csv https://example.com/exports/report.csv" },
  { label: "Retry request", prompt: "curl --retry 3 --retry-delay 2 https://api.example.com/health" },
  { label: "Trace timings", prompt: "curl -w \"\\nstatus=%{http_code} total=%{time_total}\\n\" -o /dev/null -s https://api.example.com/ping" },
  { label: "Header dump", prompt: "curl -I https://app.example.com" },
  { label: "Multipart upload", prompt: "curl -F \"file=@./archives/reports.zip\" https://uploads.example.com/imports" },
  { label: "Delete resource", prompt: "curl -X DELETE -H \"Authorization: Bearer $TOKEN\" https://api.example.com/v1/tasks/42" },
  { label: "Query params", prompt: "curl \"https://api.example.com/search?query=cache&limit=20&sort=recent\"" },
  { label: "GraphQL post", prompt: "curl -X POST https://api.example.com/graphql -H \"Content-Type: application/json\" -d '{\"query\":\"{ viewer { id email } }\"}'" },
  { label: "Compressed get", prompt: "curl --compressed https://docs.example.com/architecture" },
  { label: "TLS info", prompt: "curl --tlsv1.2 --http2 https://status.example.com" },
  { label: "Save body", prompt: "curl -sS https://api.example.com/events > .\\tmp\\events.json" },
  { label: "Fail on error", prompt: "curl --fail-with-body https://api.example.com/v1/deployments/latest" },
]);

const shellPrompts = toPrompts("shell", "shell", [
  { label: "Export host", prompt: "$env:API_BASE_URL='https://api.example.com'; echo $env:API_BASE_URL" },
  { label: "Inline node", prompt: "@'`nconsole.log('hello from node')`n'@ | node -" },
  { label: "Run script", prompt: "pwsh -NoProfile -File .\\scripts\\deploy.ps1 -Environment production" },
  { label: "Set variable", prompt: "$port=5175; Start-Process npm.cmd -ArgumentList 'run','dev','--','--port',$port" },
  { label: "Check services", prompt: "Get-Service | Where-Object { $_.Status -eq 'Running' -and $_.Name -like '*docker*' }" },
  { label: "Tail log", prompt: "Get-Content .\\logs\\api.log -Wait -Tail 50" },
  { label: "Select process", prompt: "Get-Process node | Where-Object { $_.ProcessName -like '*node*' }" },
  { label: "Date stamp", prompt: "Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK'" },
  { label: "Join strings", prompt: "'lint','test','build' -join ' -> '" },
  { label: "Parse json", prompt: "Get-Content .\\tmp\\events.json | ConvertFrom-Json | Select-Object -First 5" },
  { label: "Filter branch", prompt: "git branch --all | Where-Object { $_ -match 'feature/' }" },
  { label: "Sleep poll", prompt: "1..5 | ForEach-Object { Start-Sleep -Seconds 1; Write-Output \"poll $_\" }" },
  { label: "Env lookup", prompt: "Get-ChildItem Env: | Where-Object { $_.Name -match 'TOKEN|KEY' }" },
  { label: "Read csv", prompt: "Import-Csv .\\reports\\summary.csv | Select-Object -First 10" },
]);

export const commandPrompts: ContentItem[] = [
  ...gitPrompts,
  ...npmPrompts,
  ...pipPrompts,
  ...filesystemPrompts,
  ...searchPrompts,
  ...dockerPrompts,
  ...curlPrompts,
  ...shellPrompts,
];
