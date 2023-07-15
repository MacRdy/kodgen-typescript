import {
	EnumEntryDef,
	EnumModelDef,
} from '../../../core/entities/schema-entities/enum-model-def.model';
import { ImportRegistryService } from '../../../core/import-registry/import-registry.service';
import { toKebabCase } from '../../../core/utils';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import { ITsGenEnum, ITsGenParameters } from '../typescript-generator.model';
import { TypescriptGeneratorEnumService } from './typescript-generator-enum.service';

jest.mock('../../../core/import-registry/import-registry.service');
jest.mock('../../../core/printer/printer');
jest.mock('../../../core/utils');
jest.mock('../typescript-generator-storage.service');
jest.mock('../typescript-generator-naming.service');

const importRegistryServiceMock = jest.mocked(ImportRegistryService);
const storageServiceMock = jest.mocked(TypescriptGeneratorStorageService);
const namingServiceMock = jest.mocked(TypescriptGeneratorNamingService);
const toKebabCaseMock = jest.mocked(toKebabCase);

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

		const result = service.generate([enumDef], {});

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
