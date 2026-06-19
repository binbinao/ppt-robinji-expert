---
name: maimai-search
description: 脉脉人才搜索 - 在脉脉上搜索候选人简历，支持多维度筛选
---

# 脉脉人才搜索技能

本技能帮助你在脉脉（maimai.cn）上搜索候选人简历，支持按职位、公司、学校、地区、工作年限、学历等多维度筛选。

## 前置条件

使用此技能前，请确保已安装和配置：

1. **Node.js** v16+ —— [下载地址](https://nodejs.org/)
2. **opencli** —— `npm install -g @jackwener/opencli`
3. **Chrome 浏览器** 并已登录脉脉账号
4. **Playwright MCP Bridge** Chrome 扩展 —— [安装地址](https://chromewebstore.google.com/detail/playwright-mcp-bridge/kldoghpdblpjbjeechcaoibpfbgfomkn)

### 配置 Playwright MCP

```bash
claude mcp add playwright --scope user -- npx @playwright/mcp@latest
```

## 何时使用

- 需要在脉脉上寻找特定职位的候选人
- 按公司、学校、地区等条件筛选人才
- 获取候选人的详细简历信息（工作年限、学历、技能标签等）
- 查看候选人的共同好友信息

## 使用方法

### 基础搜索

直接用自然语言描述你的需求：

```
"帮我在脉脉上搜索 Java 工程师"
"找找看有没有做过产品经理的候选人"
"搜索上海的技术人才"
```

### 按公司筛选

```
"搜索字节跳动的 Java 工程师"
"找有百度和阿里工作经验的产品经理"
"搜索大厂出身的技术人才"
```

### 按学校筛选

```
"搜索北大清华的互联网人才"
"找 985/211 院校的算法工程师"
"搜索海外名校毕业的候选人"
```

### 按地区筛选

```
"搜索北京的技术人才"
"找上海的金融从业者"
"搜索深圳的硬件工程师"
```

### 组合筛选

```
"找北京字节的 Java 工程师，本科以上，3-5 年经验"
"搜索北大清华的互联网产品经理，可直聊"
"找上海 5-10 年经验的技术总监"
```

## 搜索参数说明

### 基础参数

| 参数 | 说明 | 示例 |
|------|------|------|
| query | 搜索关键词（职位、技能等） | "Java"、"产品经理" |
| page | 页码（从 0 开始） | 0, 1, 2 |
| size | 每页结果数量 | 20, 50 |

### 筛选参数

| 参数 | 说明 | 值 |
|------|------|------|
| positions | 职位 | "运营"、"Java 开发工程师" |
| companies | 公司（多个用逗号分隔） | "字节跳动，阿里巴巴" |
| schools | 学校（多个用逗号分隔） | "北京大学，清华大学" |
| provinces | 省份 | "北京"、"上海" |
| cities | 城市 | "北京市"、"上海市" |
| worktimes | 工作年限 | 1=1-3 年，2=3-5 年，3=5-10 年，4=10 年以上 |
| degrees | 学历 | 1=大专，2=本科，3=硕士，4=博士，5=MBA |
| professions | 行业 | 01=互联网，02=金融，03=电子，04=通信 |
| is_211 | 是否 211 院校 | 0=不限，1=211 |
| is_985 | 是否 985 院校 | 0=不限，1=211 |
| sortby | 排序方式 | 0=相关度，1=活跃度，2=工作年限，3=学历 |
| is_direct_chat | 是否直聊 | 0=不限，1=可直聊 |

## 输出字段

| 字段 | 说明 |
|------|------|
| name | 候选人姓名 |
| job_title | 当前职位 |
| company | 当前公司 |
| historical_companies | 历史工作经历（用 / 分隔） |
| location | 工作地点 |
| work_year | 工作年限 |
| school | 毕业院校 |
| degree | 学历 |
| active_status | 活跃状态 |
| age | 年龄 |
| tags | 技能标签/行业标签 |
| mutual_friends | 共同好友数量及名单 |

## 常见问题

### 提示"需要登录"

请先在 Chrome 浏览器中访问 [maimai.cn](https://maimai.cn) 并登录脉脉账号。

### 搜索结果为空

- 检查关键词是否过于具体
- 尝试更通用的搜索词（如 "Java" 代替 "Java 高级开发"）
- 确认脉脉账号状态正常

## 相关资源

- [opencli-maimai GitHub 仓库](https://github.com/ivanxia1988/opencli-maimai)
- [opencli 框架](https://github.com/jackwener/opencli)

## 安装此技能

```bash
npx skills add ivanxia1988/opencli-maimai@maimai-search
```

## 卸载此技能

```bash
npx skills remove maimai-search
```
