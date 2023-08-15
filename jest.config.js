module.exports = {
	coverageProvider: 'v8',
	moduleNameMapper: {},
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest',
	},
};
