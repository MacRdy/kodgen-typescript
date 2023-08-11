import Ajv from 'ajv';
import { generateAjvErrorMessage, IDocument, IGeneratorFile } from 'kodgen';
import pathLib from 'path';
import configSchema from '../../../assets/fetch-typescript-config-schema.json';
import { baseUrlSelector } from '../typescript/typescript-generator.model';
import { TypescriptGeneratorService } from '../typescript/typescript-generator.service';
import { toPascalCase } from '../utils';
import { IFetchTsGenConfig } from './fetch-typescript-generator.model';

export class FetchTypescriptGeneratorService extends TypescriptGeneratorService<IFetchTsGenConfig> {
	getName(): string {
		return 'fetch-typescript';
	}

	getTemplateDir(): string {
		return pathLib.join(__dirname, 'templates');
	}

	constructor() {
		super({
			enumDir: 'enums',
			enumFileNameResolver: name => toPascalCase(name),
			enumTemplate: 'enum',
			modelDir: 'models',
			modelFileNameResolver: name => toPascalCase(name),
			modelTemplate: 'model',
			pathDir: 'services',
			pathFileNameResolver: name => toPascalCase(name),
			pathTemplate: 'service',
		});
	}

	override generate(doc: IDocument, config?: IFetchTsGenConfig): IGeneratorFile[] {
		const files = super.generate(doc, config);

		files.push({
			path: 'internals.ts',
			template: 'internals',
			templateData: {
				baseUrl: baseUrlSelector(doc),
			},
		});

		return files;
	}

	prepareConfig(userConfig?: IFetchTsGenConfig): IFetchTsGenConfig {
		const config: IFetchTsGenConfig = {
			index: userConfig?.index ?? true,
			inlinePathParameters: userConfig?.inlinePathParameters ?? true,
			readonly: userConfig?.readonly ?? true,
			useNativeEnums: userConfig?.useNativeEnums,
			useClasses: userConfig?.useClasses,
		};

		this.validate(config);

		return config;
	}

	private validate(config: IFetchTsGenConfig): void {
		const validate = new Ajv({ allErrors: true }).compile<IFetchTsGenConfig>(configSchema);

		if (!validate(config)) {
			throw new Error(
				generateAjvErrorMessage('Invalid generator configuration', validate.errors),
			);
		}
	}
}
