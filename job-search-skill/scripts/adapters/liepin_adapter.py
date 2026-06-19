"""
猎聘 (Liepin) 适配器 - 基于猎聘官方 MCP Server

使用 TerminalSkills/liepin-jobs 提供的 liepin_mcp.py 脚本。
猎聘官方 MCP 文档：https://www.liepin.com/mcp/server
"""

import json
import os
import subprocess
from pathlib import Path
from typing import Optional, List

from .base import BaseAdapter, JobPosting, SearchResult


# 默认脚本路径
DEFAULT_SCRIPT = Path(__file__).resolve().parents[2] / "skills" / "liepin" / "liepin_mcp.py"


def _resolve_script_path() -> Path:
    """解析 liepin_mcp.py 路径"""
    env_path = os.environ.get("LIEPIN_SCRIPT")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    if DEFAULT_SCRIPT.exists():
        return DEFAULT_SCRIPT
    # 最后备选：脚本可能没装
    raise FileNotFoundError(
        f"liepin_mcp.py not found. Expected at {DEFAULT_SCRIPT}. "
        f"Run: curl -o <skill_dir>/liepin/liepin_mcp.py "
        f"https://raw.githubusercontent.com/TerminalSkills/skills/main/skills/liepin-jobs/liepin_mcp.py"
    )


def run_liepin(args: List[str], timeout: int = 30) -> tuple[int, str, str]:
    """执行 liepin_mcp.py 命令"""
    script = _resolve_script_path()
    try:
        proc = subprocess.run(
            ["python3", str(script), *args],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "timeout"
    except FileNotFoundError as e:
        return -1, "", str(e)


class LiepinAdapter(BaseAdapter):
    """猎聘适配器 - 基于官方 MCP"""
    
    platform_name = "liepin"
    requires_auth = True
    auth_help = (
        "猎聘需要 2 个 token：\n"
        "1. 访问 https://www.liepin.com/mcp/server 并登录\n"
        "2. 复制 Gateway Token (mcp_gateway_token_xxx)\n"
        "3. 复制 User Token (liepin_user_token_xxx)\n"
        "4. 运行: python3 liepin_mcp.py setup\n"
        "或者设置环境变量：\n"
        "  export LIEPIN_GATEWAY_TOKEN=...\n"
        "  export LIEPIN_USER_TOKEN=...\n"
        "Token 有效期 90 天，到期需重新获取。"
    )
    
    def is_available(self) -> bool:
        """检查脚本存在 + token 是否已配置"""
        try:
            _resolve_script_path()
        except FileNotFoundError:
            return False
        
        # 检查 token 是否在环境变量中
        if os.environ.get("LIEPIN_GATEWAY_TOKEN") and os.environ.get("LIEPIN_USER_TOKEN"):
            return True
        
        # 尝试调用 list-tools（如果认证 OK 会返回成功）
        code, stdout, _ = run_liepin(["list-tools"], timeout=15)
        if code == 0:
            return True
        
        # 否则提示需要 setup
        return False
    
    def search_jobs(
        self,
        query: str,
        location: str = "",
        limit: int = 20,
        **kwargs,
    ) -> SearchResult:
        """
        猎聘搜索职位
        
        支持的 kwargs:
            salary: 薪资范围字符串 (如 "30-50k")
            education: 学历要求
            experience: 经验要求
            companyType: 公司类型
            companyName: 公司名称
        """
        args = ["search-job", "--jobName", query]
        if location:
            args.extend(["--address", location])
        if limit:
            args.extend(["--pageSize", str(limit)])
        
        for k, v in kwargs.items():
            if v is not None:
                args.extend([f"--{k}", str(v)])
        
        args.append("--json")
        
        code, stdout, stderr = run_liepin(args, timeout=60)
        if code != 0:
            return SearchResult(
                platform="liepin",
                success=False,
                error=stderr.strip() or f"liepin exited with code {code}",
            )
        
        try:
            data = json.loads(stdout)
        except json.JSONDecodeError as e:
            return SearchResult(
                platform="liepin",
                success=False,
                error=f"JSON parse error: {e}",
            )
        
        jobs = [self._parse_job(item) for item in self._extract_items(data)]
        jobs = [j for j in jobs if j is not None]
        
        return SearchResult(
            platform="liepin",
            success=True,
            jobs=jobs,
            total=len(jobs),
        )
    
    def _extract_items(self, data) -> list:
        """从猎聘 JSON 提取职位列表"""
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            # 猎聘 MCP 常见的几个字段名
            for key in ("data", "items", "results", "list", "jobCardList", "jobList"):
                v = data.get(key)
                if isinstance(v, list):
                    return v
            # 有时整个 dict 就是一个职位
            if data.get("jobId") or data.get("jobName"):
                return [data]
        return []
    
    def _parse_job(self, item: dict) -> Optional[JobPosting]:
        if not isinstance(item, dict):
            return None
        # 猎聘字段映射（不同接口可能字段名略有不同）
        job_id = str(
            item.get("jobId") or item.get("job_id") or item.get("id") or ""
        )
        title = item.get("jobName") or item.get("jobTitle") or item.get("title") or ""
        company = item.get("companyName") or item.get("company") or item.get("compName") or ""
        location = item.get("city") or item.get("workCity") or item.get("cityName") or item.get("address") or ""
        salary = item.get("salary") or item.get("salaryDesc") or item.get("salaryRange") or ""
        
        # 拼接描述字段
        desc_parts = []
        for key in ("jobDesc", "description", "descriptionText", "require"):
            if item.get(key):
                desc_parts.append(str(item[key]))
        description = "\n".join(desc_parts)
        
        return JobPosting(
            platform="liepin",
            job_id=job_id,
            title=title,
            company=company,
            location=location,
            salary=salary,
            description=description,
            url=item.get("jobUrl") or item.get("url") or item.get("link") or 
                f"https://www.liepin.com/job/{job_id}.shtml",
            experience=item.get("experience") or item.get("workExp") or "",
            education=item.get("education") or item.get("eduLevel") or "",
            job_kind=item.get("jobKind") or item.get("kind"),  # 投递时需要
            posted_at=item.get("publishTime") or item.get("updateTime") or "",
            raw=item,
        )
    
    def get_job_detail(self, job_id: str) -> Optional[JobPosting]:
        """获取猎聘职位详情"""
        code, stdout, _ = run_liepin([
            "get-job-detail", "--jobId", job_id, "--json"
        ])
        if code != 0:
            return None
        try:
            data = json.loads(stdout)
        except json.JSONDecodeError:
            return None
        job = self._parse_job(data)
        return job
    
    def apply_job(self, job_id: str, job_kind: str = "", **kwargs) -> dict:
        """
        投递猎聘职位
        
        Args:
            job_id: 职位 ID
            job_kind: 职位投递类型（必传，可从搜索结果获取）
        """
        if not job_kind:
            return {
                "success": False,
                "error": "需要 job_kind 参数（从搜索结果中获取）",
            }
        
        code, stdout, stderr = run_liepin([
            "apply-job", "--jobId", job_id, "--jobKind", job_kind, "--json"
        ])
        if code != 0:
            return {"success": False, "error": stderr.strip()}
        try:
            return json.loads(stdout)
        except json.JSONDecodeError:
            return {"success": code == 0, "raw": stdout}