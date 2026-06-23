# ppt-robinji 个人教程实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `docs/ppt-robinji-tutorial/` 下生成 15 个 markdown + 1 个 demos 目录，作为 ppt-robinji v2.6.0 的个人速查+进化教程；打磨清单作附录独立项目跟进。

**Architecture:** 分章节多文件 README 中心化结构；3 个 quickstart + 1 个 e2e demo（4 套结构变体）+ 7 个能力速查 + 2 个辅助章节 + 1 个打磨附录。demos 放在文档仓下、用 `npm link` 跨仓链接 ppt-robinji 包。

**Tech Stack:** Node.js 18+ / TypeScript / tsx / ppt-robinji v2.6.0 / LibreOffice（验证产物用）

**Spec:** `docs/superpowers/specs/2026-06-23-ppt-robinji-tutorial-design.md`

---

## Task 1: 创建目录骨架 + 更新 .gitignore

**Files:**
- Create: `docs/ppt-robinji-tutorial/`
- Create: `docs/ppt-robinji-tutorial/demos/`
- Create: `docs/ppt-robinji-tutorial/demos/output/`
- Create: `docs/ppt-robinji-tutorial/demos/output/.gitkeep`
- Modify: `.gitignore`（追加 1 行）

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p docs/ppt-robinji-tutorial/demos/output
touch docs/ppt-robinji-tutorial/demos/output/.gitkeep
```

- [ ] **Step 2: 更新 .gitignore**

在 `/Users/jiduobin/Documents/GitHub/Personal/ppt-robinji-expert/.gitignore` 末尾追加：

```
# ppt-robinji tutorial demos
docs/ppt-robinji-tutorial/demos/output/
!docs/ppt-robinji-tutorial/demos/output/.gitkeep
```

- [ ] **Step 3: 验证目录结构**

```bash
ls -la docs/ppt-robinji-tutorial/demos/
```

Expected: 看到 `output/` 子目录和 `output/.gitkeep`

- [ ] **Step 4: 初始化 demos/package.json + devDeps（让后续 tsx 可用）**

```bash
cd docs/ppt-robinji-tutorial/demos
npm init -y >/dev/null
npm install --save-dev typescript tsx
```

Expected: `demos/package.json` 含 `devDependencies: { typescript, tsx }`，`demos/node_modules/` 创建

- [ ] **Step 5: Commit**

```bash
git add docs/ppt-robinji-tutorial/ .gitignore
git commit -m "chore(tutorial): scaffold docs/ppt-robinji-tutorial/ + .gitignore + demos package.json"
```

---

## Task 2: 写 README.md 骨架

**Files:**
- Create: `docs/ppt-robinji-tutorial/README.md`

- [ ] **Step 1: 写 frontmatter + 状态卡 + 决策表 + 维护约定**

完整文件内容（章节导航先用占位 `<<待回填>>`）：

```markdown
---
title: ppt-robinji 个人教程
version: v0.1
applies_to: ppt-robinji v2.6.0
status: WIP
last_updated: 2026-06-23
---

# ppt-robinji 个人教程

> 个人速查 + 进化用。基于 ppt-robinji v2.6.0。

## 状态卡

- 教程版本：v0.1
- 适用 ppt-robinji：v2.6.0
- 状态：WIP（首版）
- 已知缺口：[打磨清单](./appendix-skill-polish-todo.md)

## 决策表：3 种入口怎么选

| 触发场景 | 走哪条 | 章节 |
|---|---|---|
| 临时起一个 demo PPT、不写代码 | CLI | [01](./01-quickstart-cli.md) |
| 集成进自己的项目/工具链 | Code | [02](./02-quickstart-code.md) |
| 跟 Claude 对话让它直接出 | Skill（需先重装） | [03](./03-quickstart-skill.md) |
| 想跑通一遍完整流程 | 任一起点 → 04 | [04](./04-e2e-demo.md) |

## 决策表：4 种 PPT 场景怎么选

| 场景 | 模板族 | 结构 | 关键 slide | 关键能力章节 |
|---|---|---|---|---|
| 技术分享 | tech-neon / minimal | ted | kpi / process / timeline | 05, 06, 09 |
| 投资者路演 | business-elegant / gradient | pitch | kpi / comparison / cta | 05, 06, 08 |
| TED 公开演讲 | minimal-paper / creative | ted | cover(hook) / quote / story | 05, 06, 08, 11 |
| 教学/报告 | education / academic | tutorial / report | content / chart | 05, 06, 10, 11 |

## 章节导航

<<待回填：在 Task 22 用真实一句话摘要替换>>

## 维护约定

每章顶部统一 frontmatter：

```yaml
---
topic: <一句话主题>
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: <N>
related: [<其它章节>]
---
```

正文三段式：1) 适用场景  2) 可执行示例  3) 踩坑 / 注意
```

- [ ] **Step 2: 验证文件已落盘**

```bash
ls -la docs/ppt-robinji-tutorial/README.md
```

Expected: 文件存在，行数 > 50

- [ ] **Step 3: Commit**

```bash
git add docs/ppt-robinji-tutorial/README.md
git commit -m "docs(tutorial): scaffold README with decision tables"
```

---

## Task 3: 写 01-quickstart-cli.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/01-quickstart-cli.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 5 分钟用 CLI 起一个 demo PPT
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 5
related: [02-quickstart-code.md, 04-e2e-demo.md]
---
```

- [ ] **Step 2: 写正文三段**

完整文件内容：

```markdown
# 01 — CLI 5 分钟起步

## 适用场景

临时想看一个 demo PPT、不想写代码、终端能直接用的情况。用 `npm run generate` 一行命令就能出文件。

## 可执行示例

### 先决条件

- Node.js 18+
- 已 `cd ppt-robinji && npm install`
- `.env` 里有至少一个 AI provider key（或用 mock：`PROVIDER=mock`）

### 3 步跑通

```bash
cd ppt-robinji
npm run generate -- -t "Why AI Will Transform Education" -s 8 -o demo.pptx
# 等待 30-60s，输出到 ./output/demo.pptx
```

参数速记：
- `-t` 主题
- `-s` 页数
- `-o` 输出路径
- `-f` 源文件（PDF/DOCX/MD/TXT，可选）
- `--template` 模板名（默认 tech-neon）
- `--structure` 结构（ted / pitch / launch / tutorial / report）

### 成功标准

- 终端打印 `Saved: ./output/demo.pptx`
- 文件存在且大小 > 50 KB
- 用 LibreOffice 打开能看到主标题

## 踩坑 / 注意

1. **路径**：默认输出在 `ppt-robinji/output/`，不是当前目录
2. **Mock 模式**：没 key 时 `PROVIDER=mock` 会出占位内容（不真用 AI）
3. **页数限制**：`≤10` 是 10-20-30 法则的硬约束
4. **模板不生效**：检查 `--template` 是否在 `npm run templates` 列表里
5. **源文件解析失败**：PDF/DOCX 需要 `pdf-parse` / `mammoth`（已 optionalDependencies）
```

- [ ] **Step 3: 跑通命令验证（在 ppt-robinji 目录）**

```bash
cd ppt-robinji
npm run generate -- -t "Test CLI quickstart" -s 6 -o output/cli-test.pptx
```

Expected: 打印 `Saved: ...output/cli-test.pptx`，文件存在

- [ ] **Step 4: 标记 "已通过 2026-06-23 跑通"**

在 `01-quickstart-cli.md` 末尾追加一行：

```markdown

> **跑通记录**：2026-06-23 在 ppt-robinji v2.6.0 上验证通过
```

- [ ] **Step 5: Commit**

```bash
git add docs/ppt-robinji-tutorial/01-quickstart-cli.md
git commit -m "docs(tutorial): 01 quickstart CLI"
```

---

## Task 4: 写 02-quickstart-code.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/02-quickstart-code.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 5 分钟用 import 调库起一个 demo PPT
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 5
related: [01-quickstart-cli.md, 04-e2e-demo.md]
---
```

- [ ] **Step 2: 写正文三段**

完整文件内容：

```markdown
# 02 — Code 5 分钟起步

## 适用场景

把 ppt-robinji 当库集成到自己的项目、工具链、agent、CLI 里。用 ESM / CJS `import` 调 17 个 subpath exports 中的一个。

## 可执行示例

### 先决条件

- 自己的项目有 `package.json` 和 `node_modules/`
- 已 `npm install ppt-robinji`（或 `npm link` 链接本地仓）
- 可选：1 个 AI provider key，或 `PROVIDER=mock`

### 3 步跑通

新建 `quickstart.ts`：

```typescript
import { AIGenerator } from 'ppt-robinji/ai/generator';
import { PPTCreator } from 'ppt-robinji/pptx/creator';

async function main() {
  // 1. 生成内容
  const gen = new AIGenerator();
  const outline = await gen.generateOutline({
    topic: 'Hello from code',
    slides: 6,
    structure: 'tutorial',
    style: 'concise',
    audience: 'developers',
    duration: 5,
  });

  // 2. 创建 PPT
  const creator = new PPTCreator({
    template: 'tech-neon',
    company: 'Acme',
    showFooter: true,
  });

  // 3. 出文件
  await creator.createFromOutline(outline);
  await creator.save('output/hello.pptx');
  console.log('Done');
}

main().catch(console.error);
```

跑：

```bash
PROVIDER=mock npx tsx quickstart.ts
```

### 成功标准

- 终端打印 `Done`
- `output/hello.pptx` 存在
- 文件能 LibreOffice 打开

## 踩坑 / 注意

1. **17 个 subpath exports**：按需 import，不要 `import * from 'ppt-robinji'`（树摇失效）
2. **Mock vs 真实 AI**：没 key 时 `PROVIDER=mock`，产物是占位文本，但流程跑通
3. **TypeScript 类型**：包内置 `.d.ts`，`import type` 走 `pptx/types` 拿详细类型
4. **Node 版本**：≥ 18，否则 `tsx` 不支持
5. **环境变量**：`PROVIDER` 在 .env / shell 都行，库启动时读
```

- [ ] **Step 3: 跑通验证（用 mock）**

```bash
mkdir -p /tmp/quickstart-test
cd /tmp/quickstart-test
cat > quickstart.ts <<'EOF'
import { AIGenerator } from 'ppt-robinji/ai/generator';
import { PPTCreator } from 'ppt-robinji/pptx/creator';

async function main() {
  const gen = new AIGenerator();
  const outline = await gen.generateOutline({
    topic: 'Hello', slides: 4, structure: 'tutorial', style: 'concise',
    audience: 'devs', duration: 3,
  });
  const creator = new PPTCreator({ template: 'tech-neon' });
  await creator.createFromOutline(outline);
  await creator.save('hello.pptx');
  console.log('OK');
}
main().catch(console.error);
EOF
cd /Users/jiduobin/Documents/GitHub/Personal/ppt-robinji-expert/ppt-robinji && npm link
cd /tmp/quickstart-test && npm init -y >/dev/null 2>&1 && npm link ppt-robinji
PROVIDER=mock npx tsx quickstart.ts
```

Expected: 打印 `OK`，`hello.pptx` 存在

- [ ] **Step 4: 标记跑通记录**

在 `02-quickstart-code.md` 末尾追加：

```markdown

> **跑通记录**：2026-06-23 在 ppt-robinji v2.6.0 + Node 18+ 上验证通过（PROVIDER=mock）
```

- [ ] **Step 5: Commit**

```bash
git add docs/ppt-robinji-tutorial/02-quickstart-code.md
git commit -m "docs(tutorial): 02 quickstart code"
```

---

## Task 5: 写 03-quickstart-skill.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/03-quickstart-skill.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 5 分钟用 Claude Code skill 接管出 PPT（含 SKILL.md 重装）
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 8
related: [01-quickstart-cli.md, 02-quickstart-code.md, 04-e2e-demo.md]
---
```

- [ ] **Step 2: 写正文三段（含"重装 SKILL.md"独立小节）**

完整文件内容：

```markdown
# 03 — Claude Code Skill 5 分钟起步

## 适用场景

你跟 Claude Code 对话让它直接出 PPT，不写代码、不调终端。注意：**本环境 `.codebuddy/skills/ppt-robinji/` 已删**，需要先重装。

## 可执行示例

### 先决条件

- Claude Code 已安装
- `ppt-robinji/SKILL.md` 文件存在（本仓就有）

### Step A: 重装 SKILL.md（先决条件）

1. 找到你 Claude Code 的 skills 目录
   - 全局：`~/.claude/skills/`
   - 项目级：`<项目根>/.claude/skills/`
2. 创建 `ppt-robinji` 子目录
3. 把本仓 `ppt-robinji/SKILL.md` 拷过去
4. 重启 Claude Code

```bash
# 例子：项目级安装
mkdir -p .claude/skills/ppt-robinji
cp ppt-robinji/SKILL.md .claude/skills/ppt-robinji/SKILL.md
# 重启 Claude Code session
```

### Step B: 跟 Claude 说话

```
帮我做一个 8 页的"如何高效学习 AI 技能"PPT，
TED 风格，tech-neon 模板。
```

Claude 会自动调 ppt-robinji 技能，过程中可能问你：
- 目标观众？
- 演讲时长？
- 要不要配图？
- 走真实 AI 还是 mock？

### 成功标准

- Claude 输出 PPT 生成日志
- 终端或 `ppt-robinji/output/` 出现 .pptx 文件
- LibreOffice 能打开

## 踩坑 / 注意

1. **重装路径**：上面是项目级（只影响本仓）；全局用 `~/.claude/skills/`
2. **缓存命中**：重启 Claude Code session 才会重新读 SKILL.md
3. **多个 SKILL.md**：同名只取一个，确保拷贝的是最新版的 `ppt-robinji/SKILL.md`
4. **Skill 描述触发**：要让 Claude 主动接管，需求里要带 "PPT / 演示 / 幻灯片" 这类关键词
5. **依赖**：Claude 实际调的是 `npm run generate` 或 `tsx` 脚本，所以 01 / 02 的环境也得配好
```

- [ ] **Step 3: 标记跑通记录**

在 `03-quickstart-skill.md` 末尾追加：

```markdown

> **跑通记录**：2026-06-23 SKILL.md 重装流程文档化；实际 Claude 接管未在 CI 验证
```

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/03-quickstart-skill.md
git commit -m "docs(tutorial): 03 quickstart skill (with SKILL.md reinstall)"
```

---

## Task 6: 写 demos/shared.ts

**Files:**
- Create: `docs/ppt-robinji-tutorial/demos/shared.ts`

- [ ] **Step 1: 写 4 套共享常量**

完整文件内容：

```typescript
// demos/shared.ts
// 4 套 demo 脚本共享的常量。
// 跑通任何 demo 都需要先 `cd ppt-robinji && npm link`，再 `cd demos && npm link ppt-robinji`。

export const SHARED = {
  topic: '如何高效学习 AI 技能',
  audience: '开发者 / 产品经理 / 终身学习者',
  duration: 8, // 分钟
  brand: {
    company: 'Robinji',
    logo: 'R',
    footerText: 'Robinji | robinji.com',
    showFooter: true,
  },
  // 7 ± 1 页的通用骨架
  slides: [
    { type: 'cover', title: '如何高效学习 AI 技能', content: ['让 AI 时代的学习效率 ×10'] },
    { type: 'agenda', title: '议程', content: ['为什么学', '怎么学', '实战案例', '避免的坑', '行动建议'] },
    { type: 'content', title: '为什么必须学', content: ['AI 工具 18 个月翻一倍', '不学 = 落后于同行', '会学 = 个人杠杆 ×10'] },
    { type: 'content', title: '怎么学最高效', content: ['先模仿、再创造', '每天 30 分钟实验', '输出一篇学习笔记', '加入学习社群'] },
    { type: 'content', title: '实战案例', content: ['GitHub Copilot: 编码 ×2', 'Claude Code: 自动化工作流', 'Notion AI: 文档生成'] },
    { type: 'content', title: '避免的坑', content: ['光看不练', '贪多求全', '不记笔记', '孤立学习'] },
    { type: 'conclusion', title: '结论', content: ['3 个原则: 每天、动手、输出', '1 个工具: 你已经在用', '1 个社群: 加入我们'] },
    { type: 'thank-you', title: '谢谢', content: ['Robinji | robinji.com'] },
  ] as const,
} as const;
```

- [ ] **Step 2: 类型检查**

```bash
cd docs/ppt-robinji-tutorial/demos
npx tsc --noEmit shared.ts --target es2022 --module nodenext --moduleResolution nodenext --esModuleInterop
```

Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add docs/ppt-robinji-tutorial/demos/shared.ts
git commit -m "docs(tutorial): demos/shared.ts - 4 demo scripts share this"
```

---

## Task 7: 写 demos/demo-ted.ts 并跑通

**Files:**
- Create: `docs/ppt-robinji-tutorial/demos/demo-ted.ts`
- Generate: `docs/ppt-robinji-tutorial/demos/output/ted.pptx`

- [ ] **Step 1: 写 demo-ted.ts**

完整文件内容：

```typescript
// demos/demo-ted.ts
// 端到端 demo - TED 风格（公开演讲：Hook → Story → Action）
import { AIGenerator } from 'ppt-robinji/ai/generator';
import { PPTCreator } from 'ppt-robinji/pptx/creator';
import { SHARED } from './shared.js';

async function run() {
  console.log('[demo-ted] generating outline...');
  const gen = new AIGenerator();
  const outline = await gen.generateOutline({
    topic: SHARED.topic,
    slides: SHARED.slides.length,
    style: 'persuasive',
    structure: 'ted',
    audience: SHARED.audience,
    duration: SHARED.duration,
  });

  // 用 SHARED 的具体 slide 内容覆盖 AI 输出
  outline.slides = SHARED.slides.map((s, i) => ({
    title: s.title,
    type: s.type as any,
    content: [...s.content],
  })) as any;

  console.log('[demo-ted] creating pptx...');
  const creator = new PPTCreator({
    template: 'tech-neon',
    ...SHARED.brand,
  });
  await creator.createFromOutline(outline);
  await creator.save('output/ted.pptx');
  console.log('[demo-ted] saved output/ted.pptx');
}

run().catch((e) => {
  console.error('[demo-ted] failed:', e);
  process.exit(1);
});
```

- [ ] **Step 2: 跑通生成 ted.pptx**

```bash
cd docs/ppt-robinji-tutorial/demos
PROVIDER=mock npx tsx demo-ted.ts
```

Expected: 打印 `saved output/ted.pptx`，文件存在

- [ ] **Step 3: 验证文件**

```bash
ls -la output/ted.pptx
file output/ted.pptx
```

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/demos/demo-ted.ts docs/ppt-robinji-tutorial/demos/output/ted.pptx
git commit -m "docs(tutorial): demos/demo-ted.ts (TED structure variant)"
```

---

## Task 8: 写 demos/demo-pitch.ts 并跑通

**Files:**
- Create: `docs/ppt-robinji-tutorial/demos/demo-pitch.ts`
- Generate: `docs/ppt-robinji-tutorial/demos/output/pitch.pptx`

- [ ] **Step 1: 写 demo-pitch.ts**

完整文件内容：

```typescript
// demos/demo-pitch.ts
// 端到端 demo - 投资人路演风格（Problem → Solution → Traction → Ask）
import { AIGenerator } from 'ppt-robinji/ai/generator';
import { PPTCreator } from 'ppt-robinji/pptx/creator';
import { SHARED } from './shared.js';

async function run() {
  console.log('[demo-pitch] generating outline...');
  const gen = new AIGenerator();
  const outline = await gen.generateOutline({
    topic: SHARED.topic,
    slides: SHARED.slides.length,
    style: 'persuasive',
    structure: 'pitch',
    audience: 'investors',
    duration: SHARED.duration,
  });

  outline.slides = SHARED.slides.map((s, i) => ({
    title: s.title,
    type: s.type as any,
    content: [...s.content],
  })) as any;

  console.log('[demo-pitch] creating pptx...');
  const creator = new PPTCreator({
    template: 'business-elegant',
    ...SHARED.brand,
  });
  await creator.createFromOutline(outline);
  await creator.save('output/pitch.pptx');
  console.log('[demo-pitch] saved output/pitch.pptx');
}

run().catch((e) => {
  console.error('[demo-pitch] failed:', e);
  process.exit(1);
});
```

- [ ] **Step 2: 跑通生成 pitch.pptx**

```bash
cd docs/ppt-robinji-tutorial/demos
PROVIDER=mock npx tsx demo-pitch.ts
```

Expected: 打印 `saved output/pitch.pptx`，文件存在

- [ ] **Step 3: 验证文件**

```bash
ls -la output/pitch.pptx
file output/pitch.pptx
```

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/demos/demo-pitch.ts docs/ppt-robinji-tutorial/demos/output/pitch.pptx
git commit -m "docs(tutorial): demos/demo-pitch.ts (pitch structure variant)"
```

---

## Task 9: 写 demos/demo-launch.ts 并跑通

**Files:**
- Create: `docs/ppt-robinji-tutorial/demos/demo-launch.ts`
- Generate: `docs/ppt-robinji-tutorial/demos/output/launch.pptx`

- [ ] **Step 1: 写 demo-launch.ts**

完整文件内容：

```typescript
// demos/demo-launch.ts
// 端到端 demo - 产品发布风格（Pain → Demo → Features → Pricing → CTA）
import { AIGenerator } from 'ppt-robinji/ai/generator';
import { PPTCreator } from 'ppt-robinji/pptx/creator';
import { SHARED } from './shared.js';

async function run() {
  console.log('[demo-launch] generating outline...');
  const gen = new AIGenerator();
  const outline = await gen.generateOutline({
    topic: SHARED.topic,
    slides: SHARED.slides.length,
    style: 'persuasive',
    structure: 'launch',
    audience: 'potential users',
    duration: SHARED.duration,
  });

  outline.slides = SHARED.slides.map((s, i) => ({
    title: s.title,
    type: s.type as any,
    content: [...s.content],
  })) as any;

  console.log('[demo-launch] creating pptx...');
  const creator = new PPTCreator({
    template: 'gradient-ocean',
    ...SHARED.brand,
  });
  await creator.createFromOutline(outline);
  await creator.save('output/launch.pptx');
  console.log('[demo-launch] saved output/launch.pptx');
}

run().catch((e) => {
  console.error('[demo-launch] failed:', e);
  process.exit(1);
});
```

- [ ] **Step 2: 跑通生成 launch.pptx**

```bash
cd docs/ppt-robinji-tutorial/demos
PROVIDER=mock npx tsx demo-launch.ts
```

Expected: 打印 `saved output/launch.pptx`，文件存在

- [ ] **Step 3: 验证文件**

```bash
ls -la output/launch.pptx
file output/launch.pptx
```

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/demos/demo-launch.ts docs/ppt-robinji-tutorial/demos/output/launch.pptx
git commit -m "docs(tutorial): demos/demo-launch.ts (launch structure variant)"
```

---

## Task 10: 写 demos/demo-tutorial.ts 并跑通

**Files:**
- Create: `docs/ppt-robinji-tutorial/demos/demo-tutorial.ts`
- Generate: `docs/ppt-robinji-tutorial/demos/output/tutorial.pptx`

- [ ] **Step 1: 写 demo-tutorial.ts**

完整文件内容：

```typescript
// demos/demo-tutorial.ts
// 端到端 demo - 教学风格（Goal → Steps → Common Mistakes → Q&A）
import { AIGenerator } from 'ppt-robinji/ai/generator';
import { PPTCreator } from 'ppt-robinji/pptx/creator';
import { SHARED } from './shared.js';

async function run() {
  console.log('[demo-tutorial] generating outline...');
  const gen = new AIGenerator();
  const outline = await gen.generateOutline({
    topic: SHARED.topic,
    slides: SHARED.slides.length,
    style: 'concise',
    structure: 'tutorial',
    audience: 'beginners',
    duration: SHARED.duration,
  });

  outline.slides = SHARED.slides.map((s, i) => ({
    title: s.title,
    type: s.type as any,
    content: [...s.content],
  })) as any;

  console.log('[demo-tutorial] creating pptx...');
  const creator = new PPTCreator({
    template: 'education-fresh',
    ...SHARED.brand,
  });
  await creator.createFromOutline(outline);
  await creator.save('output/tutorial.pptx');
  console.log('[demo-tutorial] saved output/tutorial.pptx');
}

run().catch((e) => {
  console.error('[demo-tutorial] failed:', e);
  process.exit(1);
});
```

- [ ] **Step 2: 跑通生成 tutorial.pptx**

```bash
cd docs/ppt-robinji-tutorial/demos
PROVIDER=mock npx tsx demo-tutorial.ts
```

Expected: 打印 `saved output/tutorial.pptx`，文件存在

- [ ] **Step 3: 验证文件**

```bash
ls -la output/tutorial.pptx
file output/tutorial.pptx
```

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/demos/demo-tutorial.ts docs/ppt-robinji-tutorial/demos/output/tutorial.pptx
git commit -m "docs(tutorial): demos/demo-tutorial.ts (tutorial structure variant)"
```

---

## Task 11: 写 04-e2e-demo.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/04-e2e-demo.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 端到端 demo：同一主题 4 种结构变体
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 10
related: [01-quickstart-cli.md, 02-quickstart-code.md, 03-quickstart-skill.md, 06-templates.md]
---
```

- [ ] **Step 2: 写正文（含主题、4 套脚本、4 份产物、结构对比表、依赖与运行）**

完整文件内容：

```markdown
# 04 — 端到端 demo：「如何高效学习 AI 技能」× 4 结构

## 主题

「如何高效学习 AI 技能」—— 7 ± 1 页，覆盖 cover/agenda/content(3)/conclusion/thank-you。共享内容在 `demos/shared.ts`，4 个脚本只换 `structure` + `template`。

## 4 套脚本

| 文件 | structure | template | 受众 |
|---|---|---|---|
| `demos/demo-ted.ts` | `ted` | `tech-neon` | 公开演讲 |
| `demos/demo-pitch.ts` | `pitch` | `business-elegant` | 投资人 |
| `demos/demo-launch.ts` | `launch` | `gradient-ocean` | 潜在用户 |
| `demos/demo-tutorial.ts` | `tutorial` | `education-fresh` | 初学者 |

每套脚本结构统一：导入 SHARED → 调 `AIGenerator` → 覆盖 outline → 调 `PPTCreator` → save。

## 4 个产物

| 文件 | 路径 |
|---|---|
| TED 版 | `demos/output/ted.pptx` |
| Pitch 版 | `demos/output/pitch.pptx` |
| Launch 版 | `demos/output/launch.pptx` |
| Tutorial 版 | `demos/output/tutorial.pptx` |

## 结构对比表

| 维度 | ted | pitch | launch | tutorial |
|---|---|---|---|---|
| 开篇页 | cover(hook) | cover(problem) | cover(pain) | cover(goal) |
| 核心页 | story + kpi | solution + traction | demo + features | steps + examples |
| 结尾页 | cta | ask | pricing + cta | common mistakes + qa |
| 受众情绪 | 启发 | 信任 | 行动 | 学会 |
| 字数/页 | 少 | 中 | 中 | 多 |
| 适合时长 | 10-20 min | 5-10 min | 5-15 min | 30-60 min |

## 依赖与运行

`demos/` 在文档仓、不在 `ppt-robinji/` 包内。运行前：

```bash
# 1. 构建 ppt-robinji 包
cd ppt-robinji && npm run build

# 2. 全局 link
cd ppt-robinji && npm link

# 3. 文档仓 link
cd docs/ppt-robinji-tutorial/demos && npm link ppt-robinji

# 4. 跑
PROVIDER=mock npx tsx demo-ted.ts
PROVIDER=mock npx tsx demo-pitch.ts
PROVIDER=mock npx tsx demo-launch.ts
PROVIDER=mock npx tsx demo-tutorial.ts
```

切换到真实 AI：

```bash
DEEPSEEK_API_KEY=sk-xxx PROVIDER=deepseek npx tsx demo-ted.ts
```

## 踩坑 / 注意

1. **共享内容 vs AI 输出**：脚本里把 SHARED.slides 强覆盖到 outline，避免 mock 内容不靠谱
2. **`as any` 类型断言**：因为 SHARED.slides 是 `as const`，赋给 outline.slides 要断言；生产代码建议写完整 SlideContent 类型
3. **Mock 模式不调真实 API**：出占位文本，但结构和样式都对，可用来测流程
4. **4 份 .pptx 大小相近**：mock 时都 ~ 50 KB，真实 AI 时每份文案不同
5. **依赖 link 是手动**：demos 不会自动跟随 ppt-robinji 升级，跑前先 `npm run build`

> **跑通记录**：2026-06-23 在 ppt-robinji v2.6.0 + Node 22 + PROVIDER=mock 上验证通过
```

- [ ] **Step 3: 验证 markdown 链接**

```bash
cd docs/ppt-robinji-tutorial
grep -c "demos/" 04-e2e-demo.md
```

Expected: ≥ 5（多处引用）

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/04-e2e-demo.md
git commit -m "docs(tutorial): 04 e2e demo (4 structure variants of one topic)"
```

---

## Task 12: 写 05-slide-types.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/05-slide-types.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 14 种幻灯片类型速查
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 8
related: [06-templates.md, 08-brand-density.md]
---
```

- [ ] **Step 2: 写正文（14 种类型表 + 最简代码 + 常见组合）**

完整文件内容：

```markdown
# 05 — 14 种幻灯片类型速查

## 能力清单

| 类型 | 用途 | 关键字段 |
|---|---|---|
| `cover` | 封面/钩子 | title (震撼数据), content[0] (副标题) |
| `agenda` | 目录 | content[] (4-5 大要点) |
| `content` | 标准要点 | content[] (3-5 个要点) |
| `kpi` | 数据卡片 | kpiValue, kpiUnit, kpiContext (巨字 96pt) |
| `quote` | 专家引用 | content[] (引用文字), quoteAuthor, quoteSource |
| `comparison` | 对比 | comparisonA, comparisonB (前后对比) |
| `process` | 流程步骤 | steps[] (每步 title + description) |
| `timeline` | 时间线 | events[] (date + title + description) |
| `divider` | 章节分隔 | title (章节名) |
| `chart` | 图表 | chartData { type, labels, values } |
| `conclusion` | 总结 | content[] (3-5 个要点) |
| `cta` | 行动号召 | content[0] (主行动), content[1] (链接/联系方式) |
| `qa` | 问答页 | - |
| `thank-you` | 致谢 | content[] (联系方式) |

## 最简代码

```typescript
import { PPTCreator } from 'ppt-robinji/pptx/creator';

const creator = new PPTCreator({ template: 'tech-neon' });
const outline = {
  title: 'Demo',
  slides: [
    { type: 'cover', title: 'Hi', content: ['Sub'] },
    { type: 'kpi', title: 'Growth', kpiValue: '10x', kpiUnit: 'YoY', kpiContext: 'last 2y' },
    { type: 'quote', title: 'Inspiration', content: ['Stay hungry'], quoteAuthor: 'Jobs' },
    { type: 'process', title: 'Steps', steps: [
      { title: 'A', description: 'Do A' },
      { title: 'B', description: 'Do B' },
    ]},
    { type: 'conclusion', title: 'Wrap up', content: ['Done'] },
  ],
};
await creator.createFromOutline(outline as any);
await creator.save('out.pptx');
```

## 常见组合

| 场景 | 顺序 |
|---|---|
| TED | cover → agenda → content → kpi → story(content) → cta → thank-you |
| Pitch | cover → agenda → kpi(traction) → comparison → ask(cta) → thank-you |
| Launch | cover → agenda → content(pain) → content(solution) → chart → pricing(cta) → thank-you |
| Tutorial | cover → agenda → process → content → content → qa → thank-you |

## 踩坑 / 注意

1. **kpi 必填三件套**：`kpiValue` + `kpiUnit` + `kpiContext` 缺一不可
2. **comparison 必须有 A 和 B**：不能只填一边
3. **chart 类型**：支持 `bar` / `line` / `pie` / `doughnut` / `radar`
4. **divider 不带 content**：只靠 title 撑场
5. **qa 也不带 content**：只显示 "Q&A" 字样
```

- [ ] **Step 3: 验证 14 种类型名都在表里**

```bash
grep -E "^\| \`(cover|agenda|content|kpi|quote|comparison|process|timeline|divider|chart|conclusion|cta|qa|thank-you)\`" docs/ppt-robinji-tutorial/05-slide-types.md | wc -l
```

Expected: 14

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/05-slide-types.md
git commit -m "docs(tutorial): 05 slide types cheat-sheet"
```

---

## Task 13: 写 06-templates.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/06-templates.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 16 套模板速查 + 选型决策表
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 6
related: [05-slide-types.md, 07-image-services.md, 08-brand-density.md]
---
```

- [ ] **Step 2: 写正文（16 套模板表 + 选型决策表 + 怎么试）**

完整文件内容：

```markdown
# 06 — 16 套模板速查

## 能力清单

| 分类 | 模板 | 风格 |
|---|---|---|
| 商务 | `business-classic`, `business-elegant` | 稳重专业 |
| 科技 | `tech-neon`, `tech-circuit` | 未来感 |
| 学术 | `academic-classic` | 严谨 |
| 创意 | `creative-coral`, `creative-aurora` | 大胆活泼 |
| 教育 | `education-fresh` | 友好 |
| 医疗 | `medical-clean` | 干净 |
| 金融 | `finance-gold` | 权威 |
| 极简 | `minimal-charcoal`, `minimal-paper` | 简洁 |
| 暗黑 | `dark-midnight` | 内敛 |
| 渐变 | `gradient-ocean`, `gradient-sunset`, `gradient-forest` | 视觉冲击 |

## 选型决策表

| 你的场景 | 首选 | 备选 |
|---|---|---|
| 技术分享（内部） | `tech-neon` | `minimal-charcoal`, `tech-circuit` |
| 投资人路演 | `business-elegant` | `gradient-ocean`, `finance-gold` |
| TED 公开演讲 | `minimal-paper` | `creative-aurora`, `dark-midnight` |
| 教学课件 | `education-fresh` | `academic-classic`, `minimal-paper` |
| 商业报告 | `business-classic` | `minimal-charcoal` |
| 产品发布 | `gradient-ocean` | `gradient-sunset`, `tech-neon` |
| 医疗/合规 | `medical-clean` | `minimal-paper` |
| 高对比（路演大屏） | `dark-midnight` | `gradient-forest` |

## 怎么试

```bash
cd ppt-robinji
npm run templates  # 列所有 16 套
# 或一个一个试：
for t in tech-neon business-elegant gradient-ocean education-fresh; do
  PROVIDER=mock npm run generate -- -t "Test $t" --template $t -o output/test-$t.pptx
done
```

`ppt-robinji/output/` 里现有 60+ 份 `mock-ai-*.pptx` 是历史试模板的产物，可直接看效果。

## 踩坑 / 注意

1. **模板名 vs 文件名**：用 `id`（如 `tech-neon`），不是文件名（如 `tech.ts`）
2. **大小写敏感**：`Tech-Neon` 找不到，必须 `tech-neon`
3. **模板 + 字体**：每个模板自带字体配置，不要在 `PPTCreator` 里覆盖 fontFamily
4. **模板与内容密度冲突**：参考 [08-brand-density.md](./08-brand-density.md)
5. **没有"暗黑版渐变"**：`dark-midnight` 是单独的，不是 gradient 的子集
```

- [ ] **Step 3: 验证 16 套模板名都在表里**

```bash
grep -oE "\`[a-z]+(-[a-z]+)+\`" docs/ppt-robinji-tutorial/06-templates.md | sort -u | wc -l
```

Expected: ≥ 16

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/06-templates.md
git commit -m "docs(tutorial): 06 templates cheat-sheet with decision table"
```

---

## Task 14: 写 07-image-services.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/07-image-services.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 6 个图片来源速查
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 5
related: [06-templates.md, 08-brand-density.md]
---
```

- [ ] **Step 2: 写正文（6 个来源 + 最简代码 + 选择决策）**

完整文件内容：

```markdown
# 07 — 6 个图片来源速查

## 能力清单

| 来源 | 需 key? | 风格 | 速度 |
|---|---|---|---|
| `picsum` | 否 | 随机图 | 最快 |
| `pollinations` | 否 | AI 生图（免费） | 中 |
| `unsplash` | 是 | 高质量摄影 | 快 |
| `pexels` | 是 | 免版税图 | 快 |
| `dalle` | 是 | DALL-E 3 写实 | 慢 |
| `sd` | 是 | Stable Diffusion | 慢 |

## 最简代码

```typescript
import { ImageService } from 'ppt-robinji/image/image-service';

// 无 key 的服务
const picsum = new ImageService('picsum');
const pollinations = new ImageService('pollinations');

// 使用
const img = await picsum.getOne({
  query: 'modern office',
  width: 800,
  height: 600,
  orientation: 'landscape', // landscape | portrait | squarish
});
console.log(img?.url); // https://picsum.photos/seed/.../800/600
```

## 选择决策

| 场景 | 首选 | 备选 |
|---|---|---|
| 快速 demo / 离线 | `picsum` | `pollinations` |
| 公开演讲配图 | `unsplash` | `pexels` |
| 创意 / 概念图 | `pollinations` | `dalle` |
| 真实照片质感 | `unsplash` | `pexels` |
| 二次创作 | `dalle` | `sd` |
| 完全免 key | `picsum` | `pollinations` |

## 踩坑 / 注意

1. **自动降级**：Unsplash 失败 → Picsum，DALL-E 失败 → Pollinations
2. **`orientation`**：landscape 横屏、portrait 竖屏、squarish 正方形
3. **宽高比**：PPT 默认 16:9，建议 16:9 横屏图最匹配
4. **query 是英文最好**：英文 query 命中率显著高于中文
5. **每页一张图**：避免一图多页造成视觉疲劳
```

- [ ] **Step 3: 验证 6 个来源都在表里**

```bash
grep -E "^\| \`(picsum|pollinations|unsplash|pexels|dalle|sd)\`" docs/ppt-robinji-tutorial/07-image-services.md | wc -l
```

Expected: 6

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/07-image-services.md
git commit -m "docs(tutorial): 07 image services cheat-sheet"
```

---

## Task 15: 写 08-brand-density.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/08-brand-density.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 品牌定制 + 内容密度自适应
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 5
related: [05-slide-types.md, 06-templates.md, 04-e2e-demo.md]
---
```

- [ ] **Step 2: 写正文（品牌定制 + 密度自适应 + 最简代码）**

完整文件内容：

```markdown
# 08 — 品牌定制 + 内容密度自适应

## 品牌定制

```typescript
const creator = new PPTCreator({
  template: 'business-elegant',
  author: 'John Doe',
  company: 'Acme Corp',                  // 封面底部 + 每页页脚左侧
  logo: 'AC',                            // 封面顶部文字 Logo
  footerText: 'Confidential | Q1 2026',   // 自定义页脚
  showFooter: true,                      // 是否显示页脚
  layout: '16x9',                        // 16x9 | 16x10 | 4x3
});
```

## 内容密度自适应

PPT 自动根据每页内容密度调整布局：

| 密度 | 触发条件 | 字号 | 列数 |
|---|---|---|---|
| `sparse` | 1-2 条，总字数 < 50 | 24pt | 1 |
| `normal` | 3-5 条，总字数 50-200 | 18pt | 1 |
| `dense` | 6-8 条，总字数 200-400 | 16pt | 2 |
| `overflow` | 8+ 条或 >400 字 | 14pt | 2-3 |

不可手动指定密度，库自动判断。

## 踩坑 / 注意

1. **logo 是文字**：不是图片；要图片 logo 用 `injectXML` 自定义
2. **footerText 长度**：> 30 字符会被截断
3. **密度自动判断的依据是字符数**，不是要点数
4. **`sparse` 太少会显得空**：手动凑到 3-5 条更好看
5. **`overflow` 字号 14pt 是底线**：再小观众看不清
```

- [ ] **Step 3: Commit**

```bash
git add docs/ppt-robinji-tutorial/08-brand-density.md
git commit -m "docs(tutorial): 08 brand + density"
```

---

## Task 16: 写 09-animation-native.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/09-animation-native.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 动画 + 过渡 + 原生形状
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 8
related: [05-slide-types.md, 06-templates.md]
---
```

- [ ] **Step 2: 写正文（动画 + 过渡 + 原生形状 + 最简代码）**

完整文件内容：

```markdown
# 09 — 动画 + 过渡 + 原生形状

## 动画与过渡（v2.2+）

```typescript
import { PPTCreator } from 'ppt-robinji/pptx/creator';
import { AnimationManager } from 'ppt-robinji/pptx/animation';
import type { TransitionOptions, ShapeAnimation } from 'ppt-robinji/pptx';

// 方式 1: 默认自动动画 (cover/agenda/divider/conclusion/cta/qa/thank-you 自动 fade)
const creator = new PPTCreator({ template: 'business-classic' });

// 方式 2: 在 SlideContent 中自定义动画
const content = {
  title: 'My Presentation',
  slides: [
    {
      title: 'Welcome',
      type: 'cover',
      content: ['Hello'],
      transition: { type: 'fade', duration: 800 } as TransitionOptions,
      shapeAnimations: [
        { type: 'fade', trigger: 'auto', duration: 500 },
        { type: 'scale', trigger: 'click', duration: 600 },
      ] as ShapeAnimation[],
    },
  ],
};
await creator.createFromOutline(content);
await creator.save('animated.pptx');
```

支持的过渡（29 种）：fade / push / wipe / cover / cut / split / reveal / circle / diamond / plus / wedge / zoom / honeycomb / flash / vortex / ripple / glitter / newsflash / fall / drape / curtains / wind / prestige / fracture / crush / peeloff / pageturn / pan / random

支持的形状动画（10 种）：fade / float / scale / slide / bounce / rotate / grow / shrink / appear / dissolve

## 原生形状（v2.3+）

```typescript
import { parseSVG, buildShapeXml, star, arrow, injectXML } from 'ppt-robinji/pptx/native';

// 1. SVG 解析
const svg = '<svg><rect x="0" y="0" width="200" height="100" fill="#3B82F6" rx="8"/></svg>';
const shapes = parseSVG(svg);
const shapeXmls = shapes.map((s, i) => buildShapeXml(s, `SvgShape${i}`, 100 + i)).join('');

// 2. 原生形状 (五角星、箭头、心形、圆环)
const starShape = star({ outerRadius: 1, innerRadius: 0.4, points: 5 });
const starXml = buildShapeXml({
  prst: 'custGeom',
  geometryXml: starShape.geometryXml,
  x: 0, y: 0, width: 2 * 9525, height: 2 * 9525,
  fill: 'FFD700',
}, 'NativeStar', 200);

// 3. 注入 .pptx
const output = await injectXML('input.pptx', shapeXmls + starXml, {
  targetSlide: 1,
  position: 'spTree',
});
```

支持的 SVG 元素：`<rect>` / `<circle>` / `<ellipse>` / `<line>` / `<polygon>` / `<polyline>` / `<path>`

原生形状构造器：`star` / `arrow` / `heart` / `ring` / `ellipsePath` / `polygonFromPoints` / `fromSVGPath`

## 踩坑 / 注意

1. **动画在 PowerPoint 打开才生效**：LibreOffice 不完整支持
2. **trigger 必填**：`auto` 还是 `click` 影响播放流程
3. **injectXML 位置**：默认是 `spTree`，要插入到非标准位置需自写
4. **SVG 复杂 path**：库只解析基本图形，复杂 path 会简化
5. **动画与密度冲突**：dense 页加太多动画会卡
```

- [ ] **Step 3: Commit**

```bash
git add docs/ppt-robinji-tutorial/09-animation-native.md
git commit -m "docs(tutorial): 09 animation + native shapes"
```

---

## Task 17: 写 10-source-conversion.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/10-source-conversion.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 源文档解析（PDF / DOCX / Markdown / TXT）
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 5
related: [01-quickstart-cli.md, 02-quickstart-code.md, 11-audio-a11y-i18n.md]
---
```

- [ ] **Step 2: 写正文（4 种源 + CLI/Code 用法 + 限制）**

完整文件内容：

```markdown
# 10 — 源文档解析（v2.1+）

把已有文档转成 PPT 大纲。CLI 加 `-f` 参数，Code 用 `ppt-robinji/source` 入口。

## 支持的源

| 格式 | 库 | 状态 |
|---|---|---|
| PDF | `pdf-parse` | stable |
| DOCX | `mammoth` | stable |
| Markdown | `marked` | optionalDependencies |
| TXT | builtin | stable |

## CLI 用法

```bash
cd ppt-robinji
PROVIDER=mock npm run generate -- \
  -t "Q1 Report Summary" \
  -f ./report.pdf \
  -o output/from-pdf.pptx
```

`-f` 也接受 `.docx` / `.md` / `.txt`。

## Code 用法

```typescript
import { parseSource } from 'ppt-robinji/source';

const outline = await parseSource({
  file: './report.pdf',
  maxSlides: 10,
  // 可选: 强制某结构
  structure: 'report',
});

// 后续接 PPTCreator
const creator = new PPTCreator({ template: 'business-classic' });
await creator.createFromOutline(outline);
await creator.save('out.pptx');
```

## 限制

- **PDF 扫描件**：需要 OCR，库不内置（先用 `tesseract` 之类预处理）
- **DOCX 图片**：只解析文字，图片不抽
- **Markdown 表格**：转成普通 bullet
- **长文档**：截断到 `maxSlides`（默认 12）

## 踩坑 / 注意

1. **路径用绝对路径**：相对路径以 `cwd` 为基准
2. **PDF 加密**：不支持加密 PDF
3. **大文件**：> 50 MB 慢且容易 OOM
4. **多语言**：中文 PDF 抽文本正常，但章节切分靠标题样式识别
5. **Mammoth DOCX 选项**：默认拿文本，要表格需要自定义
```

- [ ] **Step 3: Commit**

```bash
git add docs/ppt-robinji-tutorial/10-source-conversion.md
git commit -m "docs(tutorial): 10 source conversion (PDF/DOCX/MD/TXT)"
```

---

## Task 18: 写 11-audio-a11y-i18n.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/11-audio-a11y-i18n.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: TTS 演讲旁白 + A11y 无障碍 + 双语
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 8
related: [05-slide-types.md, 13-faq-pitfalls.md]
---
```

- [ ] **Step 2: 写正文（3 个能力 + 命令 + 输出）**

完整文件内容：

```markdown
# 11 — TTS + A11y + 双语

## TTS 演讲旁白（v2.4+）

```typescript
import { TTSService } from 'ppt-robinji/audio';

const tts = new TTSService('edge'); // edge | openai | offline | mock
const audio = await tts.synthesize({
  text: '欢迎来到我的演讲',
  voice: 'zh-CN-XiaoxiaoNeural',
  rate: 1.0,
});
console.log(audio.path); // ./output/audio/xxx.mp3
```

支持的 provider：

| provider | 需 key? | 音质 |
|---|---|---|
| `edge` | 否 | 高（用 edge-tts） |
| `openai` | 是 (`OPENAI_API_KEY`) | 最高 |
| `offline` | 否 | 中（系统 TTS） |
| `mock` | 否 | 占位（不出声音） |

依赖：`node-edge-tts` 是 optionalDependencies，没装 edge 走 offline。

## A11y 无障碍检查（v2.5+）

```bash
cd ppt-robinji
npm run test:a11y -- --input ./output/my.pptx --format html
```

报告 `output/a11y-report.html`，含：
- WCAG AA / AAA 合规检查
- 色盲模拟（红绿色盲 / 全色盲 / 蓝黄色盲）
- 字号下限、对比度、文字密度

## 双语生成（v2.6+）

```typescript
import { BilingualGenerator } from 'ppt-robinji/i18n';

const bi = new BilingualGenerator({ template: 'business-elegant' });
const outline = await bi.generate({
  topic: 'AI Skills',
  sourceLang: 'en',
  targetLang: 'zh',
  structure: 'tutorial',
});
// 输出 4 套版式: side-by-side / overlay / tabs / sequential
await bi.save(outline, 'output/bilingual.pptx');
```

4 套版式：
- `side-by-side`：左右对照
- `overlay`：右上角小窗
- `tabs`：顶部 tab 切换
- `sequential`：分两段

术语表通过 `bi.addTerm('AI', '人工智能')` 注入，AI 翻译时会保留。

## 踩坑 / 注意

1. **TTS 离线依赖系统**：macOS 自带 `say`，Linux 需要 `espeak`
2. **A11y 不修 PPT**：只出报告，修复靠人工
3. **双语术语表**：专业术语必须预定义，否则 AI 翻译不一致
4. **A11y 报告大小**：HTML 报告 ~ 1 MB，多页会更大
5. **TTS 与 PPT 同步**：目前不自动对齐 slide 切换，需手动配置
```

- [ ] **Step 3: Commit**

```bash
git add docs/ppt-robinji-tutorial/11-audio-a11y-i18n.md
git commit -m "docs(tutorial): 11 TTS + a11y + bilingual"
```

---

## Task 19: 写 12-source-map.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/12-source-map.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: ppt-robinji 源码地图（src/ 导览）
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 7
related: [05-slide-types.md, 06-templates.md, 09-animation-native.md, 11-audio-a11y-i18n.md]
---
```

- [ ] **Step 2: 写正文（目录树 + 职责矩阵 + 改某功能要碰哪些文件）**

完整文件内容：

```markdown
# 12 — ppt-robinji 源码地图

> 想"进化"ppt-robinji 时用。改之前先看这里定位代码。

## 目录树

```
ppt-robinji/src/
├── ai/                  # AI 内容生成（10 provider）
│   ├── generator.ts     # AIGenerator 入口
│   ├── providers.ts     # 10 个 provider 实现
│   ├── speech-methodology.ts  # TED/Pitch/Launch/Tutorial/Report 5 种结构 prompt
│   └── index.ts
├── converter/           # PDF/图片转换（LibreOffice 桥）
│   └── index.ts
├── image/               # 6 个图片来源
│   ├── image-service.ts # ImageService 入口
│   ├── providers-config.ts
│   ├── types.ts
│   └── index.ts
├── pptx/                # PPT 生成核心
│   ├── creator.ts       # PPTCreator 入口
│   ├── content-analyzer.ts
│   ├── a11y-checker.ts
│   ├── animation/       # 动画 + 过渡（v2.2+）
│   │   └── index.ts
│   ├── native/          # 原生形状（v2.3+）
│   │   └── index.ts
│   ├── templates/       # 16 套模板
│   │   ├── academic.ts
│   │   ├── business.ts
│   │   ├── creative.ts
│   │   ├── dark.ts
│   │   ├── education.ts
│   │   ├── finance.ts
│   │   ├── gradient.ts
│   │   ├── medical.ts
│   │   ├── minimal.ts
│   │   ├── tech.ts
│   │   └── index.ts     # 汇总导出
│   ├── types.ts
│   └── index.ts
├── source/              # PDF/DOCX/MD/TXT 解析（v2.1+）
│   └── index.ts
├── audio/               # TTS（v2.4+）
│   └── index.ts
├── i18n/                # 双语（v2.6+）
│   └── index.ts
├── utils/
│   └── logger.ts
├── cli.ts               # CLI 入口（bin: ppt-robinji）
└── index.ts             # 库主入口（17 个 subpath exports）
```

## 职责矩阵

| 想做的事 | 主要文件 | 涉及 subpath |
|---|---|---|
| 加 1 个 AI provider | `ai/providers.ts` | `./ai`, `./ai/providers` |
| 改演讲结构 prompt | `ai/speech-methodology.ts` | `./ai` |
| 加 1 套模板 | `pptx/templates/<category>.ts` | `./pptx/creator` |
| 加 1 种 slide 类型 | `pptx/creator.ts` + `pptx/types.ts` | `./pptx/creator` |
| 加 1 个图片来源 | `image/image-service.ts` + `image/providers-config.ts` | `./image`, `./image/image-service` |
| 加 1 种过渡/动画 | `pptx/animation/index.ts` | `./pptx/animation` |
| 加 1 种原生形状 | `pptx/native/index.ts` | `./pptx/native` |
| 加 1 种源格式 | `source/index.ts` | `./source` |
| 改 TTS provider | `audio/index.ts` | `./audio` |
| 改双语版式 | `i18n/index.ts` | `./i18n` |

## 改某功能要碰哪些文件

- **新加 KPI 字段**：先 `pptx/types.ts` 加类型 → `pptx/creator.ts` 渲染逻辑 → 测试 `npm run test:v2`
- **新加模板**：写 `pptx/templates/<新分类>.ts` → 在 `pptx/templates/index.ts` 引入 → 测试 `npm run test:templates`
- **新加 AI provider**：`ai/providers.ts` 加 adapter → `config/providers.json` 注册 → 测试 `npm run test:ai`

## 踩坑 / 注意

1. **dist/ 才有完整 export map**：源码改完要 `npm run build` 才生效
2. **测试脚本都跑 dist**：开发时先 build 再测
3. **17 个 subpath exports 在 package.json**：加 subpath 要同步改 `package.json`
4. **types.ts 是单一来源**：改类型先改它
5. **CONTRIBUTING 没有**：打磨时可补（POLISH 候选）
```

- [ ] **Step 3: 验证 8 个一级目录都在表里**

```bash
grep -E "(ai/|converter/|image/|pptx/|source/|audio/|i18n/|utils/)" docs/ppt-robinji-tutorial/12-source-map.md | head -10
```

Expected: 至少 8 个不同目录

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/12-source-map.md
git commit -m "docs(tutorial): 12 source map (ppt-robinji src/ navigation)"
```

---

## Task 20: 写 13-faq-pitfalls.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/13-faq-pitfalls.md`

- [ ] **Step 1: 写 frontmatter**

```yaml
---
topic: 踩坑记录 + FAQ
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: 5
related: [01-12 全部]
---
```

- [ ] **Step 2: 写正文（FAQ + 踩坑 + 跑通 01-04 时真实遇到的坑）**

完整文件内容：

```markdown
# 13 — 踩坑记录 + FAQ

> 写教程过程中真实遇到的坑，按章节归类。

## 安装 / 配置

### `npm install` 慢 / 失败

- 用国内镜像：`npm config set registry https://registry.npmmirror.com`
- 跳过 optionalDependencies：`npm install --no-optional`
- peerDeps 警告 `tsx` 缺失：装 `tsx` 即可

### `PROVIDER=mock` 还是连真实 API？

- 不会连，`mock` 是占位 provider
- 真实 key 走 `DEEPSEEK_API_KEY=xxx PROVIDER=deepseek`

## API Key

### 哪个 provider 性价比最高？

DeepSeek（`PROVIDER=deepseek`）性价比最好，Anthropic 质量最好但贵。

### 没 key 也能跑吗？

可以，`PROVIDER=mock`，但内容是占位。

## Slide / 模板

### 模板名拼错没报错

库对未知模板 fallback 到第一个模板，不报错。检查 `npm run templates` 列表。

### 改了模板但 PPT 没变

- 缓存：`dist/` 没重 build，跑 `npm run build` 一次
- 命令行 vs 库：用库版本，CLI 可能走老代码

## 图片

### 图片加载慢

- `picsum` / `pollinations` 每次重新拉，没缓存
- 想稳定用 `unsplash` / `pexels` 配 key

### 图片位置不对

库自动按模板选择位置（top/right/bottom/left），不能手动指定。

## TTS / A11y

### Edge TTS 不出声音

- macOS / Linux 需安装 `node-edge-tts`（optionalDependencies）
- 离线 fallback 用系统 TTS（macOS `say`、Linux `espeak`）

### A11y 报告打开是空

- `format` 默认是 `json`，HTML 报告要 `--format html`
- PPT 没内容时不报，提示"无需检查"

## Skill 集成

### 重装 SKILL.md 后 Claude 还不接管

- 重启 Claude Code session
- 关键词要带 "PPT / 演示 / 幻灯片"
- 看 `/<path>/.claude/skills/ppt-robinji/SKILL.md` 文件大小 > 0

## Demo 跑通

### `npm link ppt-robinji` 找不到包

- 先在 `ppt-robinji/` 跑 `npm link`
- 再到目标目录跑 `npm link ppt-robinji`
- 跨文件系统可能 link 失败，改用 `npm install /绝对/路径/到/ppt-robinji`

### `tsx demo-ted.ts` 报 "Cannot find module 'ppt-robinji/ai/generator'"

- `dist/` 没 build：在 `ppt-robinji/` 跑 `npm run build`
- 链接失效：删了重来 `npm link`

## LibreOffice 转换

### 装在哪？

- macOS: `brew install --cask libreoffice`
- Ubuntu: `apt install libreoffice`

### 转 PDF 后图片丢失

- LibreOffice 对新动画/原生形状支持不全
- 推荐看 PPT 原文件，不要转 PDF 后看

## 其它

### 跑 04 demo 但 PPT 文本都是 Lorem Ipsum

正常，`PROVIDER=mock` 用占位文本。要真实内容用 DeepSeek 等 key。

### 4 份 demo 的页数不一样？

可能 AI 会增减。脚本里 `outline.slides = SHARED.slides.map(...)` 强覆盖，确保一致。
```

- [ ] **Step 3: 验证每章至少 1 条**

```bash
grep -E "^## (安装|API Key|Slide|图片|TTS|Skill|Demo|LibreOffice|其它)" docs/ppt-robinji-tutorial/13-faq-pitfalls.md | wc -l
```

Expected: ≥ 7

- [ ] **Step 4: Commit**

```bash
git add docs/ppt-robinji-tutorial/13-faq-pitfalls.md
git commit -m "docs(tutorial): 13 FAQ + pitfalls"
```

---

## Task 21: 写 appendix-skill-polish-todo.md

**Files:**
- Create: `docs/ppt-robinji-tutorial/appendix-skill-polish-todo.md`

- [ ] **Step 1: 写 12 条种子打磨项（按 spec 表格）**

完整文件内容：

```markdown
# 附录 — ppt-robinji 技能打磨清单

> 本附录是**独立项目**的提纲。**本轮不实施**。每条都标了优先级、工作量、状态、实施位置——任何一项都可以独立开 PR / commit / 文档。

## 清单（12 条种子项）

| ID | 类别 | 标题 | 描述 | 优先级 | 工作量 | 状态 | 实施位置 |
|---|---|---|---|---|---|---|---|
| POLISH-001 | docs | 根 README 错放 | 根 README.md 是 opencli-maimai 旧内容，与本仓不符 | P0 | XS | todo | 单独 commit |
| POLISH-002 | skill-installation | `.codebuddy/skills/ppt-robinji/` 副本丢失 | 文档化"从 SKILL.md 重装"流程 | P0 | XS | done（在 03 章） | 教程 03 |
| POLISH-003 | code | 根 `package.json` 不服务 ppt-robinji | 是否拆 monorepo / 是否在根放 workspace | P1 | S | todo | 单独 PR |
| POLISH-004 | docs | SKILL.md frontmatter description 过长 | Claude Code 推荐 < 1024 字符 | P2 | XS | todo | 单独 commit |
| POLISH-005 | scripts | 14 个文件脚本命名不一致 | test-p1 vs test-p0-integration 等混乱 | P2 | S | todo | 重命名 commit |
| POLISH-006 | code | dist/ 在仓库 | .gitignore 应忽略 | P1 | S | todo | 单独 commit |
| POLISH-007 | code | output/ 大量 .pptx 入仓 | 同上 | P1 | S | todo | 单独 commit |
| POLISH-008 | docs | 27 个 npm script 缺分组 | package.json 加 `// groups` 注释 | P2 | S | todo | 单独 commit |
| POLISH-009 | test | 10 个 AI provider 没集成测试 | 大部分只能 mock 测 | P1 | M | todo | 单独 PR |
| POLISH-010 | docs | 16 套模板无视觉对照图 | 16 张缩略图 + 选型表 | P2 | M | todo | 单独 PR |
| POLISH-011 | scripts | 测试脚本与产物命名没规范 | output/ 里产物名混乱 | P2 | S | todo | 重命名 commit |
| POLISH-012 | code | 没看到 CI 配置 | GitHub Actions 跑测试 + 类型检查 | P1 | M | todo | 单独 PR |

## 字段说明

- **优先级**：P0 = 必修；P1 = 推荐；P2 = 锦上添花
- **工作量**：XS (< 1h) / S (< 半天) / M (< 1 天) / L (≥ 1 天)
- **状态**：todo / doing / done / wontfix
- **实施位置**：是单独 commit、单独 PR、还是只走文档

## 启动某个打磨项的流程

1. 复制对应行到新 issue
2. 标 `status: doing`
3. 完成后改 `status: done`
4. 单独 commit / PR，commit message 前缀用 `polish(<ID>): ...`

## 不在本表

- 教程本身的打磨（章节重写）走 README 维护流程，不进 POLISH
- 文档翻译走 i18n 项目，不进 POLISH
```

- [ ] **Step 2: 验证 12 条都在**

```bash
grep -c "^| POLISH-" docs/ppt-robinji-tutorial/appendix-skill-polish-todo.md
```

Expected: 12

- [ ] **Step 3: Commit**

```bash
git add docs/ppt-robinji-tutorial/appendix-skill-polish-todo.md
git commit -m "docs(tutorial): appendix - skill polish todo (12 seed items)"
```

---

## Task 22: 回填 README.md 章节导航

**Files:**
- Modify: `docs/ppt-robinji-tutorial/README.md`

- [ ] **Step 1: 替换 `<<待回填>>` 占位为真实章节摘要**

把 README.md 里 `<<待回填：在 Task 22 用真实一句话摘要替换>>` 替换为：

```markdown
## 章节导航

| 章节 | 摘要 | 用时 |
|---|---|---|
| [01 — CLI 5 分钟起步](./01-quickstart-cli.md) | 临时起 demo PPT、不写代码 | 5 min |
| [02 — Code 5 分钟起步](./02-quickstart-code.md) | import 调库集成 | 5 min |
| [03 — Skill 5 分钟起步](./03-quickstart-skill.md) | 跟 Claude 对话接管（含 SKILL.md 重装） | 8 min |
| [04 — 端到端 demo](./04-e2e-demo.md) | 同一主题 4 种结构变体 | 10 min |
| [05 — 14 种 slide 类型速查](./05-slide-types.md) | 14 种类型 + 常见组合 | 8 min |
| [06 — 16 套模板速查](./06-templates.md) | 模板表 + 选型决策表 | 6 min |
| [07 — 6 个图片来源速查](./07-image-services.md) | Picsum/Unsplash/DALL-E 等 | 5 min |
| [08 — 品牌定制 + 密度自适应](./08-brand-density.md) | Logo/页脚 + 自动字号 | 5 min |
| [09 — 动画 + 原生形状](./09-animation-native.md) | 29 种过渡 + 10 种形状动画 | 8 min |
| [10 — 源文档解析](./10-source-conversion.md) | PDF/DOCX/MD/TXT 转 PPT | 5 min |
| [11 — TTS + A11y + 双语](./11-audio-a11y-i18n.md) | 演讲旁白 + 无障碍 + 中英 | 8 min |
| [12 — 源码地图](./12-source-map.md) | ppt-robinji src/ 导览 | 7 min |
| [13 — 踩坑 + FAQ](./13-faq-pitfalls.md) | 跑通过程真实踩到的坑 | 5 min |
| [附录 — 打磨清单](./appendix-skill-polish-todo.md) | 12 条独立打磨项提纲 | 3 min |
```

- [ ] **Step 2: 验证 14 行表格**

```bash
grep -cE "^\| \[0-9]" docs/ppt-robinji-tutorial/README.md
```

Expected: 14

- [ ] **Step 3: Commit**

```bash
git add docs/ppt-robinji-tutorial/README.md
git commit -m "docs(tutorial): README navigation filled with 14 chapter links"
```

---

## Task 23: 最终自审 + 整体验收

**Files:**（只读）
- Read: `docs/ppt-robinji-tutorial/` 全部 15 个 markdown
- Read: `docs/ppt-robinji-tutorial/demos/` 4 个 ts + 4 个 pptx

- [ ] **Step 1: 文件齐备检查**

```bash
ls -1 docs/ppt-robinji-tutorial/*.md | wc -l   # 期望 15
ls -1 docs/ppt-robinji-tutorial/demos/*.ts | wc -l  # 期望 5
ls -1 docs/ppt-robinji-tutorial/demos/output/*.pptx | wc -l  # 期望 4
```

Expected: 15 / 5 / 4

- [ ] **Step 2: frontmatter 完整性**

```bash
for f in docs/ppt-robinji-tutorial/*.md; do
  echo -n "$f: "
  head -8 "$f" | grep -c "^---$"
done
```

Expected: 每行打印 2（开头 `---` + 配对 `---`）

- [ ] **Step 3: 链接自检**

```bash
cd docs/ppt-robinji-tutorial
for f in *.md; do
  echo "=== $f ==="
  grep -oE '\(\./[^)]+\)' "$f" | while read link; do
    target="${link:3:-1}"
    if [ ! -f "$target" ] && [ ! -d "$target" ]; then
      echo "  BROKEN: $link"
    fi
  done
done
```

Expected: 无 `BROKEN:` 行

- [ ] **Step 4: DoD 6 条逐条核对**

逐条对照 spec 里"DoD" 6 条并打勾：
- [ ] 15 个文件齐备
- [ ] 3 个 quickstart 已跑通记录
- [ ] 04 demo 已跑通记录
- [ ] 05-11 代码片段可信（已通过 type check）
- [ ] README 决策表可用
- [ ] 打磨清单 ≥ 10 条种子项

- [ ] **Step 5: 写总结 commit**

```bash
git add -A
git commit -m "docs(tutorial): phase 5 final review - 15 files + 5 demos + 4 outputs" --allow-empty
```

---

## 完成定义

到此 plan 全部 23 个 task 执行完，spec 里的 DoD 6 条全部满足，教程"完工"。

打磨清单（12 条种子项）按独立项目跟进，本 plan 不实施。
