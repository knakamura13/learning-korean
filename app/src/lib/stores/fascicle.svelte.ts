/**
 * fascicle.svelte.ts — chrome state for the Pressed Fascicle shell.
 * ToC and colophon overlays; live lab folio while a sitting is mounted.
 */

export interface LiveLabFolio {
	number: number;
	card: number;
	total: number;
}

function createFascicle() {
	let tocOpen = $state(false);
	let colophonOpen = $state(false);
	let liveLab = $state<LiveLabFolio | null>(null);

	function setToc(open: boolean) {
		tocOpen = open;
		if (open) colophonOpen = false;
	}

	function setColophon(open: boolean) {
		colophonOpen = open;
		if (open) tocOpen = false;
	}

	return {
		get tocOpen() {
			return tocOpen;
		},
		get colophonOpen() {
			return colophonOpen;
		},
		get liveLab() {
			return liveLab;
		},
		setToc,
		setColophon,
		toggleToc() {
			setToc(!tocOpen);
		},
		toggleColophon() {
			setColophon(!colophonOpen);
		},
		setLiveLab(next: LiveLabFolio | null) {
			liveLab = next;
		}
	};
}

export const fascicle = createFascicle();
