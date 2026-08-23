/**
 * Source contracts for GitHub #144 — screen-reader semantic parity.
 * These pin AT-visible structure; they do not replace a VoiceOver pass.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import layout from '../../routes/+layout.svelte?raw';
import healthz from '../../routes/healthz/+page.svelte?raw';
import labPage from '../../routes/lab/[id]/+page.svelte?raw';
import reference from '../../routes/reference/+page.svelte?raw';
import audioClip from '../components/AudioClip.svelte?raw';
import labDragClient from '../components/labDrag.client.ts?raw';
import progressBackup from '../components/ProgressBackup.svelte?raw';
import reviewCompose from '../components/ReviewCompose.svelte?raw';
import settingsLink from '../components/SettingsLink.svelte?raw';
import slots from '../components/Slots.svelte?raw';
import target from '../components/Target.svelte?raw';
import tray from '../components/Tray.svelte?raw';
import clusterStep from '../components/steps/ClusterStep.svelte?raw';
import liaisonStep from '../components/steps/LiaisonStep.svelte?raw';
import mouthStep from '../components/steps/MouthStep.svelte?raw';
import readStep from '../components/steps/ReadStep.svelte?raw';

const appCss = readFileSync(new URL('../../app.css', import.meta.url), 'utf8');

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('no style block');
	return match[1];
}

describe('a11y semantic parity (#144)', () => {
	it('renders /reference specimen grids as lists', () => {
		const grids = reference.match(/class="grid"/g) ?? [];
		expect(grids.length).toBe(3);
		expect(reference).toMatch(/<ul class="grid">/);
		expect(reference).toMatch(/<li class="cell">/);
		expect(styleBlock(reference)).toMatch(/\.grid\s*\{[^}]*list-style:\s*none/s);
	});

	it('exposes mouth-diagram front-to-back order to AT', () => {
		expect(mouthStep).toMatch(/front to back/i);
		expect(mouthStep).toMatch(/aria-posinset=\{i \+ 1\}/);
		expect(mouthStep).toMatch(/aria-setsize=\{ZONES\.length\}/);
	});

	it('exposes compose per-slot correctness after a miss beyond CSS classes', () => {
		expect(reviewCompose).toMatch(/chipVerdict/);
		expect(reviewCompose).toMatch(/, \{verdict\}/);
		expect(reviewCompose).toMatch(/incorrect|correct/);
	});

	it('keeps Target free of spurious status role and mixed-lang aria-label', () => {
		expect(target).not.toMatch(/role="status"/);
		expect(target).not.toMatch(/aria-label=/);
		expect(target).toMatch(/<b lang="ko">\{target\}<\/b>/);
	});

	it('avoids mixed English+Hangul in a single aria-label at the known sites', () => {
		expect(layout).not.toMatch(/aria-label="Korean 한"/);
		expect(target).not.toMatch(/aria-label=/);
		expect(tray).not.toMatch(/aria-label="\{label\}: \{item\}"/);
		expect(slots).not.toMatch(/aria-label=\{slotAriaLabel/);
		expect(audioClip).not.toMatch(/aria-label=\{failed/);
		expect(mouthStep).not.toMatch(/aria-label=\{label \?/);
		expect(clusterStep).not.toMatch(/aria-label="Choose consonant \{jamo\}"/);
		expect(liaisonStep).not.toMatch(/aria-label="Move \{jamo\}"/);
		expect(readStep).not.toMatch(/aria-label="Block \{i \+ 1\}:/);
	});

	it('announces backup import/export from a persistent live region', () => {
		expect(progressBackup).toMatch(/data-backup-live[^>]*aria-live="polite"/);
		expect(progressBackup).toMatch(/data-backup-live[^>]*aria-atomic="true"/);
		expect(progressBackup).not.toMatch(/\{#if status\}[\s\S]*?aria-live="polite"/);
	});

	it('hides the drag mirror from the accessibility tree', () => {
		expect(labDragClient).toMatch(/aria-hidden['"]?\s*,\s*['"]true['"]|setAttribute\(\s*['"]aria-hidden['"]\s*,\s*['"]true['"]/);
	});

	it('gives .rom pseudo brackets an empty accessible alt', () => {
		// CSS Content Module alt: content: '[' / ''; keeps brackets visual-only.
		expect(appCss).toContain(".rom::before { content: '[' / ''; }");
		expect(appCss).toContain(".rom::after { content: ']' / ''; }");
	});

	it('exposes a contentinfo footer landmark', () => {
		expect(layout).toMatch(/<footer\b/);
	});

	it('gives /healthz a document title and a heading', () => {
		expect(healthz).toMatch(/<title>/);
		expect(healthz).toMatch(/<h1\b/);
	});

	it('drops the redundant title on the settings link', () => {
		expect(settingsLink).toMatch(/aria-label="Settings"/);
		expect(settingsLink).not.toMatch(/\btitle="/);
	});

	it('keeps the lab gate advisory as static copy without role=status', () => {
		expect(labPage).toMatch(/class="gate/);
		expect(labPage).not.toMatch(/class="gate[^"]*"\s+role="status"/);
	});
});

describe('a11y semantic parity — mirror attribute at runtime', () => {
	it('sets aria-hidden on the Shopify mirror node when created', () => {
		expect(labDragClient).toMatch(/mirror:created/);
		expect(labDragClient).toMatch(/aria-hidden/);
	});
});
