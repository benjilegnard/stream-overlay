/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: 'jest-preset-angular',
	testEnvironment: '@happy-dom/jest-environment',
	setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
};
