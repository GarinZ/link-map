import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { HotModuleReplacementPlugin } from 'webpack';
import merge from 'webpack-merge';

import commonConfig from './webpack.common';

const devConfig = merge(commonConfig, {
    mode: 'development',
    devtool: 'source-map',
    plugins: [
        new HotModuleReplacementPlugin(),
        new ReactRefreshWebpackPlugin({
            overlay: {
                sockIntegration: 'whm',
            },
        }),
        // 将TypeScrip类型检查移到独立进程，另外把Error打到devServer中
        // 用vscode所以先暂时禁用tsconfig.json
        // new ForkTsCheckerWebpackPlugin({
        //     typescript: {
        //         memoryLimit: 1024,
        //         configFile: resolveSrc('tsconfig.json'),
        //     },
        // }),
    ],
});

export default devConfig;
