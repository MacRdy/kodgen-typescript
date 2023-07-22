import {
	EnumModelDef,
	IGeneratorFile,
	IImportRegistryEntry,
	ObjectModelDef,
	PathDef,
	PathRequestBody,
	PathResponse,
	Printer,
	Server,
	Tag,
} from 'kodgen';
import pathLib from 'path';
import { ImportRegistryService } from '../../../import-registry/import-registry.service';
import { IJSDocConfig, IJSDocConfigParam } from '../jsdoc/jsdoc.model';
import { JSDocService } from '../jsdoc/jsdoc.service';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import {
	ITsGenConfig,
	ITsGenParameters,
	ITsGenPath,
	ITsGenPathRequest,
	ITsGenPathResponse,
	ITsPathBody,
} from '../typescript-generator.model';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';

export class TypescriptGeneratorPathService {
	private readonly jsonMediaRe = /^application\/json$/i;

	private readonly successResponseCodeRe = /^2/;
	private readonly defaultResponseCodeRe = /^default$/i;

	constructor(
		private readonly modelService: TypescriptGeneratorModelService,
		private readonly storage: TypescriptGeneratorStorageService,
		private readonly importRegistry: ImportRegistryService,
		private readonly namingService: TypescriptGeneratorNamingService,
		private readonly config: ITsGenParameters,
	) {}

	generate(
		paths: PathDef[],
		servers: Server[],
		tags: Tag[],
		config: ITsGenConfig,
	): IGeneratorFile[] {
		const baseUrl = servers[0]?.url;

		const files: IGeneratorFile[] = [];

		const pathsToGenerate: Record<string, PathDef[]> = {};
		const commonPaths: PathDef[] = [];

		for (const path of paths) {
			if (path.tags?.length) {
				for (const tag of path.tags) {
					const tagPaths = pathsToGenerate[tag] ?? [];

					pathsToGenerate[tag] = [...tagPaths, path];
				}
			} else {
				commonPaths.push(path);
			}
		}

		for (const [name, p] of Object.entries(pathsToGenerate)) {
			Printer.verbose(`Creating service for '${name}'`);

			const entityName = this.namingService.generateUniqueServiceName(name);

			const file = this.getSpecificServiceFile(
				config,
				entityName,
				pathLib.posix.join(
					this.config.pathDir,
					this.config.pathFileNameResolver(entityName),
				),
				p,
				baseUrl,
				tags.find(x => x.name === name)?.description,
			);

			files.push(file);
		}

		if (commonPaths.length) {
			Printer.verbose(`Creating common service`);

			const file = this.getSpecificServiceFile(
				config,
				this.namingService.generateServiceName('common'),
				this.config.pathFileNameResolver('common'),
				commonPaths,
				baseUrl,
			);

			files.push(file);
		}

		return files;
	}

	private getSpecificServiceFile(
		config: ITsGenConfig,
		name: string,
		filePath: string,
		pathDefs: PathDef[],
		baseUrl?: string,
		description?: string,
	): IGeneratorFile {
		const paths: ITsGenPath[] = [];

		for (const path of pathDefs) {
			Printer.verbose(`Adding path ${path.urlPattern}`);

			const pathName = this.namingService.generateUniqueOperationName(
				name,
				path.method,
				path.urlPattern,
				path.operationId,
			);

			const pathModel: ITsGenPath = {
				name: pathName,
				urlPattern: path.urlPattern,
				method: path.method,
				operationId: path.operationId,
				request: this.getRequest(path),
				response: this.getResponse(path),
				deprecated: path.deprecated,
				summaries: path.summaries,
				descriptions: path.descriptions,
				extensions: path.extensions,
				security: path.security,
			};

			paths.push(pathModel);
		}

		return {
			path: filePath,
			template: 'service',
			templateData: {
				config,
				name,
				description,
				baseUrl,
				paths,
				jsdoc: new JSDocService(),
				resolvePath: (to: string): string => {
					const resolved = pathLib.posix.relative(pathLib.posix.dirname(filePath), to);

					return resolved.startsWith('.') ? resolved : `./${resolved}`;
				},
				toJSDocConfig: (
					path: ITsGenPath,
					pathParametersVarName: string,
					queryParametersVarName: string,
					bodyVarName: string,
					responseTypeName?: string,
				): IJSDocConfig =>
					this.toJSDocConfig(
						config,
						path,
						pathParametersVarName,
						queryParametersVarName,
						bodyVarName,
						responseTypeName,
					),
				getImportEntries: () => this.getImportEntries(paths, filePath, config),
				parametrizeUrlPattern: (
					urlPattern: string,
					inline = true,
					inlinePropertyName?: string,
				) =>
					urlPattern.replace(
						/{([^}]+)(?=})}/g,
						(_, capture: string) =>
							'${' + (inline ? capture : `${inlinePropertyName}.${capture}`) + '}',
					),
			},
		};
	}

	private toJSDocConfig(
		config: ITsGenConfig,
		path: ITsGenPath,
		pathParametersVarName: string,
		queryParametersVarName: string,
		bodyVarName: string,
		responseTypeName?: string,
	): IJSDocConfig {
		const params: IJSDocConfigParam[] = [];

		if (path.request.pathParametersType) {
			if (config.inlinePathParameters) {
				for (const param of path.request.pathParametersType.properties) {
					params.push({
						name: param.name,
						type: param.type,
						optional: !param.required,
						description: param.description,
					});
				}
			} else {
				params.push({
					name: pathParametersVarName,
					type: path.request.pathParametersType.name,
				});
			}
		}

		if (path.request.queryParametersType) {
			params.push({
				name: queryParametersVarName,
				type: path.request.queryParametersType.name,
			});
		}

		if (path.request.body) {
			params.push({
				name: bodyVarName,
				type: path.request.body.typeName,
				description: path.request.body.description,
			});
		}

		return {
			params,
			deprecated: path.deprecated,
			summary: path.summaries,
			description: path.descriptions,
			returns: {
				type: responseTypeName,
				description: path.response.description,
			},
		};
	}

	private getRequest(path: PathDef): ITsGenPathRequest {
		const pathParametersType =
			path.requestPathParameters &&
			this.storage.get(path.requestPathParameters)?.generatedModel;

		const queryParametersType =
			path.requestQueryParameters &&
			this.storage.get(path.requestQueryParameters)?.generatedModel;

		const pathRequestBody = this.getPathRequestBody(path);

		let body: ITsPathBody | undefined;

		if (pathRequestBody) {
			body = {
				typeName: this.modelService.resolveType(pathRequestBody.content),
				media: pathRequestBody.media,
				required: !!pathRequestBody.required,
				description: pathRequestBody.description,
				dependencies: this.modelService.resolveDependencies(pathRequestBody.content),
			};
		}

		return {
			pathParametersType,
			queryParametersType,
			queryParametersMapping:
				path.requestQueryParameters &&
				this.storage.get(path.requestQueryParameters)?.mapping,
			body,
		};
	}

	private getPathRequestBody(path: PathDef): PathRequestBody | undefined {
		let body: PathRequestBody | undefined;

		if (path.requestBodies && path.requestBodies.length > 1) {
			body = path.requestBodies.find(x => new RegExp(this.jsonMediaRe).test(x.media));

			if (body) {
				Printer.verbose(`Multiple request bodies found. Take '${body.media}'`);
			}
		}

		if (!body) {
			body = path.requestBodies?.[0];

			if (body && path.requestBodies && path.requestBodies.length > 1) {
				Printer.verbose(`Multiple request bodies found. Take first (${body.media})`);
			}
		}

		return body;
	}

	private getResponse(path: PathDef): ITsGenPathResponse {
		let response = this.getMostRelatedResponse(
			path.responses ?? [],
			this.successResponseCodeRe,
		);

		if (!response) {
			response = this.getMostRelatedResponse(
				path.responses ?? [],
				this.defaultResponseCodeRe,
			);
		}

		const responseType = response?.content;

		if (!responseType) {
			return { typeName: 'void', dependencies: [] };
		}

		const dependencies: string[] = [];

		if (response) {
			const responseDependencies = this.modelService.resolveDependencies(response.content);

			dependencies.push(...responseDependencies);
		}

		return {
			dependencies,
			typeName: this.modelService.resolveType(responseType),
			media: response?.media,
			description:
				responseType instanceof EnumModelDef || responseType instanceof ObjectModelDef
					? responseType.description
					: undefined,
		};
	}

	private getMostRelatedResponse(list: PathResponse[], media: RegExp): PathResponse | undefined {
		let response: PathResponse | undefined;

		if (list.length > 1) {
			response = list.find(
				x => new RegExp(media).test(x.code) && new RegExp(this.jsonMediaRe).test(x.media),
			);

			if (response) {
				Printer.verbose(
					`Multiple responses found. Take '${response.media}' (${response.code})`,
				);
			}
		}

		if (!response) {
			response = list.find(x => new RegExp(media).test(x.code));

			if (response && list.length > 1) {
				Printer.verbose(`Multiple responses found. Take first (${response.media})`);
			}
		}

		return response;
	}

	private getImportEntries(
		paths: ITsGenPath[],
		currentFilePath: string,
		config: ITsGenConfig,
	): IImportRegistryEntry[] {
		const dependencies: string[] = [];

		for (const p of paths) {
			if (p.request.pathParametersType) {
				if (!config.inlinePathParameters) {
					dependencies.push(p.request.pathParametersType.name);
				} else {
					const propertyDependencies = p.request.pathParametersType.properties.flatMap(
						x => x.dependencies,
					);

					dependencies.push(
						...propertyDependencies,
						...p.request.pathParametersType.dependencies,
					);
				}
			}

			if (p.request.queryParametersType) {
				dependencies.push(p.request.queryParametersType.name);
			}

			if (p.request.body) {
				dependencies.push(...p.request.body.dependencies);
			}

			dependencies.push(...p.response.dependencies);
		}

		return this.importRegistry.getImportEntries(dependencies, currentFilePath);
	}
}
