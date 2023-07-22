import { Extensions, IDocument, PathMethod } from 'kodgen';

export interface ITsGenConfig {
	index?: boolean;
	inlinePathParameters?: boolean;
	readonly?: boolean;
	useNativeEnums?: boolean;
}

export interface ITsGenParameters {
	enumDir: string;
	enumFileNameResolver: (name: string) => string;
	enumTemplate: string;

	modelDir: string;
	modelFileNameResolver: (name: string) => string;
	modelTemplate: string;

	pathDir: string;
	pathFileNameResolver: (name: string) => string;
	pathTemplate: string;
}

export interface ITsGenEnumEntry<T = unknown> {
	name: string;
	value: T;
	deprecated: boolean;
	description?: string;
	extensions?: Extensions;
}

export interface ITsGenEnum {
	name: string;
	isStringlyTyped: boolean;
	entries: ITsGenEnumEntry[];
	deprecated: boolean;
	extensions?: Extensions;
	description?: string;
}

export interface ITsGenModelProperty {
	name: string;
	type: string;
	required: boolean;
	deprecated: boolean;
	dependencies: string[];
	description?: string;
	extensions: Extensions;
}

export interface ITsGenModel {
	name: string;
	properties: ITsGenModelProperty[];
	additionPropertiesTypeName?: string;
	deprecated: boolean;
	description?: string;
	dependencies: string[];
}

export interface ITsGenPropertyMapping {
	originalName: string;
	objectPath: string[];
}

export interface ITsPathBody {
	typeName: string;
	media: string;
	required: boolean;
	description?: string;
	dependencies: string[];
}

export interface ITsGenPathRequest {
	pathParametersType?: ITsGenModel;
	queryParametersType?: ITsGenModel;
	queryParametersMapping?: ITsGenPropertyMapping[];
	body?: ITsPathBody;
}

export interface ITsGenPathResponse {
	typeName: string;
	media?: string;
	dependencies: string[];
	description?: string;
}

export interface ITsGenPath {
	name: string;
	urlPattern: string;
	method: PathMethod;
	operationId?: string;
	request: ITsGenPathRequest;
	response: ITsGenPathResponse;
	deprecated: boolean;
	summaries?: string[];
	descriptions?: string[];
	extensions: Extensions;
	security: Record<string, string[]>[];
}

export interface ITsGenStorageInfo<T> {
	name?: string;
	generatedModel?: T;
	mapping?: ITsGenPropertyMapping[];
}

/**
 * @function
 * @description Generate unique enum name
 * @param {string} name - Original name (if any), or a set of keywords identifying the element
 * @param {number} [modifier] - Modifier. Adds uniqueness to duplicate enum names
 * @param {string} [type] - Model type for elements without original name (PathParameters, QueryParameters, FormData, Body or Response)
 * @returns {string} - New enum name
 */
export type TsGenGenerateEnumName = (name: string, modifier?: number, type?: string) => string;

/**
 * @function
 * @description Generate unique model name
 * @param {string} name - Original name (if any), or a set of keywords identifying the element
 * @param {number} [modifier] - Modifier. Adds uniqueness to duplicate model names
 * @param {string} [type] - Model type for elements without original name (PathParameters, QueryParameters, FormData, Body or Response)
 * @returns {string} - New model name
 */
export type TsGenGenerateModelName = (name: string, modifier?: number, type?: string) => string;

/**
 * @function
 * @description Generate unique model property name (complex query param models only)
 * @param {string} name - Original property name
 * @param {number} [modifier] - Modifier. Adds uniqueness to duplicate model property names
 * @returns {string} - New property name
 */
export type TsGenGeneratePropertyName = (name: string, modifier?: number) => string;

/**
 * @function
 * @description Generate unique service name
 * @param {string} name - Original service name (tag)
 * @param {number} [modifier] - Modifier. Adds uniqueness to duplicate service names
 * @returns {string} - New service name
 */
export type TsGenGenerateServiceName = (name: string, modifier?: number) => string;

/**
 * @function
 * @description Generate unique method name
 * @param {string} name - A set of keywords identifying the path (method, url pattern)
 * @param {number} [modifier] - Modifier. Adds uniqueness to duplicate method names
 * @returns {string} - New method name
 */
export type TsGenGenerateOperationName = (
	method: string,
	urlPattern: string,
	operationId?: string,
	modifier?: number,
) => string;

/**
 * @function
 * @description Simple type resolver (schema type to TypeScript type converter)
 * @param {string} type - Schema type name to resolve (e.g. of property)
 * @param {number} [format] - Schema type format
 * @returns {string} - Resolved TypeScript type name
 */
export type TsGenResolveSimpleType = (type: string, format?: string) => string | undefined;

export const baseUrlSelector = (document: IDocument): string | undefined =>
	document.servers[0]?.url;
