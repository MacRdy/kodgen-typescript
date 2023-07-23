import { IDocument, IGenerator, IGeneratorFile } from 'kodgen';
import { ImportRegistryService } from '../../import-registry/import-registry.service';
import { TypescriptGeneratorEnumService } from './entities/typescript-generator-enum.service';
import { TypescriptGeneratorModelService } from './entities/typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './entities/typescript-generator-path.service';
import { TypescriptGeneratorNamingService } from './typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from './typescript-generator-storage.service';
import { ITsGenConfig, ITsGenParameters } from './typescript-generator.model';

export abstract class TypescriptGeneratorService implements IGenerator<ITsGenConfig> {
	private readonly storage = new TypescriptGeneratorStorageService();
	private readonly importRegistry = new ImportRegistryService();
	private readonly namingService = new TypescriptGeneratorNamingService();

	private readonly enumService = new TypescriptGeneratorEnumService(
		this.storage,
		this.importRegistry,
		this.namingService,
		this.parameters,
	);

	private readonly modelService = new TypescriptGeneratorModelService(
		this.storage,
		this.importRegistry,
		this.namingService,
		this.parameters,
	);

	private readonly pathService = new TypescriptGeneratorPathService(
		this.modelService,
		this.storage,
		this.importRegistry,
		this.namingService,
		this.parameters,
	);

	constructor(private readonly parameters: ITsGenParameters) {}

	abstract getName(): string;

	abstract getTemplateDir(): string;

	abstract prepareConfig(userConfig?: ITsGenConfig): ITsGenConfig;

	generate(document: IDocument, config?: ITsGenConfig): IGeneratorFile[] {
		if (!config) {
			throw new Error('Generator config not defined');
		}

		const files: IGeneratorFile[] = [
			...this.enumService.generate(document, config),
			...this.modelService.generate(document, config),
			...this.pathService.generate(document, config),
		];

		if (config?.index) {
			const paths = files.map(x => `./${x.path}`);

			files.push({
				path: 'index',
				template: 'index',
				templateData: { paths },
			});
		}

		return files.map(x => ({ ...x, path: `${x.path}.ts` }));
	}
}
