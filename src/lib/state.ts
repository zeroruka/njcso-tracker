import { assign, createMachine } from 'xstate';

export const stateMachine = createMachine(
	{
		id: 'state',
		context: {
			loop: 0
		},
		initial: 'disabled',
		states: {
			disabled: {
				on: {
					start: 'enabled'
				}
			},
			enabled: {
				on: {
					ready: 'scanning'
				}
			},
			scanning: {
				on: {
					loading: 'loading',
					failure: 'error'
				}
			},
			loading: {
				on: {
					success: {
						target: 'success',
						actions: assign({
							loop: (state) => {
								console.log('context', state.context);
								return state.context.loop + 1;
							}
						}),
						guard: 'isLoopLessThan2'
					},
					failure: 'error'
				}
			},
			error: {
				after: {
					400: 'enabled'
				}
			},
			success: {
				after: {
					400: [
						{ target: 'enabled', guard: 'isLoop1' },
						{ target: 'end', guard: 'isLoop2' }
					]
				}
			},
			end: {
				on: {
					reset: {
						target: 'enabled',
						actions: assign({
							loop: 0
						})
					}
				}
			}
		},
		types: {
			context: {} as { loop: number }
		}
	},
	{
		guards: {
			isLoopLessThan2: (state) => state.context.loop < 2,
			isLoop1: (state) => state.context.loop === 1,
			isLoop2: (state) => state.context.loop === 2
		}
	}
);
