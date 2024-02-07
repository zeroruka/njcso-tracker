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

type SheetsApi = ReturnType<typeof google.sheets>;

let sheetsApi: SheetsApi;

async function initializeSheetsApi(): Promise<SheetsApi> {
	// if (sheetsApi) return sheetsApi;
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
	sheetsApi = google.sheets({ version: 'v4', auth });
	return sheetsApi;
}

export async function getValues(range: string) {
	const api = await initializeSheetsApi();
	const response = await api.spreadsheets.values.get({
		spreadsheetId: SHEET_ID,
		range
	});
	return response.data.values;
}

async function makeSheetsApiCall<T>(callback: (api: SheetsApi) => Promise<T>) {
	const api = await initializeSheetsApi();
	return callback(api);
}

export async function query(queryObj: Partial<InstrumentData>): Promise<InstrumentData | null> {
	return makeSheetsApiCall(async (api) => {
		const response = await api.spreadsheets.values.get({
			spreadsheetId: SHEET_ID,
			range: 'A1:J999'
		});
		const values = response.data.values;
		if (!values) return null;
		const rows = parseRows(values);
		return rows.find((row) =>
			Object.entries(queryObj).every(([key, value]) => row[key] === value)
		) as InstrumentData;
	});
}

export async function updateRow(id: string, values: Partial<InstrumentData>) {
	return makeSheetsApiCall(async (api) => {
		const currentValues = await query({ id });
		if (!currentValues) throw new Error('No matching row');
		const newValues = Object.keys(currentValues)
			.filter((key): key is keyof InstrumentData => key !== 'row')
			.map((key) => values[key] ?? currentValues[key]);
		const response = await api.spreadsheets.values.update({
			spreadsheetId: SHEET_ID,
			range: `A${currentValues.row}:J${currentValues.row}`,
			valueInputOption: 'RAW',
			requestBody: { values: [newValues] }
		});
		return response.data;
	});
}

export async function appendRow(values: LogData) {
	return makeSheetsApiCall(async (api) => {
		await api.spreadsheets.batchUpdate({
			spreadsheetId: SHEET_ID,
			requestBody: {
				requests: [
					{
						insertDimension: {
							range: {
								sheetId: 1266756917,
								dimension: 'ROWS',
								startIndex: 1,
								endIndex: 2
							},
							inheritFromBefore: false
						}
					}
				]
			}
		});
		const response = await api.spreadsheets.values.update({
			spreadsheetId: SHEET_ID,
			range: 'Logs!A2',
			valueInputOption: 'RAW',
			requestBody: {
				values: [[values.date, values.instrument, values.id, values.action]]
			}
		});
		return response.data;
	});
}

function parseRows(values: string[][]): Row[] {
	const keys = values[0].map(toSnakeCase);
	return values
		.slice(1)
		.map((row, index) => {
			const obj: Row = { row: index + 2 };
			row.forEach((value, i) => {
				obj[keys[i]] = value;
			});
			return obj;
		})
		.filter((obj) => obj[keys[0]]); // Assuming the first column is always filled for valid rows
}

type Row = { [key: string]: string | number | undefined; row: number };

function toSnakeCase(str: string): string {
	return str
		.replace(/\W+/g, ' ')
		.split(/ |\B(?=[A-Z])/)
		.map((word) => word.toLowerCase())
		.join('_');
}
