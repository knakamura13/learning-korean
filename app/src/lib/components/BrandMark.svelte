<span class="mark" lang="ko">
	<span class="vh">한</span>
	<svg
		viewBox="-1 -48 937 992"
		fill="currentColor"
		aria-hidden="true"
		focusable="false"
	>
		<g class="jamo jamo-h">
			<path
				d="M47.20 104.64H585.88V187.84H47.20ZM264.20 0.00H368.88V146.16H264.20Z"
			/>
			<path
				fill-rule="evenodd"
				d="M316.60 230.32Q381.96 230.32 431.88 252.06Q481.80 273.80 509.82 312.66Q537.84 351.52 537.84 403.32Q537.84 454.68 509.82 493.54Q481.80 532.40 431.88 554.14Q381.96 575.88 316.60 575.88Q251.24 575.88 201.10 554.14Q150.96 532.40 122.94 493.54Q94.92 454.68 94.92 403.32Q94.92 351.52 122.94 312.66Q150.96 273.80 201.10 252.06Q251.24 230.32 316.60 230.32ZM316.60 310.84Q262.80 310.84 229.08 335.58Q195.36 360.32 195.36 403.48Q195.36 445.88 229.08 470.62Q262.80 495.36 316.60 495.36Q370.75 495.36 404.08 470.62Q437.40 445.88 437.40 403.48Q437.40 360.32 404.08 335.58Q370.75 310.84 316.60 310.84Z"
			/>
		</g>
		<g class="jamo jamo-a">
			<path
				d="M654.52 0.68H759.20V684.84H654.52ZM728.40 290.96H888.08V378.08H728.40Z"
			/>
		</g>
		<g class="jamo jamo-n">
			<path
				d="M181.48 810.76H796.56V895.64H181.48ZM181.48 631.64H286.28V846.96H181.48Z"
			/>
		</g>
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

	svg {
		display: block;
		inline-size: 100%;
		block-size: 100%;
		overflow: visible;
	}

	.jamo {
		transform-box: fill-box;
		transform-origin: center;
	}

	@media (prefers-reduced-motion: no-preference) {
		:global(a.brand:hover) .jamo-h,
		:global(a.brand:focus-visible) .jamo-h {
			animation: han-nod-h 450ms ease-out 0ms 1 both;
		}
		:global(a.brand:hover) .jamo-a,
		:global(a.brand:focus-visible) .jamo-a {
			animation: han-nod-a 450ms ease-out 100ms 1 both;
		}
		:global(a.brand:hover) .jamo-n,
		:global(a.brand:focus-visible) .jamo-n {
			animation: han-nod-n 450ms ease-out 200ms 1 both;
		}
	}

	@keyframes -global-han-nod-h {
		0%,
		100% {
			transform: rotate(0deg) translateY(0);
		}
		40% {
			transform: rotate(5.5deg) translateY(-1px);
		}
	}

	@keyframes -global-han-nod-a {
		0%,
		100% {
			transform: rotate(0deg) translateY(0);
		}
		40% {
			transform: rotate(-5deg) translateY(-1px);
		}
	}

	@keyframes -global-han-nod-n {
		0%,
		100% {
			transform: rotate(0deg) translateY(0);
		}
		40% {
			transform: rotate(4.5deg) translateY(1px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
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
