import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path'

export default {
    module: {
        rules: [
            {
                test: /\.wgsl$/,
                use: 'raw-loader',
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ],
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },

    devServer: {
        compress: true,
        hot: true,
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: './index.html',
            inject: false,
        }),
    ],

    cache: {
        type: 'memory',
    },

    output: {
        filename: 'bundle.js',
        path: path.resolve(process.cwd(), 'dist'),
        clean: true,
    }
};
