import { useState, useEffect, useRef, useCallback } from "react";

// ─── MOCK JENKINSFILES (one per repo) ───────────────────────────────────────
const JENKINSFILES = {
  "github.com/sameeermokhasi/forgeCI-frontend": {
    agent: "node",
    stages: [
      { name: "Install", steps: ["npm ci"], duration: 8000 },
      { name: "Lint", steps: ["npm run lint"], duration: 5000 },
      { name: "Build", steps: ["npm run build"], duration: 9000 },
      { name: "Test", steps: ["npm run test -- --coverage"], duration: 12000 },
      { name: "Deploy", steps: ["npm run preview"], duration: 7000 },
    ],
  },
  "github.com/sameeermokhasi/forgeCI-data": {
    agent: "python",
    stages: [
      { name: "Deps", steps: ["pip install pdf2image PyPDF2"], duration: 6000 },
      { name: "Lint", steps: ["pylint pdf2txt.py"], duration: 3000 },
      { name: "Test", steps: ["pytest --cov=."], duration: 15000, parallel: false },
      { name: "Process", steps: ["python pdf2txt.py"], duration: 4000 },
      { name: "Deploy", steps: ["python -m PyPDF2"], duration: 6000 },
    ],
  },
  "github.com/sameeermokhasi/forgeCI-infra": {
    agent: "terraform",
    stages: [
      { name: "Init", steps: ["terraform init"], duration: 5000 },
      { name: "Validate", steps: ["terraform validate"], duration: 3000 },
      { name: "Plan", steps: ["terraform plan -out=tfplan"], duration: 10000 },
      { name: "Apply", steps: ["terraform apply tfplan"], duration: 14000 },
    ],
  },
  "github.com/sameeermokhasi/forgeCI-backend": {
    agent: "spark",
    stages: [
      { name: "Deps", steps: ["npm install"], duration: 18000 },
      { name: "Build", steps: ["npm run start"], duration: 11000 },
      { name: "Test", steps: ["npm test"], duration: 20000 },
      { name: "Deploy", steps: ["docker build && docker push"], duration: 7000 },
    ],
  },
};

const REPOS = Object.keys(JENKINSFILES);
const BRANCHES = ["main", "develop", "feature/auth", "hotfix/payment", "release/2.4"];
const AUTHORS = ["alice", "bob", "carol", "dave", "eve"];

// ─── JENKINS MASTER (Job Scheduler & Pipeline Orchestrator) ──────────────────
class JenkinsMaster {
  constructor(maxConcurrentWorkers = 2) {
    this.maxWorkers = maxConcurrentWorkers;
    this.queue = []; // Priority-sorted queue of queued jobs
    this.running = new Map(); // Map of jobId -> job (currently executing)
    this.completed = []; // Historical completed jobs
    this.jobIdCounter = 0;
  }

  // Enqueue a new job from API POST
  enqueueJob(jobData) {
    const job = {
      id: `build-${String(++this.jobIdCounter).padStart(4, "0")}`,
      ...jobData,
      status: "queued",
      enqueuedAt: Date.now(),
      stages: [],
      currentStageIdx: -1,
      startedAt: null,
      completedAt: null,
      outcome: null,
    };
    this.queue.push(job);
    this._sortQueue();
    return job;
  }

  // Sort queue by priority (lower number = higher priority)
  _sortQueue() {
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  // Promote queued jobs to running if slots available
  promoteQueuedJobs() {
    const availableSlots = this.maxWorkers - this.running.size;
    for (let i = 0; i < availableSlots && this.queue.length > 0; i++) {
      const job = this.queue.shift();
      this._startJob(job);
      this.running.set(job.id, job);
    }
  }

  // Start a job: initialize first stage
  _startJob(job) {
    const now = Date.now();
    const stages = job.jenkinsfile.stages.map((stage, idx) => ({
      name: stage.name,
      status: idx === 0 ? "running" : "pending",
      progress: 0,
      startedAt: idx === 0 ? now : null,
      completedAt: null,
    }));
    job.status = "running";
    job.startedAt = now;
    job.stages = stages;
    job.currentStageIdx = 0;
  }

  // Tick: progress all running jobs one frame
  tick(deltaMs = 200) {
    const now = Date.now();
    for (const job of this.running.values()) {
      this._tickPipeline(job, now);
      // Check if job completed
      if (job.status === "completed") {
        this.running.delete(job.id);
        this.completed.push(job);
      }
    }
  }

  // Progress a single job's pipeline
  _tickPipeline(job, now) {
    const stageIdx = job.currentStageIdx;
    const stageDef = job.jenkinsfile.stages[stageIdx];
    const stage = job.stages[stageIdx];

    if (!stage || !stageDef) return;

    const elapsed = now - stage.startedAt;
    const progress = Math.min(1, elapsed / stageDef.duration);
    stage.progress = progress;

    if (progress >= 1) {
      // Stage done
      stage.status = "done";
      stage.progress = 1;
      stage.completedAt = now;

      const nextIdx = stageIdx + 1;
      if (nextIdx < job.jenkinsfile.stages.length) {
        // Start next stage
        const nextStageDef = job.jenkinsfile.stages[nextIdx];
        job.stages[nextIdx] = {
          name: nextStageDef.name,
          status: "running",
          progress: 0,
          startedAt: now,
          completedAt: null,
        };
        job.currentStageIdx = nextIdx;
      } else {
        // All stages done - finalize job
        const failRoll = Math.random();
        job.status = "completed";
        job.completedAt = now;
        job.outcome = failRoll < 0.12 ? "failed" : "success";
        job.currentStageIdx = -1;
      }
    }
  }

  setMaxWorkers(count) {
    this.maxWorkers = count;
  }

  getStats() {
    return {
      queued: this.queue.length,
      running: this.running.size,
      completed: this.completed.length,
      success: this.completed.filter(j => j.outcome === "success").length,
      failed: this.completed.filter(j => j.outcome === "failed").length,
    };
  }

  getAllJobs() {
    return {
      queued: [...this.queue],
      running: Array.from(this.running.values()),
      completed: [...this.completed].reverse(),
    };
  }

  clearAll() {
    this.queue = [];
    this.running.clear();
    this.completed = [];
  }
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randSha = () => Math.random().toString(16).slice(2, 10);

function createJobFromApiData(repo, branch, sha, author, message) {
  const priority = branch === "main" ? 1 : branch.startsWith("hotfix") ? 0 : 2;
  return {
    repo,
    branch,
    sha,
    author,
    message,
    priority,
    jenkinsfile: JENKINSFILES[repo],
  };
}

// ─── AGENT COLORS ────────────────────────────────────────────────────────────
const AGENT_STYLES = {
  node:      { bg: "#1a3a2a", accent: "#4ade80", label: "NODE" },
  python:    { bg: "#1a2a3a", accent: "#60a5fa", label: "PY" },
  terraform: { bg: "#2a1a3a", accent: "#a78bfa", label: "TF" },
  spark:     { bg: "#3a2a1a", accent: "#fb923c", label: "SPARK" },
};

const getAgentStyle = (agent) => AGENT_STYLES[agent] || { bg: "#1a1a2a", accent: "#94a3b8", label: agent?.toUpperCase()?.slice(0, 4) };

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function StageBar({ stage, stageDef }) {
  const pct = Math.round((stage.progress || 0) * 100);
  const isRunning = stage.status === "running";
  const isDone = stage.status === "done";
  const isPending = stage.status === "pending";

  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{
          fontSize: 10,
          fontFamily: "'IBM Plex Mono', monospace",
          color: isDone ? "#4ade80" : isRunning ? "#f8fafc" : "#475569",
          letterSpacing: "0.05em",
          display: "flex", alignItems: "center", gap: 5
        }}>
          {isDone && <span style={{ color: "#4ade80" }}>✓</span>}
          {isRunning && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#60a5fa", animation: "pulse 1s infinite" }} />}
          {isPending && <span style={{ color: "#334155" }}>○</span>}
          {stage.name}
        </span>
        <span style={{ fontSize: 10, color: isDone ? "#4ade80" : isRunning ? "#94a3b8" : "#334155", fontFamily: "'IBM Plex Mono', monospace" }}>
          {isDone ? "100%" : isRunning ? `${pct}%` : "—"}
        </span>
      </div>
      <div style={{ height: 4, background: "#0f172a", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${isDone ? 100 : pct}%`,
          background: isDone ? "#166534" : isRunning ? "linear-gradient(90deg, #2563eb, #60a5fa)" : "#1e293b",
          borderRadius: 2,
          transition: "width 0.2s linear",
          position: "relative",
          overflow: "hidden",
        }}>
          {isRunning && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
              animation: "shimmer 1.2s infinite",
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, compact = false }) {
  const agentStyle = getAgentStyle(job.jenkinsfile?.agent);
  const isRunning = job.status === "running";
  const isCompleted = job.status === "completed";
  const isQueued = job.status === "queued";

  const totalDuration = job.jenkinsfile?.stages?.reduce((a, s) => a + s.duration, 0) || 1;
  const elapsed = isRunning && job.startedAt ? Date.now() - job.startedAt : 0;
  const overallPct = isCompleted ? 100 : isRunning
    ? Math.min(100, Math.round((elapsed / totalDuration) * 100))
    : 0;

  const priorityLabel = job.priority === 0 ? "HOTFIX" : job.priority === 1 ? "MAIN" : "FEAT";
  const priorityColor = job.priority === 0 ? "#ef4444" : job.priority === 1 ? "#f59e0b" : "#475569";

  const waitSecs = isQueued ? Math.round((Date.now() - job.enqueuedAt) / 1000) : null;
  const runSecs = (isRunning || isCompleted) && job.startedAt
    ? Math.round(((job.completedAt || Date.now()) - job.startedAt) / 1000)
    : null;

  return (
    <div style={{
      background: "#0f172a",
      border: `1px solid ${isRunning ? "#1e40af" : isCompleted ? (job.outcome === "failed" ? "#7f1d1d" : "#14532d") : "#1e293b"}`,
      borderRadius: 8,
      padding: compact ? "10px 12px" : "14px 16px",
      marginBottom: 10,
      position: "relative",
      overflow: "hidden",
      boxShadow: isRunning ? "0 0 20px rgba(37,99,235,0.08)" : "none",
    }}>
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: isCompleted
          ? (job.outcome === "failed" ? "#ef4444" : "#22c55e")
          : isRunning ? "#3b82f6" : "#334155",
        borderRadius: "8px 0 0 8px",
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: isRunning ? 12 : 0 }}>
        {/* Agent badge */}
        <div style={{
          background: agentStyle.bg,
          border: `1px solid ${agentStyle.accent}22`,
          borderRadius: 4,
          padding: "2px 6px",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: agentStyle.accent, letterSpacing: "0.1em" }}>
            {agentStyle.label}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'IBM Plex Mono', monospace" }}>{job.id}</span>
            <span style={{ fontSize: 9, background: `${priorityColor}22`, color: priorityColor, borderRadius: 3, padding: "1px 5px", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>
              {priorityLabel}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.repo.replace("github.com/acme/", "")}
            <span style={{ color: "#475569" }}> @ </span>
            <span style={{ color: "#60a5fa" }}>{job.branch}</span>
          </div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ color: "#64748b" }}>{job.sha}</span>
            <span style={{ color: "#1e293b" }}> · </span>
            <span>{job.author}</span>
            <span style={{ color: "#1e293b" }}> · </span>
            <span>{job.message}</span>
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {isQueued && (
            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>
              wait {waitSecs}s
            </div>
          )}
          {(isRunning || isCompleted) && runSecs !== null && (
            <div style={{ fontSize: 10, color: isCompleted ? (job.outcome === "failed" ? "#ef4444" : "#4ade80") : "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>
              {runSecs}s
            </div>
          )}
          {isCompleted && (
            <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: job.outcome === "failed" ? "#ef4444" : "#22c55e", marginTop: 2 }}>
              {job.outcome === "failed" ? "FAILED" : "SUCCESS"}
            </div>
          )}
        </div>
      </div>

      {/* Stage progress (only when running) */}
      {isRunning && job.stages.length > 0 && (
        <div style={{ paddingLeft: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 9, color: "#475569", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em" }}>PIPELINE STAGES</span>
            <span style={{ fontSize: 9, color: "#3b82f6", fontFamily: "'IBM Plex Mono', monospace" }}>{overallPct}% overall</span>
          </div>
          {job.stages.map((stage, i) => (
            <StageBar key={i} stage={stage} stageDef={job.jenkinsfile.stages[i]} />
          ))}
        </div>
      )}

      {/* Completed stage summary */}
      {isCompleted && job.stages.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {job.stages.map((s, i) => (
            <span key={i} style={{
              fontSize: 9, fontFamily: "'IBM Plex Mono', monospace",
              padding: "2px 6px", borderRadius: 3,
              background: s.status === "done" ? "#14532d" : "#7f1d1d",
              color: s.status === "done" ? "#4ade80" : "#fca5a5",
            }}>
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Column({ title, count, accent, children }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        paddingBottom: 10, borderBottom: `1px solid #1e293b`
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#94a3b8", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {title}
        </span>
        <span style={{
          marginLeft: "auto",
          fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
          background: "#1e293b", color: "#475569",
          padding: "1px 7px", borderRadius: 10,
        }}>
          {count}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {children}
        {count === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#1e293b", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
            empty
          </div>
        )}
      </div>
    </div>
  );
}

// ─── POST API MODAL ───────────────────────────────────────────────────────────
function ApiModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    repo: REPOS[0],
    branch: "main",
    sha: randSha(),
    author: "alice",
    message: "feat: add new feature",
  });

  const payload = JSON.stringify({
    repository: { url: form.repo },
    ref: `refs/heads/${form.branch}`,
    after: form.sha,
    pusher: { name: form.author },
    head_commit: { message: form.message },
  }, null, 2);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12,
        padding: 24, width: 520, maxWidth: "95vw",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: "#3b82f6", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", marginBottom: 2 }}>POST /api/v1/jobs</div>
            <div style={{ fontSize: 13, color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace" }}>Enqueue a new build</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        {/* Form fields */}
        {[
          { label: "Repository", key: "repo", type: "select", options: REPOS },
          { label: "Branch", key: "branch", type: "select", options: BRANCHES },
          { label: "Commit SHA", key: "sha", type: "text" },
          { label: "Author", key: "author", type: "select", options: AUTHORS },
          { label: "Commit message", key: "message", type: "text" },
        ].map(({ label, key, type, options }) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4, letterSpacing: "0.06em" }}>{label}</div>
            {type === "select" ? (
              <select
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{
                  width: "100%", background: "#020617", border: "1px solid #1e293b",
                  borderRadius: 6, padding: "6px 10px", color: "#e2e8f0",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, outline: "none",
                }}
              >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{
                  width: "100%", background: "#020617", border: "1px solid #1e293b",
                  borderRadius: 6, padding: "6px 10px", color: "#e2e8f0",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>
        ))}

        <div style={{ marginTop: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6, letterSpacing: "0.06em" }}>PAYLOAD PREVIEW</div>
          <pre style={{
            background: "#020617", border: "1px solid #1e293b", borderRadius: 6,
            padding: 12, fontSize: 10, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace",
            overflow: "auto", maxHeight: 140, margin: 0,
          }}>{payload}</pre>
        </div>

        <button
          onClick={() => { onSubmit(form); onClose(); }}
          style={{
            width: "100%", padding: "10px 0",
            background: "#1d4ed8", border: "none", borderRadius: 6,
            color: "#fff", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
            cursor: "pointer", letterSpacing: "0.08em",
          }}
        >
          POST → ENQUEUE JOB
        </button>
      </div>
    </div>
  );
}

// ─── JENKINS MASTER (JOB SCHEDULER & PIPELINE ORCHESTRATOR) ────────────────────
class JenkinsMaster {
  constructor(maxConcurrentWorkers = 2) {
    this.maxWorkers = maxConcurrentWorkers;
    this.queue = []; // Priority queue of queued jobs
    this.running = new Map(); // Map of jobId -> job (currently executing)
    this.completed = []; // Historical completed jobs
    this.jobIdCounter = 0;
  }

  // Enqueue a new job from API POST
  enqueueJob(jobData) {
    const job = {
      id: `build-${String(++this.jobIdCounter).padStart(4, "0")}`,
      ...jobData,
      status: "queued",
      enqueuedAt: Date.now(),
      stages: [],
      currentStageIdx: -1,
      startedAt: null,
      completedAt: null,
      outcome: null,
    };
    this.queue.push(job);
    this._sortQueue();
    return job;
  }

  // Sort queue by priority (lower number = higher priority)
  _sortQueue() {
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  // Promote queued jobs to running if slots available
  promoteQueuedJobs() {
    const availableSlots = this.maxWorkers - this.running.size;
    for (let i = 0; i < availableSlots && this.queue.length > 0; i++) {
      const job = this.queue.shift();
      this._startJob(job);
      this.running.set(job.id, job);
    }
  }

  // Start a job: initialize first stage
  _startJob(job) {
    const now = Date.now();
    const stages = job.jenkinsfile.stages.map((stage, idx) => ({
      name: stage.name,
      status: idx === 0 ? "running" : "pending",
      progress: 0,
      startedAt: idx === 0 ? now : null,
      completedAt: null,
    }));
    job.status = "running";
    job.startedAt = now;
    job.stages = stages;
    job.currentStageIdx = 0;
  }

  // Tick: progress all running jobs one frame
  tick(deltaMs = 200) {
    const now = Date.now();
    for (const job of this.running.values()) {
      this._tickPipeline(job, now);
      // Check if job completed
      if (job.status === "completed") {
        this.running.delete(job.id);
        this.completed.push(job);
      }
    }
  }

  // Progress a single job's pipeline
  _tickPipeline(job, now) {
    const stageIdx = job.currentStageIdx;
    const stageDef = job.jenkinsfile.stages[stageIdx];
    const stage = job.stages[stageIdx];

    if (!stage || !stageDef) return;

    const elapsed = now - stage.startedAt;
    const progress = Math.min(1, elapsed / stageDef.duration);
    stage.progress = progress;

    if (progress >= 1) {
      // Stage done
      stage.status = "done";
      stage.progress = 1;
      stage.completedAt = now;

      const nextIdx = stageIdx + 1;
      if (nextIdx < job.jenkinsfile.stages.length) {
        // Start next stage
        const nextStageDef = job.jenkinsfile.stages[nextIdx];
        job.stages[nextIdx] = {
          name: nextStageDef.name,
          status: "running",
          progress: 0,
          startedAt: now,
          completedAt: null,
        };
        job.currentStageIdx = nextIdx;
      } else {
        // All stages done - finalize job
        const failRoll = Math.random();
        job.status = "completed";
        job.completedAt = now;
        job.outcome = failRoll < 0.12 ? "failed" : "success";
        job.currentStageIdx = -1;
      }
    }
  }

  setMaxWorkers(count) {
    this.maxWorkers = count;
  }

  getStats() {
    return {
      queued: this.queue.length,
      running: this.running.size,
      completed: this.completed.length,
      success: this.completed.filter(j => j.outcome === "success").length,
      failed: this.completed.filter(j => j.outcome === "failed").length,
    };
  }

  getAllJobs() {
    return {
      queued: [...this.queue],
      running: Array.from(this.running.values()),
      completed: [...this.completed].reverse(),
    };
  }

  clearAll() {
    this.queue = [];
    this.running.clear();
    this.completed = [];
  }
}



// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function StageBar({ stage, stageDef }) {
  const pct = Math.round((stage.progress || 0) * 100);
  const isRunning = stage.status === "running";
  const isDone = stage.status === "done";
  const isPending = stage.status === "pending";

  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{
          fontSize: 10,
          fontFamily: "'IBM Plex Mono', monospace",
          color: isDone ? "#4ade80" : isRunning ? "#f8fafc" : "#475569",
          letterSpacing: "0.05em",
          display: "flex", alignItems: "center", gap: 5
        }}>
          {isDone && <span style={{ color: "#4ade80" }}>✓</span>}
          {isRunning && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#60a5fa", animation: "pulse 1s infinite" }} />}
          {isPending && <span style={{ color: "#334155" }}>○</span>}
          {stage.name}
        </span>
        <span style={{ fontSize: 10, color: isDone ? "#4ade80" : isRunning ? "#94a3b8" : "#334155", fontFamily: "'IBM Plex Mono', monospace" }}>
          {isDone ? "100%" : isRunning ? `${pct}%` : "—"}
        </span>
      </div>
      <div style={{ height: 4, background: "#0f172a", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${isDone ? 100 : pct}%`,
          background: isDone ? "#166534" : isRunning ? "linear-gradient(90deg, #2563eb, #60a5fa)" : "#1e293b",
          borderRadius: 2,
          transition: "width 0.2s linear",
          position: "relative",
          overflow: "hidden",
        }}>
          {isRunning && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
              animation: "shimmer 1.2s infinite",
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, compact = false }) {
  const agentStyle = getAgentStyle(job.jenkinsfile?.agent);
  const isRunning = job.status === "running";
  const isCompleted = job.status === "completed";
  const isQueued = job.status === "queued";

  const totalDuration = job.jenkinsfile?.stages?.reduce((a, s) => a + s.duration, 0) || 1;
  const elapsed = isRunning && job.startedAt ? Date.now() - job.startedAt : 0;
  const overallPct = isCompleted ? 100 : isRunning
    ? Math.min(100, Math.round((elapsed / totalDuration) * 100))
    : 0;

  const priorityLabel = job.priority === 0 ? "HOTFIX" : job.priority === 1 ? "MAIN" : "FEAT";
  const priorityColor = job.priority === 0 ? "#ef4444" : job.priority === 1 ? "#f59e0b" : "#475569";

  const waitSecs = isQueued ? Math.round((Date.now() - job.enqueuedAt) / 1000) : null;
  const runSecs = (isRunning || isCompleted) && job.startedAt
    ? Math.round(((job.completedAt || Date.now()) - job.startedAt) / 1000)
    : null;

  return (
    <div style={{
      background: "#0f172a",
      border: `1px solid ${isRunning ? "#1e40af" : isCompleted ? (job.outcome === "failed" ? "#7f1d1d" : "#14532d") : "#1e293b"}`,
      borderRadius: 8,
      padding: compact ? "10px 12px" : "14px 16px",
      marginBottom: 10,
      position: "relative",
      overflow: "hidden",
      boxShadow: isRunning ? "0 0 20px rgba(37,99,235,0.08)" : "none",
    }}>
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: isCompleted
          ? (job.outcome === "failed" ? "#ef4444" : "#22c55e")
          : isRunning ? "#3b82f6" : "#334155",
        borderRadius: "8px 0 0 8px",
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: isRunning ? 12 : 0 }}>
        {/* Agent badge */}
        <div style={{
          background: agentStyle.bg,
          border: `1px solid ${agentStyle.accent}22`,
          borderRadius: 4,
          padding: "2px 6px",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: agentStyle.accent, letterSpacing: "0.1em" }}>
            {agentStyle.label}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'IBM Plex Mono', monospace" }}>{job.id}</span>
            <span style={{ fontSize: 9, background: `${priorityColor}22`, color: priorityColor, borderRadius: 3, padding: "1px 5px", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>
              {priorityLabel}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.repo.replace("github.com/acme/", "")}
            <span style={{ color: "#475569" }}> @ </span>
            <span style={{ color: "#60a5fa" }}>{job.branch}</span>
          </div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ color: "#64748b" }}>{job.sha}</span>
            <span style={{ color: "#1e293b" }}> · </span>
            <span>{job.author}</span>
            <span style={{ color: "#1e293b" }}> · </span>
            <span>{job.message}</span>
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {isQueued && (
            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>
              wait {waitSecs}s
            </div>
          )}
          {(isRunning || isCompleted) && runSecs !== null && (
            <div style={{ fontSize: 10, color: isCompleted ? (job.outcome === "failed" ? "#ef4444" : "#4ade80") : "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>
              {runSecs}s
            </div>
          )}
          {isCompleted && (
            <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: job.outcome === "failed" ? "#ef4444" : "#22c55e", marginTop: 2 }}>
              {job.outcome === "failed" ? "FAILED" : "SUCCESS"}
            </div>
          )}
        </div>
      </div>

      {/* Stage progress (only when running) */}
      {isRunning && job.stages.length > 0 && (
        <div style={{ paddingLeft: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 9, color: "#475569", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em" }}>PIPELINE STAGES</span>
            <span style={{ fontSize: 9, color: "#3b82f6", fontFamily: "'IBM Plex Mono', monospace" }}>{overallPct}% overall</span>
          </div>
          {job.stages.map((stage, i) => (
            <StageBar key={i} stage={stage} stageDef={job.jenkinsfile.stages[i]} />
          ))}
        </div>
      )}

      {/* Completed stage summary */}
      {isCompleted && job.stages.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {job.stages.map((s, i) => (
            <span key={i} style={{
              fontSize: 9, fontFamily: "'IBM Plex Mono', monospace",
              padding: "2px 6px", borderRadius: 3,
              background: s.status === "done" ? "#14532d" : "#7f1d1d",
              color: s.status === "done" ? "#4ade80" : "#fca5a5",
            }}>
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Column({ title, count, accent, children }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        paddingBottom: 10, borderBottom: `1px solid #1e293b`
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#94a3b8", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {title}
        </span>
        <span style={{
          marginLeft: "auto",
          fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
          background: "#1e293b", color: "#475569",
          padding: "1px 7px", borderRadius: 10,
        }}>
          {count}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {children}
        {count === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#1e293b", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
            empty
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const masterRef = useRef(new JenkinsMaster(2));
  const [jobs, setJobs] = useState({ queued: [], running: [], completed: [] });
  const [showModal, setShowModal] = useState(false);
  const [maxRunning, setMaxRunning] = useState(2);
  const [autoFire, setAutoFire] = useState(false);
  const [tick, setTick] = useState(0);
  const autoRef = useRef(null);

  const master = masterRef.current;

  // Tick every 200ms for progress updates
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 200);
    return () => clearInterval(id);
  }, []);

  // Auto-fire random jobs
  useEffect(() => {
    if (autoFire) {
      autoRef.current = setInterval(() => {
        const repo = rand(REPOS);
        const branch = rand(BRANCHES);
        const author = rand(AUTHORS);
        const sha = randSha();
        const message = `chore: update ${rand(["deps","ci","readme","types"])}`;
        const jobData = createJobFromApiData(repo, branch, sha, author, message);
        master.enqueueJob(jobData);
        setJobs(master.getAllJobs());
      }, 4000);
    } else {
      clearInterval(autoRef.current);
    }
    return () => clearInterval(autoRef.current);
  }, [autoFire]);

  // Scheduler: promote queued → running, tick running pipeline
  useEffect(() => {
    master.setMaxWorkers(maxRunning);
    master.promoteQueuedJobs();
    master.tick();
    setJobs(master.getAllJobs());
  }, [tick, maxRunning]);

  const enqueueJob = useCallback((form) => {
    const jobData = createJobFromApiData(form.repo, form.branch, form.sha, form.author, form.message);
    master.enqueueJob(jobData);
    setJobs(master.getAllJobs());
  }, []);

  const { queued, running, completed } = jobs;
  const successCount = completed.filter(j => j.outcome === "success").length;
  const failCount = completed.filter(j => j.outcome === "failed").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020617",
      fontFamily: "'IBM Plex Mono', monospace",
      color: "#94a3b8",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        select:focus, input:focus { border-color: #3b82f6 !important; }
      `}</style>

      {showModal && <ApiModal onClose={() => setShowModal(false)} onSubmit={enqueueJob} />}

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #0f172a",
        padding: "14px 24px",
        display: "flex", alignItems: "center", gap: 16,
        background: "#020617",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ width: 28, height: 28, background: "#1d4ed8", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14 }}>⚡</span>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#e2e8f0", letterSpacing: "0.05em" }}>PipelineX</div>
            <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.1em" }}>CONTINUOUS DEPLOYMENT ENGINE</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, color: "#60a5fa", lineHeight: 1 }}>{queued.length}</div>
            <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.08em" }}>QUEUED</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, color: "#3b82f6", lineHeight: 1 }}>{running.length}</div>
            <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.08em" }}>RUNNING</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, color: "#22c55e", lineHeight: 1 }}>{successCount}</div>
            <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.08em" }}>PASSED</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, color: "#ef4444", lineHeight: 1 }}>{failCount}</div>
            <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.08em" }}>FAILED</div>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: "#1e293b" }} />

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 10, color: "#475569" }}>
            workers:
            <select
              value={maxRunning}
              onChange={e => setMaxRunning(Number(e.target.value))}
              style={{
                marginLeft: 6, background: "#0f172a", border: "1px solid #1e293b",
                color: "#94a3b8", borderRadius: 4, padding: "2px 6px",
                fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <button
            onClick={() => setAutoFire(f => !f)}
            style={{
              background: autoFire ? "#14532d" : "#1e293b",
              border: `1px solid ${autoFire ? "#166534" : "#334155"}`,
              color: autoFire ? "#4ade80" : "#475569",
              borderRadius: 6, padding: "5px 12px",
              fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: "0.06em",
            }}
          >
            {autoFire ? "● AUTO" : "○ AUTO"}
          </button>

          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "#1d4ed8", border: "none",
              color: "#fff", borderRadius: 6, padding: "5px 14px",
              fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: "0.06em",
            }}
          >
            + POST JOB
          </button>

          <button
            onClick={() => {
              master.clearAll();
              setJobs(master.getAllJobs());
            }}
            style={{
              background: "none", border: "1px solid #1e293b",
              color: "#334155", borderRadius: 6, padding: "5px 10px",
              fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Board */}
      <div style={{
        display: "flex", gap: 0,
        padding: "20px 24px",
        height: "calc(100vh - 65px)",
        overflow: "hidden",
      }}>
        {/* Queued */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 16, borderRight: "1px solid #0f172a", overflowY: "auto" }}>
          <Column title="Queued" count={queued.length} accent="#475569">
            {queued.map(j => <JobCard key={j.id} job={j} compact />)}
          </Column>
        </div>

        {/* In Progress */}
        <div style={{ flex: 1.4, minWidth: 0, paddingLeft: 16, paddingRight: 16, borderRight: "1px solid #0f172a", overflowY: "auto" }}>
          <Column title="In Progress" count={running.length} accent="#3b82f6">
            {running.map(j => <JobCard key={j.id} job={j} />)}
            {running.length === 0 && queued.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 60, color: "#1e293b", fontSize: 11 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⚙</div>
                POST a job or enable AUTO to begin
              </div>
            )}
          </Column>
        </div>

        {/* Completed */}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: 16, overflowY: "auto" }}>
          <Column title="Completed" count={completed.length} accent="#22c55e">
            {completed.map(j => <JobCard key={j.id} job={j} compact />)}
          </Column>
        </div>
      </div>
    </div>
  );
}
