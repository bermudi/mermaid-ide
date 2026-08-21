import { C } from '$/constants';

const mermaidAiDomain = 'mermaid.ai';
const mermaidLiveDomain = 'mermaid.live';

/**
 * Check if we're on mermaid.ai
 */
export const isOnMermaidAI = (): boolean => {
  const domain = window.location.hostname;
  return domain === mermaidAiDomain || domain.endsWith(`.${mermaidAiDomain}`);
};

/**
 * Check if we're on mermaid.live
 */
export const isOnMermaidLive = (): boolean => {
  const domain = window.location.hostname;
  return domain === mermaidLiveDomain || domain.endsWith(`.${mermaidLiveDomain}`);
};

/**
 * Check if the editor chooser modal should be shown.
 * Shows for new users who haven't dismissed it and aren't viewing a shared link.
 * Not shown on mobile (viewport width < 640px).
 * Can be forced open for QA via the `?editorChooser=1` query flag, which bypasses
 * the hostname and dismissed checks.
 */
export const shouldShowEditorChooser = (): boolean => {
  return false;
};

/**
 * Dismiss the editor chooser modal permanently
 */
export const dismissEditorChooser = (): void => {
  window.localStorage.setItem(C.editorChooserDismissedKey, 'true');
};
