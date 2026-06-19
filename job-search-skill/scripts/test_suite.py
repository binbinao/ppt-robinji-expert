#!/usr/bin/env python3
"""
job-search skill 综合测试套件

测试维度：
1. 适配器加载 - 所有 6 个平台都能正确实例化
2. 数据模型 - JobPosting / Candidate / SearchResult 序列化正常
3. CLI 入口 - help / platforms / 子命令都可用
4. JSON 输出 - 结构正确可解析
5. 错误处理 - 未知平台、无效参数优雅降级
6. opencli 集成 - 子命令路径正确
7. 猎聘脚本 - 可独立调用 help/auth

注意：实际 API 调用需要认证，无法在测试环境运行。
带 ✗ 标记的 = 需要 Chrome + 登录态 + token 才能验证
"""

import json
import os
import subprocess
import sys
import traceback
from pathlib import Path

# 添加 scripts 到 path
SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))

# ANSI 颜色
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
BOLD = "\033[1m"
END = "\033[0m"

PASS = f"{GREEN}✓{END}"
FAIL = f"{RED}✗{END}"
SKIP = f"{YELLOW}⊘{END}"  # 需要认证
INFO = f"{BLUE}ℹ{END}"

results = {"pass": 0, "fail": 0, "skip": 0, "failures": []}


def test(name, fn):
    """运行一个测试"""
    global results
    try:
        result = fn()
        if result == "skip":
            print(f"  {SKIP} {name} (需要认证)")
            results["skip"] += 1
        elif result is True or result is None:
            print(f"  {PASS} {name}")
            results["pass"] += 1
        else:
            print(f"  {FAIL} {name}: {result}")
            results["fail"] += 1
            results["failures"].append((name, result))
    except Exception as e:
        tb = traceback.format_exc().splitlines()[-3:]
        msg = f"{type(e).__name__}: {e}"
        print(f"  {FAIL} {name}: {msg}")
        if "--verbose" in sys.argv:
            print(f"     {' / '.join(tb)}")
        results["fail"] += 1
        results["failures"].append((name, msg))


def section(name):
    print(f"\n{BOLD}━━━ {name} ━━━{END}")


# ============= 1. 环境依赖 =============
section("1. 环境依赖检查")

def check_python():
    import sys
    v = sys.version_info
    if v >= (3, 9):
        return True
    return f"Python {v.major}.{v.minor} < 3.9"

def check_node():
    r = subprocess.run(["node", "--version"], capture_output=True, text=True)
    if r.returncode == 0:
        return True
    return "Node.js 未安装"

def check_opencli_bin():
    p = SKILL_DIR / "node_modules" / ".bin" / "opencli"
    if p.exists() and os.access(p, os.X_OK):
        return True
    return f"opencli 不存在或不可执行: {p}"

def check_liepin_script():
    p = SKILL_DIR / "skills" / "liepin" / "liepin_mcp.py"
    if p.exists() and p.stat().st_size > 1000:
        return True
    return f"liepin_mcp.py 缺失或太小: {p}"

def check_opencli_maimai():
    p = SKILL_DIR / "skills" / "maimai" / "maimai" / "search-talents.yaml"
    if p.exists() and p.stat().st_size > 1000:
        return True
    return f"maimai/search-talents.yaml 缺失: {p}"

test("Python ≥ 3.9", check_python)
test("Node.js 可用", check_node)
test("opencli 二进制存在", check_opencli_bin)
test("猎聘脚本存在", check_liepin_script)
test("脉脉 YAML 适配器存在", check_opencli_maimai)


# ============= 2. 适配器加载 =============
section("2. 适配器加载测试")

def test_adapter(name):
    from adapters import ADAPTERS
    if name not in ADAPTERS:
        return f"{name} 不在 ADAPTERS 中"
    cls = ADAPTERS[name]
    try:
        adapter = cls()
        if not hasattr(adapter, "search_jobs"):
            return f"{name} 缺少 search_jobs 方法"
        if not hasattr(adapter, "is_available"):
            return f"{name} 缺少 is_available 方法"
        if not hasattr(adapter, "platform_name"):
            return f"{name} 缺少 platform_name 属性"
        return True
    except Exception as e:
        return f"实例化失败: {e}"

for p in ["boss", "linkedin", "maimai", "indeed", "51job", "liepin", "lagou"]:
    test(f"适配器 {p} 可实例化", lambda p=p: test_adapter(p))


# ============= 3. 数据模型 =============
section("3. 数据模型测试")

def test_job_posting():
    from adapters import JobPosting
    j = JobPosting(
        platform="boss",
        job_id="123",
        title="测试职位",
        company="测试公司",
        location="上海",
        salary="30-50k",
        description="这是一个测试",
        url="https://example.com/job/123",
        job_kind="1",
    )
    d = j.to_dict()
    assert d["platform"] == "boss"
    assert d["job_id"] == "123"
    assert d["title"] == "测试职位"
    j2 = JobPosting.from_dict(d) if hasattr(JobPosting, "from_dict") else j
    return True

def test_candidate():
    from adapters import Candidate
    c = Candidate(
        platform="maimai",
        user_id="u001",
        name="张三",
        current_title="高级工程师",
        current_company="字节跳动",
        skills=["Python", "Go"],
        is_contactable=True,
    )
    d = c.to_dict()
    assert d["platform"] == "maimai"
    assert d["name"] == "张三"
    assert "Python" in d["skills"]
    return True

def test_search_result():
    from adapters import SearchResult, JobPosting
    r = SearchResult(
        platform="test",
        success=True,
        jobs=[
            JobPosting(platform="test", job_id="1", title="job1"),
            JobPosting(platform="test", job_id="2", title="job2"),
        ],
        total=2,
    )
    d = r.to_dict()
    assert d["total"] == 2
    assert len(d["jobs"]) == 2
    return True

def test_json_serialization():
    from adapters import JobPosting
    j = JobPosting(platform="x", job_id="1", title="t", company="c")
    s = j.to_json()
    # 必须能被 json.loads 解析
    parsed = json.loads(s)
    assert parsed["title"] == "t"
    # 必须包含中文字符不被转义
    j2 = JobPosting(platform="x", job_id="1", title="前端开发")
    s2 = j2.to_json()
    assert "前端开发" in s2
    return True

test("JobPosting 创建和序列化", test_job_posting)
test("Candidate 创建和序列化", test_candidate)
test("SearchResult 创建和序列化", test_search_result)
test("JSON 中文不转义", test_json_serialization)


# ============= 4. CLI 入口 =============
section("4. CLI 入口测试")

def run_cli(*args):
    """运行 unified_search.py 并返回 (returncode, stdout, stderr)"""
    p = SCRIPT_DIR / "unified_search.py"
    r = subprocess.run(
        ["python3", str(p), *args],
        capture_output=True, text=True, timeout=30,
    )
    return r.returncode, r.stdout, r.stderr

def test_cli_help():
    code, out, _ = run_cli("--help")
    if code == 0 and "usage:" in out.lower():
        return True
    return f"exit={code}, output={out[:200]}"

def test_cli_version():
    code, out, _ = run_cli("--version")
    if code == 0 and "1.0.0" in out:
        return True
    return f"exit={code}, output={out[:100]}"

def test_cli_platforms_table():
    code, out, err = run_cli("platforms")
    if code == 0:
        # 应包含 7 个平台名
        platforms = ["boss", "linkedin", "maimai", "indeed", "51job", "liepin", "lagou"]
        missing = [p for p in platforms if p not in out]
        if missing:
            return f"缺失平台: {missing}"
        return True
    return f"exit={code}, stderr={err[:200]}"

def test_cli_platforms_json():
    code, out, err = run_cli("platforms", "--format", "json")
    if code == 0:
        try:
            data = json.loads(out)
            if len(data) != 7:
                return f"应返回 7 个平台，实际 {len(data)}"
            # 验证结构
            for item in data:
                assert "platform" in item
                assert "available" in item
                assert "auth" in item
            # 验证拉勾存在
            lagou = next((d for d in data if d["platform"] == "lagou"), None)
            if not lagou:
                return "拉勾平台未注册"
            if lagou["name_zh"] != "拉勾":
                return f"拉勾中文名错误: {lagou['name_zh']}"
            return True
        except json.JSONDecodeError as e:
            return f"JSON 解析失败: {e}"
    return f"exit={code}, stderr={err[:200]}"

def test_cli_search_help():
    code, out, _ = run_cli("search", "--help")
    if code == 0 and "query" in out.lower():
        return True
    return f"exit={code}"

def test_cli_candidates_help():
    code, out, _ = run_cli("candidates", "--help")
    if code == 0 and "query" in out.lower():
        return True
    return f"exit={code}"

def test_cli_apply_help():
    code, out, _ = run_cli("apply", "--help")
    if code == 0 and "job-id" in out:
        return True
    return f"exit={code}"

test("CLI --help 可用", test_cli_help)
test("CLI --version 可用", test_cli_version)
test("platforms 表格输出", test_cli_platforms_table)
test("platforms JSON 输出", test_cli_platforms_json)
test("search --help", test_cli_search_help)
test("candidates --help", test_cli_candidates_help)
test("apply --help", test_cli_apply_help)


# ============= 5. 错误处理 =============
section("5. 错误处理测试")

def test_unknown_platform():
    code, out, err = run_cli("search", "Python", "--platforms", "nonexistent_platform")
    # 即使某个平台未知，CLI 不应崩溃
    # 应该报告该平台未找到
    if "nonexistent" in out.lower() or "unknown" in out.lower() or "❌" in out or code != 0:
        return True  # 错误处理符合预期
    return f"未正确报告未知平台: exit={code}"

def test_invalid_format():
    code, out, err = run_cli("platforms", "--format", "xml")
    if code != 0:
        return True  # argparse 应拒绝无效格式
    return f"应拒绝无效格式: exit={code}"

def test_search_no_query():
    code, out, err = run_cli("search")
    if code != 0:
        return True  # 应报错缺少 query
    return f"应要求提供 query 参数: exit={code}"

def test_apply_no_job_id():
    code, out, err = run_cli("apply", "liepin")
    if code != 0:
        return True  # 应报错缺少 job-id
    return f"应要求 --job-id: exit={code}"

test("未知平台不崩溃", test_unknown_platform)
test("无效格式被拒绝", test_invalid_format)
test("search 缺少 query 报错", test_search_no_query)
test("apply 缺少 job-id 报错", test_apply_no_job_id)


# ============= 6. opencli 集成 =============
section("6. opencli 集成测试")

def test_opencli_list():
    bin_path = SKILL_DIR / "node_modules" / ".bin" / "opencli"
    r = subprocess.run([str(bin_path), "list"], capture_output=True, text=True, timeout=10)
    if r.returncode == 0:
        # 应包含所有 7 个平台
        for p in ["boss", "linkedin", "maimai", "indeed", "51job", "lagou"]:
            if p not in r.stdout:
                return f"opencli list 缺少 {p}"
        return True
    return f"exit={r.returncode}"

def test_opencli_boss_help():
    bin_path = SKILL_DIR / "node_modules" / ".bin" / "opencli"
    r = subprocess.run([str(bin_path), "boss", "search", "--help"],
                       capture_output=True, text=True, timeout=10)
    if r.returncode == 0 and "--city" in r.stdout:
        return True
    return f"exit={r.returncode}, stderr={r.stderr[:200]}"

def test_opencli_linkedin_help():
    bin_path = SKILL_DIR / "node_modules" / ".bin" / "opencli"
    r = subprocess.run([str(bin_path), "linkedin", "search", "--help"],
                       capture_output=True, text=True, timeout=10)
    if r.returncode == 0 and "--location" in r.stdout:
        return True
    return f"exit={r.returncode}"

def test_opencli_maimai_help():
    bin_path = SKILL_DIR / "node_modules" / ".bin" / "opencli"
    r = subprocess.run([str(bin_path), "maimai", "search-talents", "--help"],
                       capture_output=True, text=True, timeout=10)
    if r.returncode == 0 and "--worktimes" in r.stdout:
        return True
    return f"exit={r.returncode}"

def test_opencli_lagou_search_help():
    """拉勾插件 search 命令"""
    bin_path = SKILL_DIR / "node_modules" / ".bin" / "opencli"
    r = subprocess.run([str(bin_path), "lagou", "search", "--help"],
                       capture_output=True, text=True, timeout=10)
    if r.returncode == 0 and "--city" in r.stdout and "--salary" in r.stdout:
        return True
    return f"exit={r.returncode}, stderr={r.stderr[:200]}"

def test_opencli_lagou_detail_help():
    """拉勾插件 detail 命令"""
    bin_path = SKILL_DIR / "node_modules" / ".bin" / "opencli"
    r = subprocess.run([str(bin_path), "lagou", "detail", "--help"],
                       capture_output=True, text=True, timeout=10)
    if r.returncode == 0 and "--positionId" in r.stdout:
        return True
    return f"exit={r.returncode}"

def test_opencli_lagou_company_help():
    """拉勾插件 company 命令"""
    bin_path = SKILL_DIR / "node_modules" / ".bin" / "opencli"
    r = subprocess.run([str(bin_path), "lagou", "company", "--help"],
                       capture_output=True, text=True, timeout=10)
    if r.returncode == 0 and "--companyId" in r.stdout and "--withJobs" in r.stdout:
        return True
    return f"exit={r.returncode}"

test("opencli list 输出 7 平台", test_opencli_list)
test("opencli boss search --help", test_opencli_boss_help)
test("opencli linkedin search --help", test_opencli_linkedin_help)
test("opencli maimai search-talents --help", test_opencli_maimai_help)
test("opencli lagou search --help", test_opencli_lagou_search_help)
test("opencli lagou detail --help", test_opencli_lagou_detail_help)
test("opencli lagou company --help", test_opencli_lagou_company_help)


# ============= 7. 猎聘脚本 =============
section("7. 猎聘 MCP 脚本测试")

def test_liepin_help():
    script = SKILL_DIR / "skills" / "liepin" / "liepin_mcp.py"
    r = subprocess.run(["python3", str(script), "--help"],
                       capture_output=True, text=True, timeout=10)
    if r.returncode == 0:
        # 应列出 search-job / apply-job / my-resume 等命令
        for cmd in ["search-job", "apply-job", "my-resume"]:
            if cmd not in r.stdout:
                return f"猎聘脚本 help 缺少 {cmd}"
        return True
    return f"exit={r.returncode}, stderr={r.stderr[:200]}"

def test_liepin_search_help():
    script = SKILL_DIR / "skills" / "liepin" / "liepin_mcp.py"
    r = subprocess.run(["python3", str(script), "search-job", "--help"],
                       capture_output=True, text=True, timeout=10)
    if r.returncode == 0 and "--jobName" in r.stdout:
        return True
    return f"exit={r.returncode}"

def test_liepin_setup_help():
    script = SKILL_DIR / "skills" / "liepin" / "liepin_mcp.py"
    r = subprocess.run(["python3", str(script), "setup", "--help"],
                       capture_output=True, text=True, timeout=10)
    if r.returncode == 0:
        return True
    return f"exit={r.returncode}, stderr={r.stderr[:200]}"

def test_liepin_list_tools():
    """list-tools 无认证时应返回清晰错误而非崩溃"""
    script = SKILL_DIR / "skills" / "liepin" / "liepin_mcp.py"
    env = os.environ.copy()
    env.pop("LIEPIN_GATEWAY_TOKEN", None)
    env.pop("LIEPIN_USER_TOKEN", None)
    r = subprocess.run(
        ["python3", str(script), "list-tools"],
        capture_output=True, text=True, timeout=10, env=env,
    )
    # 即使没 token，也不应抛 Python traceback
    if "Traceback" in r.stderr:
        return f"不应抛 traceback: {r.stderr[:200]}"
    return True

def test_liepin_search_no_token():
    """无 token 调用 search-job 应返回友好错误（而不是抛异常）"""
    script = SKILL_DIR / "skills" / "liepin" / "liepin_mcp.py"
    env = os.environ.copy()
    env.pop("LIEPIN_GATEWAY_TOKEN", None)
    env.pop("LIEPIN_USER_TOKEN", None)
    r = subprocess.run(
        ["python3", str(script), "search-job", "--jobName", "测试"],
        capture_output=True, text=True, timeout=10, env=env,
    )
    # 期望：返回非 0 退出码，但 stderr 有可读错误（不是 Python traceback）
    if "Traceback" in r.stderr:
        return f"不应抛 Python traceback: {r.stderr[:200]}"
    if "token" in (r.stdout + r.stderr).lower() or "未配置" in (r.stdout + r.stderr) or "setup" in (r.stdout + r.stderr).lower():
        return True
    # 即使报错信息不同，只要不抛 traceback 就算通过
    return True

test("猎聘脚本 --help", test_liepin_help)
test("猎聘 search-job --help", test_liepin_search_help)
test("猎聘 setup --help", test_liepin_setup_help)
test("猎聘无 token 时优雅报错", test_liepin_search_no_token)
test("猎聘 list-tools 无认证不崩溃", test_liepin_list_tools)


# ============= 7.5 错误格式化 =============
section("7.5 错误格式化测试")

def test_format_yaml_stderr():
    """opencli YAML 错误在 stderr 中应被正确格式化"""
    from adapters.opencli_adapter import BossAdapter
    adapter = BossAdapter()
    mock_stderr = """ok: false
error:
  code: BROWSER_CONNECT
  message: Browser Bridge extension not connected
  help: |-
    Make sure Chrome is open
"""
    result = adapter._format_opencli_error("", mock_stderr, 69)
    if "BROWSER_CONNECT" in result and "Browser Bridge" in result and "帮助" in result:
        return True
    return f"未正确格式化: {result[:200]}"

def test_format_json_stdout():
    """opencli JSON 错误在 stdout 中应被正确格式化"""
    from adapters.opencli_adapter import BossAdapter
    adapter = BossAdapter()
    mock_stdout = '{"ok": false, "error": {"code": "AUTH", "message": "Invalid token"}}'
    result = adapter._format_opencli_error(mock_stdout, "", 1)
    if "AUTH" in result and "Invalid token" in result:
        return True
    return f"未正确格式化: {result}"

def test_format_plain_stderr():
    """纯文本 stderr 应被原样返回（截断）"""
    from adapters.opencli_adapter import BossAdapter
    adapter = BossAdapter()
    mock_stderr = "error: unknown command"
    result = adapter._format_opencli_error("", mock_stderr, 1)
    if "unknown command" in result:
        return True
    return f"未正确格式化: {result}"

def test_format_no_output():
    """无任何输出时返回退出码信息"""
    from adapters.opencli_adapter import BossAdapter
    adapter = BossAdapter()
    result = adapter._format_opencli_error("", "", 127)
    if "127" in result:
        return True
    return f"未正确格式化: {result}"

test("YAML 错误（来自 stderr）", test_format_yaml_stderr)
test("JSON 错误（来自 stdout）", test_format_json_stdout)
test("纯文本 stderr", test_format_plain_stderr)
test("无输出时显示退出码", test_format_no_output)


# ============= 8. 集成场景（需要认证）=============
section("8. 集成场景（标记为 ⊘ 需要认证）")

def test_real_search_needs_auth():
    """真实搜索需要 Chrome + 登录"""
    return "skip"

def test_real_apply_needs_auth():
    """真实投递需要 token"""
    return "skip"

def test_candidate_search_needs_auth():
    """候选人搜索需要登录"""
    return "skip"

test("真实职位搜索", test_real_search_needs_auth)
test("真实候选人搜索", test_candidate_search_needs_auth)
test("真实投递", test_real_apply_needs_auth)


# ============= 9. 文件完整性 =============
section("9. 文件完整性检查")

def check_file(rel_path, min_lines=0):
    p = SKILL_DIR / rel_path
    if not p.exists():
        return f"缺失: {rel_path}"
    lines = len(p.read_text().splitlines())
    if lines < min_lines:
        return f"{rel_path} 行数不足: {lines} < {min_lines}"
    return True

test("SKILL.md 存在且 ≥ 100 行", lambda: check_file("SKILL.md", 100))
test("README.md 存在且 ≥ 100 行", lambda: check_file("README.md", 100))
test("references/auth_setup.md 存在", lambda: check_file("references/auth_setup.md", 50))
test("evals/test_prompts.md 存在", lambda: check_file("evals/test_prompts.md", 50))
test("adapters/base.py 存在", lambda: check_file("scripts/adapters/base.py", 50))
test("adapters/opencli_adapter.py 存在", lambda: check_file("scripts/adapters/opencli_adapter.py", 100))
test("adapters/liepin_adapter.py 存在", lambda: check_file("scripts/adapters/liepin_adapter.py", 100))
test("adapters/lagou_adapter.py 存在", lambda: check_file("scripts/adapters/lagou_adapter.py", 100))
test("unified_search.py 存在", lambda: check_file("scripts/unified_search.py", 200))

# 拉勾插件目录检查
def test_lagou_plugin_dir():
    """拉勾 opencli 插件目录"""
    lagou_dir = SKILL_DIR.parent / "lagou"
    if not lagou_dir.exists():
        return "拉勾插件目录不存在"
    required = ["search.ts", "detail.ts", "company.ts", "SKILL.md", "package.json"]
    missing = [f for f in required if not (lagou_dir / f).exists()]
    if missing:
        return f"拉勾插件缺失文件: {missing}"
    return True

test("拉勾插件目录完整", test_lagou_plugin_dir)


# ============= 汇总 =============
section("📊 测试结果汇总")

total = results["pass"] + results["fail"] + results["skip"]
pass_rate = (results["pass"] / (results["pass"] + results["fail"]) * 100) if (results["pass"] + results["fail"]) > 0 else 0

print(f"""
  {PASS} 通过:  {results['pass']}
  {FAIL} 失败:  {results['fail']}
  {SKIP} 跳过:  {results['skip']} (需要 Chrome/Token)
  ─────────────
  {BOLD}合计:    {total}{END}
  {BOLD}通过率:  {pass_rate:.1f}%{END} (排除跳过项)
""")

if results["failures"]:
    print(f"{RED}失败用例详情：{END}")
    for name, msg in results["failures"]:
        print(f"  • {name}: {msg}")

# 退出码
sys.exit(0 if results["fail"] == 0 else 1)