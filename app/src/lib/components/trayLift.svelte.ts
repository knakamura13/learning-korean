/**
 * Shared lift while a composer tray chip is being dragged onto a slot.
 * Slots read this to highlight the matching drop target.
 */
export type TrayLift = {
	dock: string;
	item: string;
	x: number;
	y: number;
};

class TrayLiftState {
	current = $state.raw<TrayLift | null>(null);
}

export const trayLift = new TrayLiftState();
