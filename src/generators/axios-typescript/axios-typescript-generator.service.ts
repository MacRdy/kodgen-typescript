import Ajv from 'ajv';
import { generateAjvErrorMessage, IDocument, IGeneratorFile } from 'kodgen';
import pathLib from 'path';
import configSchema from '../../../assets/axios-typescript-config-schema.json';
import { baseUrlSelector } from '../typescript/typescript-generator.model';
import { TypescriptGeneratorService } from '../typescript/typescript-generator.service';
import { toPascalCase } from '../utils';
import { IAxiosTsGenConfig } from './axios-typescript-generator.model';

export class AxiosTypescriptGeneratorService extends TypescriptGeneratorService<IAxiosTsGenConfig> {
	getName(): string {
		return 'axios-typescript';
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

	override generate(doc: IDocument, config?: IAxiosTsGenConfig): IGeneratorFile[] {
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

	prepareConfig(userConfig?: IAxiosTsGenConfig): IAxiosTsGenConfig {
		const config: IAxiosTsGenConfig = {
			index: userConfig?.index ?? true,
			inlinePathParameters: userConfig?.inlinePathParameters ?? true,
			readonly: userConfig?.readonly ?? true,
			useNativeEnums: userConfig?.useNativeEnums,
			useClasses: userConfig?.useClasses,
		};

		this.validate(config);

		return config;
	}

	private validate(config: IAxiosTsGenConfig): void {
		const validate = new Ajv({ allErrors: true }).compile<IAxiosTsGenConfig>(configSchema);

		if (!validate(config)) {
			throw new Error(
				generateAjvErrorMessage('Invalid generator configuration', validate.errors),
			);
		}
	}
}
