export type ConfigurableAgentField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

export type ConfigurableAgentConfig = {
  kind: 'configurable_agent';
  version: 1;
  masterPrompt: string;
  fields: ConfigurableAgentField[];
  acceptsImage?: boolean;
  outputTitle?: string;
};

export const defaultConfigurableFields: ConfigurableAgentField[] = [
  {
    key: 'produto',
    label: 'Produto, tema ou ideia',
    type: 'text',
    placeholder: 'Ex: Kit 3 Baby Dolls',
    required: true,
  },
  {
    key: 'objetivo',
    label: 'Objetivo do resultado',
    type: 'textarea',
    placeholder: 'Ex: criar um roteiro persuasivo para TikTok Shop',
  },
  {
    key: 'estilo',
    label: 'Estilo',
    type: 'select',
    options: ['Natural', 'Persuasivo', 'Cinematografico', 'Educativo', 'Direto'],
  },
];

export const slugifyAgentTitle = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const buildConfigurableAgentPrompt = (
  masterPrompt: string,
  fields: ConfigurableAgentField[] = defaultConfigurableFields
): string =>
  JSON.stringify(
    {
      kind: 'configurable_agent',
      version: 1,
      masterPrompt,
      fields,
      acceptsImage: true,
      outputTitle: 'Resultado gerado',
    } satisfies ConfigurableAgentConfig,
    null,
    2
  );

export const parseConfigurableAgent = (
  prompt?: string
): ConfigurableAgentConfig | null => {
  if (!prompt?.trim()) return null;

  try {
    const parsed = JSON.parse(prompt);

    if (parsed?.kind !== 'configurable_agent') return null;
    if (!Array.isArray(parsed.fields)) return null;

    return {
      kind: 'configurable_agent',
      version: 1,
      masterPrompt: String(parsed.masterPrompt || ''),
      fields: parsed.fields,
      acceptsImage: parsed.acceptsImage !== false,
      outputTitle: String(parsed.outputTitle || 'Resultado gerado'),
    };
  } catch {
    return null;
  }
};
