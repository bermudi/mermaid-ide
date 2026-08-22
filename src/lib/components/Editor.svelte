<script lang="ts">
  import DesktopEditor from '$/components/DesktopEditor.svelte';
  import MobileEditor from '$/components/MobileEditor.svelte';
  import { Button } from '$/components/ui/button';
  import { TID } from '$/constants';
  import { aiState, repairDiagram } from '$/util/ai.svelte';
  import { updateCode, updateConfig, validatedState } from '$lib/util/state.svelte';
  import { debounce } from 'lodash-es';
  import ExclamationCircleIcon from '~icons/material-symbols/error-outline-rounded';
  import SparkIcon from '~icons/material-symbols/auto-awesome-outline-rounded';

  const { isMobile } = $props<{ isMobile: boolean }>();
  const onUpdate = (text: string) => {
    if (validatedState.current.editorMode === 'code') {
      updateCode(text);
    } else {
      updateConfig(text);
    }
  };

  let showError = $state(false);
  let isRepairing = $state(false);
  let repairError = $state<string | null>(null);

  const showErrorDebounced = debounce(() => {
    showError = true;
  }, 3000);

  $effect(() => {
    if (validatedState.current.error) {
      showErrorDebounced();
    } else {
      showErrorDebounced.cancel();
      showError = false;
    }

    return () => {
      showErrorDebounced.cancel();
    };
  });

  async function handleRepair() {
    if (!validatedState.current.error || validatedState.current.editorMode !== 'code') return;
    if (!aiState.hasKey) {
      repairError = 'Enter your Vercel AI Gateway key in the AI panel below first.';
      return;
    }
    isRepairing = true;
    repairError = null;
    try {
      const fixed = await repairDiagram(
        validatedState.current.code,
        validatedState.current.error.toString()
      );
      updateCode(fixed, { updateDiagram: true });
    } catch (e) {
      repairError = e instanceof Error ? e.message : String(e);
    } finally {
      isRepairing = false;
    }
  }
</script>

<div class="flex h-full flex-col">
  {#if isMobile}
    <MobileEditor {onUpdate} />
  {:else}
    <DesktopEditor {onUpdate} />
  {/if}
  {#if showError && validatedState.current.error instanceof Error}
    <div class="flex flex-col text-sm" data-testid={TID.errorContainer}>
      <div class="flex items-center justify-between gap-2 bg-slate-900 p-2 text-white">
        <div class="flex w-fit items-center gap-2">
          <ExclamationCircleIcon class="size-6 text-destructive" aria-hidden="true" />
          <div class="flex flex-col">
            <p>Syntax error</p>
            {#if validatedState.current.editorMode === 'code'}
              <p class="text-xs text-white/60" data-testid={TID.aiHelpText}>
                {#if aiState.hasKey}
                  Repair with AI via {aiState.model}
                {:else}
                  Enter your Gateway key in the AI panel to enable repair
                {/if}
              </p>
            {/if}
          </div>
        </div>
        {#if validatedState.current.editorMode === 'code'}
          <Button
            variant="accent"
            size="sm"
            data-testid={TID.aiRepairButton}
            onclick={handleRepair}
            disabled={isRepairing}>
            <SparkIcon class={isRepairing ? 'animate-spin' : ''} />
            {isRepairing ? 'Repairing...' : 'AI Repair'}
          </Button>
        {/if}
      </div>
      <output class="max-h-32 overflow-auto bg-muted p-2" name="mermaid-error" for="editor">
        <pre>{validatedState.current.error?.toString()}</pre>
      </output>
      {#if repairError}
        <div class="bg-destructive/10 p-2 text-xs text-destructive">{repairError}</div>
      {/if}
    </div>
  {/if}
</div>
