import { cli, Strategy } from "@jackwener/opencli/registry";
cli({
  site: "lagou",
  name: "company",
  access: "read",
  description: "\u67E5\u8BE2\u62C9\u52FE\u516C\u53F8\u4FE1\u606F\uFF08\u542B\u5728\u62DB\u804C\u4F4D\uFF09",
  domain: "www.lagou.com",
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    {
      name: "companyId",
      required: true,
      help: "\u62C9\u52FE\u516C\u53F8 ID\uFF08\u4ECE search \u547D\u4EE4\u83B7\u53D6\uFF09"
    },
    {
      name: "withJobs",
      type: "boolean",
      default: false,
      help: "\u662F\u5426\u540C\u65F6\u5217\u51FA\u8BE5\u516C\u53F8\u7684\u5728\u62DB\u804C\u4F4D\uFF08\u524D 10 \u4E2A\uFF09"
    }
  ],
  columns: [
    "companyId",
    "companyFullName",
    "companyShortName",
    "financeStage",
    "companySize",
    "industryField",
    "city",
    "companyLabelList",
    "activeJobCount",
    "companyUrl"
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
    if (!apiResult || apiResult.error) {
      throw new Error(`\u62C9\u52FE\u516C\u53F8 API \u5931\u8D25: ${apiResult?.error || "\u672A\u77E5\u9519\u8BEF"}`);
    }
    const data = apiResult;
    const company = data.company || data.content?.company || data || {};
    let activeJobs = [];
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
      if (jobsResult && !jobsResult.error) {
        const jd = jobsResult;
        const list = jd.content?.positionResult?.result || jd.positionResult?.result || [];
        activeJobs = list.slice(0, 10).map((j) => ({
          positionId: j.positionId,
          positionName: j.positionName,
          salary: j.salary,
          city: j.city
        }));
        activeJobCount = jd.content?.positionResult?.resultSize || list.length;
      }
    }
    return [{
      companyId: company.companyId || Number(companyId),
      companyFullName: company.companyFullName || "",
      companyShortName: company.companyShortName || "",
      companyLogo: company.companyLogo || "",
      financeStage: company.financeStage || "",
      companySize: company.companySize || "",
      industryField: company.industryField || "",
      city: company.city || "",
      registeredCapital: company.registeredCapital || "",
      registeredTime: company.registeredTime || "",
      companyLabelList: (company.companyLabelList || []).join(" / "),
      companyIntroduce: (company.companyIntroduce || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 500),
      activeJobCount,
      activeJobs: activeJobs || [],
      companyUrl: `https://www.lagou.com/gongsi/${companyId}.html`
    }];
  }
});
