# 🎯 Priority-Based Job Queue & Real Git Integration

## Phase 1: Priority Scheduling System

### Priority Assignment Criteria

```
PRIORITY LEVELS (1-5, where 5 is highest)
════════════════════════════════════════

5 - CRITICAL (Hotfix/Production)
   ├─ Branch: main/master
   ├─ Trigger: Direct push to main
   ├─ SLA: Execute immediately
   └─ Use case: Production fixes, hotfixes

4 - HIGH (Release Preparation)
   ├─ Branch: release/*, develop
   ├─ Trigger: Release branch push
   ├─ SLA: Execute within 2 minutes
   └─ Use case: Release candidates, staging

3 - MEDIUM (Feature Development)
   ├─ Branch: feature/*, feature-*
   ├─ Trigger: Feature branch push
   ├─ SLA: Execute within 5 minutes
   └─ Use case: Regular feature development

2 - LOW (Testing & Experiments)
   ├─ Branch: test/*, experiment/*
   ├─ Trigger: Test branch push
   ├─ SLA: Execute when workers available
   └─ Use case: Experimental branches

1 - LOWEST (Documentation & Chores)
   ├─ Branch: docs/*, chore/*
   ├─ Trigger: Docs/chore branch push
   ├─ SLA: Execute in background
   └─ Use case: Documentation updates
```

---

## Phase 2: Repository Setup (3 Repos × 2 Branches Each)

### Repository 1: Payment Service
```
Repo Name: payment-service
URL: https://github.com/5huaib/payment-service

Branches:
├─ main (Priority 5 - CRITICAL)
│  ├─ Real commits: Actual payment processor changes
│  ├─ Protected: Requires PR review
│  └─ Auto-deploy: Yes
│
└─ develop (Priority 4 - HIGH)
   ├─ Real commits: Feature integration point
   ├─ Auto-merge from features
   └─ Auto-deploy: Yes

Webhook: POST /webhook/repo1
```

### Repository 2: Auth Service
```
Repo Name: auth-service
URL: https://github.com/5huaib/auth-service

Branches:
├─ main (Priority 5 - CRITICAL)
│  ├─ Real commits: Authentication fixes
│  ├─ Protected: Requires PR review
│  └─ Auto-deploy: Yes
│
└─ staging (Priority 4 - HIGH)
   ├─ Real commits: Pre-production testing
   ├─ Auto-merge from features
   └─ Auto-deploy: Yes

Webhook: POST /webhook/repo2
```

### Repository 3: Frontend App
```
Repo Name: frontend-app
URL: https://github.com/5huaib/frontend-app

Branches:
├─ main (Priority 5 - CRITICAL)
│  ├─ Real commits: UI/UX updates
│  ├─ Protected: Requires PR review
│  └─ Auto-deploy: Yes
│
└─ beta (Priority 3 - MEDIUM)
   ├─ Real commits: New features
   ├─ Experimental: No protection
   └─ Auto-deploy: Yes

Webhook: POST /webhook/repo3
```

---

## Priority Calculation Algorithm

```typescript
// Calculate priority based on branch name and repository
function calculateJobPriority(
  branch: string,
  repoName: string,
  commitMessage: string,
  fileChanges: string[]
): number {
  let priority = 0;

  // Rule 1: Branch-based priority (Base Score)
  if (branch === 'main' || branch === 'master') {
    priority = 5; // CRITICAL
  } else if (branch === 'develop' || branch === 'staging' || branch.startsWith('release/')) {
    priority = 4; // HIGH
  } else if (branch.startsWith('feature/') || branch.startsWith('hotfix/')) {
    priority = 3; // MEDIUM
  } else if (branch.startsWith('test/') || branch.startsWith('experiment/')) {
    priority = 2; // LOW
  } else if (branch.startsWith('docs/') || branch.startsWith('chore/')) {
    priority = 1; // LOWEST
  }

  // Rule 2: Commit message modifiers
  if (commitMessage.includes('[URGENT]') || commitMessage.includes('[CRITICAL]')) {
    priority = Math.min(5, priority + 2); // Boost by 2, max 5
  } else if (commitMessage.includes('[HIGH]')) {
    priority = Math.min(5, priority + 1); // Boost by 1
  } else if (commitMessage.includes('[LOW]')) {
    priority = Math.max(1, priority - 1); // Reduce by 1, min 1
  }

  // Rule 3: File-based priority
  if (fileChanges.some(f => f.includes('package.json') || f.includes('Dockerfile'))) {
    priority = Math.min(5, priority + 1); // Infrastructure changes
  }
  if (fileChanges.some(f => f.includes('security') || f.includes('auth'))) {
    priority = Math.min(5, priority + 1); // Security changes
  }

  // Rule 4: Repository importance
  const criticalRepos = ['payment-service', 'auth-service'];
  if (criticalRepos.includes(repoName)) {
    priority = Math.max(priority, 3); // Minimum priority for critical repos
  }

  return Math.max(1, Math.min(5, priority)); // Clamp between 1-5
}
```

