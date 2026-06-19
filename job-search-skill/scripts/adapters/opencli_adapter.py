"""
opencli 通用适配器 - 处理所有基于 opencli 框架的平台
（boss、linkedin、maimai、indeed、51job 等）
"""

import json
import os
import subprocess
from pathlib import Path
from typing import Optional, List

from .base import BaseAdapter, JobPosting, Candidate, SearchResult


# opencli 命令的 node_modules/.bin 路径（相对于项目根目录）
def _resolve_opencli_path() -> str:
    """自动寻找 opencli 可执行文件"""
    # 优先使用环境变量
    env_path = os.environ.get("OPENCLI_BIN")
    if env_path and Path(env_path).exists():
        return env_path
    
    # 备选：本项目 node_modules
    candidates = [
        "./node_modules/.bin/opencli",
        "./job-search-skill/node_modules/.bin/opencli",
        os.path.expanduser("~/.npm-global/bin/opencli"),
        "/usr/local/bin/opencli",
        "opencli",  # 走 PATH
    ]
    for c in candidates:
        if c == "opencli" or Path(c).exists():
            return c
    return "opencli"


OPENCLI_BIN = _resolve_opencli_path()


def run_opencli(args: List[str], timeout: int = 60) -> tuple[int, str, str]:
    """执行 opencli 命令并返回 (exit_code, stdout, stderr)"""
    try:
        proc = subprocess.run(
            [OPENCLI_BIN, *args],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "timeout"
    except FileNotFoundError:
        return -1, "", f"opencli not found at {OPENCLI_BIN}"


class OpenCLIAdapter(BaseAdapter):
    """
    opencli 平台的通用适配器基类
    
    子类只需要定义 platform_name 和实现 _run_search。
    """
    
    platform_name: str = "opencli"
    requires_auth: bool = True
    auth_help: str = "需要 Chrome 中登录目标平台，然后通过 Cookie-Editor 导出 cookies"
    
    def search_jobs(
        self,
        query: str,
        location: str = "",
        limit: int = 20,
        **kwargs,
    ) -> SearchResult:
        """调用 opencli 命令搜索"""
        args = self._build_search_args(query, location, limit, **kwargs)
        return self._run_search(args, "jobs")
    
    def _build_search_args(self, query, location, limit, **kwargs) -> List[str]:
        """子类重写：构造 opencli 子命令参数"""
        raise NotImplementedError
    
    def _run_search(self, args: List[str], result_type: str) -> SearchResult:
        """执行搜索并解析结果"""
        args = [*args, "-f", "json", "--limit", str(20)]
        code, stdout, stderr = run_opencli(args)

        if code != 0:
            friendly = self._format_opencli_error(stdout, stderr, code)
            return SearchResult(
                platform=self.platform_name,
                success=False,
                error=friendly,
            )

        try:
            data = json.loads(stdout)
        except json.JSONDecodeError as e:
            return SearchResult(
                platform=self.platform_name,
                success=False,
                error=f"JSON parse error: {e}; output: {stdout[:200]}",
            )
        
        if result_type == "jobs":
            jobs = [self._parse_job(item) for item in self._extract_items(data)]
            jobs = [j for j in jobs if j is not None]
            return SearchResult(
                platform=self.platform_name,
                success=True,
                jobs=jobs,
                total=len(jobs),
            )
        else:
            candidates = [self._parse_candidate(item) for item in self._extract_items(data)]
            candidates = [c for c in candidates if c is not None]
            return SearchResult(
                platform=self.platform_name,
                success=True,
                candidates=candidates,
                total=len(candidates),
            )
    
    def _extract_items(self, data) -> list:
        """从 opencli JSON 输出提取列表数据（默认假设 list）"""
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for key in ("data", "items", "results", "jobs", "list"):
                if key in data and isinstance(data[key], list):
                    return data[key]
        return []
    
    def _format_opencli_error(self, stdout: str, stderr: str, code: int) -> str:
        """把 opencli 的 JSON/YAML 错误输出格式化成可读消息

        opencli 失败时的输出可能：
        - stdout: 空 / JSON {"ok": false, ...}
        - stderr: YAML 格式错误（含 help 提示）
        """
        # 合并所有可能的输出，优先尝试解析为结构化数据
        for source in [stdout, stderr]:
            if not source or not source.strip():
                continue
            err_data = self._try_parse_structured(source.strip())
            if err_data is None:
                continue
            if isinstance(err_data, dict) and err_data.get("ok") is False:
                return self._format_structured_error(err_data, code)
            # 有时 opencli 把 JSON 整个写在 stderr，但 ok 字段可能在不同位置
            if isinstance(err_data, dict) and "error" in err_data:
                # 直接包含 error 字段
                return self._format_structured_error({"ok": False, "error": err_data["error"]}, code)

        # 都解析不出来 — 返回更友好的回退消息
        if stderr.strip():
            # 截断过长的错误
            err = stderr.strip()
            if len(err) > 300:
                err = err[:300] + "..."
            return f"opencli 错误 (exit={code}): {err}"
        return f"opencli 退出码 {code}"

    @staticmethod
    def _try_parse_structured(text: str):
        """尝试把字符串解析为 JSON 或 YAML"""
        # 先 JSON
        try:
            return json.loads(text)
        except (json.JSONDecodeError, ValueError):
            pass
        # 再 YAML
        try:
            import yaml
            return yaml.safe_load(text)
        except ImportError:
            return None
        except Exception:
            return None

    @staticmethod
    def _format_structured_error(err_data: dict, code: int) -> str:
        """格式化已解析的错误字典"""
        err = err_data.get("error", {})
        if isinstance(err, dict):
            msg = err.get("message", "")
            help_text = err.get("help", "")
            code_str = err.get("code", "")
            # help_text 可能是 string 或 list
            if isinstance(help_text, list):
                help_text = " ".join(str(x) for x in help_text)
            help_clean = str(help_text).replace(chr(10), " ").strip() if help_text else ""
            prefix = f"[{code_str}] " if code_str else ""
            if help_clean:
                return f"{prefix}{msg} | 帮助: {help_clean}"
            return f"{prefix}{msg}" if prefix else msg
        return str(err) if err else f"opencli 错误 code={code}"
    
    def _parse_job(self, item: dict) -> Optional[JobPosting]:
        """子类重写：从原始数据解析 JobPosting"""
        raise NotImplementedError
    
    def _parse_candidate(self, item: dict) -> Optional[Candidate]:
        return None
    
    def is_available(self) -> bool:
        """检查 opencli 是否安装且能列出此平台"""
        code, stdout, _ = run_opencli(["list"])
        if code != 0:
            return False
        return self.platform_name in stdout.lower()


# ============= Boss直聘适配器 =============
class BossAdapter(OpenCLIAdapter):
    platform_name = "boss"
    auth_help = (
        "Boss直聘需要登录态。在 Chrome 中登录 https://www.zhipin.com 后，"
        "安装 Cookie-Editor 扩展，导出 cookies 为 JSON，"
        "再通过 `opencli boss ...` 配置 cookie"
    )
    
    def _build_search_args(self, query, location, limit, **kwargs) -> List[str]:
        args = ["boss", "search", query or ""]
        if location:
            args.extend(["--city", location])
        for k, v in kwargs.items():
            if v is not None:
                args.extend([f"--{k}", str(v)])
        return args
    
    def _parse_job(self, item: dict) -> Optional[JobPosting]:
        if not isinstance(item, dict):
            return None
        return JobPosting(
            platform="boss",
            job_id=str(item.get("jobId") or item.get("job_id") or item.get("encryptId") or ""),
            title=item.get("jobName") or item.get("title") or item.get("job_title") or "",
            company=item.get("brandName") or item.get("company") or item.get("companyName") or "",
            location=item.get("cityName") or item.get("city") or item.get("location") or "",
            salary=item.get("salaryDesc") or item.get("salary") or "",
            description=item.get("jobDesc") or item.get("description") or "",
            experience=item.get("experienceName") or "",
            education=item.get("degreeName") or "",
            url=item.get("url") or item.get("jobUrl") or f"https://www.zhipin.com/job_detail/{item.get('jobId','')}.html",
            raw=item,
        )


# ============= LinkedIn 适配器 =============
class LinkedInAdapter(OpenCLIAdapter):
    platform_name = "linkedin"
    auth_help = (
        "LinkedIn 需要登录态。在 Chrome 中登录 https://www.linkedin.com 后，"
        "通过 Cookie-Editor 导出 li_at 和 JSESSIONID 等 cookies，配置到 opencli"
    )
    
    def _build_search_args(self, query, location, limit, **kwargs) -> List[str]:
        args = ["linkedin", "search", query]
        if location:
            args.extend(["--location", location])
        for k, v in kwargs.items():
            if v is not None:
                # opencli 风格的参数名转换（如 jobType → --job-type）
                cli_arg = "--" + k.replace("_", "-")
                args.extend([cli_arg, str(v)])
        return args
    
    def _parse_job(self, item: dict) -> Optional[JobPosting]:
        if not isinstance(item, dict):
            return None
        return JobPosting(
            platform="linkedin",
            job_id=str(item.get("id") or item.get("job_id") or item.get("entityUrn", "")[-10:]),
            title=item.get("title") or item.get("jobTitle") or "",
            company=(item.get("company") or {}).get("name") if isinstance(item.get("company"), dict) else (item.get("companyName") or item.get("company") or ""),
            location=item.get("location") or item.get("formattedLocation") or "",
            salary=item.get("salary") or "",
            description=item.get("description") or item.get("descriptionText") or "",
            url=item.get("link") or item.get("jobUrl") or f"https://www.linkedin.com/jobs/view/{item.get('id','')}",
            posted_at=item.get("postedAt") or item.get("listedAt") or "",
            applicants=item.get("applicants") or 0,
            raw=item,
        )


# ============= 脉脉适配器 =============
class MaimaiAdapter(OpenCLIAdapter):
    platform_name = "maimai"
    auth_help = (
        "脉脉需要登录态。在 Chrome 中登录 https://maimai.cn 后，"
        "通过 Cookie-Editor 导出 cookies 配置到 opencli"
    )

    def search_jobs(self, query, location="", limit=20, **kwargs):
        # 脉脉主要用于搜索人才，没有传统职位列表
        # 这里返回空结果 + 提示用户使用 search_candidates
        return SearchResult(
            platform="maimai",
            success=False,
            error="脉脉主要用于候选人搜索（人才库），请使用 candidates 子命令",
        )

    def _build_search_args(self, query, location, limit, **kwargs) -> List[str]:
        args = ["maimai", "search-talents", query]
        for k, v in kwargs.items():
            if v is not None:
                cli_arg = "--" + k.replace("_", "-")
                args.extend([cli_arg, str(v)])
        return args

    def search_candidates(self, query: str, limit: int = 20, **kwargs) -> SearchResult:
        """搜索候选人 - 脉脉核心功能"""
        # search-talents 用 --size 而不是 --limit
        # 直接构造参数，绕过 _build_search_args 的 --limit 重复
        args = ["maimai", "search-talents", query, "--size", str(limit)]
        for k, v in kwargs.items():
            if v is not None:
                cli_arg = "--" + k.replace("_", "-")
                args.extend([cli_arg, str(v)])
        # _run_search 会再追加 --limit，我们用特殊路径直接调用
        # 为了避免重复，手动调用 opencli
        from .opencli_adapter import run_opencli
        import json
        code, stdout, stderr = run_opencli(args)
        if code != 0:
            friendly = self._format_opencli_error(stdout, stderr, code)
            return SearchResult(
                platform=self.platform_name,
                success=False,
                error=friendly,
            )
        try:
            data = json.loads(stdout)
        except json.JSONDecodeError as e:
            return SearchResult(
                platform=self.platform_name,
                success=False,
                error=f"JSON parse error: {e}",
            )
        candidates = [self._parse_candidate(item) for item in self._extract_items(data)]
        candidates = [c for c in candidates if c is not None]
        return SearchResult(
            platform=self.platform_name,
            success=True,
            candidates=candidates,
            total=len(candidates),
        )

    def _parse_candidate(self, item: dict) -> Optional[Candidate]:
        if not isinstance(item, dict):
            return None
        return Candidate(
            platform="maimai",
            user_id=str(item.get("uid") or item.get("id") or ""),
            name=item.get("name") or "",
            current_title=item.get("position") or item.get("title") or "",
            current_company=item.get("company") or "",
            location=item.get("city") or item.get("location") or "",
            education=item.get("degree") or "",
            school=item.get("school") or "",
            experience_years=item.get("worktime") or "",
            skills=item.get("skills") or [],
            url=item.get("url") or f"https://maimai.cn/profile/{item.get('uid','')}",
            raw=item,
        )


# ============= Indeed 适配器 =============
class IndeedAdapter(OpenCLIAdapter):
    platform_name = "indeed"
    auth_help = "Indeed 公开搜索不需要登录"
    
    def _build_search_args(self, query, location, limit, **kwargs) -> List[str]:
        args = ["indeed", "search", query]
        if location:
            args.extend(["--location", location])
        for k, v in kwargs.items():
            if v is not None:
                args.extend([f"--{k.replace('_', '-')}", str(v)])
        return args
    
    def _parse_job(self, item: dict) -> Optional[JobPosting]:
        if not isinstance(item, dict):
            return None
        return JobPosting(
            platform="indeed",
            job_id=str(item.get("jk") or item.get("id") or ""),
            title=item.get("title") or "",
            company=item.get("company") or item.get("companyName") or "",
            location=item.get("location") or item.get("formattedLocation") or "",
            salary=item.get("salary") or item.get("salarySnippet") or "",
            description=item.get("description") or item.get("snippet") or "",
            url=item.get("url") or f"https://www.indeed.com/viewjob?jk={item.get('jk','')}",
            posted_at=item.get("datePosted") or "",
            raw=item,
        )


# ============= 51job 适配器 =============
class Job51Adapter(OpenCLIAdapter):
    platform_name = "51job"
    auth_help = "51job 部分高级功能需要登录态"
    
    def _build_search_args(self, query, location, limit, **kwargs) -> List[str]:
        # 51job hot 命令支持按城市浏览；detail 需要 jobId
        # 这里用 hot 浏览指定城市
        args = ["51job", "hot"]
        if location:
            args.extend(["--city", location])
        return args
    
    def _parse_job(self, item: dict) -> Optional[JobPosting]:
        if not isinstance(item, dict):
            return None
        return JobPosting(
            platform="51job",
            job_id=str(item.get("jobId") or item.get("id") or ""),
            title=item.get("jobName") or item.get("title") or "",
            company=item.get("companyName") or item.get("company") or "",
            location=item.get("city") or item.get("workCity") or "",
            salary=item.get("salary") or item.get("salaryText") or "",
            description=item.get("description") or item.get("jobDesc") or "",
            url=item.get("url") or f"https://jobs.51job.com/{item.get('jobId','')}.html",
            raw=item,
        )