#!/usr/bin/env python3
"""
统一职位搜索 - 跨平台聚合入口

特性：
- 一条命令搜索多个平台（猎聘/Boss/LinkedIn/脉脉/Indeed/51job）
- 自动识别平台可用性，跳过未配置的
- 返回标准 JSON / Markdown / 表格输出
- 支持候选人搜索（脉脉/LinkedIn）

用法：
    # 多平台搜索职位
    python3 unified_search.py search "AI产品经理" --location "上海" --platforms liepin,boss,linkedin

    # 搜索候选人
    python3 unified_search.py candidates "Java工程师" --platforms maimai,linkedin

    # 查看已配置平台
    python3 unified_search.py platforms

    # 仅猎聘投递
    python3 unified_search.py apply liepin --job-id 123 --job-kind 1

    # 输出 JSON（机器可读）
    python3 unified_search.py search "前端" --platforms boss --format json
"""

import argparse
import asyncio
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import List, Dict, Any

# 把 scripts 加入 path，便于导入 adapters
sys.path.insert(0, str(Path(__file__).resolve().parent))

from adapters import ADAPTERS, PLATFORM_META, SearchResult, JobPosting  # noqa: E402


VERSION = "1.0.0"


def get_adapter(platform: str):
    """获取平台适配器实例"""
    cls = ADAPTERS.get(platform.lower())
    if not cls:
        raise ValueError(f"Unknown platform: {platform}. Available: {list(ADAPTERS.keys())}")
    return cls()


def cmd_platforms(args):
    """列出所有支持平台 + 当前可用状态"""
    rows = []
    for name, meta in PLATFORM_META.items():
        try:
            adapter = get_adapter(name)
            available = adapter.is_available()
            err = ""
        except Exception as e:
            available = False
            err = str(e)
        
        rows.append({
            "platform": name,
            "name_zh": meta["name_zh"],
            "region": meta["region"],
            "type": meta["type"],
            "auth": meta["auth"],
            "available": available,
            "note": err if not available else "OK",
        })
    
    if args.format == "json":
        print(json.dumps(rows, ensure_ascii=False, indent=2))
    else:
        print(f"\n{'平台':<10} {'中文名':<12} {'区域':<8} {'类型':<14} {'认证':<12} {'可用':<6} {'备注'}")
        print("-" * 100)
        for r in rows:
            avail_mark = "✓" if r["available"] else "✗"
            note = r["note"][:30] + "..." if len(r["note"]) > 30 else r["note"]
            print(f"{r['platform']:<10} {r['name_zh']:<12} {r['region']:<8} {r['type']:<14} {r['auth']:<12} {avail_mark:<6} {note}")
        
        # 统计
        ok = sum(1 for r in rows if r["available"])
        print(f"\n共 {len(rows)} 个平台，{ok} 个可用")
        if ok < len(rows):
            print("\n未配置平台的认证帮助：")
            for r in rows:
                if not r["available"]:
                    try:
                        adapter = get_adapter(r["platform"])
                    except Exception:
                        continue
                    name_zh = r["name_zh"]
                    plat = r["platform"]
                    print(f"\n  [{name_zh} ({plat})]")
                    for line in adapter.auth_help.split("\n"):
                        print(f"    {line}")


def cmd_search(args):
    """统一搜索职位"""
    platforms = [p.strip() for p in args.platforms.split(",") if p.strip()]
    if not platforms:
        platforms = list(ADAPTERS.keys())
    
    query = args.query
    location = args.location or ""
    limit = args.limit
    
    print(f"🔍 搜索职位: '{query}'")
    if location:
        print(f"📍 地点: {location}")
    print(f"🌐 平台: {', '.join(platforms)}\n")
    
    # 并发搜索所有平台
    results: Dict[str, SearchResult] = {}
    start = time.time()
    
    with ThreadPoolExecutor(max_workers=min(len(platforms), 6)) as executor:
        future_to_platform = {}
        for p in platforms:
            try:
                adapter = get_adapter(p)
            except Exception as e:
                results[p] = SearchResult(platform=p, success=False, error=str(e))
                continue
            
            if not adapter.is_available():
                results[p] = SearchResult(
                    platform=p, success=False,
                    error=f"平台 {p} 未配置或不可用",
                )
                continue
            
            future = executor.submit(
                adapter.search_jobs, query, location, limit,
            )
            future_to_platform[future] = p
        
        for future in as_completed(future_to_platform):
            p = future_to_platform[future]
            try:
                results[p] = future.result()
            except Exception as e:
                results[p] = SearchResult(platform=p, success=False, error=f"exception: {e}")
    
    elapsed = time.time() - start
    
    # 输出结果
    if args.format == "json":
        out = {
            "query": query,
            "location": location,
            "platforms": platforms,
            "elapsed_s": round(elapsed, 2),
            "results": {p: r.to_dict() for p, r in results.items()},
            "all_jobs": [
                j.to_dict() for r in results.values() for j in r.jobs
            ],
        }
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        # Markdown / 表格输出
        total_jobs = sum(len(r.jobs) for r in results.values())
        print(f"⏱️  耗时 {elapsed:.2f}s，共找到 {total_jobs} 个职位\n")
        
        for p in platforms:
            r = results.get(p)
            if not r:
                continue
            meta = PLATFORM_META.get(p, {})
            print(f"━━━ {meta.get('name_zh', p)} ({p}) ━━━")
            if not r.success:
                print(f"  ✗ {r.error or '搜索失败'}\n")
                continue
            if not r.jobs:
                print("  (无结果)\n")
                continue
            for i, job in enumerate(r.jobs[:args.display], 1):
                salary = f" | 💰 {job.salary}" if job.salary else ""
                loc = f" | 📍 {job.location}" if job.location else ""
                print(f"  {i}. {job.title} @ {job.company}{loc}{salary}")
                if job.url:
                    print(f"     {job.url}")
            if len(r.jobs) > args.display:
                print(f"  ... 共 {len(r.jobs)} 条，仅显示前 {args.display}")
            print()


def cmd_candidates(args):
    """搜索候选人（脉脉/LinkedIn）"""
    platforms = [p.strip() for p in args.platforms.split(",") if p.strip()]
    # 默认候选人平台
    if not platforms:
        platforms = ["maimai", "linkedin"]
    
    query = args.query
    print(f"👥 搜索候选人: '{query}'")
    print(f"🌐 平台: {', '.join(platforms)}\n")
    
    results: Dict[str, SearchResult] = {}
    
    for p in platforms:
        try:
            adapter = get_adapter(p)
        except Exception as e:
            results[p] = SearchResult(platform=p, success=False, error=str(e))
            continue
        
        if not adapter.is_available():
            results[p] = SearchResult(
                platform=p, success=False,
                error=f"平台 {p} 未配置",
            )
            continue
        
        try:
            results[p] = adapter.search_candidates(query, args.limit)
        except Exception as e:
            results[p] = SearchResult(platform=p, success=False, error=f"exception: {e}")
    
    # 输出
    if args.format == "json":
        out = {
            "query": query,
            "results": {p: r.to_dict() for p, r in results.items()},
        }
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        for p in platforms:
            r = results.get(p)
            if not r:
                continue
            meta = PLATFORM_META.get(p, {})
            print(f"━━━ {meta.get('name_zh', p)} ({p}) ━━━")
            if not r.success:
                print(f"  ✗ {r.error or '搜索失败'}\n")
                continue
            if not r.candidates:
                print("  (无结果)\n")
                continue
            for i, c in enumerate(r.candidates[:args.display], 1):
                title = f"{c.current_title} @ {c.current_company}" if c.current_title or c.current_company else ""
                print(f"  {i}. {c.name} — {title}")
                if c.school:
                    print(f"     🎓 {c.school} ({c.education})")
                if c.experience_years:
                    print(f"     💼 {c.experience_years} 年经验")
                if c.skills:
                    print(f"     🛠  {', '.join(c.skills[:5])}")
                if c.url:
                    print(f"     {c.url}")
            print()


def cmd_apply(args):
    """投递职位（仅猎聘/Boss 支持）"""
    adapter = get_adapter(args.platform)
    if not adapter.is_available():
        print(f"✗ {args.platform} 不可用：{adapter.auth_help}")
        return 1
    
    result = adapter.apply_job(args.job_id, job_kind=args.job_kind)
    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        if result.get("success"):
            print(f"✓ 投递成功")
        else:
            print(f"✗ 投递失败：{result.get('error', 'unknown')}")
    return 0 if result.get("success") else 1


def main():
    parser = argparse.ArgumentParser(
        prog="unified_search",
        description="统一职位搜索 — 跨平台聚合 LinkedIn/脉脉/猎聘/Boss直聘/Indeed/51job",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s search "AI产品经理" --location "上海"
  %(prog)s search "前端工程师" --platforms liepin,boss --format json
  %(prog)s candidates "Java" --platforms maimai
  %(prog)s platforms
  %(prog)s apply liepin --job-id 123456 --job-kind 1
        """,
    )
    parser.add_argument("--version", action="version", version=f"unified_search {VERSION}")
    
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    def add_common(p):
        """公共参数：--format"""
        p.add_argument("--format", "-f", choices=["table", "md", "json"], default="table",
                      help="输出格式（默认 table）")
    
    # platforms
    p_platforms = subparsers.add_parser("platforms", help="列出所有支持的平台")
    add_common(p_platforms)
    p_platforms.set_defaults(func=cmd_platforms)
    
    # search
    p_search = subparsers.add_parser("search", help="搜索职位")
    add_common(p_search)
    p_search.add_argument("query", help="搜索关键词")
    p_search.add_argument("--location", "-l", default="", help="工作地点")
    p_search.add_argument("--platforms", "-p", default="", help="逗号分隔的平台列表，留空 = 全部")
    p_search.add_argument("--limit", type=int, default=20, help="每个平台最多返回数量")
    p_search.add_argument("--display", type=int, default=10, help="每个平台最多显示数量")
    p_search.set_defaults(func=cmd_search)
    
    # candidates
    p_cand = subparsers.add_parser("candidates", help="搜索候选人（脉脉/LinkedIn）")
    add_common(p_cand)
    p_cand.add_argument("query", help="搜索关键词")
    p_cand.add_argument("--platforms", "-p", default="", help="逗号分隔的平台列表")
    p_cand.add_argument("--limit", type=int, default=20)
    p_cand.add_argument("--display", type=int, default=10)
    p_cand.set_defaults(func=cmd_candidates)
    
    # apply
    p_apply = subparsers.add_parser("apply", help="投递职位")
    add_common(p_apply)
    p_apply.add_argument("platform", choices=["liepin", "boss"], help="投递平台")
    p_apply.add_argument("--job-id", required=True, help="职位 ID")
    p_apply.add_argument("--job-kind", default="", help="职位投递类型（猎聘必传）")
    p_apply.set_defaults(func=cmd_apply)
    
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()