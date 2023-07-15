import { ErrorObject } from 'ajv';
import { ExtendedModelDef, ModelDef } from 'kodgen';

export const getAjvValidateErrorMessage = (
	errors?: ErrorObject[] | null,
	title = 'Invalid configuration',
): string => {
	const message = errors
		?.map(e => [e.instancePath, e.message].filter(Boolean).join(' '))
		.join('\n- ');

	return `${title}:\n- ${message ?? 'Unknown error'}`;
};

export interface Type<T> extends Function {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	new (...args: any[]): T;
}

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

export const mergeParts = (...parts: string[]): string =>
	parts
		.map(x => x.trim())
		.filter(Boolean)
		.join(' ');
