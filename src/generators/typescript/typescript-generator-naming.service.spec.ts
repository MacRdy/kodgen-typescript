import {
	BODY_OBJECT_ORIGIN,
	FORM_DATA_OBJECT_ORIGIN,
	Hooks,
	ObjectModel,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	Path,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from 'kodgen';
import { toCamelCase, toPascalCase } from '../utils';
import { TypescriptGeneratorNamingService } from './typescript-generator-naming.service';

jest.mock('../utils');
jest.mock('./typescript-generator.model');

const toCamelCaseMock = jest.mocked(toCamelCase);
const toPascalCaseMock = jest.mocked(toPascalCase);

const hooksGetOrDefaultSpy = jest.spyOn(Hooks, 'getOrDefault');

describe('typescript-generator-naming-service', () => {
	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);
	});

	beforeEach(() => {
		toCamelCaseMock.mockReset();
		toPascalCaseMock.mockReset();

		toCamelCaseMock.mockImplementation((...args) => args.join(''));
		toPascalCaseMock.mockImplementation((...args) => args.join(''));
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate unique name', () => {
		const service = new TypescriptGeneratorNamingService();

		const entity = new ObjectModel('Test');

		expect(service.generateUniqueEnumName(entity)).toStrictEqual('Test  ');
		expect(service.generateUniqueEnumName(entity)).toStrictEqual('Test 1 ');

		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test 2 ');
		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test 3 ');

		expect(service.generateUniquePropertyName('Object1', 'Test')).toStrictEqual('Test ');
		expect(service.generateUniquePropertyName('Object1', 'Test')).toStrictEqual('Test 1');
		expect(service.generateUniquePropertyName('Object2', 'Test')).toStrictEqual('Test ');

		expect(service.generateUniqueServiceName('Test')).toStrictEqual('Test ');
		expect(service.generateUniqueServiceName('Test')).toStrictEqual('Test 1');

		const path1 = new Path('test', 'GET');

		expect(service.generateUniqueOperationName('Service1', path1)).toStrictEqual('GET test ');

		expect(service.generateUniqueOperationName('Service1', path1)).toStrictEqual('GET test 1');

		expect(service.generateUniqueOperationName('Service2', path1)).toStrictEqual('GET test ');

		const path2 = new Path('test', 'GET', { operationId: 'operationId' });

		expect(service.generateUniqueOperationName('Service2', path2)).toStrictEqual(
			'operationId ',
		);

		const path3 = new Path('test', 'GET', {
			operationId: 'operationId',
			extensions: { 'x-operation-name': 'greet' },
		});

		expect(service.generateUniqueOperationName('Service2', path3)).toStrictEqual('greet ');

		expect(service.generateServiceName('Test')).toStrictEqual('Test ');
	});

	it('should generate correct name by origin', () => {
		const service = new TypescriptGeneratorNamingService();

		const entity = new ObjectModel('Test');

		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test  ');

		entity.origin = PATH_PARAMETERS_OBJECT_ORIGIN;

		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test  PathParameters');

		entity.origin = QUERY_PARAMETERS_OBJECT_ORIGIN;

		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test  QueryParameters');

		entity.origin = BODY_OBJECT_ORIGIN;

		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test  Body');

		entity.origin = FORM_DATA_OBJECT_ORIGIN;

		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test  FormData');

		entity.origin = RESPONSE_OBJECT_ORIGIN;

		expect(service.generateUniqueModelName(entity)).toStrictEqual('Test  Response');
	});
});
