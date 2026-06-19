#!/bin/bash
# 统一职位搜索 — 便捷包装脚本
# 自动使用本项目内的 opencli / Python 解释器

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# 把 opencli 加入 PATH
export PATH="$SKILL_DIR/node_modules/.bin:$PATH"

# 优先使用本项目 node_modules 中的 opencli
if [ -x "$SKILL_DIR/node_modules/.bin/opencli" ]; then
    export OPENCLI_BIN="$SKILL_DIR/node_modules/.bin/opencli"
fi

# 优先使用本项目中的猎聘脚本
if [ -f "$SKILL_DIR/skills/liepin/liepin_mcp.py" ]; then
    export LIEPIN_SCRIPT="$SKILL_DIR/skills/liepin/liepin_mcp.py"
fi

exec python3 "$SCRIPT_DIR/unified_search.py" "$@"