/**
 * 拉勾职位详情查询
 */

import { cli, Strategy } from '@jackwener/opencli/registry';

interface JobDetail {
    position: {
        positionId: number;
        positionName: string;
        positionDetail?: string;
        workYear: string;
        education: string;
        salary: string;
        city: string;
        positionAddress: string;
        longitude?: number;
        latitude?: number;
        positionAdvantage: string;
        createTime: string;
    };
    company: {
        companyId: number;
        companyFullName: string;
        companyShortName: string;
        companyLogo?: string;
        financeStage: string;
        companySize: string;
        industryField: string;
        companyLabelList?: string[];
        companyIntroduce?: string;
    };
    publisher?: {
        userId: number;
        name: string;
        position: string;
    };
}

cli({
    site: 'lagou',
    name: 'detail',
    access: 'read',
    description: '获取拉勾职位的详细信息（JD、公司信息、发布人等）',
    domain: 'www.lagou.com',
    strategy: Strategy.COOKIE,
    browser: true,
    args: [
        {
            name: 'positionId',
            required: true,
            help: '拉勾职位 ID（从 search 命令获取）',
        },
    ],
    columns: [
        'positionId', 'positionName', 'salary', 'city', 'workYear',
        'education', 'companyFullName', 'companySize', 'financeStage',
        'industryField', 'positionAdvantage', 'detailUrl',
    ],
    func: async (page, kwargs) => {
        const positionId = String(kwargs.positionId);

        // 先访问职位详情页获取 cookies
        await page.goto(`https://www.lagou.com/wn/jobs/${positionId}.html`);
        await page.wait(1);

        // 通过 fetch 获取职位详情 API
        const apiResult = await page.evaluate(`
            (async function() {
                try {
                    const resp = await fetch('/jobs/${positionId}.json', {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Referer': 'https://www.lagou.com/wn/jobs/${positionId}.html'
                        }
                    });
                    if (!resp.ok) return { error: 'HTTP ' + resp.status };
                    const data = await resp.json();
                    return data;
                } catch (e) {
                    return { error: String(e) };
                }
            })()
        `);

        if (!apiResult || (apiResult as any).error) {
            const errMsg = (apiResult as any)?.error || '未知错误';
            throw new Error(`拉勾详情 API 失败: ${errMsg}`);
        }

        const data = apiResult as any;
        const position = data.position || data.content?.position || {};
        const company = data.company || data.content?.company || {};

        return [{
            positionId: position.positionId || Number(positionId),
            positionName: position.positionName || '',
            salary: position.salary || '',
            city: position.city || '',
            workYear: position.workYear || '',
            education: position.education || '',
            positionAddress: position.positionAddress || '',
            positionAdvantage: position.positionAdvantage || '',
            positionDetail: (position.positionDetail || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
            createTime: position.createTime || '',
            companyId: company.companyId || 0,
            companyFullName: company.companyFullName || '',
            companyShortName: company.companyShortName || '',
            financeStage: company.financeStage || '',
            companySize: company.companySize || '',
            industryField: company.industryField || '',
            companyLabelList: (company.companyLabelList || []).join(' / '),
            companyIntroduce: (company.companyIntroduce || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
            detailUrl: `https://www.lagou.com/wn/jobs/${positionId}.html`,
        }];
    },
});