import { ExtendedModelDef } from '../../../core/entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../../core/entities/schema-entities/null-model-def.model';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import {
	PathDef,
	PathRequestBody,
	PathResponse,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
} from '../../../core/entities/schema-entities/path-def.model';
import { Property } from '../../../core/entities/schema-entities/property.model';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { Tag } from '../../../core/entities/schema-entities/tag.model';
import { Hooks } from '../../../core/hooks/hooks';
import { ImportRegistryService } from '../../../core/import-registry/import-registry.service';
import { toKebabCase } from '../../../core/utils';
import { IGeneratorFile } from '../../../generators/generator.model';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import {
	ITsGenModel,
	ITsGenParameters,
	ITsGenPath,
	ITsGenPropertyMapping,
} from '../typescript-generator.model';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './typescript-generator-path.service';

jest.mock('../../../core/import-registry/import-registry.service');
jest.mock('../../../core/hooks/hooks');
jest.mock('../../../core/printer/printer');
jest.mock('../../../core/utils');
jest.mock('./typescript-generator-model.service');
jest.mock('../typescript-generator-storage.service');
jest.mock('../typescript-generator-naming.service');
jest.mock('../typescript-generator.model');

const toKebabCaseMock = jest.mocked(toKebabCase);
const modelServiceMock = jest.mocked(TypescriptGeneratorModelService);
const storageServiceMock = jest.mocked(TypescriptGeneratorStorageService);
const namingServiceGlobalMock = jest.mocked(TypescriptGeneratorNamingService);

const hooksGetOrDefaultSpy = jest.spyOn(Hooks, 'getOrDefault');

const testingTypescriptGeneratorConfig: ITsGenParameters = {
	enumDir: 'enums',
	enumFileNameResolver: name => toKebabCase(name),
	enumTemplate: 'enum',
	modelDir: 'models',
	modelFileNameResolver: name => toKebabCase(name),
	modelTemplate: 'model',
	pathDir: 'services',
	pathFileNameResolver: name => `${toKebabCase(name)}.service`,
	pathTemplate: 'service',
};

describe('typescript-generator-path-service', () => {
	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);
	});

	beforeEach(() => {
		toKebabCaseMock.mockClear();

		modelServiceMock.mockClear();
		storageServiceMock.mockClear();
		namingServiceGlobalMock.mockClear();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate file (simple)', () => {
		toKebabCaseMock.mockReturnValueOnce('my-api');

		const pathDef = new PathDef('/api', 'GET', {
			operationId: 'operationId',
			tags: ['myApi'],
			extensions: { 'x-custom': true },
			security: [{ test: ['abc'] }],
		});

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const modelService = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const service = new TypescriptGeneratorPathService(
			modelService,
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const namingServiceMock = jest.mocked(namingService);
		namingServiceMock.generateUniqueServiceName.mockReturnValueOnce('MyApi');
		namingServiceMock.generateUniqueOperationName.mockReturnValueOnce('getApi');

		const result = service.generate([pathDef], [], [], { inlinePathParameters: true });

		expect(result.length).toStrictEqual(1);

		const resultFile = result[0];

		expect(resultFile?.path).toStrictEqual('services/my-api.service');
		expect(resultFile?.template).toStrictEqual('service');

		const path: ITsGenPath = {
			name: 'getApi',
			method: 'GET',
			urlPattern: '/api',
			operationId: 'operationId',
			request: {
				body: undefined,
				pathParametersType: undefined,
				queryParametersMapping: undefined,
				queryParametersType: undefined,
			},
			response: {
				dependencies: [],
				typeName: 'void',
			},
			extensions: { 'x-custom': true },
			security: [{ test: ['abc'] }],
			deprecated: false,
			summaries: undefined,
			descriptions: undefined,
		};

		expect(resultFile?.templateData).toBeTruthy();

		expect(resultFile?.templateData?.name).toStrictEqual('MyApi');
		expect(resultFile?.templateData?.description).toBeUndefined();
		expect(resultFile?.templateData?.paths).toStrictEqual([path]);

		expect(resultFile?.templateData?.getImportEntries).toBeTruthy();
		expect(resultFile?.templateData?.parametrizeUrlPattern).toBeTruthy();
		expect(resultFile?.templateData?.toJSDocConfig).toBeTruthy();
		expect(resultFile?.templateData?.jsdoc).toBeTruthy();
	});

	it('should generate file (with parameters)', () => {
		toKebabCaseMock.mockReturnValueOnce('my-api');

		const pathParameters = new ObjectModelDef('/api get Request Path Parameters', {
			properties: [
				new Property(
					'PathParam1',
					new ExtendedModelDef('or', [new SimpleModelDef('string'), new NullModelDef()]),
					{
						required: true,
					},
				),
			],
			origin: PATH_PARAMETERS_OBJECT_ORIGIN,
		});

		const queryParameters = new ObjectModelDef('/api get Request Query Parameters', {
			properties: [
				new Property(
					'QueryParam1',
					new ExtendedModelDef('or', [
						new SimpleModelDef('integer', { format: 'int32' }),
						new NullModelDef(),
					]),
					{
						required: true,
					},
				),
			],
			origin: QUERY_PARAMETERS_OBJECT_ORIGIN,
		});

		const tags: Tag[] = [new Tag('myApi', 'Tag description')];

		const pathDef = new PathDef('/api', 'GET', {
			requestPathParameters: pathParameters,
			requestQueryParameters: queryParameters,
			tags: ['myApi'],
			extensions: { 'x-custom': true },
		});

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const modelService = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const service = new TypescriptGeneratorPathService(
			modelService,
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const namingServiceMock = jest.mocked(namingService);
		namingServiceMock.generateUniqueServiceName.mockReturnValueOnce('MyApi');
		namingServiceMock.generateUniqueOperationName.mockReturnValueOnce('getApi');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('queryParam1');

		const modelServiceInstanceMock = jest.mocked(modelService);

		modelServiceInstanceMock?.resolveType.mockReturnValueOnce(
			'/api get Request Query Parameters',
		);

		const pathParametersModel: ITsGenModel = {
			name: '/api get Request Path Parameters',
			deprecated: false,
			dependencies: [],
			properties: [
				{
					name: 'pathParam1',
					type: '(string | null)',
					required: true,
					deprecated: false,
					dependencies: [],
					extensions: {},
				},
			],
		};

		const queryParametersModel: ITsGenModel = {
			name: '/api get Request Query Parameters',
			deprecated: false,
			dependencies: [],
			properties: [
				{
					name: 'QueryParam1',
					type: '(integer | null)',
					required: true,
					deprecated: false,
					dependencies: [],
					extensions: {},
				},
			],
		};

		const storageServiceInstanceMock = jest.mocked(storage);

		storageServiceInstanceMock?.get.mockReturnValueOnce({
			generatedModel: pathParametersModel,
		});

		const queryParametersMapping: ITsGenPropertyMapping[] = [
			{
				objectPath: ['queryParam1'],
				originalName: 'QueryParam1',
			},
		];

		storageServiceInstanceMock?.get.mockReturnValueOnce({
			generatedModel: queryParametersModel,
			mapping: queryParametersMapping,
		});

		storageServiceInstanceMock?.get.mockReturnValueOnce({
			generatedModel: queryParametersModel,
			mapping: queryParametersMapping,
		});

		const result = service.generate([pathDef], [], tags, { inlinePathParameters: true });

		expect(result.length).toStrictEqual(1);

		const resultFile = result[0];

		expect(resultFile?.path).toStrictEqual('services/my-api.service');
		expect(resultFile?.template).toStrictEqual('service');

		const path: ITsGenPath = {
			name: 'getApi',
			method: 'GET',
			urlPattern: '/api',
			operationId: undefined,
			request: {
				body: undefined,
				pathParametersType: pathParametersModel,
				queryParametersMapping: [
					{
						originalName: 'QueryParam1',
						objectPath: ['queryParam1'],
					},
				],
				queryParametersType: queryParametersModel,
			},
			response: {
				dependencies: [],
				typeName: 'void',
			},
			extensions: { 'x-custom': true },
			security: [],
			deprecated: false,
			summaries: undefined,
			descriptions: undefined,
		};

		expect(resultFile?.templateData).toBeTruthy();

		expect(resultFile?.templateData?.name).toStrictEqual('MyApi');
		expect(resultFile?.templateData?.description).toStrictEqual('Tag description');
		expect(resultFile?.templateData?.paths).toStrictEqual([path]);

		expect(resultFile?.templateData?.getImportEntries).toBeTruthy();
		expect(resultFile?.templateData?.parametrizeUrlPattern).toBeTruthy();
	});

	it('should generate file (with body and response)', () => {
		toKebabCaseMock.mockReturnValueOnce('my-api');

		const requestBodyDef = new SimpleModelDef('string');
		const requestBody = new PathRequestBody('application/json', requestBodyDef);

		const responseDef = new SimpleModelDef('boolean');
		const response = new PathResponse('200', 'application/json', responseDef);

		const pathDef = new PathDef('/api', 'POST', {
			requestBodies: [requestBody],
			responses: [response],
			tags: ['myApi'],
			extensions: { 'x-custom': true },
		});

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const modelService = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const service = new TypescriptGeneratorPathService(
			modelService,
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const namingServiceMock = jest.mocked(namingService);
		namingServiceMock.generateUniqueServiceName.mockReturnValueOnce('MyApi');
		namingServiceMock.generateUniqueOperationName.mockReturnValueOnce('postApi');

		const modelServiceInstanceMock = jest.mocked(modelService);

		modelServiceInstanceMock?.resolveDependencies.mockReturnValueOnce([]);
		modelServiceInstanceMock?.resolveType.mockReturnValueOnce('string');

		modelServiceInstanceMock?.resolveDependencies.mockReturnValueOnce([]);
		modelServiceInstanceMock?.resolveType.mockReturnValueOnce('boolean');

		const result = service.generate([pathDef], [], [], { inlinePathParameters: true });

		expect(result.length).toStrictEqual(1);

		const resultFile = result[0] as IGeneratorFile;

		expect(resultFile.path).toStrictEqual('services/my-api.service');
		expect(resultFile.template).toStrictEqual('service');

		const path: ITsGenPath = {
			name: 'postApi',
			method: 'POST',
			urlPattern: '/api',
			operationId: undefined,
			request: {
				body: {
					typeName: 'string',
					media: 'application/json',
					dependencies: [],
					description: undefined,
					required: false,
				},
				pathParametersType: undefined,
				queryParametersMapping: undefined,
				queryParametersType: undefined,
			},
			response: {
				dependencies: [],
				typeName: 'boolean',
				media: 'application/json',
				description: undefined,
			},
			extensions: { 'x-custom': true },
			security: [],
			deprecated: false,
			summaries: undefined,
			descriptions: undefined,
		};

		expect(resultFile.templateData).toBeTruthy();

		expect(resultFile.templateData?.name).toStrictEqual('MyApi');
		expect(resultFile.templateData?.description).toBeUndefined();
		expect(resultFile.templateData?.paths).toStrictEqual([path]);

		expect(resultFile.templateData?.getImportEntries).toBeTruthy();
		expect(resultFile.templateData?.parametrizeUrlPattern).toBeTruthy();
	});
});
