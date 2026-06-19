---
name: lagou
description: >-
  Search jobs and company information on Lagou (拉勾), one of China's leading
  tech recruitment platforms. Supports keyword search with city/salary/education
  filters, job detail lookup, and company information with active positions.
  Use this skill whenever the user wants to search tech jobs on 拉勾, find
  companies on 拉勾, or mentions 拉勾 / lagou by name — even if they don't
  explicitly say "search". Trigger words include: 拉勾, lagou, 拉勾网, 技术招聘,
  互联网招聘, 程序员招聘, 拉勾搜索, 拉勾公司.
license: MIT
compatibility: "Requires opencli >= 1.8.3 with Browser Bridge extension installed. Chrome must be logged into lagou.com for full access."
metadata:
  author: job-search-skill integration
  version: "0.1.0"
  category: productivity
  tags: ["jobs", "recruitment", "lagou", "拉勾", "chinese", "tech", "opencli-plugin"]
---

# 拉勾 (Lagou) - 技术招聘

## 概述

拉勾是中国领先的技术/互联网行业招聘平台。这个 opencli 插件提供 3 个核心命令：

| 命令 | 功能 | 认证要求 |
|------|------|---------|
| `lagou search` | 职位搜索（关键词 + 多维筛选） | Cookie（需登录） |
| `lagou detail` | 职位详情（JD、公司信息） | Cookie（需登录） |
| `lagou company` | 公司信息（含在招职位） | Cookie（需登录） |

## 为什么需要 Chrome 登录？

拉勾网站部署了 **阿里云 WAF**（Web应用防火墙），直接 HTTP 请求会被滑动验证拦截。因此本插件通过 opencli Browser Bridge 在已登录的 Chrome 浏览器中调用拉勾的内部 XHR API，绕过 WAF。

## 安装

```bash
# 本地安装（在插件目录）
opencli plugin install file:///path/to/lagou

# 或从 Git 安装
opencli plugin install https://github.com/your-org/opencli-plugin-lagou
```

## 使用方法

### 搜索职位

```bash
# 基础搜索
opencli lagou search "Python工程师" --city 北京

# 多维筛选
opencli lagou search "前端开发" \
  --city 上海 \
  --salary "15k-30k" \
  --experience "3-5年" \
  --education 本科 \
  --limit 15

# 表格输出（人类可读）
opencli lagou search "AI产品经理" --city 北京 -f table

# JSON 输出（程序处理）
opencli lagou search "Java架构师" --city 深圳 -f json | jq '.[0:3]'
```

### 获取职位详情

```bash
# positionId 从 search 结果获取
opencli lagou detail --positionId 12345678
```

### 查询公司信息

```bash
# 基础公司信息
opencli lagou company --companyId 456789

# 同时列出该公司的在招职位
opencli lagou company --companyId 456789 --withJobs true
```

## 输出格式

### search 输出字段

| 字段 | 类型 | 说明 |
|------|------|------|
| rank | int | 排名序号 |
| positionId | int | 拉勾职位唯一 ID |
| positionName | string | 职位名称 |
| companyId | int | 公司 ID |
| companyFullName | string | 公司全称 |
| companyShortName | string | 公司简称 |
| city | string | 工作城市 |
| businessZones | string | 商区（多个用 / 分隔） |
| salary | string | 薪资范围（如 "15k-25k"） |
| workYear | string | 经验要求 |
| education | string | 学历要求 |
| jobNature | string | 工作性质（全职/兼职/实习） |
| financeStage | string | 融资阶段 |
| companySize | string | 公司规模 |
| industryField | string | 行业领域 |
| positionAdvantage | string | 职位亮点（标签） |
| createTime | string | 发布时间 |
| detailUrl | string | 职位详情 URL |

### detail 额外字段

- `positionDetail` - 完整 JD（已去除 HTML 标签）
- `positionAddress` - 详细地址
- `companyLogo` - 公司 Logo URL
- `companyIntroduce` - 公司介绍

### company 额外字段

- `registeredCapital` - 注册资本
- `registeredTime` - 注册时间
- `companyIntroduce` - 公司介绍
- `activeJobCount` - 在招职位数量（仅当 withJobs=true）
- `activeJobs` - 在招职位列表

## 注意事项

1. **必须先登录**：在 Chrome 中打开 https://www.lagou.com 完成登录
2. **浏览器保持开启**：搜索过程中需要 Chrome 处于活动状态
3. **限速**：拉勾有反爬机制，建议每次搜索间隔 ≥ 5 秒
4. **法律合规**：本工具仅供个人求职/招聘辅助，请遵守拉勾用户协议和 robots.txt
5. **WAF 可能升级**：如拉勾更新 WAF 规则，插件可能失效，需相应更新

## 与统一搜索集成

本插件已集成到 job-search-skill 统一搜索：

```bash
# 通过统一入口调用拉勾
python3 unified_search.py search "Python" --platforms lagou --location 北京
```

## 故障排查

| 症状 | 可能原因 | 解决方案 |
|------|---------|---------|
| `拉勾 API 调用失败` | Chrome 未登录拉勾 | 在 Chrome 中访问 https://www.lagou.com 完成登录 |
| `Browser Bridge extension not connected` | 扩展未加载 | chrome://extensions 加载 opencli Browser Bridge |
| 返回空结果 | 关键词无匹配 | 尝试更宽泛的关键词 |
| `HTTP 403` | WAF 拦截 | 检查 Chrome 是否真人操作（不要切换过快） |
| 字段缺失 | API 响应结构变化 | 更新插件版本 |