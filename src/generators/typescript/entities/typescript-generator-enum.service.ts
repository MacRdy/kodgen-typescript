import {
	BODY_OBJECT_ORIGIN,
	EnumEntryDef,
	EnumModelDef,
	FORM_DATA_OBJECT_ORIGIN,
	IGeneratorFile,
	ImportRegistryService,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	Printer,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from 'kodgen';
import pathLib from 'path';
import { toPascalCase } from '../../utils';
import { JSDocService } from '../jsdoc/jsdoc.service';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import {
	ITsGenConfig,
	ITsGenEnum,
	ITsGenEnumEntry,
	ITsGenParameters,
} from '../typescript-generator.model';

export class TypescriptGeneratorEnumService {
	constructor(
		private readonly storage: TypescriptGeneratorStorageService,
		private readonly importRegistry: ImportRegistryService,
		private readonly namingService: TypescriptGeneratorNamingService,
		private readonly config: ITsGenParameters,
	) {}

	generate(enums: EnumModelDef[], config: ITsGenConfig): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const e of enums) {
			this.printVerbose(e);

			const entries: ITsGenEnumEntry[] = [];

			for (const enumEntry of e.entries) {
				const entry: ITsGenEnumEntry = {
					name: this.processEntryName(e, enumEntry),
					value: enumEntry.value,
					deprecated: enumEntry.deprecated,
					description: enumEntry.description,
					extensions: enumEntry.extensions,
				};

				entries.push(entry);
			}

			const storageInfo = this.storage.get(e);

			const name = storageInfo?.name ?? this.namingService.generateUniqueEnumName(e);

			this.storage.set(e, { name });

			const generatedModel: ITsGenEnum = {
				name,
				isStringlyTyped: e.type === 'string',
				entries,
				extensions: e.extensions,
				deprecated: e.deprecated,
				description: e.description,
			};

			const file: IGeneratorFile = {
				path: pathLib.posix.join(
					this.config.enumDir,
					this.config.enumFileNameResolver(generatedModel.name),
				),
				template: this.config.enumTemplate,
				templateData: {
					config,
					model: generatedModel,
					jsdoc: new JSDocService(),
					isValidName: (entityName: string) => !/^[^a-zA-Z_$]|[^\w$]/g.test(entityName),
				},
			};

			this.importRegistry.createLink(generatedModel.name, file.path);

			this.storage.set(e, { generatedModel });

			files.push(file);
		}

		return files;
	}

	private processEntryName(enumDef: EnumModelDef, entry: EnumEntryDef): string {
		if (entry.name === String(entry.value)) {
			if (enumDef.type !== 'string') {
				return `_${entry.name}`;
			}

			return toPascalCase(entry.name);
		}

		return entry.name;
	}

	private printVerbose(enumDef: EnumModelDef): void {
		let originName: string;

		switch (enumDef.origin) {
			case BODY_OBJECT_ORIGIN:
				originName = 'body';
				break;
			case RESPONSE_OBJECT_ORIGIN:
				originName = 'response';
				break;
			case PATH_PARAMETERS_OBJECT_ORIGIN:
				originName = 'path parameters';
				break;
			case QUERY_PARAMETERS_OBJECT_ORIGIN:
				originName = 'query parameters';
				break;
			case FORM_DATA_OBJECT_ORIGIN:
				originName = 'form data';
				break;
			default:
				originName = '';
				break;
		}

		originName = originName ? ` (${originName})` : '';

		Printer.verbose(`Creating enum from '${enumDef.name}'${originName}`);
	}
}
