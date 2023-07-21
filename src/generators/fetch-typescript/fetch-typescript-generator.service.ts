import Ajv from 'ajv';
import { generateAjvErrorMessage, IDocument, IGeneratorFile } from 'kodgen';
import pathLib from 'path';
import configSchema from '../../../assets/ng-typescript-config-schema.json';
import { ITsGenConfig } from '../typescript/typescript-generator.model';
import { TypescriptGeneratorService } from '../typescript/typescript-generator.service';
import { toPascalCase } from '../utils';

export class FetchTypescriptGeneratorService extends TypescriptGeneratorService {
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

	override generate(doc: IDocument, config?: ITsGenConfig): IGeneratorFile[] {
		const files = super.generate(doc, config);

		files.push({
			path: 'internals.ts',
			template: 'internals',
			templateData: {
				baseUrl: doc.servers[0]?.url,
			},
		});

		return files;
	}

	prepareConfig(userConfig?: ITsGenConfig): ITsGenConfig {
		const config: ITsGenConfig = {
			index: userConfig?.index ?? true,
			inlinePathParameters: userConfig?.inlinePathParameters ?? true,
			readonly: userConfig?.readonly ?? true,
			useNativeEnums: userConfig?.useNativeEnums,
		};

		this.validate(config);

		return config;
	}

	private validate(config: ITsGenConfig): void {
		const validate = new Ajv({ allErrors: true }).compile<ITsGenConfig>(configSchema);

		if (!validate(config)) {
			throw new Error(
				generateAjvErrorMessage('Invalid generator configuration', validate.errors),
			);
		}
	}
}
