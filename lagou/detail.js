import { cli, Strategy } from "@jackwener/opencli/registry";
cli({
  site: "lagou",
  name: "detail",
  access: "read",
  description: "\u83B7\u53D6\u62C9\u52FE\u804C\u4F4D\u7684\u8BE6\u7EC6\u4FE1\u606F\uFF08JD\u3001\u516C\u53F8\u4FE1\u606F\u3001\u53D1\u5E03\u4EBA\u7B49\uFF09",
  domain: "www.lagou.com",
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    {
      name: "positionId",
      required: true,
      help: "\u62C9\u52FE\u804C\u4F4D ID\uFF08\u4ECE search \u547D\u4EE4\u83B7\u53D6\uFF09"
    }
  ],
  columns: [
    "positionId",
    "positionName",
    "salary",
    "city",
    "workYear",
    "education",
    "companyFullName",
    "companySize",
    "financeStage",
    "industryField",
    "positionAdvantage",
    "detailUrl"
  ],
  func: async (page, kwargs) => {
    const positionId = String(kwargs.positionId);
    await page.goto(`https://www.lagou.com/wn/jobs/${positionId}.html`);
    await page.wait(1);
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
    if (!apiResult || apiResult.error) {
      const errMsg = apiResult?.error || "\u672A\u77E5\u9519\u8BEF";
      throw new Error(`\u62C9\u52FE\u8BE6\u60C5 API \u5931\u8D25: ${errMsg}`);
    }
    const data = apiResult;
    const position = data.position || data.content?.position || {};
    const company = data.company || data.content?.company || {};
    return [{
      positionId: position.positionId || Number(positionId),
      positionName: position.positionName || "",
      salary: position.salary || "",
      city: position.city || "",
      workYear: position.workYear || "",
      education: position.education || "",
      positionAddress: position.positionAddress || "",
      positionAdvantage: position.positionAdvantage || "",
      positionDetail: (position.positionDetail || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      createTime: position.createTime || "",
      companyId: company.companyId || 0,
      companyFullName: company.companyFullName || "",
      companyShortName: company.companyShortName || "",
      financeStage: company.financeStage || "",
      companySize: company.companySize || "",
      industryField: company.industryField || "",
      companyLabelList: (company.companyLabelList || []).join(" / "),
      companyIntroduce: (company.companyIntroduce || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      detailUrl: `https://www.lagou.com/wn/jobs/${positionId}.html`
    }];
  }
});
