from __future__ import annotations

import json
import uuid
from pathlib import Path


def make_item(topic: str, difficulty: str, length: str, label: str, prompt: str):
    return {
        "id": f"specialized-code-{topic}-{uuid.uuid4()}",
        "category": "code",
        "topic": topic,
        "difficulty": difficulty,
        "length": length,
        "label": label,
        "prompt": prompt.strip(),
        "isActive": True,
    }


def build_engineering_items():
    items = []
    items.extend(
        [
            make_item(
                "typescript",
                "medium",
                "medium",
                "Express auth guard",
                """export function requireUser(request: Request, response: Response, next: NextFunction) {
  if (!request.authUserId) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}""",
            ),
            make_item(
                "typescript",
                "hard",
                "medium",
                "Merge progress snapshot",
                """const nextSnapshot = {
  sessions: payload.sessions.map(mapSessionSnapshot),
  achievements: payload.achievements.map(mapAchievementSnapshot),
  dailyChallenge: payload.dailyChallenge ?? currentSnapshot.dailyChallenge,
};""",
            ),
            make_item(
                "python",
                "medium",
                "short",
                "Batch score normalization",
                """normalized_scores = [(score - min_score) / (max_score - min_score) for score in raw_scores]""",
            ),
            make_item(
                "java",
                "medium",
                "medium",
                "Filter active leaderboard rows",
                """List<LeaderboardRow> activeRows = rows.stream()
    .filter(LeaderboardRow::isVisible)
    .sorted(Comparator.comparingInt(LeaderboardRow::wpm).reversed())
    .toList();""",
            ),
            make_item(
                "go",
                "medium",
                "medium",
                "Load request context",
                """ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
defer cancel()

snapshot, err := service.LoadProgress(ctx, userID)
if err != nil {
    return err
}""",
            ),
            make_item(
                "rust",
                "hard",
                "medium",
                "Build API response",
                """let response = ProgressResponse {
    sessions: sessions.into_iter().map(SessionDto::from).collect(),
    achievements: achievements.into_iter().map(AchievementDto::from).collect(),
    daily_challenge,
};""",
            ),
            make_item(
                "cpp",
                "hard",
                "medium",
                "Cache rank summaries",
                """std::unordered_map<std::string, RankSummary> summaries;
for (const auto& entry : leaderboardEntries) {
    summaries.emplace(entry.userId, RankSummary{entry.rank, entry.wpm, entry.accuracy});
}""",
            ),
            make_item(
                "c",
                "medium",
                "short",
                "Reset error buffer",
                """memset(error_buffer, 0, sizeof(error_buffer));
snprintf(error_buffer, sizeof(error_buffer), "missing content item: %s", content_id);""",
            ),
            make_item(
                "sql",
                "hard",
                "medium",
                "Top daily performers",
                """SELECT user_id, MAX(best_wpm) AS max_wpm
FROM daily_challenge_progress
WHERE date_key = CURRENT_DATE
GROUP BY user_id
ORDER BY max_wpm DESC
LIMIT 20;""",
            ),
            make_item(
                "yaml",
                "medium",
                "medium",
                "Deploy pipeline",
                """steps:
  - name: Install dependencies
    run: npm ci
  - name: Run tests
    run: npm.cmd test
  - name: Build server
    run: npm.cmd run build:server""",
            ),
            make_item(
                "shell",
                "easy",
                "short",
                "Archive build output",
                """tar -czf build-artifacts.tar.gz dist dist-server data/auth.sqlite""",
            ),
            make_item(
                "javascript",
                "medium",
                "medium",
                "Collect unique topics",
                """const availableTopics = [...new Set(items.map((item) => item.topic))]
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right));""",
            ),
            make_item(
                "json",
                "easy",
                "short",
                "Leaderboard payload",
                """{"rank":12,"displayName":"dev-user","wpm":88,"accuracy":99,"recordedAt":"2026-05-06T07:10:00.000Z"}""",
            ),
            make_item(
                "typescript",
                "medium",
                "medium",
                "Select active prompt ids",
                """const activePromptIds = items
  .filter((item) => item.isActive && item.category === "code")
  .map((item) => item.id);""",
            ),
            make_item(
                "go",
                "hard",
                "medium",
                "Concurrent worker fan-in",
                """for result := range resultCh {
    if result.Err != nil {
        return fmt.Errorf("worker failed: %w", result.Err)
    }
    merged[result.Key] = result.Value
}""",
            ),
            make_item(
                "java",
                "hard",
                "medium",
                "Persist challenge assignment",
                """var assignment = challengeAssignmentRepository.upsert(
    dateKey,
    contentItemId,
    ChallengeSource.MANUAL
);""",
            ),
            make_item(
                "python",
                "medium",
                "medium",
                "Retry content fetch",
                """for attempt in range(3):
    try:
        return load_content_queue(mode, category)
    except TimeoutError:
        sleep((attempt + 1) * 0.5)""",
            ),
            make_item(
                "rust",
                "medium",
                "short",
                "Guard inactive prompt",
                """if !prompt.is_active {
    return Err(ApiError::BadRequest("prompt is inactive".into()));
}""",
            ),
            make_item(
                "cpp",
                "medium",
                "medium",
                "Format progress line",
                """std::ostringstream out;
out << entry.rank << ". " << entry.displayName << " - " << entry.wpm << " WPM";""",
            ),
            make_item(
                "c",
                "hard",
                "medium",
                "Parse integer setting",
                """char *end_ptr = NULL;
long port = strtol(env_port, &end_ptr, 10);
if (end_ptr == env_port || port <= 0) {
    return CONFIG_ERROR;
}""",
            ),
            make_item(
                "typescript",
                "medium",
                "medium",
                "Map content filters",
                """const params = new URLSearchParams();
if (filters.category) params.set("category", filters.category);
if (filters.topic) params.set("topic", filters.topic);
if (filters.difficulty) params.set("difficulty", filters.difficulty);""",
            ),
            make_item(
                "sql",
                "medium",
                "short",
                "Inactive content list",
                """SELECT id, label FROM content_items WHERE is_active = 0 ORDER BY updated_at DESC;""",
            ),
            make_item(
                "yaml",
                "medium",
                "medium",
                "Service config",
                """service:
  name: typing-api
  port: 3001
  healthcheck: /api/auth/me
  retries: 2""",
            ),
            make_item(
                "shell",
                "medium",
                "short",
                "Run targeted tests",
                """npm.cmd test -- server/test/adminRoutes.test.ts src/test/renderApp.test.tsx""",
            ),
            make_item(
                "javascript",
                "medium",
                "medium",
                "Prompt preview helper",
                """function formatPromptPreview(prompt) {
  const compact = prompt.replace(/\\s+/g, " ").trim();
  return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
}""",
            ),
        ]
    )
    return items


def build_algorithm_items():
    items = []
    items.extend(
        [
            make_item(
                "python",
                "medium",
                "medium",
                "Two sum map",
                """seen = {}
for index, value in enumerate(nums):
    complement = target - value
    if complement in seen:
        return [seen[complement], index]
    seen[value] = index""",
            ),
            make_item(
                "cpp",
                "hard",
                "medium",
                "Binary search boundary",
                """while (left < right) {
    int mid = left + (right - left) / 2;
    if (values[mid] < target) {
        left = mid + 1;
    } else {
        right = mid;
    }
}""",
            ),
            make_item(
                "java",
                "hard",
                "medium",
                "Sliding window longest unique",
                """Map<Character, Integer> lastSeen = new HashMap<>();
for (int right = 0, left = 0; right < s.length(); right++) {
    char current = s.charAt(right);
    if (lastSeen.containsKey(current)) {
        left = Math.max(left, lastSeen.get(current) + 1);
    }
    lastSeen.put(current, right);
}""",
            ),
            make_item(
                "go",
                "medium",
                "short",
                "Prefix sum query",
                """prefix[i+1] = prefix[i] + nums[i]
rangeSum := prefix[right+1] - prefix[left]""",
            ),
            make_item(
                "rust",
                "hard",
                "medium",
                "Monotonic stack",
                """while let Some(&last_index) = stack.last() {
    if heights[last_index] <= current_height {
        break;
    }
    stack.pop();
}""",
            ),
            make_item(
                "c",
                "medium",
                "medium",
                "DFS grid traversal",
                """void dfs(int row, int col) {
    if (row < 0 || col < 0 || row >= rows || col >= cols || visited[row][col]) return;
    visited[row][col] = 1;
    dfs(row + 1, col);
    dfs(row - 1, col);
    dfs(row, col + 1);
    dfs(row, col - 1);
}""",
            ),
            make_item(
                "typescript",
                "medium",
                "medium",
                "Top K heap",
                """for (const value of values) {
  minHeap.push(value);
  if (minHeap.size() > k) {
    minHeap.pop();
  }
}""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Dynamic programming stairs",
                """dp = [0] * (n + 1)
dp[0] = 1
for step in range(1, n + 1):
    dp[step] = dp[step - 1]
    if step > 1:
        dp[step] += dp[step - 2]""",
            ),
            make_item(
                "cpp",
                "hard",
                "medium",
                "Union find path compression",
                """int find(int node) {
    if (parent[node] != node) {
        parent[node] = find(parent[node]);
    }
    return parent[node];
}""",
            ),
            make_item(
                "java",
                "medium",
                "medium",
                "Level order traversal",
                """Queue<TreeNode> queue = new ArrayDeque<>();
queue.offer(root);
while (!queue.isEmpty()) {
    TreeNode node = queue.poll();
    if (node.left != null) queue.offer(node.left);
    if (node.right != null) queue.offer(node.right);
}""",
            ),
            make_item(
                "go",
                "hard",
                "medium",
                "Backtracking permutation",
                """func dfs(path []int) {
    if len(path) == len(nums) {
        result = append(result, append([]int(nil), path...))
        return
    }
}""",
            ),
            make_item(
                "rust",
                "medium",
                "short",
                "Frequency counter",
                """*counts.entry(ch).or_insert(0usize) += 1;""",
            ),
            make_item(
                "c",
                "medium",
                "short",
                "Swap pointers",
                """int tmp = nums[left];
nums[left] = nums[right];
nums[right] = tmp;""",
            ),
            make_item(
                "typescript",
                "hard",
                "medium",
                "Graph adjacency build",
                """for (const [from, to] of edges) {
  adjacency[from] ??= [];
  adjacency[from].push(to);
}""",
            ),
            make_item(
                "python",
                "medium",
                "short",
                "BFS queue setup",
                """queue = deque([(start_row, start_col, 0)])
visited.add((start_row, start_col))""",
            ),
            make_item(
                "cpp",
                "medium",
                "medium",
                "Kadane update",
                """current = std::max(value, current + value);
best = std::max(best, current);""",
            ),
            make_item(
                "java",
                "hard",
                "medium",
                "Memoized recursion",
                """if (memo.containsKey(state)) {
    return memo.get(state);
}
int answer = solve(nextState) + cost;
memo.put(state, answer);""",
            ),
            make_item(
                "go",
                "medium",
                "short",
                "Deque front pop",
                """front := deque[0]
deque = deque[1:]""",
            ),
            make_item(
                "rust",
                "hard",
                "medium",
                "Dijkstra relaxation",
                """if next_distance < distances[next_node] {
    distances[next_node] = next_distance;
    heap.push((Reverse(next_distance), next_node));
}""",
            ),
            make_item(
                "typescript",
                "medium",
                "medium",
                "Interval merge",
                """for (const [start, end] of intervals.slice(1)) {
  const last = merged[merged.length - 1];
  if (start <= last[1]) {
    last[1] = Math.max(last[1], end);
  } else {
    merged.push([start, end]);
  }
}""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Topological order",
                """while queue:
    node = queue.popleft()
    order.append(node)
    for neighbor in graph[node]:
        indegree[neighbor] -= 1
        if indegree[neighbor] == 0:
            queue.append(neighbor)""",
            ),
            make_item(
                "cpp",
                "medium",
                "short",
                "Reverse linked list step",
                """ListNode* next = current->next;
current->next = previous;
previous = current;
current = next;""",
            ),
            make_item(
                "java",
                "medium",
                "medium",
                "Heap offer poll",
                """priorityQueue.offer(score);
if (priorityQueue.size() > limit) {
    priorityQueue.poll();
}""",
            ),
            make_item(
                "go",
                "hard",
                "medium",
                "Bitmask subset iteration",
                """for mask := 0; mask < (1 << n); mask++ {
    if mask&(1<<bit) != 0 {
        sum += values[bit]
    }
}""",
            ),
            make_item(
                "rust",
                "medium",
                "medium",
                "Two pointer palindrome",
                """while left < right {
    if chars[left] != chars[right] {
        return false;
    }
    left += 1;
    right -= 1;
}""",
            ),
        ]
    )
    return items


def build_llm_items():
    items = []
    items.extend(
        [
            make_item(
                "python",
                "medium",
                "medium",
                "Chat completion request",
                """response = client.responses.create(
    model="gpt-5.5",
    input=[
        {"role": "system", "content": "You are a code review assistant."},
        {"role": "user", "content": review_prompt},
    ],
)""",
            ),
            make_item(
                "typescript",
                "medium",
                "medium",
                "Tool call payload",
                """const toolCall = {
  type: "function",
  name: "search_docs",
  arguments: JSON.stringify({ query, topK: 5 }),
};""",
            ),
            make_item(
                "javascript",
                "medium",
                "medium",
                "Streaming delta append",
                """for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    output += event.delta;
  }
}""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Chunk documents for RAG",
                """for document in documents:
    for start in range(0, len(document), chunk_size - overlap):
        chunks.append(document[start:start + chunk_size])""",
            ),
            make_item(
                "go",
                "medium",
                "medium",
                "Embedding request body",
                """payload := map[string]any{
    "model": "text-embedding-3-large",
    "input": batch,
}""",
            ),
            make_item(
                "rust",
                "hard",
                "medium",
                "System prompt template",
                """let system_prompt = format!(
    "Answer using only the supplied context. Cite section ids like [{}].",
    section_ids.join(", ")
);""",
            ),
            make_item(
                "typescript",
                "hard",
                "medium",
                "Conversation truncation",
                """const trimmedMessages = messages.slice(-maxMessages).map((message) => ({
  role: message.role,
  content: message.content,
}));""",
            ),
            make_item(
                "python",
                "medium",
                "short",
                "Cosine similarity rank",
                """scores = sorted(candidates, key=lambda item: cosine(query_vec, item.embedding), reverse=True)""",
            ),
            make_item(
                "java",
                "medium",
                "medium",
                "Retry model fallback",
                """String model = primaryModel;
if (response.statusCode() == 429) {
    model = fallbackModel;
}""",
            ),
            make_item(
                "yaml",
                "medium",
                "medium",
                "Prompt workflow config",
                """prompting:
  summarize_first: true
  max_context_chunks: 6
  citation_mode: inline
  tool_budget: 3""",
            ),
            make_item(
                "json",
                "easy",
                "short",
                "Message array payload",
                """{"messages":[{"role":"system","content":"Be concise."},{"role":"user","content":"Summarize the diff."}]}""",
            ),
            make_item(
                "shell",
                "easy",
                "short",
                "Inspect token usage",
                """jq '.usage' response.json""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Map retrieved citations",
                """citation_map = {
    chunk["id"]: {"title": chunk["title"], "score": chunk["score"]}
    for chunk in retrieved_chunks
}""",
            ),
            make_item(
                "typescript",
                "medium",
                "medium",
                "Assistant message merge",
                """const mergedContent = outputs
  .filter((part) => part.type === "output_text")
  .map((part) => part.text)
  .join("");""",
            ),
            make_item(
                "go",
                "hard",
                "medium",
                "Buffered tool events",
                """for event := range events {
    if event.Type == "tool_call.delta" {
        buffer.WriteString(event.Delta)
    }
}""",
            ),
            make_item(
                "rust",
                "medium",
                "short",
                "Prompt cache key",
                """let cache_key = format!("{}:{}:{}", model, prompt_hash, max_output_tokens);""",
            ),
            make_item(
                "javascript",
                "medium",
                "medium",
                "Validate structured answer",
                """if (!Array.isArray(payload.findings) || typeof payload.summary !== "string") {
  throw new Error("Invalid structured response");
}""",
            ),
            make_item(
                "python",
                "medium",
                "medium",
                "Windowed transcript build",
                """window = messages[-12:]
transcript = "\\n".join(f"{item['role']}: {item['content']}" for item in window)""",
            ),
            make_item(
                "java",
                "hard",
                "medium",
                "Tool budget guard",
                """if (toolCalls.size() >= maxToolCalls) {
    throw new IllegalStateException("Tool budget exhausted");
}""",
            ),
            make_item(
                "typescript",
                "medium",
                "short",
                "Inline citation render",
                """return `${finding.text} [${finding.citationIds.join(", ")}]`;""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Rerank retrieved chunks",
                """reranked = sorted(
    retrieved_chunks,
    key=lambda chunk: (chunk["semantic_score"], chunk["keyword_score"]),
    reverse=True,
)""",
            ),
            make_item(
                "go",
                "medium",
                "medium",
                "Assemble moderation result",
                """result := ModerationResult{
    Allowed: response.Allowed,
    Categories: response.Categories,
    RequestID: requestID,
}""",
            ),
            make_item(
                "rust",
                "hard",
                "medium",
                "Deserialize tool arguments",
                """let args: SearchDocsArgs = serde_json::from_str(&tool_call.arguments)
    .context("failed to parse search_docs arguments")?;""",
            ),
            make_item(
                "yaml",
                "medium",
                "medium",
                "RAG pipeline config",
                """retrieval:
  chunk_size: 800
  overlap: 120
  rerank_top_n: 8
  answer_top_n: 4""",
            ),
            make_item(
                "javascript",
                "easy",
                "short",
                "Message role check",
                """const hasSystemPrompt = messages.some((message) => message.role === "system");""",
            ),
        ]
    )
    return items


def build_ml_items():
    items = []
    items.extend(
        [
            make_item(
                "python",
                "medium",
                "medium",
                "Train test split",
                """train_df, valid_df = train_test_split(
    data_frame,
    test_size=0.2,
    random_state=42,
    stratify=data_frame["label"],
)""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "PyTorch training step",
                """optimizer.zero_grad()
logits = model(batch["input_ids"])
loss = criterion(logits, batch["labels"])
loss.backward()
optimizer.step()""",
            ),
            make_item(
                "python",
                "medium",
                "short",
                "Normalize features",
                """features = (features - features.mean(axis=0)) / (features.std(axis=0) + 1e-8)""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Confusion matrix loop",
                """for truth, pred in zip(targets, predictions):
    confusion[truth, pred] += 1""",
            ),
            make_item(
                "python",
                "medium",
                "medium",
                "Dataset __getitem__",
                """def __getitem__(self, index):
    row = self.rows[index]
    return {
        "input_ids": torch.tensor(row["input_ids"]),
        "label": torch.tensor(row["label"]),
    }""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Gradient clipping",
                """torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)""",
            ),
            make_item(
                "python",
                "medium",
                "medium",
                "Rolling feature window",
                """data_frame["rolling_mean"] = (
    data_frame["value"].rolling(window=5, min_periods=1).mean()
)""",
            ),
            make_item(
                "python",
                "medium",
                "short",
                "Sklearn pipeline",
                """pipeline = Pipeline([
    ("scale", StandardScaler()),
    ("model", LogisticRegression(max_iter=200)),
])""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Early stopping check",
                """if valid_loss < best_loss:
    best_loss = valid_loss
    patience = 0
else:
    patience += 1""",
            ),
            make_item(
                "python",
                "medium",
                "medium",
                "Batch probability threshold",
                """predictions = (torch.sigmoid(logits) >= threshold).to(dtype=torch.int64)""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Attention mask creation",
                """attention_mask = (input_ids != tokenizer.pad_token_id).long()""",
            ),
            make_item(
                "python",
                "medium",
                "short",
                "Top feature importances",
                """top_features = sorted(importances.items(), key=lambda item: item[1], reverse=True)[:10]""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Cross entropy label smoothing",
                """loss = F.cross_entropy(logits, labels, label_smoothing=0.1)""",
            ),
            make_item(
                "python",
                "medium",
                "medium",
                "Prediction dataframe merge",
                """merged = predictions_df.merge(metadata_df, on="row_id", how="left")""",
            ),
            make_item(
                "python",
                "medium",
                "short",
                "Class weight tensor",
                """class_weights = torch.tensor([0.25, 0.75], dtype=torch.float32, device=device)""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Sequence padding",
                """padded = pad_sequence(token_tensors, batch_first=True, padding_value=tokenizer.pad_token_id)""",
            ),
            make_item(
                "python",
                "medium",
                "medium",
                "AUC metric update",
                """auc_metric.update(
    preds=torch.softmax(logits, dim=-1)[:, 1],
    target=batch["labels"],
)""",
            ),
            make_item(
                "python",
                "medium",
                "short",
                "Random sampler setup",
                """sampler = WeightedRandomSampler(sample_weights, num_samples=len(sample_weights), replacement=True)""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Best checkpoint save",
                """torch.save(
    {"model": model.state_dict(), "optimizer": optimizer.state_dict()},
    checkpoint_path,
)""",
            ),
            make_item(
                "python",
                "medium",
                "medium",
                "Groupby label stats",
                """label_stats = data_frame.groupby("label")["score"].agg(["mean", "std", "count"])""",
            ),
            make_item(
                "python",
                "medium",
                "short",
                "Prediction clip",
                """predictions = np.clip(predictions, a_min=0.0, a_max=1.0)""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Manual seed block",
                """torch.manual_seed(42)
np.random.seed(42)
random.seed(42)""",
            ),
            make_item(
                "python",
                "medium",
                "medium",
                "Feature hash bucket",
                """bucket_id = mmh3.hash(feature_name, signed=False) % num_buckets""",
            ),
            make_item(
                "python",
                "hard",
                "medium",
                "Sequence loss masking",
                """loss = F.cross_entropy(
    logits.view(-1, logits.size(-1)),
    labels.view(-1),
    ignore_index=-100,
)""",
            ),
            make_item(
                "python",
                "medium",
                "short",
                "Inference no grad",
                """with torch.no_grad():
    logits = model(batch["input_ids"])""",
            ),
        ]
    )
    return items


def main():
    items = (
        build_engineering_items()
        + build_algorithm_items()
        + build_llm_items()
        + build_ml_items()
    )
    exported = [item for item in items if item["prompt"]]
    output_path = (
        Path(__file__).resolve().parents[1]
        / "data"
        / "specialized-code-pack-2026-05-06.json"
    )
    output_path.write_text(json.dumps(exported, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        json.dumps(
            {
                "count": len(exported),
                "output": str(output_path),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
