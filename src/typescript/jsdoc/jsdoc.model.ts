export enum JSDocRecordKey {
	Deprecated = '@deprecated',
	Summary = '@summary',
	Description = '@description',
	Param = '@param',
	Returns = '@returns',
}

export class JSDocRecords {
	private readonly records: Record<string, string[]> = {};

	get(): Readonly<Record<JSDocRecordKey, readonly string[]>> {
		return this.records as Record<JSDocRecordKey, readonly string[]>;
	}

	set(section: JSDocRecordKey, content?: string): void {
		if (!this.records[section]) {
			this.records[section] = [];
		}

		if (content) {
			this.records[section]?.push(content);
		}
	}
}

export interface IJSDocConfigParam {
	name: string;
	type?: string;
	optional?: boolean;
	description?: string;
}

export interface IJSDocConfigReturns {
	type?: string;
	description?: string;
}

export interface IJSDocConfig {
	description?: string | string[];
	summary?: string | string[];
	params?: IJSDocConfigParam[];
	returns?: IJSDocConfigReturns;
	deprecated?: boolean;
}
