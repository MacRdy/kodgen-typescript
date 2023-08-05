import { camelCase, camelCaseTransformMerge } from 'camel-case';
import { ExtendedModel, Model, Type } from 'kodgen';
import { paramCase } from 'param-case';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';

export const toPascalCase = (...parts: string[]): string =>
	pascalCase(parts.join(' '), { transform: pascalCaseTransformMerge });

export const toKebabCase = (...parts: string[]): string => paramCase(parts.join(' '));

export const toCamelCase = (...parts: string[]): string =>
	camelCase(parts.join(' '), { transform: camelCaseTransformMerge });

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
