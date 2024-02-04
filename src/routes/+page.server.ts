import { query } from '$lib/server/sheets';

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString() || '';
		console.log(
			await query({
				instrument: id
			})
		);
	}
};
