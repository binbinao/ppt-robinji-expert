"""所有平台适配器"""

from .base import BaseAdapter, JobPosting, Candidate, SearchResult
from .opencli_adapter import (
    OpenCLIAdapter,
    BossAdapter,
    LinkedInAdapter,
    MaimaiAdapter,
    IndeedAdapter,
    Job51Adapter,
)
from .liepin_adapter import LiepinAdapter
from .lagou_adapter import LagouAdapter

# 平台注册表 - 包含所有可用的适配器
ADAPTERS = {
    "boss": BossAdapter,
    "linkedin": LinkedInAdapter,
    "maimai": MaimaiAdapter,
    "indeed": IndeedAdapter,
    "51job": Job51Adapter,
    "liepin": LiepinAdapter,
    "lagou": LagouAdapter,
}

# 平台元数据 - 用于 UI/文档展示
PLATFORM_META = {
    "boss":     {"region": "CN", "type": "jobs",    "auth": "cookie", "free": False, "name_zh": "Boss直聘"},
    "linkedin": {"region": "global", "type": "jobs+people", "auth": "cookie", "free": False, "name_zh": "LinkedIn"},
    "maimai":   {"region": "CN", "type": "people",  "auth": "cookie", "free": False, "name_zh": "脉脉"},
    "indeed":   {"region": "global", "type": "jobs",  "auth": "cookie", "free": True,  "name_zh": "Indeed"},
    "51job":    {"region": "CN", "type": "jobs",    "auth": "cookie", "free": False, "name_zh": "前程无忧"},
    "liepin":   {"region": "CN", "type": "jobs",    "auth": "mcp_token", "free": False, "name_zh": "猎聘"},
    "lagou":    {"region": "CN", "type": "jobs",    "auth": "cookie", "free": False, "name_zh": "拉勾"},
}

__all__ = [
    "ADAPTERS",
    "PLATFORM_META",
    "BaseAdapter",
    "JobPosting",
    "Candidate",
    "SearchResult",
    "BossAdapter",
    "LinkedInAdapter",
    "MaimaiAdapter",
    "IndeedAdapter",
    "Job51Adapter",
    "LiepinAdapter",
    "LagouAdapter",
]