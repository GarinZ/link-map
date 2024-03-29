module.exports = (api) => {
    api.cache(true);

    const envPreset = [
        '@babel/env',
        {
            // 不注释这一行jest运行会报错
            // modules: false,
            bugfixes: true,
            useBuiltIns: 'usage',
            corejs: { version: require('./package.json').devDependencies['core-js'] },
        },
    ];

    // const importPlugin = [
    //     'import',
    //     {
    //         libraryName: 'antd',
    //         libraryDirectory: 'es',
    //         style: true,
    //     },
    // ];

    return {
        presets: ['@babel/preset-typescript', envPreset],
        plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-runtime',
            ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
            'lodash',
            // importPlugin,
        ],
        env: {
            development: {
                presets: [['@babel/preset-react', { runtime: 'automatic', development: true }]],
                plugins: [require.resolve('react-refresh/babel')],
            },
            production: {
                presets: [['@babel/preset-react', { runtime: 'automatic', development: false }]],
                plugins: ['@babel/plugin-transform-react-constant-elements'],
            },
            test: {
                presets: ['@babel/preset-react'],
                plugins: ['transform-es2015-modules-commonjs'],
            },
        },
    };
};
