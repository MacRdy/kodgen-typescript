import { EnumModelDef } from '../../core/entities/schema-entities/enum-model-def.model';
import { TypescriptGeneratorStorageService } from './typescript-generator-storage.service';
import { ITsGenEnum } from './typescript-generator.model';

describe('typescript-generator-storage-service', () => {
	it('should store set records correcly', () => {
		const service = new TypescriptGeneratorStorageService();

		const enumDef = new EnumModelDef('enumDef', 'integer', []);

		expect(service.get(enumDef)).toBeUndefined();

		service.set(enumDef, { name: 'test' });
		expect(service.get(enumDef)).toStrictEqual({ name: 'test', generatedModel: undefined });

		const generatedModel: ITsGenEnum = {
			deprecated: false,
			entries: [],
			isStringlyTyped: false,
			name: 'Test',
		};

		service.set(enumDef, { name: 'test1', generatedModel });
		expect(service.get(enumDef)).toStrictEqual({ name: 'test1', generatedModel });
	});
});
