import { EnumEntryDef, EnumModelDef, IDocument } from 'kodgen';
import { ImportRegistryService } from '../../../import-registry/import-registry.service';
import { selectModels, toKebabCase } from '../../utils';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import { ITsGenEnum, ITsGenParameters } from '../typescript-generator.model';
import { TypescriptGeneratorEnumService } from './typescript-generator-enum.service';

jest.mock('../../../import-registry/import-registry.service');
jest.mock('../../utils');
jest.mock('../typescript-generator-storage.service');
jest.mock('../typescript-generator-naming.service');

const importRegistryServiceMock = jest.mocked(ImportRegistryService);
const storageServiceMock = jest.mocked(TypescriptGeneratorStorageService);
const namingServiceMock = jest.mocked(TypescriptGeneratorNamingService);
const toKebabCaseMock = jest.mocked(toKebabCase);
const selectModelsMock = jest.mocked(selectModels);

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

describe('typescript-generator-enum-service', () => {
	beforeEach(() => {
		importRegistryServiceMock.mockClear();
		storageServiceMock.mockClear();
		namingServiceMock.mockClear();
		toKebabCaseMock.mockClear();
		selectModelsMock.mockClear();
	});

	it('should generate file from enum def', () => {
		toKebabCaseMock.mockReturnValueOnce('enum-name');

		const entries: EnumEntryDef[] = [
			new EnumEntryDef('entry1', 1),
			new EnumEntryDef('entry2', 2),
		];

		const enumDef = new EnumModelDef('enumName', 'integer', entries, {
			format: 'int32',
			extensions: {
				'x-custom': true,
			},
		});

		const storage = new TypescriptGeneratorStorageService();
		const registry = new ImportRegistryService();
		const namingService = new TypescriptGeneratorNamingService();

		jest.mocked(namingService).generateUniqueEnumName.mockReturnValueOnce('EnumName');

		const service = new TypescriptGeneratorEnumService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const doc: IDocument = {
			models: [enumDef],
			paths: [],
			servers: [],
			tags: [],
		};

		selectModelsMock.mockReturnValueOnce([enumDef]);

		const result = service.generate(doc, {});

		expect(result.length).toBe(1);

		const file = result[0]!;

		const model: ITsGenEnum = {
			name: 'EnumName',
			isStringlyTyped: false,
			entries: [
				{
					name: 'entry1',
					value: 1,
					deprecated: false,
					description: undefined,
					extensions: {},
				},
				{
					name: 'entry2',
					value: 2,
					deprecated: false,
					description: undefined,
					extensions: {},
				},
			],
			deprecated: false,
			description: undefined,
			extensions: { 'x-custom': true },
		};

		expect(file.path).toStrictEqual('enums/enum-name');
		expect(file.template).toStrictEqual('enum');
		expect(file.templateData?.model).toStrictEqual(model);
		expect(file.templateData?.jsdoc).toBeTruthy();
		expect(file.templateData?.isValidName).toBeTruthy();

		expect(importRegistryServiceMock.prototype.createLink).toHaveBeenCalledTimes(1);
	});
});
