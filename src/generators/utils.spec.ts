import { EnumModelDef, ExtendedModelDef, ModelDef, NullModelDef, ObjectModelDef } from 'kodgen';
import { selectModels, toCamelCase, toKebabCase, toPascalCase } from './utils';

describe('utils', () => {
	describe('toPascalCase', () => {
		it('should transform string parts to pascal case without spaces', () => {
			expect(toPascalCase('pascal', 'case', ' string')).toStrictEqual('PascalCaseString');
		});

		it('should keep all capital letters', () => {
			expect(toPascalCase('IStringType')).toStrictEqual('IStringType');
		});

		it('should lower capitals in abbr', () => {
			expect(toPascalCase('UI')).toStrictEqual('Ui');
		});

		it('should not prefix numbers', () => {
			expect(toPascalCase('000Pascal')).toStrictEqual('000Pascal');
		});

		it('should merge words correctly', () => {
			expect(toPascalCase('I/files/get')).toStrictEqual('IFilesGet');
		});

		it('should remain only letters and numbers', () => {
			expect(toPascalCase('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual('1word');
		});
	});

	describe('toKebabCase', () => {
		it('should transform string parts to kebab case without spaces', () => {
			expect(toKebabCase('kebab', 'case', ' string')).toStrictEqual('kebab-case-string');
		});

		it('should remain only letters and numbers', () => {
			expect(toKebabCase('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual('1word');
		});

		it('should not prefix numbers', () => {
			expect(toKebabCase('000kebab')).toStrictEqual('000kebab');
		});
	});

	describe('toCamelCase', () => {
		it('should transform string parts to camel case without spaces', () => {
			expect(toCamelCase('camel', 'case', ' string')).toStrictEqual('camelCaseString');
		});

		it('should remain only letters and numbers', () => {
			expect(toCamelCase('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual('1word');
		});

		it('should remove special characters', () => {
			expect(toCamelCase('MyController_OperationId')).toStrictEqual(
				'myControllerOperationId',
			);
		});

		it('should not prefix numbers', () => {
			expect(toCamelCase('000camel')).toStrictEqual('000camel');
		});
	});

	describe('selectModels', () => {
		it('should select models by type', () => {
			const enumModelDef = new EnumModelDef('name', 'integer', []);

			const objectModelDef1 = new ObjectModelDef('name');
			const objectModelDef2 = new ObjectModelDef('name');

			const nullModelDef = new NullModelDef();

			const extendedModelDef = new ExtendedModelDef('or', [objectModelDef2, nullModelDef]);

			const store: ModelDef[] = [
				enumModelDef,
				objectModelDef1,
				objectModelDef2,
				extendedModelDef,
			];

			const result1 = selectModels(store, EnumModelDef);
			expect(result1.length).toBe(1);
			expect(result1[0]).toBe(enumModelDef);

			const result2 = selectModels(store, ObjectModelDef);
			expect(result2.length).toBe(2);
			expect(result2[0]).toBe(objectModelDef1);
			expect(result2[1]).toBe(objectModelDef2);

			const result3 = selectModels(store, NullModelDef);
			expect(result3.length).toBe(1);
			expect(result3[0]).toBe(nullModelDef);
		});
	});
});
