import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type ProviderType = 'anthropic' | 'openai' | 'openai-compatible';

export interface ProviderConfig {
  name: string;
  type: ProviderType;
  apiKeyEnv: string;
  defaultModel: string;
  enabled: boolean;
  baseURL?: string;
  description?: string;
}

export interface ProvidersConfig {
  providers: {
    [key: string]: ProviderConfig;
  };
  defaultProvider: string;
}

/**
 * 加载 provider 配置
 * 尝试多个位置以兼容开发模式和 npm 包模式
 */
export function loadProvidersConfig(): ProvidersConfig {
  // 多个候选路径（dev、npm 包、用户项目）
  const candidates = [
    join(__dirname, '../../config/providers.json'),  // dev mode
    join(__dirname, '../config/providers.json'),     // npm 包内
    join(process.cwd(), 'config/providers.json'),     // 当前工作目录
    join(process.cwd(), 'node_modules/ppt-robinji/config/providers.json')  // 已安装的包
  ];

  let configData: string | null = null;
  let usedPath = '';
  for (const path of candidates) {
    if (existsSync(path)) {
      configData = readFileSync(path, 'utf-8');
      usedPath = path;
      break;
    }
  }

  if (!configData) {
    throw new Error(
      `Providers config not found. Tried:\n${candidates.map(p => `  - ${p}`).join('\n')}\n` +
      `Please set PROVIDER_<NAME>_API_KEY env vars or create config/providers.json`
    );
  }

  const config = JSON.parse(configData) as ProvidersConfig;

  // 环境变量覆盖默认 provider
  if (process.env.PROVIDER) {
    config.defaultProvider = process.env.PROVIDER;
  }

  // 验证默认 provider 存在且已启用
  const defaultProvider = config.providers[config.defaultProvider];
  if (!defaultProvider) {
    throw new Error(`Default provider not found: ${config.defaultProvider}`);
  }

  return config;
}

export function getProviderConfig(providerName: string): ProviderConfig | null {
  const config = loadProvidersConfig();
  return config.providers[providerName] || null;
}

export function getDefaultProvider(): string {
  const config = loadProvidersConfig();
  return config.defaultProvider;
}

export function getEnabledProviders(): string[] {
  const config = loadProvidersConfig();
  return Object.entries(config.providers)
    .filter(([_, p]) => p.enabled)
    .map(([name, _]) => name);
}

/**
 * 获取所有 provider（不管启用与否），用于列表展示
 */
export function getAllProviders(): Array<{ id: string; config: ProviderConfig }> {
  const config = loadProvidersConfig();
  return Object.entries(config.providers).map(([id, cfg]) => ({ id, config: cfg }));
}

/**
 * 检查 provider 是否已配置 API Key
 */
export function isProviderConfigured(providerName: string): boolean {
  const config = getProviderConfig(providerName);
  if (!config) return false;
  // Ollama 等本地服务不需要 key
  if (providerName === 'ollama') return true;
  return !!process.env[config.apiKeyEnv];
}

export function getAPIKey(providerName: string): string | undefined {
  const config = getProviderConfig(providerName);
  if (!config) return undefined;
  // Ollama 等本地服务不需要 key，使用占位符
  if (providerName === 'ollama') return 'ollama';
  return process.env[config.apiKeyEnv];
}
