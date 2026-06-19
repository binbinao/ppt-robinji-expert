# 平台认证配置指南

本文档详细说明每个平台的认证方式。运行 `python3 scripts/unified_search.py platforms` 可查看当前状态。

---

## 1. 猎聘 (Liepin) — MCP Token 认证

猎聘提供了官方 **MCP Server**（https://www.liepin.com/mcp/server），通过 2 个 token 接入。

### 获取 Token

1. 浏览器打开 https://www.liepin.com/mcp/server
2. **登录你的猎聘账号**（招聘端或求职端均可）
3. 复制两个 token：
   - **Gateway Token**（格式 `mcp_gateway_token_xxx`）
   - **User Token**（格式 `liepin_user_token_xxx`）
4. Token 有效期 **90 天**，到期需重新获取

### 配置方式（三选一）

**方式 A：交互式 setup**
```bash
python3 skills/liepin/liepin_mcp.py setup
# 按提示粘贴 token
```

**方式 B：环境变量**
```bash
export LIEPIN_GATEWAY_TOKEN="mcp_gateway_token_xxx"
export LIEPIN_USER_TOKEN="liepin_user_token_xxx"
```

**方式 C：写入 shell 配置（持久化）**
```bash
echo 'export LIEPIN_GATEWAY_TOKEN="..."' >> ~/.zshrc
echo 'export LIEPIN_USER_TOKEN="..."' >> ~/.zshrc
source ~/.zshrc
```

### 验证
```bash
# 方法 1：通过统一入口查看
python3 scripts/unified_search.py platforms
# liepin 应显示 ✓ 可用

# 方法 2：直接调用 list-tools（成功 = 认证 OK）
python3 skills/liepin/liepin_mcp.py list-tools
```

### 限流
- 60 次/分钟（所有操作共享）

---

## 2. Boss直聘 / LinkedIn / 脉脉 / Indeed / 51job — opencli Cookie 认证

这 5 个平台都通过 [@jackwener/opencli](https://github.com/jackwener/opencli) 框架 + Chrome 浏览器自动化实现。

### 前置步骤

#### A. 安装 Chrome
macOS 通常自带 Safari 和 Chrome 二选一。如果没装：
```bash
brew install --cask google-chrome
```

#### B. 安装 opencli Browser Bridge 扩展

1. 访问 https://github.com/jackwener/opencli/releases
2. 下载最新的 **opencli-browser-bridge-*.zip**
3. 解压得到 `opencli-browser-bridge` 文件夹
4. Chrome → 地址栏输入 `chrome://extensions`
5. 打开右上角 **「开发者模式」**
6. 点击 **「加载已解压的扩展程序」**
7. 选择刚才解压的文件夹

#### C. 启动 opencli daemon
```bash
./node_modules/.bin/opencli daemon restart
./node_modules/.bin/opencli doctor  # 应显示 ✓ Browser Bridge OK
```

### 在 Chrome 中登录目标平台

| 平台 | 登录 URL |
|------|---------|
| Boss直聘 | https://www.zhipin.com |
| LinkedIn | https://www.linkedin.com |
| 脉脉 | https://maimai.cn |
| Indeed | https://www.indeed.com |
| 51job | https://jobs.51job.com |

**重要**：登录成功后保持 Chrome 开着，opencli 会复用浏览器会话。

### 验证
```bash
# 测试 Boss直聘
./node_modules/.bin/opencli boss search "Python" --city 北京 --limit 3 -f json
# 应该返回 3 条职位（如果未登录会返回错误提示）
```

---

## 3. 平台限速与道德使用

| 平台 | 公开限速 | 推荐节奏 |
|------|---------|---------|
| 猎聘 | 60 次/分钟 | 单次批量 ≤ 20 |
| Boss直聘 | 平台风控严格 | 间隔 ≥ 10 秒 |
| LinkedIn | 月度 Commercial Use Limit | 人脉搜索 ≤ 100/月 |
| 脉脉 | 严格风控 | 间隔 ≥ 30 秒 |
| Indeed | 较宽松 | 间隔 ≥ 5 秒 |

**道德使用建议**：
- ❌ 不要高频批量投递（如 1 分钟内投 50 个岗位）
- ❌ 不要绕过平台 ToS
- ❌ 不要伪造简历/经验
- ✅ 保持合理人工节奏（模拟真人操作）
- ✅ 仅用于个人求职/招聘辅助

---

## 4. 故障排查

### opencli: "Browser Bridge extension not connected"

```
ok: false
error:
  code: BROWSER_CONNECT
  message: Browser Bridge extension not connected
  help: |-
    Make sure Chrome/Chromium is open and the extension is enabled.
    If the extension is installed, try: opencli daemon stop && opencli doctor
    If not installed: ...
```

**解决**：
```bash
# 1. 确保 Chrome 已打开
# 2. 确保扩展已加载（chrome://extensions 看到 opencli Bridge）
# 3. 重启 daemon
./node_modules/.bin/opencli daemon stop
./node_modules/.bin/opencli daemon restart
./node_modules/.bin/opencli doctor
```

### Liepin: "401 Unauthorized" / "Token expired"

猎聘 token 过期（90 天）：
1. 重新访问 https://www.liepin.com/mcp/server
2. 复制新的两个 token
3. 重新运行 `setup` 或更新环境变量

### 某个平台持续返回空结果

1. 在 Chrome 中重新登录该平台（可能 session 过期）
2. 检查是否触发了平台验证码
3. 用 `opencli <platform> ...` 单独测试命令
4. 查看 opencli 的 GitHub Issues 是否有平台接口变动

### "JSON parse error"

通常是 opencli 版本与适配器不匹配：
```bash
npm update @jackwener/opencli
# 重启 daemon
./node_modules/.bin/opencli daemon restart
```