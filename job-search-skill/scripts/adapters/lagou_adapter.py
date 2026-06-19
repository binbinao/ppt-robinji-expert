"""
拉勾 (Lagou) 适配器 - 通过 opencli-plugin-lagou 调用

依赖：opencli + opencli-plugin-lagou 插件
地址：https://github.com/your-org/opencli-plugin-lagou
"""

import json
import os
import subprocess
from pathlib import Path
from typing import Optional, List

from .base import BaseAdapter, JobPosting, SearchResult


# 默认 opencli 路径（与 opencli_adapter.py 一致）
def _resolve_opencli_path() -> str:
    """自动寻找 opencli 可执行文件"""
    env_path = os.environ.get("OPENCLI_BIN")
    if env_path and Path(env_path).exists():
        return env_path

    candidates = [
        "./node_modules/.bin/opencli",
        "./job-search-skill/node_modules/.bin/opencli",
        os.path.expanduser("~/.npm-global/bin/opencli"),
        "/usr/local/bin/opencli",
        "opencli",
    ]
    for c in candidates:
        if c == "opencli" or Path(c).exists():
            return c
    return "opencli"


OPENCLI_BIN = _resolve_opencli_path()


def run_opencli(args: List[str], timeout: int = 60) -> tuple[int, str, str]:
    """执行 opencli 命令"""
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


class LagouAdapter(BaseAdapter):
    """
    拉勾适配器 - 基于 opencli-plugin-lagou

    提供 3 个能力：
    - search_jobs: 职位搜索
    - get_job_detail: 职位详情
    - search_companies / get_company_info: 公司信息
    """

    platform_name = "lagou"
    requires_auth = True
    auth_help = (
        "拉勾需要 Chrome 中已登录态：\n"
        "1. 安装 opencli Browser Bridge 扩展\n"
        "2. Chrome 中打开 https://www.lagou.com 完成登录\n"
        "3. 保持 Chrome 打开，运行 opencli doctor 验证\n"
        "拉勾有强 WAF 防护，必须通过浏览器自动化访问"
    )

    def is_available(self) -> bool:
        """检查 opencli-plugin-lagou 是否安装"""
        code, stdout, _ = run_opencli(["list"])
        if code != 0:
            return False
        return "lagou" in stdout.lower()

    def search_jobs(
        self,
        query: str,
        location: str = "",
        limit: int = 20,
        **kwargs,
    ) -> SearchResult:
        """搜索拉勾职位"""
        args = ["lagou", "search", query]
        if location:
            args.extend(["--city", location])

        # 支持的 kwargs（与拉勾插件参数对应）
        for k in ["salary", "experience", "education", "jobType"]:
            if k in kwargs and kwargs[k]:
                args.extend([f"--{k}", str(kwargs[k])])

        # limit 拉勾每页最多 15
        args.extend(["--limit", str(min(int(limit), 15))])

        # 输出 JSON 便于解析
        args.extend(["-f", "json"])

        code, stdout, stderr = run_opencli(args, timeout=120)
        if code != 0:
            friendly = self._format_error(stdout, stderr, code)
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
                error=f"JSON parse error: {e}; raw: {stdout[:200]}",
            )

        items = self._extract_items(data)
        jobs = [self._parse_job(item) for item in items]
        jobs = [j for j in jobs if j is not None]

        return SearchResult(
            platform=self.platform_name,
            success=True,
            jobs=jobs,
            total=len(jobs),
        )

    def _extract_items(self, data) -> list:
        """从 opencli 输出提取职位列表"""
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for key in ("data", "items", "results", "rows"):
                if key in data and isinstance(data[key], list):
                    return data[key]
        return []

    def _parse_job(self, item: dict) -> Optional[JobPosting]:
        """解析拉勾职位数据"""
        if not isinstance(item, dict):
            return None
        return JobPosting(
            platform="lagou",
            job_id=str(item.get("positionId") or item.get("job_id") or ""),
            title=item.get("positionName") or item.get("title") or "",
            company=item.get("companyFullName") or item.get("companyShortName") or item.get("company") or "",
            location=item.get("city") or item.get("location") or "",
            salary=item.get("salary") or "",
            experience=item.get("workYear") or item.get("experience") or "",
            education=item.get("education") or "",
            description=item.get("positionAdvantage") or "",
            url=item.get("detailUrl") or item.get("url") or 
                f"https://www.lagou.com/wn/jobs/{item.get('positionId','')}.html",
            posted_at=item.get("createTime") or "",
            raw=item,
        )

    def get_job_detail(self, job_id: str) -> Optional[JobPosting]:
        """获取拉勾职位详情"""
        code, stdout, stderr = run_opencli(
            ["lagou", "detail", "--positionId", str(job_id), "-f", "json"],
            timeout=120,
        )
        if code != 0:
            return None

        try:
            data = json.loads(stdout)
        except json.JSONDecodeError:
            return None

        items = self._extract_items(data)
        if not items:
            return None
        return self._parse_job(items[0])

    def get_company_info(self, company_id: str, with_jobs: bool = False) -> Optional[dict]:
        """获取公司信息"""
        args = ["lagou", "company", "--companyId", str(company_id)]
        if with_jobs:
            args.extend(["--withJobs", "true"])
        args.extend(["-f", "json"])

        code, stdout, stderr = run_opencli(args, timeout=120)
        if code != 0:
            return None
        try:
            data = json.loads(stdout)
        except json.JSONDecodeError:
            return None
        items = self._extract_items(data)
        return items[0] if items else None

    def _format_error(self, stdout: str, stderr: str, code: int) -> str:
        """格式化错误信息（与 opencli_adapter 一致）"""
        for source in [stdout, stderr]:
            if not source or not source.strip():
                continue
            err_data = None
            try:
                err_data = json.loads(source)
            except (json.JSONDecodeError, ValueError):
                try:
                    import yaml
                    err_data = yaml.safe_load(source)
                except Exception:
                    pass
            if isinstance(err_data, dict) and err_data.get("ok") is False:
                err = err_data.get("error", {})
                if isinstance(err, dict):
                    return err.get("message", "") or f"lagou 错误 code={code}"
                return str(err)
        if stderr.strip():
            return stderr.strip()[:300]
        return f"lagou 退出码 {code}"