# Compact lab sitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On `/lab/` at `max-width: 40rem`, put prompt + answers on screen at load: one 48px sitting bar, no duplicate titles, well fills leftover `svh`.

**Architecture:** Compact sitting is CSS + chrome, not a new look. Add `lab-route` on `.frame`. Hide the inline tab strip on that band and mount `SittingNav` (dialog of the same four links) plus a bar `LabSwitcher`. `LabSpread` uses `display: contents` on `.spread-col` so `.after` is not in the well’s overflow. Mid and wide sittings keep today’s chrome.

**Tech Stack:** Svelte 5, SvelteKit 2, existing tokens, Vitest `?raw` source contracts, Playwright smoke on Pixel 7. Package manager is pnpm in `app/`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-29-lab-sitting-density-design.md`. Spec wins.
- Compact sitting = lab route (`pathname` starts with `/lab/`) **and** `max-width: 40rem`. Do not key on `max-height`.
- Portrait phones first. Landscape may page-scroll.
- 44px targets stay: pips, options, switcher, settings, sitting-nav trigger, dialog rows.
- English `Korean` stays visible. Do not `display: none` on `.name`.
- No new type families. No hamburger icon. No gamified HUD.
- Wide `min-width: 72rem` two-column spread, sticky `.spread-col`, `.well { flex-shrink: 0 }` stay. Do not rewrite those rules globally.
- Home, Review, Drill, Reference, Settings keep today’s two-row wrap at `40rem`.
- Teach + Next after settle may sit below the fold. Do not pin Next over the well.
- Mouth and vowel may scroll inside the well. Choice/liaison answers must not require page-scroll on load.
- `prefers-reduced-motion: reduce`: no new sitting-bar animation. Dialogs still use `attachModalDialog`.
- Forced colors: sitting bar and sheets match today’s `.bar` / lab switcher (`Canvas`, `ButtonBorder`, `Highlight` for current).
- Hidden LabSwitcher / tab strip uses `display: none` (out of the a11y tree).
- Document `h1` stays as `.vh` on compact in-progress. Finish card `h1` stays visible.
- Out of scope: landscape no-scroll, pip sheet (B), work-first (C), collapsed `.do` (E), finish-screen geometry, `.do` copy, Review/Drill density.
- Svelte 5: imports at top. Run Svelte MCP `svelte-autofixer` on every `.svelte` edit until clean.
- Tests: `cd app && pnpm test -- <file>` then `pnpm check` before the last commit of a task that touches `.svelte`.
- Run `svelte-autofixer` via the Svelte MCP. Do not skip it.

## File map

- Create: `app/src/lib/components/shell/SittingNav.svelte` — compact sitting menu
- Modify: `app/src/routes/+layout.svelte` — `lab-route` on `.frame`; SittingNav; bar LabSwitcher; compact nowrap overrides
- Modify: `app/src/app.css` — compact lab `.shell` padding + CSS variables
- Modify: `app/src/lib/components/shell/LabSwitcher.svelte` — `variant: 'page' | 'bar'`
- Modify: `app/src/routes/lab/[id]/+page.svelte` — `variant="page"`
- Modify: `app/src/lib/components/LabRunner.svelte` — compact `.head` / `.do` / mouth skeleton
- Modify: `app/src/lib/components/shell/LabSpread.svelte` — fill contract
- Modify: `app/src/lib/components/LabPipRail.svelte` — compact `margin-bottom`
- Modify: `app/src/lib/components/Stage.svelte` — compact padding
- Modify: `app/src/lib/components/steps/VowelStep.svelte` — `--sitting-chrome`
- Modify: `app/src/lib/polish.test.ts` — contracts
- Modify: `app/src/lib/components/shell/labIndexRail.test.ts` — LabSpread compact fill
- Modify: `app/e2e/smoke.spec.ts` — mobile switcher + sitting nav
- Modify: `docs/superpowers/specs/2026-08-29-lab-sitting-density-design.md` — status approved

---

### Task 1: Compact sitting tokens and bar wrap override

**Files:**
- Modify: `app/src/routes/+layout.svelte`
- Modify: `app/src/app.css`
- Modify: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: existing `labRoute`, `.bar.lab-route`, `.inner` wrap at `40rem`
- Produces: `.frame.lab-route`; `--sitting-bar-block`, `--shell-pad-top`, `--shell-pad-bottom`, `--sitting-chrome` on `.frame.lab-route` at `max-width: 40rem`; compact lab `.shell` padding; `.bar.lab-route .inner { flex-wrap: nowrap }` override. Keep the existing `.inner { flex-wrap: wrap }` rule so current regex tests still match.

- [ ] **Step 1: Write the failing tests**

In `app/src/lib/polish.test.ts`, inside `describe('polish audit regressions')`, add (keep the existing wrap regexes that look for `.inner { flex-wrap: wrap`):

```ts
	it('keeps compact lab sitting to one header row and tighter shell padding', () => {
		expect(layout).toMatch(/class=\{\['frame', \{ 'lab-route': labRoute \}\]\}/);
		const layoutCss = styleBlock(layout);
		expect(layoutCss).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.bar\.lab-route \.inner\s*\{[^}]*flex-wrap:\s*nowrap/s
		);
		expect(appCss).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.frame\.lab-route\s*\{[^}]*--sitting-bar-block:\s*calc\(48px \+ env\(safe-area-inset-top/s
		);
		expect(appCss).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.frame\.lab-route\s*\{[^}]*--sitting-chrome:\s*9rem/s
		);
		expect(appCss).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.frame\.lab-route \.shell\s*\{[^}]*padding-top:\s*var\(--s3\)/s
		);
		expect(appCss).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.frame\.lab-route \.shell\s*\{[^}]*padding-bottom:\s*max\(var\(--s3\), env\(safe-area-inset-bottom\)\)/s
		);
		expect(styleBlock(layout)).not.toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.bar\.lab-route \.name\s*\{[^}]*display:\s*none/s
		);
	});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm test -- src/lib/polish.test.ts`

Expected: FAIL — `class={['frame', { 'lab-route': labRoute }]}` not found.

- [ ] **Step 3: Write minimal implementation**

In `app/src/routes/+layout.svelte`, change the frame and add the compact override in the existing `max-width: 40rem` block (do not delete `.inner { flex-wrap: wrap }`):

```svelte
<div class={['frame', { 'lab-route': labRoute }]}>
```

In the layout `<style>` `max-width: 40rem` block, after the existing `.inner` / `nav` wrap rules, add:

```css
		.bar.lab-route .inner {
			flex-wrap: nowrap;
		}
```

Do not set `nav { flex: 1 0 100% }` off yet (Task 2 hides that nav). `nowrap` on the inner is enough for this task.

In `app/src/app.css`, after the existing `@media (max-width: 40rem) { .shell { ... } }` block, add:

```css
@media (max-width: 40rem) {
	.frame.lab-route {
		--sitting-bar-block: calc(48px + env(safe-area-inset-top, 0px));
		--shell-pad-top: var(--s3);
		--shell-pad-bottom: max(var(--s3), env(safe-area-inset-bottom));
		--sitting-chrome: 9rem;
	}
	.frame.lab-route .shell {
		padding-top: var(--s3);
		padding-bottom: max(var(--s3), env(safe-area-inset-bottom));
	}
}
```

`.frame` is a global class on the layout root (`class="frame svelte-…"`). `app.css` is global, so this selector works.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && pnpm test -- src/lib/polish.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/routes/+layout.svelte app/src/app.css app/src/lib/polish.test.ts
git commit -m "feat(lab): compact sitting tokens and one-row bar wrap"
```

---

### Task 2: SittingNav and hide inline tabs on compact lab

**Files:**
- Create: `app/src/lib/components/shell/SittingNav.svelte`
- Modify: `app/src/routes/+layout.svelte`
- Modify: `app/src/lib/polish.test.ts`
- Modify: `app/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: layout `nav` array `{ href, label }`, `sitting`, `load.navAria`, `resolve`, `page`, `attachModalDialog` / `requestModalClose`
- Produces: `SittingNav` with props `{ items, sitting, reviewAria }`. Trigger `aria-label="Main navigation"`, `min-width`/`min-height` 44px, visible text `Labs` + chevron. Dialog lists the four destinations. Review uses `reviewAria` when `sitting > 0` and may show the numeric count in the sheet. 8px presence pip on the trigger when `sitting > 0`. Folder-tab `::before`/`::after` stay on the inline strip only.

- [ ] **Step 1: Write the failing tests**

Add import at the top of `polish.test.ts`:

```ts
import sittingNav from './components/shell/SittingNav.svelte?raw';
```

In `uses logical properties in shared directional layout`, add `sittingNav` to the `const chrome = [` array, after `labSpread`.

Add:

```ts
	it('puts compact lab destinations in a sitting-nav dialog, not a second tab row', () => {
		expect(layout).toMatch(/SittingNav/);
		expect(sittingNav).toMatch(/aria-label="Main navigation"/);
		expect(sittingNav).toMatch(/attachModalDialog/);
		expect(sittingNav).toMatch(/aria-haspopup="dialog"/);
		expect(styleBlock(sittingNav)).toMatch(/\.trigger\s*\{[^}]*min-width:\s*44px/s);
		expect(styleBlock(sittingNav)).toMatch(/\.trigger\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(sittingNav)).toMatch(/\.sitting-sheet a\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(sittingNav)).toMatch(/forced-colors:\s*active/);
		expect(sittingNav).not.toMatch(/hamburger/i);
		expect(styleBlock(layout)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.bar\.lab-route nav\s*\{[^}]*display:\s*none/s
		);
		expect(styleBlock(sittingNav)).toMatch(/\.sitting-nav\s*\{[^}]*display:\s*none/s);
		expect(styleBlock(sittingNav)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.sitting-nav\s*\{[^}]*display:\s*block/s
		);
	});
```

In `app/e2e/smoke.spec.ts`, add after the existing lab navigation test:

```ts
test('compact lab sitting opens main destinations from the sitting-nav', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'mobile', 'compact sitting is the phone band');
	await page.goto('/lab/0001');
	const trigger = page.getByRole('button', { name: 'Main navigation' });
	await expect(trigger).toBeVisible();
	await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
	await trigger.click();
	const sheet = page.locator('dialog.sitting-sheet');
	await expect(sheet).toBeVisible();
	await expect(sheet.getByRole('link', { name: 'Labs' })).toBeVisible();
	await expect(sheet.locator('a[href$="review"]')).toBeVisible();
	await expect(sheet.getByRole('link', { name: 'Drill' })).toBeVisible();
	await expect(sheet.getByRole('link', { name: 'Reference' })).toBeVisible();
	await sheet.locator('a[href$="review"]').click();
	await expect(page).toHaveURL(/\/review\/?$/);
});
```

The home tab-shift test uses `getByRole('navigation', { name: 'Main navigation' })` on `/`. That still works: SittingNav is not mounted off lab routes.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && pnpm test -- src/lib/polish.test.ts`

Expected: FAIL — `SittingNav` not found.

- [ ] **Step 3: Implement SittingNav and wire it**

Create `app/src/lib/components/shell/SittingNav.svelte`:

```svelte
<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { attachModalDialog, requestModalClose } from '$lib/a11y/attachModalDialog';

	let {
		items,
		sitting,
		reviewAria
	}: {
		items: readonly { href: string; label: string }[];
		sitting: number;
		reviewAria: string;
	} = $props();

	let open = $state(false);
	let sheetEl = $state<HTMLDialogElement | null>(null);

	function isActive(href: string): boolean {
		return href === '/'
			? page.url.pathname === '/' || page.url.pathname.startsWith('/lab/')
			: page.url.pathname.startsWith(href);
	}

	function attachSheet(node: HTMLDialogElement) {
		sheetEl = node;
		const stop = attachModalDialog(node, () => (open = false));
		return () => {
			sheetEl = null;
			stop();
		};
	}

	function closeSheet() {
		if (sheetEl) requestModalClose(sheetEl, () => (open = false));
		else open = false;
	}
</script>

<div class="sitting-nav">
	<button
		type="button"
		class="trigger"
		aria-label="Main navigation"
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={() => (open = true)}
	>
		<span class="label">Labs</span>
		<svg class="chev" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
			<path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" />
		</svg>
		{#if sitting > 0}
			<span class="badge" aria-hidden="true"></span>
		{/if}
	</button>

	{#if open}
		<dialog
			class="sitting-sheet"
			aria-labelledby="sitting-nav-heading"
			{@attach attachSheet}
		>
			<h2 id="sitting-nav-heading">Main navigation</h2>
			<nav>
				<ul>
					{#each items as item (item.href)}
						<li>
							<a
								href={resolve(item.href)}
								aria-current={isActive(item.href) ? 'page' : undefined}
								aria-label={item.href === '/review' && sitting > 0 ? reviewAria : undefined}
								onclick={closeSheet}
							>
								{item.label}
								{#if item.href === '/review' && sitting > 0}
									<span class="count">{sitting}</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
			<button type="button" class="btn ghost close" onclick={closeSheet}>Close</button>
		</dialog>
	{/if}
</div>

<style>
	.sitting-nav {
		display: none;
		flex-shrink: 0;
	}
	@media (max-width: 40rem) {
		.sitting-nav {
			display: block;
		}
	}

	.trigger {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--s1);
		min-width: 44px;
		min-height: 44px;
		padding: 0 var(--s2);
		border: 0;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--accent);
		font: inherit;
		font-size: 0.84rem;
		cursor: pointer;
	}
	.trigger:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}

	.label { font-weight: 500; }
	.chev {
		inline-size: 12px;
		block-size: 12px;
	}

	.badge {
		position: absolute;
		inset-inline-end: 0.15rem;
		inset-block-start: 0.2rem;
		inline-size: 8px;
		block-size: 8px;
		border-radius: 50%;
		background: var(--rose);
	}

	.sitting-sheet {
		width: min(26rem, calc(100% - 2rem));
		max-height: min(70dvh, 34rem);
		padding: var(--s4);
		border: 1px solid var(--rule);
		border-radius: var(--r-lg);
		background: var(--paper-raised);
		color: var(--ink);
		box-shadow: var(--shadow-3);
		overscroll-behavior: contain;
	}
	.sitting-sheet::backdrop {
		background: color-mix(in srgb, var(--ink) 35%, transparent);
	}
	.sitting-sheet h2 {
		margin: 0 0 var(--s3);
		font-family: var(--display);
		font-style: italic;
		font-size: 1.1rem;
		font-weight: 400;
	}
	.sitting-sheet ul {
		list-style: none;
		margin: 0 0 var(--s3);
		padding: 0;
	}
	.sitting-sheet a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 44px;
		padding: var(--s1) var(--s2);
		border-radius: var(--r-sm);
		text-decoration: none;
		color: var(--ink);
		font-size: 0.87rem;
	}
	.sitting-sheet a[aria-current='page'] {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.count {
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
		font-size: 0.75rem;
	}
	.close { min-height: 44px; }

	@media (prefers-reduced-motion: reduce) {
		.trigger { transition: none; }
	}

	@media (forced-colors: active) {
		.trigger { color: ButtonText; }
		.sitting-sheet {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
		.sitting-sheet a[aria-current='page'] {
			background: Highlight;
			color: HighlightText;
		}
		.badge { background: Highlight; }
	}
</style>
```

In `+layout.svelte` script, add:

```ts
	import SittingNav from '$lib/components/shell/SittingNav.svelte';
```

In the header `.inner`, after `a.brand` and before `<nav>`:

```svelte
		{#if labRoute}
			<SittingNav items={nav} sitting={sitting} reviewAria={load.navAria} />
		{/if}
```

`nav` is a `const` array. Passing it as `items={nav}` is fine.

In layout `max-width: 40rem` styles add:

```css
		.bar.lab-route nav {
			display: none;
		}
```

Also hide SittingNav above the compact band: the component already `display: none` by default and `display: block` at `max-width: 40rem`. Layout only mounts it on `labRoute`, so at 800px lab width the component is mounted but hidden, and the inline `<nav>` is visible (the `display: none` override is inside `max-width: 40rem` only).

Call Svelte MCP `svelte-autofixer` on `SittingNav.svelte` and `+layout.svelte`. Fix until clean.

- [ ] **Step 4: Run tests**

Run: `cd app && pnpm test -- src/lib/polish.test.ts`

Expected: PASS. Then `cd app && pnpm check`.

E2E is Task 7. Do not run the full Playwright suite here unless the app is already built.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/components/shell/SittingNav.svelte app/src/routes/+layout.svelte app/src/lib/polish.test.ts app/e2e/smoke.spec.ts
git commit -m "feat(lab): sitting-nav dialog for compact lab chrome"
```

---

### Task 3: LabSwitcher bar and page variants

**Files:**
- Modify: `app/src/lib/components/shell/LabSwitcher.svelte`
- Modify: `app/src/routes/+layout.svelte`
- Modify: `app/src/routes/lab/[id]/+page.svelte`
- Modify: `app/src/lib/polish.test.ts`
- Modify: `app/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `currentId: string`
- Produces: `variant?: 'page' | 'bar'` default `'page'`. Root `class={['switcher', variant]}`. `.switcher.bar` hidden except `max-width: 40rem`. `.switcher.page` `display: none` at `max-width: 40rem`. Existing `@media (min-width: 72rem) { .switcher { display: none } }` stays and hides both. Bar trigger `flex: 1 1 auto; min-width: 0` so the title truncates. `min-height: 44px` stays.

- [ ] **Step 1: Write the failing tests**

Replace the existing `gives phones a lab switcher where the index rail is display:none` assertions that require `labPage` to match `LabSwitcher` (keep that). Add:

```ts
	it('mounts a bar lab switcher on compact sitting and hides the page switcher', () => {
		expect(layout).toMatch(/LabSwitcher/);
		expect(layout).toMatch(/variant="bar"/);
		expect(labPage).toMatch(/variant="page"/);
		expect(labSwitcher).toMatch(/variant\s*=\s*'page'/);
		expect(styleBlock(labSwitcher)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.switcher\.page\s*\{[^}]*display:\s*none/s
		);
		expect(styleBlock(labSwitcher)).toMatch(
			/\.switcher\.bar\s*\{[^}]*display:\s*none/s
		);
		expect(styleBlock(labSwitcher)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.switcher\.bar\s*\{[^}]*display:\s*flex/s
		);
		expect(styleBlock(labSwitcher)).toMatch(/\.trigger\s*\{[^}]*min-height:\s*44px/s);
	});
```

In `app/e2e/smoke.spec.ts` lab navigation test, on mobile click the **visible** switcher:

```ts
	if (testInfo.project.name === 'mobile') {
		const switcher = page.locator('.switcher.bar .trigger');
		await expect(switcher).toBeVisible();
		await expect(page.locator('.switcher.page')).toBeHidden();
		await expect(rail).toBeHidden();
		await switcher.click();
		const sheet = page.locator('dialog.sheet');
		await expect(sheet).toBeVisible();
		await expect(sheet.locator('a')).toHaveCount(10);
		await expect(sheet.locator('a[aria-current="page"]')).toHaveCount(1);
		await sheet.locator('a').nth(1).click();
		await expect(page).toHaveURL(/\/lab\/0002$/);
		await expect(page.locator('dialog.sheet')).toBeHidden();
	} else {
		await expect(page.locator('.switcher .trigger')).toBeHidden();
		await expect(rail).toBeVisible();
	}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && pnpm test -- src/lib/polish.test.ts`

Expected: FAIL — `variant="bar"` not in layout.

- [ ] **Step 3: Implement**

`LabSwitcher.svelte` props:

```ts
	let {
		currentId,
		variant = 'page'
	}: {
		currentId: string;
		variant?: 'page' | 'bar';
	} = $props();
```

Root:

```svelte
<div class={['switcher', variant]}>
```

CSS (keep the 72rem hide last so it wins on desktop):

```css
	.switcher.bar {
		display: none;
		margin-block-end: 0;
		flex: 1 1 auto;
		min-width: 0;
	}
	.switcher.bar .trigger {
		max-width: 100%;
		background: transparent;
		border-color: transparent;
	}

	@media (max-width: 40rem) {
		.switcher.page {
			display: none;
		}
		.switcher.bar {
			display: flex;
		}
	}

	@media (min-width: 72rem) {
		.switcher {
			display: none;
		}
	}
```

Keep existing `.trigger { min-height: 44px }` and `.title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }`.

Layout: import LabSwitcher. After brand, before SittingNav:

```svelte
		{#if labRoute && labId}
			<LabSwitcher currentId={labId} variant="bar" />
		{/if}
```

Add in layout script:

```ts
	const labId = $derived(
		typeof page.params.id === 'string' && page.url.pathname.includes('/lab/')
			? page.params.id
			: ''
	);
```

`page` is already imported from `$app/state`.

Inner order: brand, bar LabSwitcher, SittingNav, `<nav>`, SettingsLink.

Bar inner at compact sitting needs the switcher to shrink: in layout `max-width: 40rem`:

```css
		.bar.lab-route .inner :global(.switcher.bar) {
			flex: 1 1 auto;
			min-width: 0;
		}
```

Page: `<LabSwitcher currentId={lab.id} variant="page" />`

Svelte MCP `svelte-autofixer` on both files.

- [ ] **Step 4: Run tests**

Run: `cd app && pnpm test -- src/lib/polish.test.ts`

Expected: PASS. `cd app && pnpm check`.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/components/shell/LabSwitcher.svelte app/src/routes/+layout.svelte app/src/routes/lab/\[id\]/+page.svelte app/src/lib/polish.test.ts app/e2e/smoke.spec.ts
git commit -m "feat(lab): bar lab switcher as the compact sitting title"
```

---

### Task 4: LabRunner compact head

**Files:**
- Modify: `app/src/lib/components/LabRunner.svelte`
- Modify: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: existing `.head`, `compactHead`, `.eyebrow`, `h1`, `.standfirst`, `.do`
- Produces: compact sitting (`max-width: 40rem`) hides eyebrow and standfirst, `h1` gets class `vh`, `.head { margin: 0 }`, `.do { font-size: 1.1rem }`. `compactHead` unchanged for mid/wide. Finish `h1` unchanged.

- [ ] **Step 1: Write the failing tests**

```ts
	it('hides duplicate lab title chrome on compact sitting and keeps a visually hidden h1', () => {
		expect(labRunner).toMatch(/<h1 class="vh">\{lab\.title\}<\/h1>/);
		const css = styleBlock(labRunner);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.head\s*\{[^}]*margin:\s*0/s
		);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.eyebrow,\s*\.standfirst\s*\{[^}]*display:\s*none/s
		);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.do\s*\{[^}]*font-size:\s*1\.1rem/s
		);
		expect(css).toMatch(
			/\.do\s*\{[^}]*font-size:\s*clamp\(1\.15rem, 1\.15rem \+ [^,]+, 1\.45rem\)/s
		);
	});
```

The `h1` markup may be `class="vh"` only on compact via `class:vh` always? Spec: on compact sitting the h1 is `.vh`. If we always add `.vh` at mid/wide, the visible title disappears on tablet. So **CSS** must do the hiding, not a permanent class:

Preferred markup — keep `<h1>{lab.title}</h1>` and:

```css
@media (max-width: 40rem) {
  .head h1 {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}
```

That duplicates `.vh`. Better: `class="vh"` **only via a media-less class that we apply in CSS**:

```svelte
<h1 class="sit-title">{lab.title}</h1>
```

```css
@media (max-width: 40rem) {
  .head .sit-title {
    /* copy .vh rules */
  }
}
```

Simplest locked approach matching the spec’s “class `.vh`”: always keep one h1, and at compact sitting add the global `vh` class with a matchMedia? That is JS. **Do not** use matchMedia for this. Use CSS that clones `.vh` onto `.head h1` at `40rem`.

Then the test is:

```ts
	it('hides duplicate lab title chrome on compact sitting and keeps a document h1', () => {
		expect(labRunner).toMatch(/<h1>\{lab\.title\}<\/h1>/);
		const css = styleBlock(labRunner);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.head\s*\{[^}]*margin:\s*0/s
		);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.head \.eyebrow,\s*\.head \.standfirst\s*\{[^}]*display:\s*none/s
		);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.head h1\s*\{[^}]*clip:\s*rect\(0, 0, 0, 0\)/s
		);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.do\s*\{[^}]*font-size:\s*1\.1rem/s
		);
	});
```

Do **not** put `class="vh"` on finish `h1`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm test -- src/lib/polish.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement**

Keep the `.head` markup. Add at the end of LabRunner `<style>` (before finish styles is fine):

```css
	@media (max-width: 40rem) {
		.head {
			margin: 0;
		}
		.head .eyebrow,
		.head .standfirst {
			display: none;
		}
		.head h1 {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}
		.do {
			font-size: 1.1rem;
			line-height: 1.34;
		}
	}
```

`compactHead` still drops standfirst from the DOM after card 1 on all widths (`{#if !compactHead}`). Compact CSS `display: none` covers card 1 when standfirst is in the DOM.

Svelte MCP `svelte-autofixer` on `LabRunner.svelte`.

- [ ] **Step 4: Run tests**

Run: `cd app && pnpm test -- src/lib/polish.test.ts`

Expected: PASS. Existing `.do` clamp test still matches the first `.do` block. `cd app && pnpm check`.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/components/LabRunner.svelte app/src/lib/polish.test.ts
git commit -m "feat(lab): hide duplicate title chrome on compact sitting"
```

---

### Task 5: LabSpread viewport-fill well

**Files:**
- Modify: `app/src/lib/components/shell/LabSpread.svelte`
- Modify: `app/src/lib/components/shell/labIndexRail.test.ts`
- Modify: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: existing `article` / `well` / `after` snippets; `.spread-col` wraps well then after
- Produces: at `max-width: 40rem`, `.spread:not(.solo)` is a column flex with `min-height: calc(100svh - var(--sitting-bar-block) - var(--shell-pad-top) - var(--shell-pad-bottom))`. `.spread-col { display: contents }`. `.well` `flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: var(--s3)`. `.article` / `.after` `flex: 0 0 auto`. Gap `--s3`. Do not set a fixed `height` on `.spread`. Wide sticky / `flex-shrink: 0` rules stay inside `min-width: 72rem` or the default `.well` block.

- [ ] **Step 1: Write the failing tests**

In `labIndexRail.test.ts` `describe('LabSpread source contracts')`:

```ts
	it('fills leftover svh with the well on compact sitting and keeps after outside that overflow', () => {
		const css = styleBlock(spread);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.spread:not\(\.solo\)\s*\{[^}]*min-height:\s*calc\(100svh/s
		);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.spread:not\(\.solo\)[\s\S]*\.spread-col\s*\{[^}]*display:\s*contents/s
		);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.spread:not\(\.solo\)[\s\S]*\.well\s*\{[^}]*min-height:\s*0/s
		);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.spread:not\(\.solo\)[\s\S]*\.well\s*\{[^}]*overflow-y:\s*auto/s
		);
		expect(css).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.spread:not\(\.solo\)[\s\S]*gap:\s*var\(--s3\)/s
		);
		expect(css).toMatch(/\.well\s*\{[^}]*flex-shrink:\s*0/s);
		expect(css).toMatch(/\.after\s*\{[^}]*flex-shrink:\s*0/s);
	});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm test -- src/lib/components/shell/labIndexRail.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement**

In `LabSpread.svelte` `<style>`, after the base `.well` rules and **before** `min-width: 72rem`:

```css
	@media (max-width: 40rem) {
		.spread:not(.solo) {
			display: flex;
			flex-direction: column;
			gap: var(--s3);
			min-height: calc(
				100svh - var(--sitting-bar-block, 48px) - var(--shell-pad-top, var(--s5)) -
					var(--shell-pad-bottom, var(--s7))
			);
		}
		.spread:not(.solo) .article {
			flex: 0 0 auto;
		}
		.spread:not(.solo) .spread-col {
			display: contents;
		}
		.spread:not(.solo) .well {
			flex: 1 1 auto;
			min-height: 0;
			overflow-y: auto;
			overscroll-behavior: contain;
			padding: var(--s3);
		}
		.spread:not(.solo) .after {
			flex: 0 0 auto;
		}
	}
```

Do not remove `min-height: 16rem` from the **unqualified** `.well` — the compact selector overrides it with higher specificity. Wide `min-width: 72rem` `.well { min-height: 320px }` stays.

Svelte MCP `svelte-autofixer` on `LabSpread.svelte`.

- [ ] **Step 4: Run tests**

Run: `cd app && pnpm test -- src/lib/components/shell/labIndexRail.test.ts src/lib/polish.test.ts`

Expected: PASS. `cd app && pnpm check`.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/components/shell/LabSpread.svelte app/src/lib/components/shell/labIndexRail.test.ts app/src/lib/polish.test.ts
git commit -m "feat(lab): fill leftover viewport with the compact sitting well"
```

---

### Task 6: Pip rail, Stage, vowel dock, mouth skeleton

**Files:**
- Modify: `app/src/lib/components/LabPipRail.svelte`
- Modify: `app/src/lib/components/Stage.svelte`
- Modify: `app/src/lib/components/steps/VowelStep.svelte`
- Modify: `app/src/lib/components/LabRunner.svelte`
- Modify: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: `.rail-wrap { margin-bottom: var(--s4) }`; Stage `padding: var(--s5) 0 var(--s6)`; vowel `.zone` `calc(100dvh - 14rem)`; `.work-skel .mouth-ph` `min-height: 16rem; aspect-ratio: 1`
- Produces: compact `40rem` pip `margin-bottom: var(--s2)`; Stage padding `var(--s3) 0 var(--s4)`; vowel `calc(100svh - var(--sitting-chrome, 14rem))`; compact mouth-ph `min-height: 8rem; aspect-ratio: auto`. Pip jump / 44px / phase rules unchanged.

- [ ] **Step 1: Write the failing tests**

```ts
	it('tightens compact sitting pip, stage, vowel dock, and mouth skeleton', () => {
		expect(styleBlock(labPipRail)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.rail-wrap\s*\{[^}]*margin-bottom:\s*var\(--s2\)/s
		);
		expect(styleBlock(stage)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.stage\s*\{[^}]*padding:\s*var\(--s3\) 0 var\(--s4\)/s
		);
		expect(styleBlock(vowelStep)).toMatch(/100svh - var\(--sitting-chrome, 14rem\)/);
		expect(sittingCss).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.work-skel \.mouth-ph\s*\{[^}]*min-height:\s*8rem/s
		);
		expect(sittingCss).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.work-skel \.mouth-ph\s*\{[^}]*aspect-ratio:\s*auto/s
		);
		expect(styleBlock(labPipRail)).toMatch(/min-width:\s*44px/);
		expect(styleBlock(labPipRail)).toMatch(/min-height:\s*44px/);
	});
```

Keep the existing mouth-skel test that asserts the **default** 16rem / `aspect-ratio: 1` block.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm test -- src/lib/polish.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement**

`LabPipRail.svelte`:

```css
	@media (max-width: 40rem) {
		.rail-wrap {
			margin-bottom: var(--s2);
		}
	}
```

`Stage.svelte` — add a `40rem` query (there is already `34rem` for glyphs):

```css
	@media (max-width: 40rem) {
		.stage {
			padding: var(--s3) 0 var(--s4);
		}
	}
```

`VowelStep.svelte` `.zone` width:

```css
		width: min(100%, max(16rem, calc(100svh - var(--sitting-chrome, 14rem))));
```

`LabRunner.svelte`:

```css
	@media (max-width: 40rem) {
		.work-skel .mouth-ph {
			min-height: 8rem;
			aspect-ratio: auto;
		}
	}
```

Svelte MCP `svelte-autofixer` on each edited `.svelte`.

- [ ] **Step 4: Run tests**

Run: `cd app && pnpm test -- src/lib/polish.test.ts`

Expected: PASS. `cd app && pnpm check`.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/components/LabPipRail.svelte app/src/lib/components/Stage.svelte app/src/lib/components/steps/VowelStep.svelte app/src/lib/components/LabRunner.svelte app/src/lib/polish.test.ts
git commit -m "feat(lab): compact pip, stage, vowel, and skeleton density"
```

---

### Task 7: Spec status, check, e2e smoke

**Files:**
- Modify: `docs/superpowers/specs/2026-08-29-lab-sitting-density-design.md`
- Modify: `app/e2e/smoke.spec.ts` (if Task 2/3 e2e was deferred)
- Test: `app/e2e/axe.spec.ts` (run only; no change unless it fails)

**Interfaces:**
- Consumes: Tasks 1–6
- Produces: spec **Status:** `approved; implement`. Mobile Pixel 7 smoke: bar switcher, sitting-nav, no duplicate visible Main navigation landmark on `/lab/0001`. Home still has the tab strip.

- [ ] **Step 1: Set spec status**

Change the spec header from `ready to implement (written spec pending review)` to `approved; implement`.

- [ ] **Step 2: Full unit + check**

Run: `cd app && pnpm test && pnpm check`

Expected: PASS.

- [ ] **Step 3: E2E**

Build is required (`ADAPTER=node pnpm build` if that is how this repo’s Playwright webServer works — see `app/playwright.config.ts`: it runs `node build/index.js`. Build first:

```bash
cd app && ADAPTER=node pnpm build && pnpm test:e2e e2e/smoke.spec.ts e2e/axe.spec.ts
```

Expected: PASS on desktop and mobile projects.

If axe fails because two `Main navigation` names exist, the compact lab inline `<nav>` is not `display: none`. Fix that before adding axe exceptions.

Manual (Pixel 7 / 375×667 equivalent, if a browser is available):

1. Lab 05 choice 2×2: phase + `.do` + four options on screen at load.
2. Lab 06 card 1: prompt + Hangul + picks; standfirst gone.
3. Lab 01 mouth: prompt on screen; diagram may scroll inside the well.
4. After a correct pick, teach + Next may sit below the fold.
5. `/` still wraps tabs to a second row.
6. Desktop 1280 two-column spread unchanged.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-29-lab-sitting-density-design.md app/e2e/smoke.spec.ts
git commit -m "docs: mark compact sitting spec approved"
```

If e2e needed a code fix, commit that separately with a `fix(lab):` message.

---

## Spec coverage (self-review)

| Spec item | Task |
|---|---|
| G1 portrait / no 400–500 / `svh` | 1, 5 |
| G2 prompt+answers on load; teach may scroll; mouth/vowel inner scroll | 5, 6 |
| G3 duplicate chrome | 3, 4 |
| G4 drop 16rem well floor on compact | 5 |
| G5 44px | 2, 3, 6 |
| G6 h1 `.vh` via clip on compact | 4 |
| G7 no new look | all |
| G8 desktop spread unchanged | 5 |
| Sitting bar contents | 2, 3 |
| Two LabSwitcher mounts | 3 |
| Shell padding | 1 |
| Pip margin | 6 |
| `.do` 1.1rem | 4 |
| Stage / vowel / skeleton | 6 |
| Forced-colors / reduced-motion | 2, 3 |
| Skip link / card-change uses `header.bar` bottom | already in LabRunner; no hardcoded two-row |
| Home wrap stays | 1, 2 (`:not` via override, wrap rule kept) |
| Brand Korean visible | 1 test |
| Finish geometry | solo excluded in Task 5 |
| E2E mobile | 2, 3, 7 |
