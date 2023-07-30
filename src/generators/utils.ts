import { camelCase, camelCaseTransformMerge } from 'camel-case';
import kebabCase from 'just-kebab-case';
import { ExtendedModelDef, ModelDef, Type } from 'kodgen';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';

export const toPascalCase = (...parts: string[]): string =>
	pascalCase(parts.join(' '), { transform: pascalCaseTransformMerge });

export const toKebabCase = (...parts: string[]): string => kebabCase(parts.join(' '));

export const toCamelCase = (...parts: string[]): string =>
	camelCase(parts.join(' '), { transform: camelCaseTransformMerge });

export const selectModels = <T extends ModelDef>(
	models: ModelDef[],
	type: Type<T>,
	store = new Set<T>(),
): T[] => {
	for (const entity of models) {
		if (entity instanceof type) {
			store.add(entity);
		} else if (entity instanceof ExtendedModelDef) {
			selectModels(entity.def, type, store);
		}
	}

	return [...store.values()];
};
