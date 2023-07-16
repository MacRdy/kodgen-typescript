import { ExtendedModelDef } from '../../../core/entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../../core/entities/schema-entities/null-model-def.model';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import {
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
} from '../../../core/entities/schema-entities/path-def.model';
import { Property } from '../../../core/entities/schema-entities/property.model';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { Hooks } from '../../../core/hooks/hooks';
import { ImportRegistryService } from '../../../core/import-registry/import-registry.service';
import { mergeParts, toKebabCase } from '../../../core/utils';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import { ITsGenModel, ITsGenParameters } from '../typescript-generator.model';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';

jest.mock('../../../core/import-registry/import-registry.service');
jest.mock('../../../core/hooks/hooks');
jest.mock('../../../core/printer/printer');
jest.mock('../../../core/utils');
jest.mock('../typescript-generator.model');
jest.mock('../typescript-generator-naming.service');

const namingServiceGlobalMock = jest.mocked(TypescriptGeneratorNamingService);
const toKebabCaseMock = jest.mocked(toKebabCase);
const mergePartsMock = jest.mocked(mergeParts);

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

describe('typescript-generator-model-service', () => {
	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);
	});

	beforeEach(() => {
		namingServiceGlobalMock.mockClear();
		toKebabCaseMock.mockClear();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate file from model def', () => {
		const properties: Property[] = [
			new Property(
				'prop1',
				new ExtendedModelDef('or', [
					new SimpleModelDef('integer', { format: 'int32' }),
					new NullModelDef(),
				]),
				{
					required: true,
				},
			),
			new Property('prop2', new SimpleModelDef('string')),
		];

		const modelDef = new ObjectModelDef('modelName', {
			properties,
			additionalProperties: new SimpleModelDef('integer', { format: 'int32' }),
			extensions: {
				'x-custom': true,
			},
		});

		toKebabCaseMock.mockReturnValueOnce('model-name');

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const service = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		jest.mocked(namingService).generateUniqueModelName.mockReturnValueOnce('ModelName');

		const result = service.generate([modelDef], { inlinePathParameters: true });

		expect(result.length).toStrictEqual(1);
		expect(registry.createLink).toHaveBeenCalledTimes(1);

		const resultFile = result[0];

		expect(resultFile?.path).toStrictEqual('models/model-name');
		expect(resultFile?.template).toStrictEqual('model');

		const expectedModel: ITsGenModel = {
			name: 'ModelName',
			dependencies: [],
			additionPropertiesTypeName: 'number',
			properties: [
				{
					name: 'prop1',
					type: '(number | null)',
					required: true,
					deprecated: false,
					dependencies: [],
					extensions: {},
					description: undefined,
				},
				{
					name: 'prop2',
					type: 'string',
					required: false,
					deprecated: false,
					dependencies: [],
					extensions: {},
					description: undefined,
				},
			],
			deprecated: false,
		};

		expect(resultFile?.templateData).toBeTruthy();

		expect(resultFile?.templateData?.models).toStrictEqual([expectedModel]);
		expect(resultFile?.templateData?.extensions).toStrictEqual({ 'x-custom': true });

		expect(resultFile?.templateData?.isValidName).toBeTruthy();
		expect(resultFile?.templateData?.getImportEntries).toBeTruthy();
	});

	it('should catch additionalProperties as dependency', () => {
		const additionalProperties = new ObjectModelDef('additionalProperty');

		const modelDef = new ObjectModelDef('modelName', {
			additionalProperties,
		});

		toKebabCaseMock.mockReturnValueOnce('model-name');

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const service = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		jest.mocked(namingService).generateUniqueModelName.mockReturnValueOnce('ModelName');
		jest.mocked(namingService).generateUniqueModelName.mockReturnValueOnce(
			'AdditionalProperty',
		);

		const result = service.generate([modelDef], { inlinePathParameters: true });

		expect(result.length).toStrictEqual(1);
		expect(registry.createLink).toHaveBeenCalledTimes(1);

		const resultFile = result[0];

		expect(resultFile?.path).toStrictEqual('models/model-name');
		expect(resultFile?.template).toStrictEqual('model');

		const expectedModel: ITsGenModel = {
			name: 'ModelName',
			dependencies: ['AdditionalProperty'],
			additionPropertiesTypeName: 'AdditionalProperty',
			properties: [],
			deprecated: false,
		};

		expect(resultFile?.templateData).toBeTruthy();

		expect(resultFile?.templateData?.models).toStrictEqual([expectedModel]);
		expect(resultFile?.templateData?.extensions).toStrictEqual({});

		expect(resultFile?.templateData?.isValidName).toBeTruthy();
		expect(resultFile?.templateData?.getImportEntries).toBeTruthy();
	});

	it('should generate file with simplified model', () => {
		const properties: Property[] = [
			new Property(
				'Filter.Current.Date.From',
				new ExtendedModelDef('or', [
					new SimpleModelDef('string', { format: 'date-time' }),
					new NullModelDef(),
				]),
				{ required: true },
			),
			new Property(
				'Filter.Current.Date.To',
				new SimpleModelDef('string', { format: 'date-time' }),
			),
			new Property(
				'Filter.Current.ClientId',
				new ExtendedModelDef('or', [
					new SimpleModelDef('string', { format: 'int32' }),
					new NullModelDef(),
				]),
				{ required: true },
			),
			new Property('Id', new SimpleModelDef('string')),
		];

		const modelDef = new ObjectModelDef('queryParametersModelName', {
			properties,
			origin: QUERY_PARAMETERS_OBJECT_ORIGIN,
		});

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const namingServiceMock = jest.mocked(namingService);

		const service = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		toKebabCaseMock.mockReturnValueOnce('query-parameters-model-name');
		mergePartsMock.mockReturnValueOnce('queryParametersModelName Filter');
		mergePartsMock.mockReturnValueOnce('queryParametersModelName Filter Current');
		mergePartsMock.mockReturnValueOnce('queryParametersModelName Filter Current Date');

		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('filter');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('current');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('date');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('from');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('to');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('clientId');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('id');

		namingServiceMock.generateUniqueModelName.mockReturnValueOnce('QueryParametersModelName');
		namingServiceMock.generateUniqueModelName.mockReturnValueOnce(
			'QueryParametersModelNameFilter',
		);
		namingServiceMock.generateUniqueModelName.mockReturnValueOnce(
			'QueryParametersModelNameFilterCurrent',
		);
		namingServiceMock.generateUniqueModelName.mockReturnValueOnce(
			'QueryParametersModelNameFilterCurrentDate',
		);

		const result = service.generate([modelDef], { inlinePathParameters: true });

		expect(result.length).toStrictEqual(1);
		expect(registry.createLink).toHaveBeenCalledTimes(4);

		const resultFile = result[0];

		expect(resultFile?.path).toStrictEqual('models/query-parameters-model-name');
		expect(resultFile?.template).toStrictEqual('model');

		const expectedModels: ITsGenModel[] = [
			{
				name: 'QueryParametersModelName',
				dependencies: [],
				additionPropertiesTypeName: undefined,
				properties: [
					{
						name: 'filter',
						type: 'QueryParametersModelNameFilter',
						required: false,
						deprecated: false,
						dependencies: ['QueryParametersModelNameFilter'],
						extensions: {},
						description: undefined,
					},
					{
						name: 'id',
						type: 'string',
						required: false,
						deprecated: false,
						dependencies: [],
						extensions: {},
						description: undefined,
					},
				],
				deprecated: false,
			},
			{
				name: 'QueryParametersModelNameFilter',
				dependencies: [],
				additionPropertiesTypeName: undefined,
				properties: [
					{
						name: 'current',
						type: 'QueryParametersModelNameFilterCurrent',
						required: false,
						deprecated: false,
						dependencies: ['QueryParametersModelNameFilterCurrent'],
						extensions: {},
						description: undefined,
					},
				],
				deprecated: false,
			},
			{
				name: 'QueryParametersModelNameFilterCurrent',
				dependencies: [],
				additionPropertiesTypeName: undefined,
				properties: [
					{
						name: 'date',
						type: 'QueryParametersModelNameFilterCurrentDate',
						required: false,
						deprecated: false,
						dependencies: ['QueryParametersModelNameFilterCurrentDate'],
						extensions: {},
						description: undefined,
					},
					{
						name: 'clientId',
						type: '(string | null)',
						required: true,
						deprecated: false,
						dependencies: [],
						extensions: {},
						description: undefined,
					},
				],
				deprecated: false,
			},
			{
				name: 'QueryParametersModelNameFilterCurrentDate',
				dependencies: [],
				additionPropertiesTypeName: undefined,
				properties: [
					{
						name: 'from',
						type: '(string | null)',
						required: true,
						deprecated: false,
						dependencies: [],
						extensions: {},
						description: undefined,
					},
					{
						name: 'to',
						type: 'string',
						required: false,
						deprecated: false,
						dependencies: [],
						extensions: {},
						description: undefined,
					},
				],
				deprecated: false,
			},
		];

		expect(resultFile?.templateData).toBeTruthy();

		expect(resultFile?.templateData!.models).toStrictEqual(expectedModels);
		expect(resultFile?.templateData!.extensions).toStrictEqual({});

		expect(resultFile?.templateData!.isValidName).toBeTruthy();
		expect(resultFile?.templateData!.getImportEntries).toBeTruthy();
		expect(resultFile?.templateData!.jsdoc).toBeTruthy();
	});

	it('should skip inline path parameters origin', () => {
		const pathModelDef = new ObjectModelDef('pathModelName', {
			properties: [new Property('prop', new SimpleModelDef('string'))],
			origin: PATH_PARAMETERS_OBJECT_ORIGIN,
		});

		const queryModelDef = new ObjectModelDef('queryModelName', {
			properties: [new Property('prop', new SimpleModelDef('string'))],
			origin: QUERY_PARAMETERS_OBJECT_ORIGIN,
		});

		toKebabCaseMock.mockReturnValueOnce('path-model-name');
		toKebabCaseMock.mockReturnValueOnce('query-model-name');

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const service = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const result = service.generate([pathModelDef, queryModelDef], {
			inlinePathParameters: true,
		});

		expect(result.length).toBe(1);
		expect(result[0]?.path).toBe('models/query-model-name');
		expect(registry.createLink).toBeCalledTimes(1);
	});
});
