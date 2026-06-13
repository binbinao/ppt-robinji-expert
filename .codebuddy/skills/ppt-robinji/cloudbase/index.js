const { generatePPT, convertPPT } = require('./dist/index.js');

/**
 * CloudBase云函数入口
 */
exports.main = async (event, context) => {
  const { action, ...params } = event;

  try {
    switch (action) {
      case 'generate':
        const pptPath = await generatePPT(params);
        return { success: true, data: { path: pptPath } };

      case 'convert':
        const convertPath = await convertPPT(params);
        return { success: true, data: { path: convertPath } };

      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
