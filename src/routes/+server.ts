import { query, updateRow } from '$lib/server/sheets';
import { error, json } from '@sveltejs/kit';

export async function GET({ url }) {
	const { searchParams } = url;
	const queryString = searchParams.get('query');

	if (!queryString) {
		error(400, 'Missing query parameter');
	}

	const row = await query({ id: queryString });

	if (!row) {
		return json({ error: 'No matching row' }, { status: 404 });
	}

	return json(row);
}

export async function PATCH({ request }) {
	const body = await request.json();
	const { id, values } = body;

	if (!id || !values) {
		error(400, 'Missing id or values');
	}

	await updateRow(id, values);

	return json({ success: true });
}
