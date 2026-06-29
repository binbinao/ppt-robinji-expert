/**
 * Demo: CAD 市场分析 PPT (mock 内容)
 * 不调 AI — 验证模板 + v3 改造
 */
import PPTCreator from '../src/pptx/creator.js';

const TPL = 'business-classic';
const TITLE = 'CAD 市场分析 2026';
const FOOTER = 'CAD Market Analysis · 2026 Q1';

async function main() {
  const c = new PPTCreator({ template: TPL, author: 'demo-cad', company: 'RobinJi Research', footerText: FOOTER });

  await c.createFromOutline({
    title: TITLE,
    subtitle: '全球 CAD 软件市场规模、增长趋势与竞争格局',
    slides: [
      { title: '市场概览：千亿赛道，AI 加持', type: 'cover', content: ['2026 全球 CAD 软件市场报告'], notes: '开场。' },
      { title: '当前全球 CAD 市场规模约 120 亿美元', type: 'content',
        content: ['2025 年全球 CAD 软件市场规模：118 亿美元', '2026 年预计达 124 亿美元，CAGR 5.2%', '2030 年预测突破 150 亿美元', '云 CAD 增速最快：年增 18%'],
        notes: '传统 CAD vs 云 CAD 增长差异。' },
      { title: '主要竞争者：从三巨头到 AI 原生挑战者', type: 'content',
        content: ['Autodesk：市场份额 35%，稳坐头把交椅', 'Dassault Systèmes：18%，航空与汽车优势', 'Siemens：12%，工业制造深耕', '新兴：Onshape、PTC Atlas、AI 原生 CAD（Zoo、Topology）'],
        notes: 'AI 原生 CAD 是新变量。' },
      { title: '趋势一：AI 辅助建模成为标配', type: 'content',
        content: ['AI 自动建模：从草图到 3D 模型时间缩短 60%', '文本生成 CAD：AutoCAD 2026 推出自然语言建模', '逆向工程：从点云到 CAD 准确率达 95%+', '协同优化：AI 自动给出最优结构方案'],
        notes: 'AI 不是替代设计师，而是提效工具。' },
      { title: '趋势二：云端协作 + 实时渲染', type: 'content',
        content: ['Onshape 模式：无需本地安装，浏览器即用', '实时多人协作：设计师 + 工程师同步编辑', 'GPU 云渲染：大型装配体渲染时间缩短 80%', '数据安全：端到端加密 + 私有云部署'],
        notes: '' },
      { title: '关键数据：AI 驱动 CAD 增长', type: 'kpi', kpiValue: '+42%', kpiUnit: '', kpiContext: 'AI 原生 CAD 用户同比增长',
        content: ['相对传统 CAD 5% 增速，AI 原生 CAD 增速达 42%', '占新签合同比从 8% 升至 22%'] },
      { title: '行业应用：制造与建筑并驾齐驱', type: 'comparison',
        content: ['制造业：50% 收入，工程与装配设计', '建筑业：BIM 推动 25%，4D 进度模拟', '汽车：15%，造型与 CAE 仿真', '其他：航空、医疗、消费电子合计 10%'] },
      { title: '中国厂商：突围中的中望、华天', type: 'content',
        content: ['中望软件：国内 CAD 龙头，海外收入占比 35%', '华天软件：聚焦船舶与航空', '数码大方：在教育市场领先', '挑战：从 PLM 全链条抗衡 Autodesk 仍有差距'] },
      { title: '市场风险与挑战', type: 'content',
        content: ['AI 模型训练数据合规：版权争议', '传统厂商反击：Autodesk 收购 AI 公司', '企业切换成本：5-10 万美元/工程师', '开源替代品增长缓慢但稳定'] },
      { title: '结论：AI CAD 是下一个十年最大变量', type: 'conclusion',
        content: ['市场规模 5 年翻倍可期', 'AI 原生厂商将吃掉 30% 传统份额', '传统三巨头必须加速 AI 转型', '推荐关注：Onshape、中望 AI 模块、Solidworks 2026'] },
      { title: 'Q&A', type: 'qa', content: ['感谢聆听', '欢迎讨论'] },
      { title: '谢谢', type: 'thank-you', content: ['RobinJi Research · 2026'] }
    ]
  } as any);

  await c.save('output/cad-market-analysis.pptx');
  console.log('✅ Saved: output/cad-market-analysis.pptx');
}

main().catch(err => { console.error('FAIL:', err.message); process.exit(1); });
