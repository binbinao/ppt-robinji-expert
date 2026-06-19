# 统一职位搜索 Skill (job-search)

> 一条命令搜索 6 个招聘平台：猎聘、Boss直聘、LinkedIn、脉脉、Indeed、51job

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![Node 16+](https://img.shields.io/badge/node-16+-green.svg)](https://nodejs.org/)

## 🎯 它能做什么

| 场景 | 一条命令搞定 |
|------|-------------|
| 海投求职：找上海所有 AI产品经理 岗位 | `search "AI产品经理" --location "上海"` |
| 精准招聘：找 5年经验 Java 候选人 | `candidates "Java" --platforms maimai,linkedin` |
| 海外求职：搜 NYC Senior Engineer | `search "Senior Engineer" --location "New York" --platforms linkedin,indeed` |
| 投递猎聘职位 | `apply liepin --job-id 123 --job-kind 1` |
| 查看所有平台状态 | `platforms` |

## 📦 集成来源

- **猎聘 (Liepin)**：来自 [TerminalSkills/skills](https://github.com/TerminalSkills/skills) 的 `liepin-jobs`（基于猎聘官方 MCP Server）
- **Boss直聘 / LinkedIn / 脉脉 / Indeed / 51job**：基于 [@jackwener/opencli](https://github.com/jackwener/opencli) 框架 + 浏览器自动化
- **脉脉人才搜索**：包含 [ivanxia1988/opencli-maimai](https://github.com/ivanxia1988/opencli-maimai) 的 YAML 适配器

## 🚀 安装

### 前置要求

- **Python 3.9+**
- **Node.js 16+**
- **Google Chrome**（必需，用于 boss/linkedin/maimai/indeed/51job 的浏览器自动化）

### 一键安装（已完成）

本 skill 目录已经包含了所有依赖。如在另一台机器上重新安装：

```bash
# 1. 克隆或拷贝本目录
cp -r job-search-skill/ ~/my-skills/

# 2. 安装 opencli 框架
cd ~/my-skills/job-search-skill
npm install @jackwener/opencli

# 3. 安装猎聘 CLI（如果 skills/liepin/ 缺失）
mkdir -p skills/liepin
curl -o skills/liepin/liepin_mcp.py \
  https://raw.githubusercontent.com/TerminalSkills/skills/main/skills/liepin-jobs/liepin_mcp.py
curl -o skills/liepin/SKILL.md \
  https://raw.githubusercontent.com/TerminalSkills/skills/main/skills/liepin-jobs/SKILL.md

# 4. （可选）安装脉脉人才搜索适配器
mkdir -p skills/maimai/maimai skills/maimai/skills/maimai-search
curl -o skills/maimai/maimai/search-talents.yaml \
  https://raw.githubusercontent.com/ivanxia1988/opencli-maimai/main/maimai/search-talents.yaml
curl -o skills/maimai/skills/maimai-search/SKILL.md \
  https://raw.githubusercontent.com/ivanxia1988/opencli-maimai/main/skills/maimai-search/SKILL.md
```

### 平台认证配置

详见 [references/auth_setup.md](references/auth_setup.md)

简要步骤：

1. **猎聘**：访问 https://www.liepin.com/mcp/server 获取 2 个 token，运行 `python3 skills/liepin/liepin_mcp.py setup`
2. **其他平台**：安装 Chrome + opencli Browser Bridge 扩展 → 在 Chrome 登录目标平台

## 📖 使用

### 查看所有平台状态

```bash
python3 scripts/unified_search.py platforms
```

输出示例：

```
平台         中文名       区域    类型            认证         可用
-------------------------------------------------------------------
boss       Boss直聘    CN    jobs           cookie       ✓
linkedin   LinkedIn    global jobs+people    cookie       ✓
maimai     脉脉         CN    people         cookie       ✓
indeed     Indeed      global jobs           cookie       ✓
51job      前程无忧      CN    jobs           cookie       ✓
liepin     猎聘         CN    jobs           mcp_token    ✗
```

### 搜索职位（跨平台并发）

```bash
# 基础：搜索"AI产品经理"
python3 scripts/unified_search.py search "AI产品经理"

# 指定地点
python3 scripts/unified_search.py search "前端开发" --location "上海"

# 指定平台
python3 scripts/unified_search.py search "Python" --platforms liepin,boss,linkedin

# 限制数量
python3 scripts/unified_search.py search "Java" --limit 5 --display 5

# JSON 输出（用于脚本）
python3 scripts/unified_search.py search "Java" --format json | jq '.all_jobs'
```

### 搜索候选人（脉脉/LinkedIn）

```bash
# 基础
python3 scripts/unified_search.py candidates "Java架构师"

# 多平台
python3 scripts/unified_search.py candidates "产品经理" --platforms maimai,linkedin

# 脉脉高级筛选（直接用 opencli）
./node_modules/.bin/opencli maimai search-talents "AI" \
  --worktimes 3 \
  --degrees 2 \
  --is_985 1 \
  --companies "字节跳动,阿里巴巴" \
  -f json
```

### 投递职位

```bash
# 猎聘：先搜索获取 job_id 和 job_kind
python3 scripts/unified_search.py search "AI" --platforms liepin --format json
# 从输出中拿到 jobId + jobKind

# 投递
python3 scripts/unified_search.py apply liepin --job-id 123456 --job-kind 1
```

### 输出格式对比

| 格式 | 适用场景 |
|------|---------|
| `table`（默认） | 人类阅读，带颜色/对齐 |
| `md` | 写入文档/Markdown 报告 |
| `json` | 程序化处理（jq、Python、JS） |

## 🛠️ 架构

```
job-search-skill/
├── SKILL.md                          # Skill 元数据 + Claude 触发说明
├── README.md                          # 你正在读的
├── scripts/
│   ├── unified_search.py             # 主入口 CLI
│   ├── unified_search.sh             # 便捷包装（自动设置 PATH）
│   └── adapters/
│       ├── base.py                   # 抽象基类 + 数据模型
│       ├── opencli_adapter.py        # Boss/LinkedIn/Maimai/Indeed/51job
│       ├── liepin_adapter.py         # 猎聘（独立 MCP）
│       └── __init__.py               # 平台注册表
├── skills/                           # 第三方 skill 源代码
│   ├── liepin/                       # TerminalSkills/liepin-jobs
│   └── maimai/                       # ivanxia1988/opencli-maimai
├── node_modules/                     # 本地 npm 依赖
├── references/
│   └── auth_setup.md                 # 认证详细文档
├── evals/
│   └── test_prompts.md               # 评估测试用例
└── package.json                      # opencli 依赖声明
```

### 添加新平台

1. 在 `scripts/adapters/` 创建新文件，继承 `BaseAdapter`
2. 实现 `search_jobs()` 和 `is_available()`
3. 在 `adapters/__init__.py` 注册到 `ADAPTERS` 字典
4. 在 `PLATFORM_META` 中添加元数据

例如添加拉勾：

```python
# scripts/adapters/lagou_adapter.py
from .base import BaseAdapter, JobPosting, SearchResult

class LagouAdapter(BaseAdapter):
    platform_name = "lagou"
    
    def search_jobs(self, query, location="", limit=20, **kwargs):
        # 调用拉勾的 API 或爬虫
        ...
    
    def is_available(self):
        return True  # 或检查 cookie
```

## 🧪 测试

参见 [evals/test_prompts.md](evals/test_prompts.md) 获取完整测试用例。

### 快速验证

```bash
# 1. 检查平台状态
python3 scripts/unified_search.py platforms

# 2. 单独测试 opencli
./node_modules/.bin/opencli boss search "Python" --city 北京 --limit 3 -f json

# 3. 单独测试猎聘（需要 token）
python3 skills/liepin/liepin_mcp.py auth status

# 4. JSON 输出一致性
python3 scripts/unified_search.py search "Java" --platforms liepin --format json | python3 -m json.tool
```

## ⚠️ 道德使用与限制

- ❌ 不要高频批量投递（违反平台 ToS）
- ❌ 不要在对话中粘贴完整 token/cookie
- ❌ 不要绕过平台风控
- ✅ 仅用于个人求职/招聘辅助
- ✅ 模拟真人操作节奏

## 📄 许可证

MIT

## 🙏 致谢

- [TerminalSkills/skills](https://github.com/TerminalSkills/skills) - liepin-jobs
- [@jackwener/opencli](https://github.com/jackwener/opencli) - 浏览器自动化框架
- [ivanxia1988/opencli-maimai](https://github.com/ivanxia1988/opencli-maimai) - 脉脉人才搜索
- [猎聘官方](https://www.liepin.com/mcp/server) - 提供 MCP Server
- [Career-Ops CN](https://github.com/zyanhe233/career-ops-cn) - 中文求职 Skill 启发
- [CareerForge](https://github.com/rebecha1227-a11y/CareerForge) - 综合求职 Skill 参考