import { cli, Strategy } from "@jackwener/opencli/registry";
const CITY_CODES = {
  "\u5317\u4EAC": "010",
  "\u4E0A\u6D77": "020",
  "\u5E7F\u5DDE": "030",
  "\u6DF1\u5733": "040",
  "\u676D\u5DDE": "070",
  "\u6210\u90FD": "080",
  "\u6B66\u6C49": "090",
  "\u5357\u4EAC": "100",
  "\u82CF\u5DDE": "110",
  "\u897F\u5B89": "120",
  "\u5929\u6D25": "130",
  "\u91CD\u5E86": "140",
  "\u53A6\u95E8": "150",
  "\u957F\u6C99": "160",
  "\u9752\u5C9B": "170"
};
function getCityCode(city) {
  if (!city) return "";
  if (/^\d+$/.test(city)) return city;
  return CITY_CODES[city] || city;
}
cli({
  site: "lagou",
  name: "search",
  access: "read",
  description: "\u5728\u62C9\u52FE\u4E0A\u641C\u7D22\u804C\u4F4D\uFF08\u57FA\u4E8E\u5173\u952E\u8BCD\u3001\u57CE\u5E02\u3001\u85AA\u8D44\u7B49\u7B5B\u9009\uFF09",
  domain: "www.lagou.com",
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    {
      name: "keyword",
      required: true,
      positional: true,
      help: "\u804C\u4F4D\u5173\u952E\u8BCD\uFF0C\u5982 Python\u3001AI\u3001\u4EA7\u54C1\u7ECF\u7406"
    },
    {
      name: "city",
      default: "\u5317\u4EAC",
      help: "\u5DE5\u4F5C\u57CE\u5E02\uFF0C\u5982 \u5317\u4EAC\u3001\u4E0A\u6D77\u3001\u6DF1\u5733\uFF08\u4E5F\u652F\u6301\u57CE\u5E02\u4EE3\u7801\uFF09"
    },
    {
      name: "limit",
      type: "int",
      default: 15,
      help: "\u8FD4\u56DE\u804C\u4F4D\u6570\u91CF\uFF08\u6BCF\u9875\u6700\u591A 15\uFF09"
    },
    {
      name: "salary",
      default: "",
      help: "\u85AA\u8D44\u8303\u56F4\uFF0C\u5982 10k-20k"
    },
    {
      name: "experience",
      default: "",
      choices: ["", "\u5E94\u5C4A\u6BD5\u4E1A\u751F", "3\u5E74\u53CA\u4EE5\u4E0B", "3-5\u5E74", "5-10\u5E74", "10\u5E74\u4EE5\u4E0A", "\u4E0D\u9650"],
      help: "\u7ECF\u9A8C\u8981\u6C42"
    },
    {
      name: "education",
      default: "",
      choices: ["", "\u5927\u4E13", "\u672C\u79D1", "\u7855\u58EB", "\u535A\u58EB", "\u4E0D\u9650"],
      help: "\u5B66\u5386\u8981\u6C42"
    },
    {
      name: "jobType",
      default: "",
      choices: ["", "\u5168\u804C", "\u517C\u804C", "\u5B9E\u4E60"],
      help: "\u5DE5\u4F5C\u7C7B\u578B"
    }
  ],
  columns: [
    "rank",
    "positionId",
    "positionName",
    "companyFullName",
    "city",
    "salary",
    "workYear",
    "education",
    "positionAdvantage",
    "createTime"
  ],
  func: async (page, kwargs) => {
    const keyword = encodeURIComponent(kwargs.keyword);
    const cityCode = getCityCode(kwargs.city);
    const pageSize = Math.min(Math.max(Number(kwargs.limit) || 15, 1), 15);
    await page.goto(`https://www.lagou.com/wn/jobs?kd=${keyword}&city=${cityCode}`);
    await page.wait(1.5);
    const apiResult = await page.evaluate(`
            (async function() {
                const params = new URLSearchParams();
                params.set('kd', ${JSON.stringify(kwargs.keyword)});
                params.set('city', ${JSON.stringify(cityCode)});
                params.set('pageNo', '1');
                params.set('pageSize', ${JSON.stringify(String(pageSize))});
                params.set('salary', ${JSON.stringify(kwargs.salary || "")});
                params.set('workYear', ${JSON.stringify(kwargs.experience || "")});
                params.set('education', ${JSON.stringify(kwargs.education || "")});
                params.set('jobType', ${JSON.stringify(kwargs.jobType || "")});

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
    if (!apiResult || apiResult.error) {
      const errMsg = apiResult?.error || "\u672A\u77E5\u9519\u8BEF";
      throw new Error(`\u62C9\u52FE API \u8C03\u7528\u5931\u8D25: ${errMsg}\u3002\u8BF7\u786E\u4FDD\u5DF2\u5728 Chrome \u4E2D\u767B\u5F55\u62C9\u52FE\u3002`);
    }
    const data = apiResult;
    if (!data.success) {
      throw new Error(`\u62C9\u52FE\u8FD4\u56DE\u9519\u8BEF: ${data.msg}`);
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
      businessZones: (job.businessZones || []).join(" / "),
      salary: job.salary,
      workYear: job.workYear,
      education: job.education,
      jobNature: job.jobNature,
      financeStage: job.financeStage,
      companySize: job.companySize,
      industryField: job.industryField,
      positionAdvantage: job.positionAdvantage,
      createTime: job.createTime,
      detailUrl: `https://www.lagou.com/wn/jobs/${job.positionId}.html`
    }));
  }
});
