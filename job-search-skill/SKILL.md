---
name: job-search
description: >-
  Unified job search across Chinese and global recruitment platforms — Liepin (猎聘),
  Boss Zhipin (Boss直聘), LinkedIn, Maimai (脉脉), Indeed, and 51job — via a single
  CLI entry point. Also supports candidate sourcing on Maimai/LinkedIn.
  Use this skill whenever the user wants to search for jobs, find candidates,
  recruit people, automate job applications, aggregate listings from multiple
  recruitment platforms, search for "AI产品经理" / "前端开发" / "Java工程师" /
  "AI engineer" / "product manager" — even if they don't explicitly mention a
  platform name. Trigger words include: 找工作, 求职, 招聘, 搜职位, 投简历,
  简历, 内推, 人才搜索, headhunting, sourcing, job hunt, recruitment, hiring,
 候选人, 猎头, Liepin, 猎聘, Boss, 直聘, LinkedIn, 领英, Maimai, 脉脉, 51job,
 前程无忧, Indeed, 拉勾, lagou.
license: MIT
compatibility: "Requires Python 3.9+ and Node.js 16+. Chrome + opencli Browser Bridge extension required for cookie-based platforms (boss/linkedin/maimai/indeed/51job). Liepin requires MCP tokens."
metadata:
  author: integrated from TerminalSkills (liepin-jobs) + ivanxia1988 (opencli-maimai) + jackwener (opencli)
  version: "1.0.0"
  category: productivity
  tags: ["jobs", "recruitment", "liepin", "boss", "linkedin", "maimai", "indeed", "51job", "chinese", "global", "mcp", "opencli"]
---

# 统一职位搜索 (Unified Job Search)

## Overview

This skill aggregates **7 recruitment platforms** behind a single CLI:

| Platform | Region | Type | Auth | Adapter |
|----------|--------|------|------|---------|
| **猎聘 (Liepin)** | China | jobs | MCP tokens | TerminalSkills/liepin-jobs |
| **Boss直聘** | China | jobs | cookie | opencli boss |
| **LinkedIn** | Global | jobs + people | cookie | opencli linkedin |
| **脉脉 (Maimai)** | China | people | cookie | opencli maimai |
| **拉勾 (Lagou)** | China | jobs (tech) | cookie | opencli-plugin-lagou |
| **Indeed** | Global | jobs | cookie | opencli indeed |
| **51job (前程无忧)** | China | jobs | cookie | opencli 51job |

A single command searches all configured platforms in parallel and returns unified results in `table`, `md`, or `json` format.

## When to use

Use this skill whenever the user:
- Wants to **find a job** ("帮我找 AI产品经理 岗位", "search for frontend roles")
- Wants to **search candidates** ("帮我找 Java 工程师 候选人", "find me senior designers")
- Mentions any of the supported platforms by name (猎聘, Boss, LinkedIn, 脉脉, Indeed, 51job)
- Talks about recruiting, hiring, sourcing, headhunting, 内推, 求职, 招聘

Do NOT use this skill for:
- Resume writing or review (use a resume skill)
- Interview prep (use an interview skill)
- Generic web search that isn't recruitment-related

## Quick Start

```bash
# 1. List available platforms and their auth status
python3 scripts/unified_search.py platforms

# 2. Search jobs across all configured platforms
python3 scripts/unified_search.py search "AI产品经理" --location "上海"

# 3. Search specific platforms
python3 scripts/unified_search.py search "前端工程师" --platforms liepin,boss,linkedin

# 4. Search candidates (Maimai/LinkedIn)
python3 scripts/unified_search.py candidates "Java架构师" --platforms maimai,linkedin

# 5. Apply to a Liepin job
python3 scripts/unified_search.py apply liepin --job-id 123456 --job-kind 1

# 6. Get JSON output for downstream processing
python3 scripts/unified_search.py search "Python" --format json | jq '.all_jobs'
```

## Architecture

```
job-search-skill/
├── SKILL.md                          ← you are here
├── scripts/
│   ├── unified_search.py             ← main entry point
│   ├── unified_search.sh             ← convenience wrapper (sets PATH for opencli)
│   └── adapters/
│       ├── base.py                   ← abstract base + JobPosting/Candidate dataclasses
│       ├── opencli_adapter.py        ← Boss/LinkedIn/Maimai/Indeed/51job adapters
│       ├── liepin_adapter.py         ← Liepin adapter (calls liepin_mcp.py)
│       └── __init__.py               ← registry & platform metadata
├── skills/
│   ├── liepin/                       ← vendored liepin-jobs (Python CLI)
│   └── maimai/                       ← vendored opencli-maimai (YAML adapter)
├── node_modules/                     ← @jackwener/opencli installed locally
├── references/
│   └── auth_setup.md                 ← per-platform auth instructions
├── evals/
│   └── test_prompts.md               ← test cases for evaluation
└── README.md                          ← detailed docs
```

## Output format

Every `search` returns a standardized `JobPosting` shape:

```json
{
  "platform": "liepin",
  "job_id": "123456",
  "title": "AI产品经理",
  "company": "字节跳动",
  "location": "上海",
  "salary": "35-55k",
  "experience": "3-5年",
  "education": "本科",
  "url": "https://www.liepin.com/job/123456.shtml",
  "posted_at": "2026-06-10",
  "job_kind": "1",
  "raw": { ... original platform response ... }
}
```

This uniform shape lets downstream tools (resume matchers, ATS pipelines, dashboards) consume results from any platform without per-platform parsing.

## Authentication

Each platform has its own auth requirements. Run `platforms` to see current status:

```bash
$ python3 scripts/unified_search.py platforms
平台         中文名       区域    类型            认证         可用
-------------------------------------------------------------------
boss       Boss直聘    CN    jobs           cookie       ✓
linkedin   LinkedIn    global jobs+people    cookie       ✓
maimai     脉脉         CN    people         cookie       ✓
indeed     Indeed      global jobs           cookie       ✓
51job      前程无忧      CN    jobs           cookie       ✓
liepin     猎聘         CN    jobs           mcp_token    ✗
```

For setup of any ✗ platform, see [references/auth_setup.md](references/auth_setup.md).

### Quick auth recipes

**Liepin (most stable — uses official MCP):**
```bash
# 1. Visit https://www.liepin.com/mcp/server and copy both tokens
# 2. Run interactive setup:
python3 skills/liepin/liepin_mcp.py setup
# 3. Or set env vars:
export LIEPIN_GATEWAY_TOKEN="mcp_gateway_token_xxx"
export LIEPIN_USER_TOKEN="liepin_user_token_xxx"
```

**Boss / LinkedIn / Maimai / Indeed / 51job (cookie-based via opencli):**
1. Install Chrome + the **opencli Browser Bridge** extension from [jackwener/opencli releases](https://github.com/jackwener/opencli/releases)
2. Open Chrome and log in to the target platform
3. Enable the Browser Bridge extension
4. Run `opencli daemon stop && opencli doctor` to verify connectivity
5. Test with `opencli <platform> search "test" -f json`

## Important Conventions

- **Always check `platforms` first** before searching, so you know what's configured
- **Don't fabricate results.** If a platform is unavailable, report it; never invent jobs
- **Job application safety:** `apply` operations are intentionally NOT auto-confirmed — always show the job details to the user and get explicit confirmation before calling apply
- **Respect rate limits:** Liepin limits to 60 req/min, Maimai/LinkedIn have their own soft limits
- **Tokens are secrets.** Never log `LIEPIN_USER_TOKEN`, `LIEPIN_GATEWAY_TOKEN`, or cookie values to console/files

## Examples

### Example 1: Find AI PM roles in Shanghai
```
User: 帮我找上海的 AI产品经理 岗位

Agent:
1. Run: python3 scripts/unified_search.py platforms
2. If multiple platforms available, run search across all
3. Present top results grouped by platform
```

### Example 2: Source Java engineers for hiring
```
User: 帮我们招聘 Java架构师，要求 5年以上经验，985 优先

Agent:
1. Run: python3 scripts/unified_search.py candidates "Java架构师" \
       --platforms maimai,linkedin
2. Use opencli maimai filter --worktimes 3 --degrees 2 --is_985 1
3. Return top candidates with profile links
```

### Example 3: Apply to a specific Liepin job
```
User: 把这个猎聘职位投了：https://www.liepin.com/job/123456.shtml

Agent:
1. Parse the job URL → job_id = 123456
2. Run: search to fetch job details (including job_kind)
3. Display the job summary
4. Ask user: "确认投递这个职位吗？"
5. Only after explicit confirmation: apply liepin --job-id 123456 --job-kind <kind>
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Browser Bridge extension not connected` | Chrome 没装扩展 | 安装 opencli Browser Bridge |
| `liepin exited with code 401` | Token 过期/无效 | 重新访问 liepin.com/mcp/server 获取 |
| 搜索返回空结果 | 平台未登录 | 在 Chrome 中登录目标平台 |
| `JSON parse error` | opencli 版本不兼容 | `npm update @jackwener/opencli` |
| 某些平台列表显示 ✗ | 未配置 cookie/token | 按 auth_setup.md 配置 |