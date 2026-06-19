#!/bin/bash
# quick_check.sh - 快速验证 job-search skill 是否正确安装
# 不需要真实账号/Chrome，可立即运行

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

echo "🧪 job-search skill 安装验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0

# 1. Python 版本
echo "1️⃣  Python 版本"
PY_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
if python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)'; then
    echo "   ✓ Python $PY_VERSION (需要 ≥ 3.9)"
else
    echo "   ✗ Python $PY_VERSION 过旧（需要 ≥ 3.9）"
    ERRORS=$((ERRORS+1))
fi

# 2. Node.js 版本
echo ""
echo "2️⃣  Node.js 版本"
if command -v node > /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✓ Node $NODE_VERSION"
else
    echo "   ✗ Node 未安装"
    ERRORS=$((ERRORS+1))
fi

# 3. opencli 是否安装
echo ""
echo "3️⃣  opencli 框架"
if [ -x "$SKILL_DIR/node_modules/.bin/opencli" ]; then
    OPENCLI_VERSION=$("$SKILL_DIR/node_modules/.bin/opencli" --version 2>&1 || echo "unknown")
    echo "   ✓ opencli 已安装 ($OPENCLI_VERSION)"
else
    echo "   ✗ opencli 未安装。运行: npm install --prefix $SKILL_DIR @jackwener/opencli"
    ERRORS=$((ERRORS+1))
fi

# 4. liepin_mcp.py 是否存在
echo ""
echo "4️⃣  猎聘 CLI"
if [ -f "$SKILL_DIR/skills/liepin/liepin_mcp.py" ]; then
    SIZE=$(wc -c < "$SKILL_DIR/skills/liepin/liepin_mcp.py")
    echo "   ✓ liepin_mcp.py 存在 ($SIZE bytes)"
else
    echo "   ✗ liepin_mcp.py 缺失"
    ERRORS=$((ERRORS+1))
fi

# 5. 适配器是否可加载
echo ""
echo "5️⃣  适配器加载"
if python3 -c "import sys; sys.path.insert(0, '$SKILL_DIR/scripts'); from adapters import ADAPTERS; print('   ✓ 加载成功，共', len(ADAPTERS), '个平台:', ', '.join(ADAPTERS.keys()))" 2>&1; then
    :
else
    echo "   ✗ 适配器加载失败"
    ERRORS=$((ERRORS+1))
fi

# 6. SKILL.md 是否存在
echo ""
echo "6️⃣  SKILL.md"
if [ -f "$SKILL_DIR/SKILL.md" ]; then
    LINES=$(wc -l < "$SKILL_DIR/SKILL.md")
    echo "   ✓ SKILL.md 存在 ($LINES 行)"
else
    echo "   ✗ SKILL.md 缺失"
    ERRORS=$((ERRORS+1))
fi

# 7. 平台状态（不实际搜索）
echo ""
echo "7️⃣  平台状态（不实际调用 API）"
if [ -x "$SKILL_DIR/node_modules/.bin/opencli" ]; then
    echo "   opencli 支持的招聘平台："
    "$SKILL_DIR/node_modules/.bin/opencli" list 2>&1 | grep -B 1 -A 1 -E "^  (boss|linkedin|maimai|indeed|51job) " | grep "^  " | head -20
fi

# 8. 总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ 全部检查通过！可以开始使用。"
    echo ""
    echo "下一步："
    echo "  1. 配置猎聘 token（可选）：python3 skills/liepin/liepin_mcp.py setup"
    echo "  2. 安装 Chrome + opencli Browser Bridge（boss/linkedin/maimai 必需）"
    echo "  3. 运行 platforms 查看状态：python3 scripts/unified_search.py platforms"
else
    echo "⚠️  发现 $ERRORS 个问题，请先修复后再使用。"
fi