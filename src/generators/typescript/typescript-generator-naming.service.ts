import {
	BODY_OBJECT_ORIGIN,
	FORM_DATA_OBJECT_ORIGIN,
	Hooks,
	NamedModel,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	Path,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from 'kodgen';
import { toCamelCase, toPascalCase } from '../utils';
import {
	TsGenGenerateEnumName,
	TsGenGenerateModelName,
	TsGenGenerateOperationName,
	TsGenGeneratePropertyName,
	TsGenGenerateServiceName,
} from './typescript-generator.model';

export class TypescriptGeneratorNamingService {
	private readonly registry = new Map<string, string[]>();

	private readonly referenceEntityNamingScope = 'REFERENCE_ENTITY_NAMING_SCOPE';

	private readonly serviceNamingScope = 'SERVICE_NAMING_SCOPE';

	private readonly getMethodNamingScope = (mainEntity: string): string =>
		`${mainEntity}_METHOD_NAMING_SCOPE`;

	private readonly getPropertyNamingScope = (mainEntity: string): string =>
		`${mainEntity}_PROPERTY_NAMING_SCOPE`;

	generateUniqueEnumName(entity: NamedModel, modifier?: number): string {
		const scope = this.referenceEntityNamingScope;
		const name = this.generateEnumName(...this.getRawName(entity, modifier));

		if (this.isReserved(scope, name)) {
			return this.generateUniqueEnumName(entity, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniqueModelName(entity: NamedModel, modifier?: number): string {
		const scope = this.referenceEntityNamingScope;
		const name = this.generateModelName(...this.getRawName(entity, modifier));

		if (this.isReserved(scope, name)) {
			return this.generateUniqueModelName(entity, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniqueServiceName(name: string, modifier?: number): string {
		const scope = this.serviceNamingScope;
		const generatedName = this.generateServiceName(name, modifier);

		if (this.isReserved(scope, generatedName)) {
			return this.generateUniqueServiceName(name, (modifier ?? 0) + 1);
		}

		this.reserve(scope, generatedName);

		return generatedName;
	}

	generateUniqueOperationName(key: string, path: Path, modifier?: number): string {
		const scope = this.getMethodNamingScope(key);
		const generatedName = this.generateOperationName(path, modifier);

		if (this.isReserved(scope, generatedName)) {
			return this.generateUniqueOperationName(key, path, (modifier ?? 0) + 1);
		}

		this.reserve(scope, generatedName);

		return generatedName;
	}

	generateUniquePropertyName(key: string, name: string, modifier?: number): string {
		const scope = this.getPropertyNamingScope(key);
		const generatedName = this.generatePropertyName(name, modifier);

		if (this.isReserved(scope, generatedName)) {
			return this.generateUniquePropertyName(key, name, (modifier ?? 0) + 1);
		}

		this.reserve(scope, generatedName);

		return generatedName;
	}

	generateServiceName(name: string, modifier?: number): string {
		const fn = Hooks.getOrDefault<TsGenGenerateServiceName>(
			'generateServiceName',
			(_name, _modifier) => toPascalCase(`${_name} ${_modifier ?? ''}`),
		);

		return fn(name, modifier);
	}

	private generateEnumName(name: string, modifier?: number, type?: string): string {
		const fn = Hooks.getOrDefault<TsGenGenerateEnumName>(
			'generateEnumName',
			(_name, _modifier, _type) => toPascalCase(`${_name} ${_modifier ?? ''} ${_type ?? ''}`),
		);

		return fn(name, modifier, type);
	}

	private generateModelName(name: string, modifier?: number, type?: string): string {
		const fn = Hooks.getOrDefault<TsGenGenerateModelName>(
			'generateModelName',
			(_name, _modifier, _type) => toPascalCase(`${_name} ${_modifier ?? ''} ${_type ?? ''}`),
		);

		return fn(name, modifier, type);
	}

	private generatePropertyName(name: string, modifier?: number): string {
		const fn = Hooks.getOrDefault<TsGenGeneratePropertyName>(
			'generatePropertyName',
			(_name, _modifier) => toCamelCase(`${_name} ${_modifier ?? ''}`),
		);

		return fn(name, modifier);
	}

	private generateOperationName(path: Path, modifier?: number): string {
		const fn = Hooks.getOrDefault<TsGenGenerateOperationName>(
			'generateOperationName',
			(_path, _modifier) => {
				const operationName = _path.extensions['x-operation-name'];

				if (operationName && typeof operationName === 'string') {
					return toCamelCase(`${operationName} ${_modifier ?? ''}`);
				}

				return _path.operationId
					? toCamelCase(`${_path.operationId} ${_modifier ?? ''}`)
					: toCamelCase(`${_path.method} ${_path.urlPattern} ${_modifier ?? ''}`);
			},
		);

		return fn(path, modifier);
	}

	private reserve(scope: string, name: string): void {
		const names = this.registry.get(scope) ?? [];

		if (names.includes(name)) {
			throw new Error(`Duplicate name found ('${name}')`);
		}

		names.push(name);

		this.registry.set(scope, names);
	}

	private getRawName(
		entity: NamedModel,
		modifier?: number,
	): [string, number | undefined, string | undefined] {
		if (!entity.originalName) {
			switch (entity.origin) {
				case PATH_PARAMETERS_OBJECT_ORIGIN:
					return [entity.name, modifier, 'PathParameters'];
				case QUERY_PARAMETERS_OBJECT_ORIGIN:
					return [entity.name, modifier, 'QueryParameters'];
				case FORM_DATA_OBJECT_ORIGIN:
					return [entity.name, modifier, 'FormData'];
				case BODY_OBJECT_ORIGIN:
					return [entity.name, modifier, 'Body'];
				case RESPONSE_OBJECT_ORIGIN:
					return [entity.name, modifier, 'Response'];
			}
		}

		return [entity.name, modifier, undefined];
	}

	private isReserved(scope: string, name: string): boolean {
		return !!this.registry.get(scope)?.includes(name);
	}
}
