import { createGateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';

const STORAGE_KEY = 'mermaid-ai-gateway-key';
const MODEL_KEY = 'mermaid-ai-model';
export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export const aiState = $state({
  hasKey: typeof window !== 'undefined' ? !!localStorage.getItem(STORAGE_KEY) : false,
  model:
    typeof window !== 'undefined'
      ? (localStorage.getItem(MODEL_KEY) ?? DEFAULT_MODEL)
      : DEFAULT_MODEL
});

export function getApiKey(): string | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(STORAGE_KEY);
}

export function setApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
    aiState.hasKey = true;
  } else {
    localStorage.removeItem(STORAGE_KEY);
    aiState.hasKey = false;
  }
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  aiState.hasKey = false;
}

export function getModel(): string {
  if (typeof window === 'undefined') return DEFAULT_MODEL;
  return localStorage.getItem(MODEL_KEY) ?? DEFAULT_MODEL;
}

export function setModel(model: string): void {
  if (typeof window === 'undefined') return;
  if (model.trim()) {
    localStorage.setItem(MODEL_KEY, model.trim());
    aiState.model = model.trim();
  } else {
    localStorage.removeItem(MODEL_KEY);
    aiState.model = DEFAULT_MODEL;
  }
}

function getGateway() {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Missing API key. Please enter your Vercel AI Gateway key.');
  }
  return createGateway({ apiKey });
}

function extractMermaidCode(text: string): string {
  const trimmed = text.trim();
  const codeBlockMatch = trimmed.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return trimmed;
}

export async function repairDiagram(code: string, error: string): Promise<string> {
  const gateway = getGateway();
  const model = getModel();
  const { text } = await generateText({
    model: gateway(model),
    system:
      'You are an expert in Mermaid diagram syntax. Fix the diagram. Return ONLY the corrected Mermaid code, no explanation, no markdown fences.',
    prompt: `This Mermaid diagram has an error:

\`\`\`mermaid
${code}
\`\`\`

Error:
${error}

Fix it and return only the corrected Mermaid code.`
  });
  return extractMermaidCode(text);
}

export async function editDiagram(code: string, instruction: string): Promise<string> {
  const gateway = getGateway();
  const model = getModel();
  const { text } = await generateText({
    model: gateway(model),
    system:
      'You are an expert in Mermaid diagram syntax. Edit the diagram according to the user instruction. Return ONLY the resulting Mermaid code, no explanation, no markdown fences.',
    prompt: `Current Mermaid diagram:
\`\`\`mermaid
${code}
\`\`\`

Instruction: ${instruction}

Return only the updated Mermaid code.`
  });
  return extractMermaidCode(text);
}

export async function generateDiagram(description: string): Promise<string> {
  const gateway = getGateway();
  const model = getModel();
  const { text } = await generateText({
    model: gateway(model),
    system:
      'You are an expert in Mermaid diagram syntax. Generate a Mermaid diagram from the user description. Return ONLY the Mermaid code, no explanation, no markdown fences.',
    prompt: description
  });
  return extractMermaidCode(text);
}
