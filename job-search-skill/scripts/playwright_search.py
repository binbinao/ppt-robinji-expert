#!/usr/bin/env python3
"""
Playwright 直接执行搜索 - async 版本

优势：
- 不需要 Chrome 扩展 / opencli Browser Bridge
- 直接通过 Playwright 启动 Chromium
- 自动处理 JS 渲染、WAF
- 输出统一 JobPosting 格式
"""

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path
from typing import List

# 把 scripts 加入 path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PWTimeout

from adapters import JobPosting, SearchResult

VERSION = "1.0.0"


# ============= 各平台搜索函数 =============

async def search_indeed(page: Page, query: str, location: str = "", limit: int = 10) -> SearchResult:
    """Indeed 公开搜索"""
    try:
        params = {"q": query, "limit": str(limit)}
        if location:
            params["l"] = location
        url = "https://www.indeed.com/jobs?" + "&".join(f"{k}={v}" for k, v in params.items())
        
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        # 等待 job 卡片
        try:
            await page.wait_for_selector("[data-jk]", timeout=10000)
        except PWTimeout:
            return SearchResult(platform="indeed", success=True, jobs=[], total=0)
        
        jobs_data = await page.evaluate("""
            () => {
                const cards = document.querySelectorAll('[data-jk]');
                return Array.from(cards).map(card => {
                    const titleEl = card.querySelector('h2.jobTitle a, a.jcs-JobTitle');
                    const companyEl = card.querySelector('[data-testid="company-name"], .companyName');
                    const locationEl = card.querySelector('[data-testid="job-location"], .companyLocation');
                    const salaryEl = card.querySelector('[data-testid="attribute_snippet_testid"], .salary-snippet');
                    const snippetEl = card.querySelector('[data-testid="job-snippet"], .job-snippet');
                    const jk = card.getAttribute('data-jk');
                    return {
                        job_id: jk,
                        title: titleEl ? titleEl.textContent.trim() : '',
                        url: titleEl ? titleEl.href : `https://www.indeed.com/viewjob?jk=${jk}`,
                        company: companyEl ? companyEl.textContent.trim() : '',
                        location: locationEl ? locationEl.textContent.trim() : '',
                        salary: salaryEl ? salaryEl.textContent.trim() : '',
                        description: snippetEl ? snippetEl.textContent.trim() : '',
                    };
                }).filter(j => j.title);
            }
        """)
        
        jobs = [
            JobPosting(
                platform="indeed",
                job_id=item.get("job_id", ""),
                title=item.get("title", ""),
                company=item.get("company", ""),
                location=item.get("location", ""),
                salary=item.get("salary", ""),
                description=item.get("description", "")[:500],
                url=item.get("url", ""),
                raw=item,
            )
            for item in jobs_data[:limit]
        ]
        return SearchResult(platform="indeed", success=True, jobs=jobs, total=len(jobs))
    
    except Exception as e:
        return SearchResult(platform="indeed", success=False, error=f"{type(e).__name__}: {e}")


async def search_51job(page: Page, query: str, location: str = "", limit: int = 10) -> SearchResult:
    """51job 公开搜索"""
    try:
        url = f"https://www.51job.com/?keyword={query}"
        if location:
            url += f"&area={location}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        # 51job 经常弹登录/搜索确认页，先尝试跳过
        await asyncio.sleep(2)
        try:
            await page.wait_for_selector(".j_joblist .e, .el .e, [class*='job-item'], .list_item", timeout=8000)
        except PWTimeout:
            return SearchResult(platform="51job", success=True, jobs=[], total=0)
        
        jobs_data = await page.evaluate("""
            () => {
                const cards = document.querySelectorAll('.j_joblist .e, .el .e, [class*="list_item"], div[class*="job-item"]');
                return Array.from(cards).slice(0, 20).map(card => {
                    const linkEl = card.querySelector('a[href*="jobs.51job.com"]') || card.querySelector('a');
                    const titleEl = card.querySelector('.jname, [class*="job_name"], .t1');
                    const companyEl = card.querySelector('.cname, [class*="company_name"], .t2');
                    const locationEl = card.querySelector('.jcity, [class*="location"], .t3');
                    const salaryEl = card.querySelector('.sal, [class*="salary"], .t4');
                    
                    return {
                        job_id: linkEl?.href?.match(/(\\d+)\\.html/)?.[1] || '',
                        title: titleEl ? titleEl.textContent.trim() : '',
                        url: linkEl ? linkEl.href : '',
                        company: companyEl ? companyEl.textContent.trim() : '',
                        location: locationEl ? locationEl.textContent.trim() : '',
                        salary: salaryEl ? salaryEl.textContent.trim() : '',
                    };
                }).filter(j => j.title);
            }
        """)
        
        jobs = [
            JobPosting(
                platform="51job",
                job_id=str(item.get("job_id", "")),
                title=item.get("title", ""),
                company=item.get("company", ""),
                location=item.get("location", ""),
                salary=item.get("salary", ""),
                url=item.get("url", ""),
                raw=item,
            )
            for item in jobs_data[:limit]
        ]
        return SearchResult(platform="51job", success=True, jobs=jobs, total=len(jobs))
    
    except Exception as e:
        return SearchResult(platform="51job", success=False, error=f"{type(e).__name__}: {e}")


async def search_lagou(page: Page, query: str, location: str = "北京", limit: int = 10) -> SearchResult:
    """拉勾公开搜索 - 处理 WAF"""
    try:
        url = f"https://www.lagou.com/wn/jobs?kd={query}&city={location}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)
        
        content = await page.content()
        if "captcha" in page.url or "滑动验证" in content[:5000] or "aliyun" in content[:5000].lower():
            return SearchResult(
                platform="lagou",
                success=False,
                error="拉勾触发 WAF（阿里云滑动验证），需要登录态",
            )
        
        # 先尝试 API 调用
        try:
            api_data = await page.evaluate(f"""
                (async () => {{
                    const params = new URLSearchParams();
                    params.set('kd', {json.dumps(query)});
                    params.set('city', {json.dumps(location)});
                    params.set('pageNo', '1');
                    params.set('pageSize', '{limit}');
                    try {{
                        const resp = await fetch('/wn/jobs/positionAjax.json?' + params.toString(), {{
                            method: 'POST',
                            headers: {{
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'X-Requested-With': 'XMLHttpRequest',
                                'Referer': 'https://www.lagou.com/wn/jobs'
                            }},
                            body: params.toString()
                        }});
                        if (!resp.ok) return {{error: 'HTTP ' + resp.status}};
                        return await resp.json();
                    }} catch (e) {{
                        return {{error: String(e)}};
                    }}
                }})()
            """)
            
            if api_data and api_data.get("success"):
                results = api_data.get("content", {}).get("positionResult", {}).get("result", [])
                jobs = [
                    JobPosting(
                        platform="lagou",
                        job_id=str(j.get("positionId", "")),
                        title=j.get("positionName", ""),
                        company=j.get("companyFullName", ""),
                        location=j.get("city", ""),
                        salary=j.get("salary", ""),
                        experience=j.get("workYear", ""),
                        education=j.get("education", ""),
                        url=f"https://www.lagou.com/wn/jobs/{j.get('positionId','')}.html",
                        raw=j,
                    )
                    for j in results
                ]
                return SearchResult(platform="lagou", success=True, jobs=jobs, total=len(jobs))
            elif api_data and api_data.get("error"):
                return SearchResult(platform="lagou", success=False, error=f"API: {api_data['error']}")
        except Exception as e:
            pass
        
        # 备选：尝试 DOM 解析
        try:
            await page.wait_for_selector(".item__10RTO, .position-item, [class*='position-list'] li", timeout=5000)
            jobs_data = await page.evaluate("""
                () => {
                    const cards = document.querySelectorAll('.item__10RTO, .position-item, [class*="position-list"] li');
                    return Array.from(cards).map(card => {
                        const linkEl = card.querySelector('a[href*="/jobs/"]');
                        const titleEl = card.querySelector('.p-top__1F7CL a, .position-title');
                        const companyEl = card.querySelector('.company-name__2-SjF, .company-name');
                        const salaryEl = card.querySelector('.money__3Lkgq, .salary');
                        return {
                            job_id: linkEl?.href?.match(/\\/jobs\\/(\\d+)/)?.[1] || '',
                            title: titleEl ? titleEl.textContent.trim() : '',
                            url: linkEl?.href || '',
                            company: companyEl ? companyEl.textContent.trim() : '',
                            salary: salaryEl ? salaryEl.textContent.trim() : '',
                        };
                    }).filter(j => j.title);
                }
            """)
            
            jobs = [
                JobPosting(
                    platform="lagou",
                    job_id=item.get("job_id", ""),
                    title=item.get("title", ""),
                    company=item.get("company", ""),
                    salary=item.get("salary", ""),
                    url=item.get("url", ""),
                    raw=item,
                )
                for item in jobs_data[:limit]
            ]
            return SearchResult(platform="lagou", success=True, jobs=jobs, total=len(jobs))
        except PWTimeout:
            return SearchResult(platform="lagou", success=True, jobs=[], total=0)
    
    except Exception as e:
        return SearchResult(platform="lagou", success=False, error=f"{type(e).__name__}: {e}")


async def search_boss(page: Page, query: str, location: str = "北京", limit: int = 10) -> SearchResult:
    """Boss直聘公开搜索"""
    try:
        url = f"https://www.zhipin.com/web/geek/job?query={query}&city={location}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)
        
        # Boss 经常需要登录，先检测
        content = await page.content()
        if "登录" in content[:3000] and "立即登录" in content[:5000]:
            return SearchResult(
                platform="boss",
                success=False,
                error="Boss直聘需要登录态才能查看职位列表",
            )
        
        try:
            await page.wait_for_selector(".job-card-wrapper, .job-list li", timeout=8000)
        except PWTimeout:
            return SearchResult(platform="boss", success=True, jobs=[], total=0)
        
        jobs_data = await page.evaluate("""
            () => {
                const cards = document.querySelectorAll('.job-card-wrapper, .job-list li, [class*="job-card"]');
                return Array.from(cards).map(card => {
                    const titleEl = card.querySelector('.job-name, .job-title');
                    const companyEl = card.querySelector('.company-name, .name');
                    const salaryEl = card.querySelector('.salary, .red');
                    const linkEl = card.querySelector('a');
                    return {
                        title: titleEl ? titleEl.textContent.trim() : '',
                        company: companyEl ? companyEl.textContent.trim() : '',
                        salary: salaryEl ? salaryEl.textContent.trim() : '',
                        url: linkEl ? linkEl.href : '',
                    };
                }).filter(j => j.title);
            }
        """)
        
        if not jobs_data:
            return SearchResult(platform="boss", success=False, error="Boss直聘反爬限制")
        
        jobs = [
            JobPosting(
                platform="boss",
                job_id=item.get("url", "").split("/")[-1] if item.get("url") else "",
                title=item.get("title", ""),
                company=item.get("company", ""),
                salary=item.get("salary", ""),
                url=item.get("url", ""),
                raw=item,
            )
            for item in jobs_data[:limit]
        ]
        return SearchResult(platform="boss", success=True, jobs=jobs, total=len(jobs))
    
    except Exception as e:
        return SearchResult(platform="boss", success=False, error=f"{type(e).__name__}: {e}")


async def search_linkedin(page: Page, query: str, location: str = "", limit: int = 10) -> SearchResult:
    """LinkedIn 公开搜索"""
    try:
        url = f"https://www.linkedin.com/jobs/search/?keywords={query.replace(' ', '+')}"
        if location:
            url += f"&location={location.replace(' ', '+')}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)
        
        if "authwall" in page.url or "login" in page.url:
            return SearchResult(
                platform="linkedin",
                success=False,
                error="LinkedIn 重定向到登录页（公开搜索受限）",
            )
        
        try:
            await page.wait_for_selector(".base-card, .job-search-card", timeout=8000)
        except PWTimeout:
            return SearchResult(platform="linkedin", success=True, jobs=[], total=0)
        
        jobs_data = await page.evaluate("""
            () => {
                const cards = document.querySelectorAll('.base-card, .job-search-card');
                return Array.from(cards).slice(0, 20).map(card => {
                    const titleEl = card.querySelector('.base-search-card__title, h3');
                    const companyEl = card.querySelector('.base-search-card__subtitle, h4');
                    const locationEl = card.querySelector('.job-search-card__location');
                    const linkEl = card.querySelector('a[href*="/jobs/"]');
                    const url = linkEl ? linkEl.href : '';
                    // LinkedIn ID: URL 末尾数字
                    const idMatch = url.match(/view\\/[\\w-]+-(\\d+)/);
                    return {
                        job_id: idMatch ? idMatch[1] : '',
                        title: titleEl ? titleEl.textContent.trim() : '',
                        url: url,
                        company: companyEl ? companyEl.textContent.trim() : '',
                        location: locationEl ? locationEl.textContent.trim() : '',
                    };
                }).filter(j => j.title);
            }
        """)

        jobs = [
            JobPosting(
                platform="linkedin",
                job_id=item.get("job_id", ""),
                title=item.get("title", ""),
                company=item.get("company", ""),
                location=item.get("location", ""),
                url=item.get("url", ""),
                raw=item,
            )
            for item in jobs_data[:limit]
        ]
        return SearchResult(platform="linkedin", success=True, jobs=jobs, total=len(jobs))
    
    except Exception as e:
        return SearchResult(platform="linkedin", success=False, error=f"{type(e).__name__}: {e}")


# ============= 平台注册 =============
PLATFORM_SEARCHERS = {
    "indeed": search_indeed,
    "51job": search_51job,
    "lagou": search_lagou,
    "boss": search_boss,
    "linkedin": search_linkedin,
}


async def search_all(query: str, location: str = "", platforms: List[str] = None, limit: int = 10):
    """跨平台并发搜索"""
    if not platforms:
        platforms = list(PLATFORM_SEARCHERS.keys())
    
    print(f"🔍 搜索: '{query}'" + (f" @ {location}" if location else ""))
    print(f"🌐 平台: {', '.join(platforms)}")
    print(f"📊 每平台 limit: {limit}\n")
    
    start = time.time()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )
        
        # 为每个平台创建独立 context
        tasks = []
        for plat in platforms:
            if plat not in PLATFORM_SEARCHERS:
                print(f"  ⊘ {plat}: 跳过（不支持）")
                continue
            search_fn = PLATFORM_SEARCHERS[plat]
            
            async def run_search(plat=plat, search_fn=search_fn):
                ctx = await browser.new_context(
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    viewport={"width": 1280, "height": 800},
                    locale="zh-CN",
                    timezone_id="Asia/Shanghai",
                )
                page = await ctx.new_page()
                try:
                    result = await search_fn(page, query, location, limit)
                    return plat, result
                finally:
                    await page.close()
                    await ctx.close()
            
            tasks.append(run_search())
        
        # 并发执行
        results_list = await asyncio.gather(*tasks, return_exceptions=True)
        await browser.close()
    
    elapsed = time.time() - start
    
    results = {}
    for item in results_list:
        if isinstance(item, Exception):
            print(f"  ✗ 异常: {item}")
            continue
        plat, result = item
        results[plat] = result
        status = "✓" if result.success else "✗"
        print(f"  {status} {plat}: {len(result.jobs) if result.success else 0} 个职位 ({time.time()-start:.1f}s)")
    
    print(f"\n⏱️  总耗时: {elapsed:.2f}s")
    return results, elapsed


def format_results_table(results: dict, query: str, location: str):
    """格式化输出结果"""
    print("\n" + "=" * 100)
    print(f"📋 搜索结果: '{query}'" + (f" @ {location}" if location else ""))
    print("=" * 100)
    
    total_jobs = 0
    success_platforms = 0
    
    PLAT_NAMES = {"boss": "Boss直聘", "linkedin": "LinkedIn", "lagou": "拉勾", "indeed": "Indeed", "51job": "前程无忧"}
    
    for plat, result in results.items():
        name = PLAT_NAMES.get(plat, plat)
        
        print(f"\n━━━ {name} ({plat}) ━━━")
        
        if not result.success:
            print(f"  ✗ {result.error or '搜索失败'}")
            continue
        
        success_platforms += 1
        total_jobs += len(result.jobs)
        
        if not result.jobs:
            print("  (无结果)")
            continue
        
        for i, job in enumerate(result.jobs[:10], 1):
            salary = f" | 💰 {job.salary}" if job.salary else ""
            loc = f" | 📍 {job.location}" if job.location else ""
            print(f"  {i}. {job.title} @ {job.company}{loc}{salary}")
            if job.url:
                print(f"     {job.url}")
    
    print("\n" + "=" * 100)
    print(f"📊 汇总: {success_platforms}/{len(results)} 平台成功，共 {total_jobs} 个职位")
    print("=" * 100)
    
    return total_jobs, success_platforms


async def main_async():
    parser = argparse.ArgumentParser(
        prog="playwright_search",
        description="Playwright 直接执行招聘搜索（无需 opencli Browser Bridge）",
    )
    parser.add_argument("query", help="搜索关键词")
    parser.add_argument("--location", "-l", default="", help="城市")
    parser.add_argument("--platforms", "-p", default="", help="逗号分隔的平台")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--format", "-f", choices=["table", "json"], default="table")
    parser.add_argument("--export", help="导出 JSON 到指定路径")
    
    args = parser.parse_args()
    
    platforms = [p.strip() for p in args.platforms.split(",") if p.strip()] if args.platforms else None
    
    results, elapsed = await search_all(args.query, args.location, platforms, args.limit)
    
    if args.format == "json":
        output = {
            "query": args.query,
            "location": args.location,
            "elapsed_s": round(elapsed, 2),
            "results": {p: r.to_dict() for p, r in results.items()},
            "all_jobs": [j.to_dict() for r in results.values() for j in r.jobs],
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
    else:
        format_results_table(results, args.query, args.location)
    
    if args.export:
        output = {
            "query": args.query,
            "location": args.location,
            "results": {p: r.to_dict() for p, r in results.items()},
            "all_jobs": [j.to_dict() for r in results.values() for j in r.jobs],
        }
        with open(args.export, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"\n✓ 已导出到 {args.export}")


def main():
    asyncio.run(main_async())


if __name__ == "__main__":
    main()