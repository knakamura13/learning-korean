<span class="mark" lang="ko">
	<span class="vh">한</span>
	<svg class="jamo jamo-h" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
		<path d="M8.5 7.5h18" />
		<circle cx="17.5" cy="19" r="8.2" />
	</svg>
	<svg class="jamo jamo-a" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
		<path d="M32.5 6v26.5" />
		<path d="M32.5 16.5h10" />
	</svg>
	<svg class="jamo jamo-n" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
		<path d="M8.5 34.5v8h31" />
	</svg>
</span>

<style>
	.mark {
		position: relative;
		display: inline-grid;
		inline-size: 1.15rem;
		block-size: 1.15rem;
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

	.jamo path,
	.jamo circle {
		fill: none;
		stroke: currentColor;
		stroke-width: 4.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.jamo-h {
		transform-origin: 36% 36%;
	}
	.jamo-a {
		transform-origin: 74% 38%;
	}
	.jamo-n {
		transform-origin: 50% 84%;
	}

	@media (hover: hover) {
		:global(a.brand:hover) .jamo-h {
			animation: wiggle-h 640ms var(--ease-in-out) infinite;
		}
		:global(a.brand:hover) .jamo-a {
			animation: wiggle-a 640ms var(--ease-in-out) 80ms infinite;
		}
		:global(a.brand:hover) .jamo-n {
			animation: wiggle-n 640ms var(--ease-in-out) 160ms infinite;
		}
	}

	:global(a.brand:focus-visible) .jamo-h {
		animation: wiggle-h 640ms var(--ease-in-out) infinite;
	}
	:global(a.brand:focus-visible) .jamo-a {
		animation: wiggle-a 640ms var(--ease-in-out) 80ms infinite;
	}
	:global(a.brand:focus-visible) .jamo-n {
		animation: wiggle-n 640ms var(--ease-in-out) 160ms infinite;
	}

	@keyframes wiggle-h {
		0%,
		100% {
			transform: rotate(0deg) translate(0, 0);
		}
		25% {
			transform: rotate(8deg) translate(0.2px, -0.6px);
		}
		55% {
			transform: rotate(-7deg) translate(-0.3px, 0.3px);
		}
		80% {
			transform: rotate(3deg) translate(0.1px, -0.2px);
		}
	}

	@keyframes wiggle-a {
		0%,
		100% {
			transform: rotate(0deg) translate(0, 0);
		}
		20% {
			transform: rotate(-7deg) translate(0.4px, 0.2px);
		}
		50% {
			transform: rotate(9deg) translate(-0.2px, -0.5px);
		}
		75% {
			transform: rotate(-4deg) translate(0.2px, 0.15px);
		}
	}

	@keyframes wiggle-n {
		0%,
		100% {
			transform: rotate(0deg) translateX(0);
		}
		30% {
			transform: rotate(6deg) translateX(0.7px);
		}
		60% {
			transform: rotate(-8deg) translateX(-0.6px);
		}
		85% {
			transform: rotate(3deg) translateX(0.25px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(a.brand:hover) .jamo-h,
		:global(a.brand:hover) .jamo-a,
		:global(a.brand:hover) .jamo-n,
		:global(a.brand:focus-visible) .jamo-h,
		:global(a.brand:focus-visible) .jamo-a,
		:global(a.brand:focus-visible) .jamo-n {
			animation: none;
		}
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
