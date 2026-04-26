/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/services/**/*.ts'],
  moduleFileExtensions: ['ts', 'js'],
  verbose: true,
  forceExit: true,
};
