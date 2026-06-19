# opencli-plugin-lagou

> 拉勾 (Lagou) 招聘平台适配器 — opencli 插件

## 简介

为 [@jackwener/opencli](https://github.com/jackwener/opencli) 添加拉勾支持。提供 3 个命令：

- `lagou search` — 职位搜索
- `lagou detail` — 职位详情
- `lagou company` — 公司信息

## 为什么用 opencli 插件而不是 Python 适配器？

拉勾部署了阿里云 WAF（Web 应用防火墙），直接 HTTP 请求会被滑动验证拦截。opencli 通过 Chrome 浏览器 + Browser Bridge 扩展复用用户已登录的会话，从而绕过 WAF。

## 安装

```bash
# 从本地目录安装
opencli plugin install file:///path/to/lagou

# 或从 Git 仓库
opencli plugin install https://github.com/your-org/opencli-plugin-lagou
```

## 前置条件

1. **opencli ≥ 1.8.3** 已安装
2. **Chrome 浏览器** 已安装
3. **opencli Browser Bridge** 扩展已加载（从 [releases](https://github.com/jackwener/opencli/releases) 下载）
4. **已在 Chrome 中登录拉勾**：访问 https://www.lagou.com 完成登录

## 使用

```bash
# 基础搜索
opencli lagou search "Python" --city 北京

# 多维筛选
opencli lagou search "前端" --city 上海 --salary "20k-40k" --experience "3-5年"

# 职位详情
opencli lagou detail --positionId 12345678

# 公司信息 + 在招职位
opencli lagou company --companyId 456789 --withJobs true
```

## 集成

本插件是 [job-search-skill](https://github.com/your/job-search-skill) 的一个组件，已被自动识别。

## 字段映射

参见 [SKILL.md](./SKILL.md) 了解完整的输出字段说明。

## 故障排查

参见 [SKILL.md](./SKILL.md#故障排查)。

## 许可证

MIT