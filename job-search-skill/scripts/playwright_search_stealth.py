#!/usr/bin/env python3
"""
Playwright 增强版搜索 - 反检测 stealth 模式

关键改进：
- 注入 stealth.js 反指纹
- 模拟真实浏览器 navigator 属性
- 处理 Cloudflare / DataDome 反爬
- 添加人类行为延迟
"""

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path
from typing import List

sys.path.insert(0, str(Path(__file__).resolve().parent))

from playwright.async_api import async_playwright

from adapters import JobPosting, SearchResult


# 注入的 stealth 脚本 - 隐藏自动化痕迹
STEALTH_JS = """
// 隐藏 webdriver 标识
Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
});

// 伪造 plugins
Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5],
});

// 伪造 languages
Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en', 'zh-CN', 'zh'],
});

// 伪造 chrome 对象
window.chrome = {
    runtime: {},
    loadTimes: function() {},
    csi: function() {},
    app: {},
};

// 伪造 permissions
const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications' ?
    Promise.resolve({ state: Notification.permission }) :
    originalQuery(parameters)
);

// 隐藏 headless 特征
Object.defineProperty(navigator, 'platform', {
    get: () => 'MacIntel',
});
"""


async def setup_stealth_page(ctx, locale="en-US"):
    """创建带 stealth 注入的页面"""
    page = await ctx.new_page()
    await page.add_init_script(STEALTH_JS)
    return page


async def search_indeed_stealth(ctx, query: str, location: str = "", limit: int = 10):
    """Indeed stealth 搜索"""
    page = await setup_stealth_page(ctx, locale="en-US")
    try:
        # 先访问首页获取 cookies
        await page.goto("https://www.indeed.com/", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)
        
        # 滚动一下模拟真人
        await page.evaluate("window.scrollTo(0, 200)")
        await asyncio.sleep(1)
        
        # 搜索
        params = {"q": query, "limit": str(limit)}
        if location:
            params["l"] = location
        url = "https://www.indeed.com/jobs?" + "&".join(f"{k}={v}" for k, v in params.items())
        
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)
        
        # 检查是否被 Cloudflare 拦截
        content = await page.content()
        if "Cloudflare" in content[:3000] or "Checking your browser" in content[:5000]:
            return SearchResult(
                platform="indeed",
                success=False,
                error="Indeed Cloudflare 反爬拦截（headless 模式被检测）",
            )
        
        # 检查是否有 CAPTCHA
        if any(s in content.lower() for s in ["captcha", "are you human", "verify you are"]):
            return SearchResult(
                platform="indeed",
                success=False,
                error="Indeed 触发 CAPTCHA 验证",
            )
        
        # 等待 job 卡片
        try:
            await page.wait_for_selector("[data-jk], .job_seen_beacon, .result", timeout=10000)
        except Exception:
            return SearchResult(platform="indeed", success=True, jobs=[], total=0)
        
        jobs_data = await page.evaluate("""
            () => {
                // Indeed 多种选择器兼容
                const cards = document.querySelectorAll('[data-jk], .job_seen_beacon, .result');
                return Array.from(cards).map(card => {
                    const jk = card.getAttribute('data-jk') || card.querySelector('[data-jk]')?.getAttribute('data-jk') || '';
                    const titleEl = card.querySelector('h2.jobTitle a, a.jcs-JobTitle, .jobTitle a') 
                                || card.querySelector('[data-testid="title"]');
                    const companyEl = card.querySelector('[data-testid="company-name"], .companyName, .company');
                    const locationEl = card.querySelector('[data-testid="job-location"], .companyLocation');
                    const salaryEl = card.querySelector('[data-testid="attribute_snippet_testid"], .salary-snippet');
                    const snippetEl = card.querySelector('[data-testid="job-snippet"], .job-snippet');
                    
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
    finally:
        await page.close()


async def search_lagou_stealth(ctx, query: str, location: str = "北京", limit: int = 10):
    """拉勾 stealth 搜索 - 多种策略"""
    page = await setup_stealth_page(ctx, locale="zh-CN")
    try:
        # 策略 1: 直接搜索页
        url = f"https://www.lagou.com/wn/jobs?kd={query}&city={location}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)
        
        # 滚动模拟真人
        await page.evaluate("window.scrollTo(0, 300)")
        await asyncio.sleep(2)
        
        content = await page.content()
        if "captcha" in page.url or "滑动验证" in content[:5000] or "aliyun" in content[:5000].lower():
            # 策略 2: 尝试拉勾网 (lagou.com vs www.lagou.com)
            try:
                await page.goto(f"https://www.lagou.com/jobs/list_{query}?city={location}", 
                                wait_until="domcontentloaded", timeout=20000)
                await asyncio.sleep(3)
            except Exception:
                pass
        
        # 尝试 API 调用
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
            return SearchResult(platform="lagou", success=False, error=f"API 调用失败: {e}")
        
        return SearchResult(platform="lagou", success=True, jobs=[], total=0)
    
    except Exception as e:
        return SearchResult(platform="lagou", success=False, error=f"{type(e).__name__}: {e}")
    finally:
        await page.close()


async def search_boss_stealth(ctx, query: str, location: str = "北京", limit: int = 10):
    """Boss直聘 stealth 搜索"""
    page = await setup_stealth_page(ctx, locale="zh-CN")
    try:
        url = f"https://www.zhipin.com/web/geek/job?query={query}&city={location}"
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(3)
        await page.evaluate("window.scrollTo(0, 200)")
        await asyncio.sleep(2)
        
        content = await page.content()
        # Boss 经常弹出登录引导，先尝试关闭
        if "立即登录" in content[:5000]:
            # 尝试不登录能看多少
            try:
                await page.click(".close-icon, .dialog-close", timeout=2000)
                await asyncio.sleep(1)
            except Exception:
                pass
        
        try:
            await page.wait_for_selector(".job-card-wrapper, .job-list li, [class*='job-card']", timeout=10000)
        except Exception:
            return SearchResult(platform="boss", success=False, error="Boss直聘需要登录态")
        
        jobs_data = await page.evaluate("""
            () => {
                const cards = document.querySelectorAll('.job-card-wrapper, .job-list li, [class*="job-card"]');
                return Array.from(cards).map(card => {
                    const titleEl = card.querySelector('.job-name, .job-title');
                    const companyEl = card.querySelector('.company-name, .name');
                    const salaryEl = card.querySelector('.salary, .red');
                    const linkEl = card.querySelector('a');
                    const experienceEl = card.querySelector('.job-info .tag-list li, .job-info-primary li');
                    
                    return {
                        title: titleEl ? titleEl.textContent.trim() : '',
                        company: companyEl ? companyEl.textContent.trim() : '',
                        salary: salaryEl ? salaryEl.textContent.trim() : '',
                        url: linkEl ? linkEl.href : '',
                        experience: experienceEl ? experienceEl.textContent.trim() : '',
                    };
                }).filter(j => j.title);
            }
        """)
        
        if not jobs_data:
            return SearchResult(platform="boss", success=False, error="Boss 反爬限制")
        
        jobs = [
            JobPosting(
                platform="boss",
                job_id=item.get("url", "").split("/")[-1] if item.get("url") else "",
                title=item.get("title", ""),
                company=item.get("company", ""),
                salary=item.get("salary", ""),
                experience=item.get("experience", ""),
                url=item.get("url", ""),
                raw=item,
            )
            for item in jobs_data[:limit]
        ]
        return SearchResult(platform="boss", success=True, jobs=jobs, total=len(jobs))
    
    except Exception as e:
        return SearchResult(platform="boss", success=False, error=f"{type(e).__name__}: {e}")
    finally:
        await page.close()


PLATFORMS = {
    "indeed": search_indeed_stealth,
    "lagou": search_lagou_stealth,
    "boss": search_boss_stealth,
}


async def main_async():
    parser = argparse.ArgumentParser(description="Stealth 模式跨平台搜索")
    parser.add_argument("query")
    parser.add_argument("--location", "-l", default="")
    parser.add_argument("--platforms", "-p", default="indeed,lagou,boss")
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--format", "-f", choices=["table", "json"], default="table")
    parser.add_argument("--export")
    args = parser.parse_args()
    
    platforms = [p.strip() for p in args.platforms.split(",") if p.strip()]
    
    print(f"🔍 Stealth 搜索: '{args.query}'" + (f" @ {args.location}" if args.location else ""))
    print(f"🌐 平台: {', '.join(platforms)}\n")
    
    start = time.time()
    all_results = {}
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-features=IsolateOrigins,site-per-process",
                "--no-sandbox",
            ],
        )
        
        ctx = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York",
            color_scheme="light",
        )
        
        # 添加 stealth headers
        await ctx.set_extra_http_headers({
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        })
        
        try:
            for plat in platforms:
                if plat not in PLATFORMS:
                    print(f"  ⊘ {plat}: 不支持")
                    continue
                print(f"  → {plat}: 搜索中...", end=" ", flush=True)
                try:
                    result = await PLATFORMS[plat](ctx, args.query, args.location, args.limit)
                    all_results[plat] = result
                    status = "✓" if result.success else "✗"
                    count = len(result.jobs) if result.success else 0
                    print(f"{status} {count} 个职位")
                except Exception as e:
                    print(f"✗ 异常: {e}")
                    all_results[plat] = SearchResult(platform=plat, success=False, error=str(e))
        finally:
            await ctx.close()
            await browser.close()
    
    elapsed = time.time() - start
    
    # 输出
    PLAT_NAMES = {"boss": "Boss直聘", "lagou": "拉勾", "indeed": "Indeed"}
    
    if args.format == "json":
        output = {
            "query": args.query,
            "location": args.location,
            "elapsed_s": round(elapsed, 2),
            "results": {p: r.to_dict() for p, r in all_results.items()},
            "all_jobs": [j.to_dict() for r in all_results.values() for j in r.jobs],
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
    else:
        print(f"\n{'='*100}")
        print(f"📋 搜索结果: '{args.query}'" + (f" @ {args.location}" if args.location else ""))
        print(f"{'='*100}")
        
        total_jobs = 0
        for plat, result in all_results.items():
            name = PLAT_NAMES.get(plat, plat)
            print(f"\n━━━ {name} ({plat}) ━━━")
            if not result.success:
                print(f"  ✗ {result.error}")
                continue
            total_jobs += len(result.jobs)
            if not result.jobs:
                print("  (无结果)")
                continue
            for i, job in enumerate(result.jobs[:args.limit], 1):
                salary = f" | 💰 {job.salary}" if job.salary else ""
                loc = f" | 📍 {job.location}" if job.location else ""
                print(f"  {i}. {job.title} @ {job.company}{loc}{salary}")
                if job.url:
                    print(f"     {job.url}")
        
        print(f"\n{'='*100}")
        print(f"📊 总计: {total_jobs} 个职位 (耗时 {elapsed:.1f}s)")
        print(f"{'='*100}")
    
    if args.export:
        output = {
            "query": args.query,
            "location": args.location,
            "results": {p: r.to_dict() for p, r in all_results.items()},
            "all_jobs": [j.to_dict() for r in all_results.values() for j in r.jobs],
        }
        with open(args.export, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"\n✓ 已导出到 {args.export}")


def main():
    asyncio.run(main_async())


if __name__ == "__main__":
    main()