import {
	IJSDocConfig,
	IJSDocConfigParam,
	IJSDocConfigReturns,
	JSDocRecordKey,
	JSDocRecords,
} from './jsdoc.model';

export class JSDocService {
	constructor(private indention = '\t') {}

	setIndention(indention: string): void {
		this.indention = indention;
	}

	build(config: IJSDocConfig, indentLevel = 0): string {
		const records = new JSDocRecords();

		if (config.deprecated) {
			records.set(JSDocRecordKey.Deprecated);
		}

		if (config.summary) {
			this.setSummary(records, config.summary);
		}

		if (config.description) {
			this.setDescription(records, config.description);
		}

		if (config.params) {
			this.setParams(records, config.params);
		}

		if (config.returns) {
			this.setReturns(records, config.returns);
		}

		return this.print(records, indentLevel);
	}

	private setSummary(records: JSDocRecords, summary: string | string[]): void {
		const summaries = typeof summary === 'string' ? [summary] : summary;

		for (const s of summaries) {
			records.set(JSDocRecordKey.Summary, s);
		}
	}

	private setDescription(records: JSDocRecords, description: string | string[]): void {
		const descriptions = typeof description === 'string' ? [description] : description;

		for (const d of descriptions) {
			records.set(JSDocRecordKey.Description, d);
		}
	}

	private setParams(records: JSDocRecords, params: IJSDocConfigParam[]): void {
		for (const param of params) {
			const name = param.optional ? `[${param.name}]` : param.name;
			const type = param.type ? `{${param.type}}` : '';
			const description = param.description ? `- ${param.description}` : '';

			records.set(JSDocRecordKey.Param, [type, name, description].filter(Boolean).join(' '));
		}
	}

	private setReturns(records: JSDocRecords, returns: IJSDocConfigReturns): void {
		if (returns?.type || returns?.description) {
			const type = returns.type ? `{${returns.type}}` : '';
			const description = returns.description ? returns.description : '';

			records.set(JSDocRecordKey.Returns, [type, description].filter(Boolean).join(' '));
		}
	}

	private print(records: JSDocRecords, indentLevel: number): string {
		const indention = this.indention.repeat(indentLevel);

		const rawLines = Object.entries(records.get()).reduce<string[]>(
			(acc, [section, content]) => {
				if (!content.length) {
					return [...acc, section];
				}

				return [...acc, ...content.map(x => `${section} ${x}`)];
			},
			[],
		);

		const lines = this.prepare(rawLines);

		if (!lines.length) {
			return '';
		} else if (lines.length === 1) {
			return `${indention}/** ${lines[0]} */`;
		}

		return [`${indention}/**`, ...lines.map(x => ` * ${x}`), ' */'].join(`\n${indention}`);
	}

	private prepare(lines: string[]): string[] {
		const newLines: string[] = [];

		for (const line of lines) {
			const subLines = line
				.split(/\r\n|\r|\n/)
				.map(x => x.trim())
				.filter(Boolean);

			newLines.push(...subLines);
		}

		return newLines;
	}
}
