<script lang="ts">
	import type { Snippet } from 'svelte';
	import Colophon from './Colophon.svelte';

	let { article, well }: { article: Snippet; well: Snippet } = $props();
</script>

<div class="fascicle">
	<div class="article-column">
		{@render article()}
		<Colophon />
	</div>
	<div class="well-slot">
		{@render well()}
	</div>
</div>
