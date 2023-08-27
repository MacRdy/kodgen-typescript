import {
	ArrayModel,
	BODY_OBJECT_ORIGIN,
	ConstantModel,
	EnumModel,
	ExtendedModel,
	FORM_DATA_OBJECT_ORIGIN,
	Hooks,
	IDocument,
	IGeneratorFile,
	Model,
	NullModel,
	ObjectModel,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	Printer,
	Property,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
	SimpleModel,
	UnknownModel,
	isReferenceModel,
} from 'kodgen';
import pathLib from 'path';
import { IImportRegistryEntry } from '../../../import-registry/import-registry.model';
import { ImportRegistryService } from '../../../import-registry/import-registry.service';
import { selectModels } from '../../utils';
import { JSDocService } from '../jsdoc/jsdoc.service';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import {
	ITsGenConfig,
	ITsGenModel,
	ITsGenModelProperty,
	ITsGenParameters,
	ITsGenPropertyMapping,
	TsGenResolveSimpleType,
} from '../typescript-generator.model';

export class TypescriptGeneratorModelService {
	private objectKey = 0;

	constructor(
		private readonly storage: TypescriptGeneratorStorageService,
		private readonly importRegistry: ImportRegistryService,
		private readonly namingService: TypescriptGeneratorNamingService,
		private readonly config: ITsGenParameters,
	) {}

	generate(document: IDocument, config: ITsGenConfig): IGeneratorFile[] {
		const models = selectModels(document.models, ObjectModel);

		const files: IGeneratorFile[] = [];

		for (const model of models) {
			this.printVerbose(model);

			const fileModels = this.getModels(model);

			const mainTemplateModel = fileModels[0];

			if (!mainTemplateModel) {
				throw new Error('Unknown model generation error');
			}

			const path = pathLib.posix.join(
				this.config.modelDir,
				this.config.modelFileNameResolver(mainTemplateModel.name),
			);

			const file: IGeneratorFile = {
				path,
				template: this.config.modelTemplate,
				templateData: {
					document,
					config,
					models: fileModels,
					extensions: model.extensions,
					jsdoc: new JSDocService(),
					isValidName: (name: string) => !/^[^a-zA-Z_$]|[^\w$]/g.test(name),
					getImportEntries: () => this.getImportEntries(fileModels, path),
				},
			};

			const mainModel = fileModels[0];

			if (mainModel) {
				this.storage.set(model, {
					name: mainModel.name,
					generatedModel: mainModel,
				});
			}

			if (config.inlinePathParameters && model.origin === PATH_PARAMETERS_OBJECT_ORIGIN) {
				Printer.verbose(`Ignore ${file.path} (inline mode)`);
				continue;
			}

			for (const fileModel of fileModels) {
				this.importRegistry.createLink(fileModel.name, file.path);
			}

			files.push(file);
		}

		return files;
	}

	private printVerbose(model: ObjectModel): void {
		let originName: string;

		switch (model.origin) {
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

		Printer.verbose(`Creating model from '${model.name}'${originName}`);
	}

	private getProperties(objectProperties: readonly Property[]): ITsGenModelProperty[] {
		const properties: ITsGenModelProperty[] = [];

		for (const p of objectProperties) {
			const type = this.resolveType(p);

			const prop: ITsGenModelProperty = {
				name: p.name,
				required: p.required,
				type: type,
				deprecated: p.deprecated,
				description: p.description,
				extensions: p.extensions,
				dependencies: this.resolveDependencies(p.def),
			};

			properties.push(prop);
		}

		return properties;
	}

	private resolveDef(
		entity: Model | Property,
	): EnumModel | ObjectModel | SimpleModel | ExtendedModel | UnknownModel {
		if (entity instanceof Property) {
			return this.resolveDef(entity.def);
		} else if (entity instanceof ArrayModel) {
			return this.resolveDef(entity.items);
		} else {
			return entity;
		}
	}

	resolveDependencies(entity: Model | Property): string[] {
		const def = this.resolveDef(entity);

		if (def instanceof ExtendedModel) {
			return def.def.flatMap(x => this.resolveDependencies(x));
		} else if (!isReferenceModel(def)) {
			return [];
		}

		return [this.resolveType(def, false, true)];
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	resolveType(prop: Model | Property, isArray?: boolean, ignoreArray?: boolean): string {
		let type: string | undefined;

		if (prop instanceof Property) {
			type = this.resolveType(prop.def, false, ignoreArray);
		} else if (prop instanceof EnumModel || prop instanceof ObjectModel) {
			type = this.resolveReferenceEntityName(prop);
		} else if (prop instanceof ArrayModel) {
			type = this.resolveType(prop.items, true, ignoreArray);
		} else if (prop instanceof ExtendedModel && prop.def.length) {
			const delimiter = prop.type === 'and' ? '&' : '|';
			type = prop.def.map(x => this.resolveType(x)).join(` ${delimiter} `);
			type = prop.def.length > 1 ? `(${type})` : type;
		} else if (prop instanceof NullModel) {
			type = 'null';
		} else if (prop instanceof ConstantModel) {
			type = typeof prop.value === 'string' ? `'${prop.value}'` : `${prop.value}`;
		} else if (prop instanceof SimpleModel) {
			const fn = Hooks.getOrDefault<TsGenResolveSimpleType>('resolveSimpleType', (t, f) =>
				this.resolveSimpleType(t, f),
			);

			type = fn(prop.type, prop.format);
		}

		type ??= 'unknown';

		return isArray && !ignoreArray ? `Array<${type}>` : type;
	}

	private resolveSimpleType(type: string, format?: string): string | undefined {
		if (type === 'boolean') {
			return 'boolean';
		} else if (type === 'integer' || type === 'number') {
			return 'number';
		} else if (type === 'file' || (type === 'string' && format === 'binary')) {
			return 'Blob';
		} else if (type === 'string') {
			return 'string';
		}

		return undefined;
	}

	private resolveReferenceEntityName(entity: EnumModel | ObjectModel): string {
		const storageInfo = this.storage.get(entity);

		if (storageInfo?.name) {
			return storageInfo.name;
		}

		const name =
			entity instanceof EnumModel
				? this.namingService.generateUniqueEnumName(entity)
				: this.namingService.generateUniqueModelName(entity);

		this.storage.set(entity, { name });

		return name;
	}

	private getImportEntries(
		models: ITsGenModel[],
		currentFilePath: string,
	): IImportRegistryEntry[] {
		const dependencies: string[] = [];

		for (const m of models) {
			for (const p of m.properties) {
				dependencies.push(...p.dependencies);
			}

			dependencies.push(...m.dependencies);
		}

		return this.importRegistry.getImportEntries(dependencies, currentFilePath);
	}

	private getModels(objectModel: ObjectModel): ITsGenModel[] {
		let defs: ObjectModel[] = [objectModel];

		if (objectModel.origin === QUERY_PARAMETERS_OBJECT_ORIGIN) {
			defs = this.restructModel(objectModel);

			const mapping = this.remapProperties(objectModel);

			this.storage.set(objectModel, { mapping });
		}

		const models: ITsGenModel[] = [];

		for (const def of defs) {
			const storageInfo = this.storage.get(def);

			const name = storageInfo?.name ?? this.namingService.generateUniqueModelName(def);

			this.storage.set(def, { name });

			const dependencies: string[] = [];
			let additionalPropertiesType: string | undefined;

			if (def.additionalProperties) {
				additionalPropertiesType = this.resolveType(def.additionalProperties);
				dependencies.push(...this.resolveDependencies(def.additionalProperties));
			}

			const generatedModel: ITsGenModel = {
				name,
				properties: this.getProperties(def.properties),
				deprecated: def.deprecated,
				additionPropertiesTypeName: additionalPropertiesType,
				dependencies,
			};

			this.storage.set(def, { generatedModel });

			models.push(generatedModel);
		}

		return models;
	}

	private restructModel(objectModel: ObjectModel): ObjectModel[] {
		const newModels: ObjectModel[] = [objectModel];

		const structure = objectModel.properties.reduce<Record<string, Property[]>>((acc, prop) => {
			const parts = prop.name.split('.');

			const propName =
				parts.length > 1 && parts.every(Boolean) && parts[0] ? parts[0] : prop.name;

			if (propName) {
				acc[propName] = acc[propName] ?? [];
				acc[propName]?.push(prop);
			}

			return acc;
		}, {});

		const newProperties: Property[] = [];

		for (const [key, properties] of Object.entries(structure)) {
			if (properties.some(x => !x.name.startsWith(`${key}.`))) {
				newProperties.push(...properties);
				continue;
			}

			for (const prop of properties) {
				prop.name = prop.name.substring(key.length + 1);
			}

			const object = new ObjectModel(`${objectModel.name} ${key}`, {
				properties,
				origin: objectModel.origin,
				originalName: objectModel.originalName,
			});

			const property = new Property(key, object);
			newProperties.push(property);

			const objectPropertyModels = this.restructModel(object);
			newModels.push(...objectPropertyModels);
		}

		objectModel.properties = newProperties;

		return newModels;
	}

	private remapProperties(
		objectModel: ObjectModel,
		baseOriginalNamePath: string[] = [],
		baseObjectPath: string[] = [],
	): ITsGenPropertyMapping[] {
		const key = `${++this.objectKey}_${objectModel.name}@${objectModel.origin}`;
		const mapping: ITsGenPropertyMapping[] = [];

		for (const prop of objectModel.properties) {
			const oldName = prop.name;

			const newName = this.namingService.generateUniquePropertyName(key, oldName);
			prop.name = newName;

			const objectPath = [...baseObjectPath, newName];
			const originalNamePath = [...baseOriginalNamePath, oldName];

			if (prop.def instanceof ObjectModel) {
				mapping.push(...this.remapProperties(prop.def, originalNamePath, objectPath));
			}

			if (!(prop.def instanceof ObjectModel) || prop.def.additionalProperties) {
				mapping.push({
					originalName: originalNamePath.join('.'),
					objectPath,
				});
			}
		}

		return mapping;
	}
}
