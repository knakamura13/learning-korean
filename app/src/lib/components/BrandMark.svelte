<span class="mark" lang="ko">
	<span class="vh">한</span>
	<svg class="jamo jamo-h" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
		<text x="24" y="40" text-anchor="middle">한</text>
	</svg>
	<svg class="jamo jamo-a" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
		<text x="24" y="40" text-anchor="middle">한</text>
	</svg>
	<svg class="jamo jamo-n" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
		<text x="24" y="40" text-anchor="middle">한</text>
	</svg>
</span>

<style>
	.mark {
		position: relative;
		display: inline-grid;
		inline-size: 1.25rem;
		block-size: 1.25rem;
		color: var(--accent);
		line-height: 1;
		overflow: visible;
	}

	.jamo {
		grid-area: 1 / 1;
		inline-size: 100%;
		block-size: 100%;
		overflow: visible;
		display: block;
	}

	.jamo text {
		fill: currentColor;
		font-family: var(--hangul);
		font-size: 40px;
		font-weight: 500;
		font-style: normal;
	}

	/* Slice 한 into ㅎ (top-left), ㅏ (right), ㄴ (bottom) so each SVG can wiggle alone. */
	.jamo-h {
		clip-path: inset(0 36% 32% 0);
		transform-origin: 32% 34%;
	}
	.jamo-a {
		clip-path: inset(0 0 30% 58%);
		transform-origin: 78% 38%;
	}
	.jamo-n {
		clip-path: inset(64% 0 0 0);
		transform-origin: 50% 86%;
	}

	.mark:hover .jamo-h,
	:global(a.brand:hover) .jamo-h,
	:global(a.brand:focus-visible) .jamo-h {
		animation: han-wiggle-h 640ms var(--ease-in-out) infinite;
	}
	.mark:hover .jamo-a,
	:global(a.brand:hover) .jamo-a,
	:global(a.brand:focus-visible) .jamo-a {
		animation: han-wiggle-a 640ms var(--ease-in-out) 80ms infinite;
	}
	.mark:hover .jamo-n,
	:global(a.brand:hover) .jamo-n,
	:global(a.brand:focus-visible) .jamo-n {
		animation: han-wiggle-n 640ms var(--ease-in-out) 160ms infinite;
	}

	@keyframes -global-han-wiggle-h {
		0%,
		100% {
			transform: rotate(0deg) translate(0, 0);
		}
		25% {
			transform: rotate(22deg) translate(1.5px, -3px);
		}
		55% {
			transform: rotate(-18deg) translate(-2px, 1.5px);
		}
		80% {
			transform: rotate(8deg) translate(1px, -1px);
		}
	}

	@keyframes -global-han-wiggle-a {
		0%,
		100% {
			transform: rotate(0deg) translate(0, 0);
		}
		20% {
			transform: rotate(-20deg) translate(2.5px, 1px);
		}
		50% {
			transform: rotate(24deg) translate(-1.5px, -3px);
		}
		75% {
			transform: rotate(-10deg) translate(1px, 0.8px);
		}
	}

	@keyframes -global-han-wiggle-n {
		0%,
		100% {
			transform: rotate(0deg) translateX(0);
		}
		30% {
			transform: rotate(16deg) translateX(4px);
		}
		60% {
			transform: rotate(-20deg) translateX(-3.5px);
		}
		85% {
			transform: rotate(8deg) translateX(1.5px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mark:hover .jamo-h,
		.mark:hover .jamo-a,
		.mark:hover .jamo-n,
		:global(a.brand:hover) .jamo-h,
		:global(a.brand:hover) .jamo-a,
		:global(a.brand:hover) .jamo-n,
		:global(a.brand:focus-visible) .jamo-h,
		:global(a.brand:focus-visible) .jamo-a,
		:global(a.brand:focus-visible) .jamo-n {
			animation: none;
		}
		.mark:hover,
		:global(a.brand:hover) .mark,
		:global(a.brand:focus-visible) .mark {
			color: var(--ink);
		}
	}

	@media (max-width: 30rem) {
		.mark {
			inline-size: 1rem;
			block-size: 1rem;
		}
	}

	@media (forced-colors: active) {
		.mark {
			color: LinkText;
		}
	}
</style>
