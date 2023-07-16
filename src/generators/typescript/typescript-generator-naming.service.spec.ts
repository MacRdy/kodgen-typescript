import { ObjectModelDef } from '../../core/entities/schema-entities/object-model-def.model';
import {
	BODY_OBJECT_ORIGIN,
	FORM_DATA_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '../../core/entities/schema-entities/path-def.model';
import { Hooks } from '../../core/hooks/hooks';
import { toCamelCase, toPascalCase } from '../../core/utils';
import { TypescriptGeneratorNamingService } from './typescript-generator-naming.service';

jest.mock('../../core/utils');
jest.mock('./typescript-generator.model');

const toCamelCaseMock = jest.mocked(toCamelCase);
const toPascalCaseMock = jest.mocked(toPascalCase);

const hooksGetOrDefaultSpy = jest.spyOn(Hooks, 'getOrDefault');

describe('typescript-generator-naming-service', () => {
	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);

		toCamelCaseMock.mockImplementation((...args) => args.join(''));
		toPascalCaseMock.mockImplementation((...args) => args.join(''));
	});

	beforeEach(() => {
		toCamelCaseMock.mockClear();
		toPascalCaseMock.mockClear();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate unique name', () => {
		const service = new TypescriptGeneratorNamingService();

		const entity = new ObjectModelDef('Test');

		expect(service.generateUniqueEnumName(entity)).toStrictEqual('Test');
		expect(service.generateUniqueEnumName(entity)).toStrictEqual('Test1');

		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test2');
		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test3');

		expect(service.generateUniquePropertyName('Object1', 'Test')).toStrictEqual('Test');
		expect(service.generateUniquePropertyName('Object1', 'Test')).toStrictEqual('Test1');
		expect(service.generateUniquePropertyName('Object2', 'Test')).toStrictEqual('Test');

		expect(service.generateUniqueServiceName('Test')).toStrictEqual('Test');
		expect(service.generateUniqueServiceName('Test')).toStrictEqual('Test1');

		expect(service.generateUniqueOperationName('Service1', 'get', 'test')).toStrictEqual(
			'gettest',
		);

		expect(service.generateUniqueOperationName('Service1', 'get', 'test')).toStrictEqual(
			'gettest1',
		);

		expect(service.generateUniqueOperationName('Service2', 'get', 'test')).toStrictEqual(
			'gettest',
		);

		expect(
			service.generateUniqueOperationName('Service2', 'get', 'test', 'operationId'),
		).toStrictEqual('operationId');

		expect(service.generateServiceName('Test')).toStrictEqual('Test');
	});

	it('should generate correct name by origin', () => {
		const service = new TypescriptGeneratorNamingService();

		const entity = new ObjectModelDef('Test');

		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test');

		entity.origin = PATH_PARAMETERS_OBJECT_ORIGIN;

		expect(service.generateUniqueModelName(entity)).toStrictEqual('TestPathParameters');

		entity.origin = QUERY_PARAMETERS_OBJECT_ORIGIN;

		expect(service.generateUniqueModelName(entity)).toStrictEqual('TestQueryParameters');

		entity.origin = BODY_OBJECT_ORIGIN;

		expect(service.generateUniqueModelName(entity)).toStrictEqual('TestBody');

		entity.origin = FORM_DATA_OBJECT_ORIGIN;

		expect(service.generateUniqueModelName(entity)).toStrictEqual('TestFormData');

		entity.origin = RESPONSE_OBJECT_ORIGIN;

		expect(service.generateUniqueModelName(entity)).toStrictEqual('TestResponse');
	});
});
