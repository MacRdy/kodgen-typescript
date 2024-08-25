import camelCase from 'just-camel-case';
import kebabCase from 'just-kebab-case';
import pascalCase from 'just-pascal-case';
import { ExtendedModel, Model, Type } from 'kodgen';

export const toPascalCase = (...parts: string[]): string => pascalCase(parts.join(' '));

export const toKebabCase = (...parts: string[]): string => kebabCase(parts.join(' '));

export const toCamelCase = (...parts: string[]): string => camelCase(parts.join(' '));

export const selectModels = <T extends Model>(
	models: Model[],
	type: Type<T>,
	store = new Set<T>(),
): T[] => {
	for (const entity of models) {
		if (entity instanceof type) {
			store.add(entity);
		} else if (entity instanceof ExtendedModel) {
			selectModels(entity.def, type, store);
		}
	}

	return [...store.values()];
};
