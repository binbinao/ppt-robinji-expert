/**
 * 拉勾公司信息查询
 */

import { cli, Strategy } from '@jackwener/opencli/registry';

interface CompanyInfo {
    companyId: number;
    companyFullName: string;
    companyShortName: string;
    companyLogo?: string;
    financeStage: string;
    companySize: string;
    industryField: string;
    companyLabelList?: string[];
    companyIntroduce?: string;
    city?: string;
    registeredCapital?: string;
    registeredTime?: string;
    businessLicenseUrl?: string;
    positionCount?: number;
    activeJobs?: Array<{
        positionId: number;
        positionName: string;
        salary: string;
        city: string;
    }>;
}

cli({
    site: 'lagou',
    name: 'company',
    access: 'read',
    description: '查询拉勾公司信息（含在招职位）',
    domain: 'www.lagou.com',
    strategy: Strategy.COOKIE,
    browser: true,
    args: [
        {
            name: 'companyId',
            required: true,
            help: '拉勾公司 ID（从 search 命令获取）',
        },
        {
            name: 'withJobs',
            type: 'boolean',
            default: false,
            help: '是否同时列出该公司的在招职位（前 10 个）',
        },
    ],
    columns: [
        'companyId', 'companyFullName', 'companyShortName', 'financeStage',
        'companySize', 'industryField', 'city', 'companyLabelList',
        'activeJobCount', 'companyUrl',
    ],
    func: async (page, kwargs) => {
        const companyId = String(kwargs.companyId);
        const withJobs = Boolean(kwargs.withJobs);

        await page.goto(`https://www.lagou.com/gongsi/${companyId}.html`);
        await page.wait(1);

        const apiResult = await page.evaluate(`
            (async function() {
                try {
                    const companyResp = await fetch('/gongsi/companyAjax.json?companyId=${companyId}', {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Referer': 'https://www.lagou.com/gongsi/${companyId}.html'
                        }
                    });
                    if (!companyResp.ok) return { error: 'HTTP ' + companyResp.status };
                    return await companyResp.json();
                } catch (e) {
                    return { error: String(e) };
                }
            })()
        `);

        if (!apiResult || (apiResult as any).error) {
            throw new Error(`拉勾公司 API 失败: ${(apiResult as any)?.error || '未知错误'}`);
        }

        const data = apiResult as any;
        const company = data.company || data.content?.company || data || {};

        // 可选：获取该公司在招职位
        let activeJobs: CompanyInfo['activeJobs'] = [];
        let activeJobCount = 0;

        if (withJobs) {
            const jobsResult = await page.evaluate(`
                (async function() {
                    try {
                        const params = new URLSearchParams();
                        params.set('companyId', '${companyId}');
                        params.set('pageNo', '1');
                        params.set('pageSize', '10');
                        const resp = await fetch('/jobs/companyAjax.json?' + params.toString(), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'X-Requested-With': 'XMLHttpRequest',
                                'Referer': 'https://www.lagou.com/gongsi/${companyId}.html'
                            },
                            body: params.toString()
                        });
                        if (!resp.ok) return { error: 'HTTP ' + resp.status };
                        return await resp.json();
                    } catch (e) {
                        return { error: String(e) };
                    }
                })()
            `);

            if (jobsResult && !(jobsResult as any).error) {
                const jd = jobsResult as any;
                const list = jd.content?.positionResult?.result || jd.positionResult?.result || [];
                activeJobs = list.slice(0, 10).map((j: any) => ({
                    positionId: j.positionId,
                    positionName: j.positionName,
                    salary: j.salary,
                    city: j.city,
                }));
                activeJobCount = jd.content?.positionResult?.resultSize || list.length;
            }
        }

        return [{
            companyId: company.companyId || Number(companyId),
            companyFullName: company.companyFullName || '',
            companyShortName: company.companyShortName || '',
            companyLogo: company.companyLogo || '',
            financeStage: company.financeStage || '',
            companySize: company.companySize || '',
            industryField: company.industryField || '',
            city: company.city || '',
            registeredCapital: company.registeredCapital || '',
            registeredTime: company.registeredTime || '',
            companyLabelList: (company.companyLabelList || []).join(' / '),
            companyIntroduce: (company.companyIntroduce || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500),
            activeJobCount,
            activeJobs: activeJobs || [],
            companyUrl: `https://www.lagou.com/gongsi/${companyId}.html`,
        }];
    },
});