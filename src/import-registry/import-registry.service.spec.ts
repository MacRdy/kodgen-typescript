import { IImportRegistryEntry } from './import-registry.model';
import { ImportRegistryService } from './import-registry.service';

describe('import-registry-service', () => {
	it('should return empty array when no keys', () => {
		const service = new ImportRegistryService();

		const entries = service.getImportEntries([], './file.ext');

		expect(entries.length).toStrictEqual(0);
	});

	it('should throw an error with unknown key', () => {
		const service = new ImportRegistryService();

		const fn = () => service.getImportEntries(['key'], './file');

		expect(fn).toThrow('Dependency could not be resolved');
	});

	it('should return correct entries', () => {
		const service = new ImportRegistryService();

		service.createLink('key1', './dir1/file1');
		service.createLink('key2', './dir1/file2');

		const entries = service.getImportEntries(['key1', 'key2'], './file');

		expect(entries).toStrictEqual<IImportRegistryEntry[]>([
			{ keys: ['key1'], path: './dir1/file1' },
			{ keys: ['key2'], path: './dir1/file2' },
		]);
	});

	it('should collapse one-path files', () => {
		const service = new ImportRegistryService();

		service.createLink('key1', './dir1/file1');
		service.createLink('key2', './dir1/file1');

		const entries = service.getImportEntries(['key1', 'key2'], './file');

		expect(entries).toStrictEqual<IImportRegistryEntry[]>([
			{ keys: ['key1', 'key2'], path: './dir1/file1' },
		]);
	});

	it('should resolve relative paths', () => {
		const service = new ImportRegistryService();

		service.createLink('key1', './dir1/file1');

		const entries = service.getImportEntries(['key1'], './another-dir/sub/file');

		expect(entries).toStrictEqual<IImportRegistryEntry[]>([
			{ keys: ['key1'], path: '../../dir1/file1' },
		]);
	});
});
