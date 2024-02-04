import {
	CLIENT_EMAIL,
	CLIENT_ID,
	PRIVATE_KEY,
	PRIVATE_KEY_ID,
	PROJECT_ID,
	SHEET_ID,
	UNIVERSE_DOMAIN
} from '$env/static/private';
import { google } from 'googleapis';

type SheetsApi = ReturnType<typeof google.sheets> | null;

let sheets_api: SheetsApi = null;

export const sheets = async () => {
	if (sheets_api) return sheets_api;
	const auth = await google.auth.getClient({
		projectId: PROJECT_ID,
		credentials: {
			private_key_id: PRIVATE_KEY_ID,
			private_key: PRIVATE_KEY.replace(/\\n/g, '\n'),
			client_email: CLIENT_EMAIL,
			client_id: CLIENT_ID,
			universe_domain: UNIVERSE_DOMAIN
		},
		scopes: ['https://www.googleapis.com/auth/spreadsheets']
	});
	sheets_api = google.sheets({ version: 'v4', auth });
	return sheets_api;
};

export async function getValues(range: string) {
	const api = await sheets();
	const rsp = await api.spreadsheets.values.get({
		spreadsheetId: SHEET_ID,
		range
	});

	return rsp.data.values;
}

type Schema = {
	instrument: string;
	id: string;
	row: number;
};

export type InstrumentData = {
	instrument: string;
	id: string;
	loaned_by: string;
	zone: string;
	status: string;
	location: string;
	row: number;
};

export async function query(queryObj: Partial<Schema>): Promise<InstrumentData | null> {
	const api = await sheets();
	const rsp = await api.spreadsheets.values.get({
		spreadsheetId: SHEET_ID,
		range: 'A1:J999'
	});

	const values = rsp.data.values;
	if (!values) return null;
	const rows = parseRows(values);
	// Find the first object that matches all key-value pairs in queryObj
	const matchingObject = rows.find((row) =>
		Object.entries(queryObj).every(([key, value]) => row[key] === value)
	);

	return matchingObject as InstrumentData;
}

export async function updateRow(id: string, values: Partial<InstrumentData>) {
	const api = await sheets();
	const currentValues = await query({ id });

	if (!currentValues) {
		throw new Error('No matching row');
	}

	const newValues = Object.keys(currentValues)
		.filter((key) => key !== 'row')
		.map((key) => {
			// If the key exists in the new values, use it, otherwise retain the original value
			return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : currentValues[key];
		});

	const updateRsp = await api.spreadsheets.values.update({
		spreadsheetId: SHEET_ID,
		range: `A${currentValues.row}:J${currentValues.row}`,
		valueInputOption: 'RAW',
		requestBody: {
			values: [newValues]
		}
	});

	console.log('updateRsp', updateRsp.data);

	return updateRsp.data;
}

type Row = { [key: string]: string | number | undefined };

function parseRows(values: string[][]) {
	const keys = values[0].map((key) => toSnakeCase(key));
	const objects: Row[] = [];

	for (let i = 1; i < values.length; i++) {
		// Skip rows where all values are undefined
		if (!values[i][0]) {
			continue;
		}

		const obj: Row = {};
		for (let j = 0; j < keys.length; j++) {
			obj[keys[j]] = values[i][j];
		}
		obj['row'] = i + 1;
		objects.push(obj);
	}

	return objects;
}

function toSnakeCase(str: string): string {
	return str
		.replace(/\W+/g, ' ')
		.split(/ |\B(?=[A-Z])/)
		.map((word) => word.toLowerCase())
		.join('_');
}
