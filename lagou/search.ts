/**
 * 拉勾 (Lagou) 职位搜索
 *
 * 拉勾网站部署了阿里云 WAF，直接 HTTP 请求会被拦截。
 * 必须通过 opencli Browser Bridge + Chrome 已登录态访问。
 *
 * 数据来源：浏览器渲染后的 DOM + 拉勾内部 XHR API
 */

import { cli, Strategy } from '@jackwener/opencli/registry';

interface JobItem {
    positionId: number;
    positionName: string;
    companyId: number;
    companyFullName: string;
    companyShortName: string;
    city: string;
    businessZones: string[] | null;
    salary: string;
    salaryMonth: number;
    workYear: string;
    education: string;
    jobNature: string;
    financeStage: string;
    companySize: string;
    industryField: string;
    positionAdvantage: string;
    createTime: string;
    lastLoginTime: number;
    publisherId: number;
    positionDetail?: string;
}

interface PositionAjaxResponse {
    success: boolean;
    msg: string;
    content: {
        pageNo: number;
        pageSize: number;
        totalCount: number;
        totalPage: number;
        positionResult: {
            resultSize: number;
            result: JobItem[];
        };
    };
}

// 拉勾的城市代码映射（常用城市）
const CITY_CODES: Record<string, string> = {
    '北京': '010',
    '上海': '020',
    '广州': '030',
    '深圳': '040',
    '杭州': '070',
    '成都': '080',
    '武汉': '090',
    '南京': '100',
    '苏州': '110',
    '西安': '120',
    '天津': '130',
    '重庆': '140',
    '厦门': '150',
    '长沙': '160',
    '青岛': '170',
};

function getCityCode(city: string): string {
    if (!city) return '';
    // 如果已经是数字代码，直接返回
    if (/^\d+$/.test(city)) return city;
    // 否则查找映射表
    return CITY_CODES[city] || city;
}

cli({
    site: 'lagou',
    name: 'search',
    access: 'read',
    description: '在拉勾上搜索职位（基于关键词、城市、薪资等筛选）',
    domain: 'www.lagou.com',
    strategy: Strategy.COOKIE,
    browser: true,
    args: [
        {
            name: 'keyword',
            required: true,
            positional: true,
            help: '职位关键词，如 Python、AI、产品经理',
        },
        {
            name: 'city',
            default: '北京',
            help: '工作城市，如 北京、上海、深圳（也支持城市代码）',
        },
        {
            name: 'limit',
            type: 'int',
            default: 15,
            help: '返回职位数量（每页最多 15）',
        },
        {
            name: 'salary',
            default: '',
            help: '薪资范围，如 10k-20k',
        },
        {
            name: 'experience',
            default: '',
            choices: ['', '应届毕业生', '3年及以下', '3-5年', '5-10年', '10年以上', '不限'],
            help: '经验要求',
        },
        {
            name: 'education',
            default: '',
            choices: ['', '大专', '本科', '硕士', '博士', '不限'],
            help: '学历要求',
        },
        {
            name: 'jobType',
            default: '',
            choices: ['', '全职', '兼职', '实习'],
            help: '工作类型',
        },
    ],
    columns: [
        'rank', 'positionId', 'positionName', 'companyFullName',
        'city', 'salary', 'workYear', 'education', 'positionAdvantage', 'createTime',
    ],
    func: async (page, kwargs) => {
        const keyword = encodeURIComponent(kwargs.keyword as string);
        const cityCode = getCityCode(kwargs.city as string);
        const pageSize = Math.min(Math.max(Number(kwargs.limit) || 15, 1), 15);

        // 先打开搜索主页获取 cookies
        await page.goto(`https://www.lagou.com/wn/jobs?kd=${keyword}&city=${cityCode}`);

        // 等待搜索结果加载
        await page.wait(1.5);

        // 通过浏览器内部 fetch 调用拉勾 XHR API（绕过 WAF）
        const apiResult = await page.evaluate(`
            (async function() {
                const params = new URLSearchParams();
                params.set('kd', ${JSON.stringify(kwargs.keyword)});
                params.set('city', ${JSON.stringify(cityCode)});
                params.set('pageNo', '1');
                params.set('pageSize', ${JSON.stringify(String(pageSize))});
                params.set('salary', ${JSON.stringify(kwargs.salary || '')});
                params.set('workYear', ${JSON.stringify(kwargs.experience || '')});
                params.set('education', ${JSON.stringify(kwargs.education || '')});
                params.set('jobType', ${JSON.stringify(kwargs.jobType || '')});

                try {
                    const resp = await fetch('/wn/jobs/positionAjax.json?' + params.toString(), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Referer': 'https://www.lagou.com/wn/jobs'
                        },
                        body: params.toString()
                    });
                    if (!resp.ok) return { error: 'HTTP ' + resp.status };
                    const data = await resp.json();
                    return data;
                } catch (e) {
                    return { error: String(e) };
                }
            })()
        `);

        // 处理错误
        if (!apiResult || (apiResult as any).error) {
            const errMsg = (apiResult as any)?.error || '未知错误';
            throw new Error(`拉勾 API 调用失败: ${errMsg}。请确保已在 Chrome 中登录拉勾。`);
        }

        const data = apiResult as PositionAjaxResponse;
        if (!data.success) {
            throw new Error(`拉勾返回错误: ${data.msg}`);
        }

        const results = data.content?.positionResult?.result || [];

        return results.map((job, index) => ({
            rank: index + 1,
            positionId: job.positionId,
            positionName: job.positionName,
            companyId: job.companyId,
            companyFullName: job.companyFullName || job.companyShortName,
            companyShortName: job.companyShortName,
            city: job.city,
            businessZones: (job.businessZones || []).join(' / '),
            salary: job.salary,
            workYear: job.workYear,
            education: job.education,
            jobNature: job.jobNature,
            financeStage: job.financeStage,
            companySize: job.companySize,
            industryField: job.industryField,
            positionAdvantage: job.positionAdvantage,
            createTime: job.createTime,
            detailUrl: `https://www.lagou.com/wn/jobs/${job.positionId}.html`,
        }));
    },
});