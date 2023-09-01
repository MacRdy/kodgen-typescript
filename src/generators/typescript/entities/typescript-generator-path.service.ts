import { IDocument, IGeneratorFile, Path, PathRequestBody, PathResponse, Printer } from 'kodgen';
import pathLib from 'path';
import { IImportRegistryEntry } from '../../../import-registry/import-registry.model';
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
	baseUrlSelector,
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

	generate(document: IDocument, config: ITsGenConfig): IGeneratorFile[] {
		const baseUrl = baseUrlSelector(document);

		const files: IGeneratorFile[] = [];

		const pathsToGenerate: Record<string, Path[]> = {};
		const commonPaths: Path[] = [];

		for (const path of document.paths) {
			const controllerName = path.extensions['x-controller-name'];

			if (controllerName && typeof controllerName === 'string') {
				const controllerPaths = pathsToGenerate[controllerName] ?? [];
				pathsToGenerate[controllerName] = [...controllerPaths, path];
			} else if (path.tags?.length) {
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
				document,
				entityName,
				pathLib.posix.join(
					this.config.pathDir,
					this.config.pathFileNameResolver(entityName),
				),
				p,
				baseUrl,
				document.tags.find(x => x.name === name)?.description,
			);

			files.push(file);
		}

		if (commonPaths.length) {
			Printer.verbose(`Creating common service`);

			const file = this.getSpecificServiceFile(
				config,
				document,
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
		document: IDocument,
		name: string,
		filePath: string,
		pathDefs: Path[],
		baseUrl?: string,
		description?: string,
	): IGeneratorFile {
		const paths: ITsGenPath[] = [];

		for (const path of pathDefs) {
			Printer.verbose(`Adding path ${path.urlPattern}`);

			const pathName = this.namingService.generateUniqueOperationName(name, path);

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
				document,
				config,
				name,
				description,
				baseUrl,
				paths,
				jsdoc: new JSDocService(),
				relativeTo: (to: string): string => {
					const resolved = pathLib.posix.relative(pathLib.posix.dirname(filePath), to);

					return resolved.startsWith('.') ? resolved : `./${resolved}`;
				},
				toJSDocConfig: (
					path: ITsGenPath,
					pathParametersVarName: string,
					queryParametersVarName: string,
					bodyVarName: string,
				): IJSDocConfig =>
					this.toJSDocConfig(
						config,
						path,
						pathParametersVarName,
						queryParametersVarName,
						bodyVarName,
					),
				getImportEntries: () => this.getImportEntries(paths, filePath, config),
				camelCaseMerge: (s1: string, s2: string): string =>
					s1.charAt(0).toLowerCase() +
					s1.slice(1) +
					s2.charAt(0).toUpperCase() +
					s2.slice(1),
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
				optional: !path.request.body.required,
				description: path.request.body.description,
			});
		}

		const descriptions = [...(path.descriptions ?? [])];

		if (path.response.description) {
			descriptions.push(path.response.description);
		}

		return {
			params,
			deprecated: path.deprecated,
			summary: path.summaries,
			description: descriptions,
		};
	}

	private getRequest(path: Path): ITsGenPathRequest {
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

	private getPathRequestBody(path: Path): PathRequestBody | undefined {
		return (
			path.requestBodies?.find(x => new RegExp(this.jsonMediaRe).test(x.media)) ??
			path.requestBodies?.[0]
		);
	}

	private getResponse(path: Path): ITsGenPathResponse {
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
			description: response?.description,
		};
	}

	private getMostRelatedResponse(list: PathResponse[], codeRe: RegExp): PathResponse | undefined {
		return (
			list.find(
				x =>
					new RegExp(codeRe).test(x.code) &&
					x.media &&
					new RegExp(this.jsonMediaRe).test(x.media),
			) ?? list.find(x => new RegExp(codeRe).test(x.code))
		);
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
