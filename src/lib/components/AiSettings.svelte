<script lang="ts">
  import Card from '$/components/Card/Card.svelte';
  import { Button } from '$/components/ui/button';
  import { Input } from '$/components/ui/input';
  import {
    aiState,
    clearApiKey,
    DEFAULT_MODEL,
    editDiagram,
    generateDiagram,
    getApiKey,
    getModel,
    setApiKey,
    setModel
  } from '$/util/ai.svelte';
  import { updateCode, validatedState } from '$/util/state.svelte';
  import { onMount } from 'svelte';
  import KeyIcon from '~icons/material-symbols/key-outline-rounded';
  import VisibilityIcon from '~icons/material-symbols/visibility-outline-rounded';
  import VisibilityOffIcon from '~icons/material-symbols/visibility-off-outline-rounded';

  let apiKey = $state('');
  let model = $state(DEFAULT_MODEL);
  let showKey = $state(false);
  let hasSavedKey = $state(false);
  let justSaved = $state(false);
  let prompt = $state('');
  let isGenerating = $state(false);
  let genError = $state<string | null>(null);

  onMount(() => {
    apiKey = getApiKey() ?? '';
    model = getModel();
    hasSavedKey = !!apiKey;
  });

  function save() {
    setApiKey(apiKey);
    setModel(model || DEFAULT_MODEL);
    hasSavedKey = !!apiKey.trim();
    justSaved = true;
    setTimeout(() => (justSaved = false), 2000);
  }

  function clear() {
    clearApiKey();
    apiKey = '';
    hasSavedKey = false;
  }

  async function handleGenerate() {
    if (!prompt.trim() || !aiState.hasKey) return;
    isGenerating = true;
    genError = null;
    try {
      const code = await generateDiagram(prompt);
      updateCode(code, { updateDiagram: true });
    } catch (e) {
      genError = e instanceof Error ? e.message : String(e);
    } finally {
      isGenerating = false;
    }
  }

  async function handleEdit() {
    if (!prompt.trim() || !aiState.hasKey) return;
    isGenerating = true;
    genError = null;
    try {
      const updated = await editDiagram(validatedState.current.code, prompt);
      updateCode(updated, { updateDiagram: true });
    } catch (e) {
      genError = e instanceof Error ? e.message : String(e);
    } finally {
      isGenerating = false;
    }
  }
</script>

<Card title="AI" icon={{ component: KeyIcon }} isStackable>
  <div class="flex flex-col gap-3 p-3">
    <p class="text-xs text-muted-foreground">
      Bring your own Vercel AI Gateway key. Stored in <code>localStorage</code> only in this
      browser.
      <a
        href="https://vercel.com/docs/ai-gateway"
        target="_blank"
        class="underline hover:text-foreground">Docs</a>
    </p>
    <div class="flex flex-col gap-1">
      <label for="ai-gateway-key" class="text-xs font-medium">Gateway API Key</label>
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Input
            id="ai-gateway-key"
            type={showKey ? 'text' : 'password'}
            placeholder="vck_..."
            bind:value={apiKey}
            class="pr-8 text-xs" />
          <button
            type="button"
            class="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onclick={() => (showKey = !showKey)}
            aria-label={showKey ? 'Hide key' : 'Show key'}>
            {#if showKey}
              <VisibilityOffIcon class="size-4" />
            {:else}
              <VisibilityIcon class="size-4" />
            {/if}
          </button>
        </div>
        <Button size="sm" onclick={save} disabled={!apiKey.trim() && !hasSavedKey}>
          {justSaved ? 'Saved!' : 'Save'}
        </Button>
      </div>
      {#if hasSavedKey}
        <span class="text-xs text-green-600">Key saved locally</span>
      {:else}
        <span class="text-xs text-muted-foreground">No key saved</span>
      {/if}
    </div>
    <div class="flex flex-col gap-1">
      <label for="ai-model" class="text-xs font-medium">Model</label>
      <Input
        id="ai-model"
        type="text"
        placeholder={DEFAULT_MODEL}
        bind:value={model}
        class="text-xs"
        onchange={save} />
      <span class="text-[11px] text-muted-foreground">
        e.g. {DEFAULT_MODEL}, openai/gpt-4o, anthropic/claude-3.5-sonnet
      </span>
    </div>
    {#if hasSavedKey}
      <Button variant="ghost" size="sm" class="w-fit text-xs" onclick={clear}>Clear key</Button>
    {/if}
    <div class="border-t pt-3">
      <label for="ai-prompt" class="text-xs font-medium">AI Prompt</label>
      <textarea
        id="ai-prompt"
        placeholder="Describe a diagram to generate, or how to edit the current one..."
        bind:value={prompt}
        rows="3"
        class="mt-1 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      ></textarea>
      <div class="mt-2 flex gap-2">
        <Button
          size="sm"
          class="flex-1 text-xs"
          onclick={handleGenerate}
          disabled={!prompt.trim() || !aiState.hasKey || isGenerating}>
          {isGenerating ? '...' : 'Generate new'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          class="flex-1 text-xs"
          onclick={handleEdit}
          disabled={!prompt.trim() || !aiState.hasKey || isGenerating}>
          {isGenerating ? '...' : 'Edit current'}
        </Button>
      </div>
      {#if !aiState.hasKey}
        <p class="mt-1 text-[11px] text-muted-foreground">Save a Gateway key first</p>
      {/if}
      {#if genError}
        <p class="mt-1 text-xs text-destructive">{genError}</p>
      {/if}
    </div>
  </div>
</Card>
