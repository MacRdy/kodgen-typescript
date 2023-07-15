import { EnumModelDef, ObjectModelDef } from 'kodgen';
import { ITsGenEnum, ITsGenModel, ITsGenStorageInfo } from './typescript-generator.model';

export class TypescriptGeneratorStorageService {
	private readonly enumInfo = new Map<EnumModelDef, ITsGenStorageInfo<ITsGenEnum>>();
	private readonly modelInfo = new Map<ObjectModelDef, ITsGenStorageInfo<ITsGenModel>>();

	get(enumDef: EnumModelDef): ITsGenStorageInfo<ITsGenEnum> | undefined;
	get(modelDef: ObjectModelDef): ITsGenStorageInfo<ITsGenModel> | undefined;
	get(
		modelDef: EnumModelDef | ObjectModelDef,
	): ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel> | undefined;
	get(
		def: EnumModelDef | ObjectModelDef,
	): ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel> | undefined {
		return def instanceof EnumModelDef ? this.enumInfo.get(def) : this.modelInfo.get(def);
	}

	set(def: EnumModelDef, data: ITsGenStorageInfo<ITsGenEnum>): void;
	set(def: ObjectModelDef, data: ITsGenStorageInfo<ITsGenModel>): void;
	set(
		def: EnumModelDef | ObjectModelDef,
		data: ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel>,
	): void;
	set(
		def: EnumModelDef | ObjectModelDef,
		data: ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel>,
	): void {
		if (def instanceof EnumModelDef) {
			const existing = this.get(def);

			const info = data as ITsGenStorageInfo<ITsGenEnum>;

			this.enumInfo.set(def, {
				name: info.name ?? existing?.name,
				generatedModel: info.generatedModel ?? existing?.generatedModel,
			});
		} else {
			const existing = this.get(def);

			const info = data as ITsGenStorageInfo<ITsGenModel>;

			this.modelInfo.set(def, {
				name: info.name ?? existing?.name,
				generatedModel: info.generatedModel ?? existing?.generatedModel,
				mapping: info.mapping ?? existing?.mapping,
			});
		}
	}

	delete(def: EnumModelDef | ObjectModelDef): void {
		if (def instanceof EnumModelDef) {
			this.enumInfo.delete(def);
		} else {
			this.modelInfo.delete(def);
		}
	}
}
