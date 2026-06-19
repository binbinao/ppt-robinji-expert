# opencli-maimai

> 脉脉人才搜索 CLI & Claude Code Skill —— 让 AI 可以直接搜索脉脉候选人

用自然语言搜索脉脉上的人才简历，直接复用 Chrome 浏览器登录态，无需 API Key。

## 📦 两种使用方式

### 方式一：Claude Code Skill（推荐）⭐

安装后可在 Claude Code 中直接用自然语言搜索：

**安装技能：**
```bash
npx skills add ivanxia1988/opencli-maimai@maimai-search
```

**使用示例：**
```
"帮我在脉脉上搜索 Java 工程师"
"找找北京字节的产品经理"
"搜索北大清华的互联网人才，本科以上"
```

**卸载技能：**
```bash
npx skills remove maimai-search
```

### 方式二：opencli CLI

直接作为命令行工具使用：

```bash
opencli maimai search-talents --query "Java 工程师"
opencli maimai search-talents --query "产品经理" --companies "字节跳动"
```

## 效果演示

```
"帮我找一下上海的 Java 工程师"
"搜索做过产品经理的候选人"
"找有字节跳动工作经验的人"
```

## 前置条件

使用前请确保已安装：

- [ ] **Node.js** v16+ —— [下载地址](https://nodejs.org/)
- [ ] **opencli** —— `npm install -g @jackwener/opencli`
- [ ] **Chrome 浏览器** 并已登录脉脉
- [ ] **Playwright MCP Bridge** Chrome 扩展 —— [安装地址](https://chromewebstore.google.com/detail/playwright-mcp-bridge/kldoghpdblpjbjeechcaoibpfbgfomkn)

## 快速开始

### 1. 安装 opencli（如果还未安装）

```bash
npm install -g @jackwener/opencli
```

### 2. 配置 Playwright MCP（如果还未配置）

```bash
claude mcp add playwright --scope user -- npx @playwright/mcp@latest
```

### 3. 安装本 CLI

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/opencli-maimai.git

# 复制配置文件到 opencli 目录
cp opencli-maimai/maimai/search-talents.yaml ~/.opencli/clis/maimai/

# 确保目录存在
mkdir -p ~/.opencli/clis/maimai
```

### 4. 使用方法

在 Claude Code 中直接使用：

```bash
opencli maimai search-talents --query "Java 工程师"
opencli maimai search-talents --query "产品经理" --page 1
opencli maimai search-talents --query "字节跳动" --size 10
```

或在 Claude Code 中用自然语言：

```
"帮我在脉脉上搜索 Java 工程师"
"找找看有没有做过产品经理的候选人"
```

## 使用示例

### 基础搜索

```bash
# 搜索 Java 工程师
opencli maimai search-talents --query "Java"

# 搜索产品经理
opencli maimai search-talents --query "产品经理"
```

### 按公司筛选

```bash
# 搜索百度的人才
opencli maimai search-talents --query "Java" --companies "百度"

# 搜索字节和阿里的人才
opencli maimai search-talents --query "算法" --companies "字节跳动，阿里巴巴"
```

### 按学校筛选

```bash
# 搜索北大清华的人才
opencli maimai search-talents --query "产品经理" --schools "北京大学，清华大学"

# 搜索 985/211 院校人才
opencli maimai search-talents --query "Java" --is_211 1 --is_985 1
```

### 按地区筛选

```bash
# 搜索北京的人才
opencli maimai search-talents --query "Java" --provinces "北京"

# 搜索上海的人才
opencli maimai search-talents --query "产品经理" --cities "上海市"
```

### 按学历和年限筛选

```bash
# 搜索硕士学历，3-5 年经验
opencli maimai search-talents --query "算法工程师" --degrees 3 --worktimes 2

# 搜索本科及以上，5-10 年经验
opencli maimai search-talents --query "技术总监" --worktimes 3
```

### 组合筛选

```bash
# 搜索北京字节跳动的 Java 工程师，本科以上，3-5 年经验
opencli maimai search-talents --query "Java" \
  --companies "字节跳动" \
  --provinces "北京" \
  --degrees 2 \
  --worktimes 2

# 搜索北大清华的互联网行业人才，可直聊
opencli maimai search-talents --query "产品经理" \
  --schools "北京大学，清华大学" \
  --professions "01" \
  --is_direct_chat 1
```

## 命令参数

### 基础参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `--query` | string | ✅ | - | 搜索关键词（如职位、公司、技能） |
| `--page` | int | ❌ | 0 | 页码（从 0 开始） |
| `--size` | int | ❌ | 20 | 每页结果数量 |

### 筛选参数

| 参数 | 类型 | 说明 | 示例值 |
|------|------|------|--------|
| `--positions` | string | 职位 | "运营"、"Java 开发工程师" |
| `--companies` | string | 公司（多个用逗号分隔） | "百度"、"字节跳动，阿里巴巴" |
| `--schools` | string | 学校（多个用逗号分隔） | "北京大学"、"清华大学，复旦大学" |
| `--provinces` | string | 省份 | "北京"、"上海" |
| `--cities` | string | 城市 | "北京市"、"上海市" |
| `--worktimes` | string | 工作年限 | 1=1-3 年，2=3-5 年，3=5-10 年，4=10 年以上 |
| `--degrees` | string | 学历 | 1=大专，2=本科，3=硕士，4=博士，5=MBA |
| `--professions` | string | 行业 | 01=互联网，02=金融，03=电子，04=通信 |
| `--is_211` | int | 是否 211 院校 | 0=不限，1=211 |
| `--is_985` | int | 是否 985 院校 | 0=不限，1=985 |
| `--sortby` | int | 排序方式 | 0=相关度，1=活跃度，2=工作年限，3=学历 |
| `--is_direct_chat` | int | 是否直聊 | 0=不限，1=可直聊 |

## 输出字段

| 字段 | 说明 |
|------|------|
| `name` | 候选人姓名 |
| `job_title` | 当前职位 |
| `company` | 当前公司 |
| `historical_companies` | 历史工作经历（用 `/` 分隔，排除当前公司） |
| `location` | 工作地点 |
| `work_year` | 工作年限 |
| `school` | 毕业院校 |
| `degree` | 学历 |
| `active_status` | 活跃状态 |
| `age` | 年龄 |
| `tags` | 技能标签/行业标签 |
| `mutual_friends` | 共同好友数量及名单（前 3 人） |

## 常见问题

### 提示"需要登录"

请先在 Chrome 浏览器中访问 [maimai.cn](https://maimai.cn) 并登录脉脉账号。

### 搜索结果为空

- 检查关键词是否过于具体
- 尝试更通用的搜索词（如 "Java" 代替 "Java 高级开发"）
- 确认脉脉账号状态正常

### opencli 命令不存在

运行以下命令重新安装：

```bash
npm install -g @jackwener/opencli
```

## 安装此 Skill

```bash
npx skills add ivanxia1988/opencli-maimai@maimai-search
```

安装后，在 Claude Code 中直接用自然语言搜索脉脉人才：

```
"帮我在脉脉上搜索 Java 工程师"
"找找北京字节的产品经理，本科以上"
```

## 项目结构

```
opencli-maimai/
├── README.md
├── LICENSE
├── skills/
│   └── maimai-search/
│       └── SKILL.md         # Claude Code Skill 定义文件
├── maimai/
│   └── search-talents.yaml  # 脉脉搜索配置文件
└── scripts/
    ├── install.sh           # 一键安装脚本（可选）
    └── publish.sh           # 发布脚本
```

## 与其他 opencli 模块集成

本 CLI 是 [opencli](https://github.com/jackwener/opencli) 生态的一部分，可以同时使用其他平台的 CLI：

```bash
# 同时搜索多个平台
opencli boss search --query "Java" --city "上海"
opencli maimai search-talents --query "Java"
opencli linkedin search --query "Java"
```

## 致谢

- 基于 [opencli](https://github.com/jackwener/opencli) 构建
- 感谢 [@jackwener](https://github.com/jackwener) 开发的 opencli 框架

## License

MIT

---

**注意**: 本工具仅供个人学习和招聘工作使用，请遵守脉脉的用户协议和数据使用规范。
