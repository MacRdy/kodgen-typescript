import { NgTypescriptGeneratorService } from 'generators/ng-typescript/ng-typescript-generator.service';
import { IGeneratorPackage } from 'kodgen';

export {
	TsGenGenerateEnumName,
	TsGenGenerateModelName,
	TsGenGenerateOperationName,
	TsGenGeneratePropertyName,
	TsGenGenerateServiceName,
	TsGenResolveSimpleType,
} from './generators/typescript/typescript-generator.model';

export const generatorPackage: IGeneratorPackage = {
	generators: [new NgTypescriptGeneratorService()],
};

export default generatorPackage;
