"""
适配器基类 - 定义统一的职位搜索接口

所有平台适配器都必须实现以下接口，确保上层可以统一调用。
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any
import json


@dataclass
class JobPosting:
    """统一的职位数据结构 - 跨平台聚合的标准格式"""
    # 基本信息
    platform: str               # 来源平台: liepin/boss/linkedin/maimai/indeed/51job
    job_id: str                 # 平台内唯一 ID
    title: str                  # 职位名称
    company: str = ""           # 公司
    location: str = ""          # 工作地点
    salary: str = ""            # 薪资范围
    
    # 详细描述
    description: str = ""       # 职位描述
    requirements: str = ""      # 任职要求
    experience: str = ""        # 经验要求
    education: str = ""         # 学历要求
    
    # 元数据
    url: str = ""               # 职位详情 URL
    posted_at: str = ""         # 发布时间
    applicants: int = 0         # 申请人数（如果有）
    
    # 求职侧专用（猎聘/Boss 支持）
    job_kind: Optional[str] = None      # 职位投递类型
    can_apply: bool = True              # 是否可投递
    match_score: Optional[float] = None # 与简历匹配度（如果计算过）
    
    # 原始数据，便于排查
    raw: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if k != "raw" or v}
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)


@dataclass
class Candidate:
    """统一的候选人数据结构 - 主要用于脉脉/LinkedIn 人脉搜索"""
    platform: str               # 来源平台
    user_id: str                # 用户 ID
    name: str
    current_title: str = ""     # 当前职位
    current_company: str = ""   # 当前公司
    location: str = ""
    education: str = ""
    school: str = ""
    experience_years: str = ""  # 工作年限
    skills: List[str] = field(default_factory=list)
    
    url: str = ""
    is_contactable: bool = False  # 是否可直聊
    mutual_connections: int = 0
    
    raw: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if k != "raw" or v}
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)


@dataclass
class SearchResult:
    """统一的搜索结果"""
    platform: str
    success: bool
    jobs: List[JobPosting] = field(default_factory=list)
    candidates: List[Candidate] = field(default_factory=list)
    total: int = 0
    error: Optional[str] = None
    duration_ms: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "platform": self.platform,
            "success": self.success,
            "total": self.total,
            "error": self.error,
            "duration_ms": self.duration_ms,
            "jobs": [j.to_dict() for j in self.jobs],
            "candidates": [c.to_dict() for c in self.candidates],
        }


class BaseAdapter(ABC):
    """所有平台适配器的基类"""
    
    platform_name: str = "unknown"
    requires_auth: bool = True
    auth_help: str = ""
    
    @abstractmethod
    def search_jobs(
        self,
        query: str,
        location: str = "",
        limit: int = 20,
        **kwargs,
    ) -> SearchResult:
        """
        搜索职位。
        
        Args:
            query: 搜索关键词（职位名/技能）
            location: 工作地点
            limit: 返回数量
            **kwargs: 平台特定参数（如薪资、经验等）
        
        Returns:
            SearchResult 对象
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """检查此适配器是否可用（依赖/认证是否就绪）"""
        pass
    
    def get_job_detail(self, job_id: str) -> Optional[JobPosting]:
        """获取职位详情（部分平台支持，可选实现）"""
        return None
    
    def apply_job(self, job_id: str, **kwargs) -> Dict[str, Any]:
        """投递职位（部分平台支持，可选实现）"""
        return {"success": False, "error": "此平台不支持程序化投递"}
    
    def search_candidates(
        self,
        query: str,
        limit: int = 20,
        **kwargs,
    ) -> SearchResult:
        """搜索候选人（仅脉脉/LinkedIn 等支持）"""
        return SearchResult(
            platform=self.platform_name,
            success=False,
            error=f"{self.platform_name} 不支持候选人搜索",
        )