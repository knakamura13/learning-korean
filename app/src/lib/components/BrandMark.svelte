<span class="mark" lang="ko">
	<span class="vh">한</span>
	<span class="jamo jamo-h">
		<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
			<text x="24" y="40" text-anchor="middle">한</text>
		</svg>
	</span>
	<span class="jamo jamo-a">
		<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
			<text x="24" y="40" text-anchor="middle">한</text>
		</svg>
	</span>
	<span class="jamo jamo-n">
		<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
			<text x="24" y="40" text-anchor="middle">한</text>
		</svg>
	</span>
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

	.jamo svg {
		display: block;
		inline-size: 100%;
		block-size: 100%;
		overflow: visible;
	}

	.jamo text {
		fill: currentColor;
		font-family: var(--hangul);
		font-size: 40px;
		font-weight: 500;
		font-style: normal;
	}

	/*
	  Partition 한 so ㅎ's loop stays only on the ㅎ slice. A looser ㅏ
	  clip used to keep a second copy of that loop, which read as a period
	  once the slices moved.
	*/
	.jamo-h svg {
		clip-path: inset(0 39% 42% 0);
	}
	.jamo-a svg {
		clip-path: inset(0 0 42% 61%);
	}
	.jamo-n svg {
		clip-path: inset(58% 0 0 0);
	}

	.jamo-h {
		transform-origin: 30% 32%;
	}
	.jamo-a {
		transform-origin: 80% 36%;
	}
	.jamo-n {
		transform-origin: 50% 84%;
	}

	.mark:hover .jamo-h,
	:global(a.brand:hover) .jamo-h,
	:global(a.brand:focus-visible) .jamo-h {
		animation: han-wiggle-h 1.1s var(--ease-in-out) infinite;
	}
	.mark:hover .jamo-a,
	:global(a.brand:hover) .jamo-a,
	:global(a.brand:focus-visible) .jamo-a {
		animation: han-wiggle-a 1.1s var(--ease-in-out) 90ms infinite;
	}
	.mark:hover .jamo-n,
	:global(a.brand:hover) .jamo-n,
	:global(a.brand:focus-visible) .jamo-n {
		animation: han-wiggle-n 1.1s var(--ease-in-out) 180ms infinite;
	}

	@keyframes -global-han-wiggle-h {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(2.4deg) translate(0.2px, -0.35px);
		}
	}

	@keyframes -global-han-wiggle-a {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(-2.2deg) translate(0.3px, 0.15px);
		}
	}

	@keyframes -global-han-wiggle-n {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: rotate(1.8deg) translateX(0.4px);
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
