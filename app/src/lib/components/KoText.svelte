<script lang="ts">
	import { splitKo } from '$lib/a11y/lang';

	let { text }: { text: string } = $props();
</script>

{#each splitKo(text) as part, i (`${i}:${part.text}`)}
	{#if part.ko}<span lang="ko">{part.text}</span>{:else}{part.text}{/if}
{/each}
