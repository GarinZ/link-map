import type { JestConfigWithTsJest } from 'ts-jest';

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: { '^.+\\.ts?$': 'ts-jest' },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
} as JestConfigWithTsJest;
