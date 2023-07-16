import { IGeneratorPackage } from 'kodgen';
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
	generators: [new NgTypescriptGeneratorService()],
};

export default generatorPackage;
