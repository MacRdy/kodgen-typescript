import { IGeneratorPackage } from 'kodgen';
import { AxiosTypescriptGeneratorService } from './generators/axios-typescript/axios-typescript-generator.service';
import { FetchTypescriptGeneratorService } from './generators/fetch-typescript/fetch-typescript-generator.service';
import { NgTypescriptGeneratorService } from './generators/ng-typescript/ng-typescript-generator.service';

export {
	TsGenGenerateEnumName,
	TsGenGenerateModelName,
	TsGenGenerateOperationName,
	TsGenGeneratePropertyName,
	TsGenGenerateServiceName,
	TsGenResolveSimpleType,
} from './generators/typescript/typescript-generator.model';

const generatorPackage: IGeneratorPackage = {
	generators: [
		new NgTypescriptGeneratorService(),
		new AxiosTypescriptGeneratorService(),
		new FetchTypescriptGeneratorService(),
	],
};

export default generatorPackage;
