import {
	ExtendedModel,
	Hooks,
	IDocument,
	IGeneratorFile,
	NullModel,
	ObjectModel,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	Path,
	PathRequestBody,
	PathResponse,
	Property,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	SimpleModel,
	Tag,
} from 'kodgen';
import { ImportRegistryService } from '../../../import-registry/import-registry.service';
import { toKebabCase } from '../../utils';
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

jest.mock('../../../import-registry/import-registry.service');
jest.mock('../../utils');
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
		toKebabCaseMock.mockReset();

		modelServiceMock.mockReset();
		storageServiceMock.mockReset();
		namingServiceGlobalMock.mockReset();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate three services', () => {
		const pathDef1 = new Path('', 'GET', { tags: ['tag'] });

		const pathDef2 = new Path('', 'GET');

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
		namingServiceMock.generateUniqueServiceName.mockImplementation(x => x);
		namingServiceMock.generateServiceName.mockImplementation(x => x);

		const doc: IDocument = {
			info: {},
			models: [],
			paths: [pathDef1, pathDef2],
			servers: [],
			tags: [],
		};

		const result = service.generate(doc, { inlinePathParameters: true });

		expect(result.length).toStrictEqual(2);

		expect(result[0]?.templateData!.name).toStrictEqual('tag');
		expect(result[1]?.templateData!.name).toStrictEqual('common');
	});

	it('should generate file (simple)', () => {
		toKebabCaseMock.mockReturnValueOnce('my-api');

		const pathDef = new Path('/api', 'GET', {
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

		const doc: IDocument = {
			info: {},
			models: [],
			paths: [pathDef],
			servers: [],
			tags: [],
		};

		const result = service.generate(doc, { inlinePathParameters: true });

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

		const pathParameters = new ObjectModel('/api get Request Path Parameters', {
			properties: [
				new Property(
					'PathParam1',
					new ExtendedModel('or', [new SimpleModel('string'), new NullModel()]),
					{
						required: true,
					},
				),
			],
			origin: PATH_PARAMETERS_OBJECT_ORIGIN,
		});

		const queryParameters = new ObjectModel('/api get Request Query Parameters', {
			properties: [
				new Property(
					'QueryParam1',
					new ExtendedModel('or', [
						new SimpleModel('integer', { format: 'int32' }),
						new NullModel(),
					]),
					{
						required: true,
					},
				),
			],
			origin: QUERY_PARAMETERS_OBJECT_ORIGIN,
		});

		const pathDef = new Path('/api', 'GET', {
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

		const doc: IDocument = {
			info: {},
			models: [],
			paths: [pathDef],
			servers: [],
			tags: [new Tag('myApi', 'Tag description')],
		};

		const result = service.generate(doc, { inlinePathParameters: true });

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

		const requestBodyDef = new SimpleModel('string');
		const requestBody = new PathRequestBody('application/json', requestBodyDef);

		const responseDef = new SimpleModel('boolean');
		const response = new PathResponse('200', responseDef, { media: 'application/json' });

		const pathDef = new Path('/api', 'POST', {
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

		const doc: IDocument = {
			info: {},
			models: [],
			paths: [pathDef],
			servers: [],
			tags: [],
		};

		const result = service.generate(doc, { inlinePathParameters: true });

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
				typeDescription: undefined,
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
