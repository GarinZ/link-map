/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    transform: { '\\.(mjs|jsx|js|ts|tsx)$': 'babel-jest' }, // 使用babel编译js和ts文件
    moduleDirectories: ['node_modules', 'src'], // 决定模块路径
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'], // 模块扩展路径
    setupFilesAfterEnv: ['./jest.setup.js'], // 在jest环境设置后执行的文件
    moduleNameMapper: {
        // '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
        //     '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|less)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1', // 适配webpack的@别名（resolve.modules配置）
    },
    transformIgnorePatterns: [
        '<rootDir>/node_modules/(?!(' +
            '@garinz/webext-bridge' +
            '|.pnpm/nanoevents@6.0.2/node_modules/nanoevents' +
            '|.pnpm/serialize-error@9.1.1/node_modules/serialize-error' +
            '|.pnpm/dexie@3.2.3/node_modules/dexie' +
            '))',
    ], // 忽略一些node_modules的编译
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'], // 收集覆盖率的文件
    coverageDirectory: 'coverage',
};
