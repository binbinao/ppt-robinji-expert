#!/bin/bash

# opencli-maimai 一键安装脚本
# 用法：./scripts/install.sh

set -e

echo "🚀 开始安装 opencli-maimai..."

# 检查 opencli 是否已安装
if ! command -v opencli &> /dev/null; then
    echo "❌ 未检测到 opencli，正在安装..."
    npm install -g @jackwener/opencli
fi

# 检查 Playwright MCP 是否已配置
if ! claude mcp list 2>/dev/null | grep -q playwright; then
    echo "⚠️  未检测到 Playwright MCP 配置"
    echo "💡 请运行以下命令："
    echo "   claude mcp add playwright --scope user -- npx @playwright/mcp@latest"
fi

# 创建目录
echo "📁 创建配置目录..."
mkdir -p ~/.opencli/clis/maimai

# 复制配置文件
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📋 复制配置文件..."
cp "$PROJECT_DIR/maimai/search-talents.yaml" ~/.opencli/clis/maimai/

# 验证安装
echo "✅ 验证安装..."
if opencli maimai search-talents --help &> /dev/null; then
    echo "🎉 安装成功！"
    echo ""
    echo "使用方法:"
    echo "  opencli maimai search-talents --query \"关键词\""
    echo ""
    echo "请确保："
    echo "  1. Chrome 浏览器已打开"
    echo "  2. 已登录脉脉账号 (maimai.cn)"
    echo "  3. Playwright MCP Bridge 扩展已安装"
else
    echo "⚠️  安装完成，但未通过验证"
    echo "   请手动运行：opencli maimai search-talents --help"
fi
