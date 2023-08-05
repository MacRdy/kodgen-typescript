import { EnumModel, ObjectModel } from 'kodgen';
import { ITsGenEnum, ITsGenModel, ITsGenStorageInfo } from './typescript-generator.model';

export class TypescriptGeneratorStorageService {
	private readonly enumInfo = new Map<EnumModel, ITsGenStorageInfo<ITsGenEnum>>();
	private readonly modelInfo = new Map<ObjectModel, ITsGenStorageInfo<ITsGenModel>>();

	get(enumDef: EnumModel): ITsGenStorageInfo<ITsGenEnum> | undefined;
	get(modelDef: ObjectModel): ITsGenStorageInfo<ITsGenModel> | undefined;
	get(
		modelDef: EnumModel | ObjectModel,
	): ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel> | undefined;
	get(
		def: EnumModel | ObjectModel,
	): ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel> | undefined {
		return def instanceof EnumModel ? this.enumInfo.get(def) : this.modelInfo.get(def);
	}

	set(def: EnumModel, data: ITsGenStorageInfo<ITsGenEnum>): void;
	set(def: ObjectModel, data: ITsGenStorageInfo<ITsGenModel>): void;
	set(
		def: EnumModel | ObjectModel,
		data: ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel>,
	): void;
	set(
		def: EnumModel | ObjectModel,
		data: ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel>,
	): void {
		if (def instanceof EnumModel) {
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

	delete(def: EnumModel | ObjectModel): void {
		if (def instanceof EnumModel) {
			this.enumInfo.delete(def);
		} else {
			this.modelInfo.delete(def);
		}
	}
}
