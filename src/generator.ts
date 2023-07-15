import { IGeneratorPackage } from 'kodgen';
import { NgTypescriptGeneratorService } from './ng-typescript/ng-typescript-generator.service';

export const generator: IGeneratorPackage = {
	generators: [new NgTypescriptGeneratorService()],
};
