import Ajv from 'ajv';
import { generateAjvErrorMessage, IDocument, IGeneratorFile } from 'kodgen';
import pathLib from 'path';
import configSchema from '../../../assets/ng-typescript-config-schema.json';
import { ITsGenConfig } from '../typescript/typescript-generator.model';
import { TypescriptGeneratorService } from '../typescript/typescript-generator.service';
import { toKebabCase } from '../utils';

export class NgTypescriptGeneratorService extends TypescriptGeneratorService {
	getName(): string {
		return 'ng-typescript';
	}

	getTemplateDir(): string {
		return pathLib.join(__dirname, 'templates');
	}

	constructor() {
		super({
			enumDir: 'enums',
			enumFileNameResolver: name => toKebabCase(name),
			enumTemplate: 'enum',
			modelDir: 'models',
			modelFileNameResolver: name => toKebabCase(name),
			modelTemplate: 'model',
			pathDir: 'services',
			pathFileNameResolver: name => `${toKebabCase(name)}.service`,
			pathTemplate: 'service',
		});
	}

	override generate(doc: IDocument, config?: ITsGenConfig): IGeneratorFile[] {
		const files = super.generate(doc, config);

		files.push({
			path: 'internals.ts',
			template: 'internals',
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
