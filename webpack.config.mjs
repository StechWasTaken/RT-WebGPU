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
        static: path.resolve(process.cwd(), 'dist'),
        compress: true,
        hot: true,
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: './index.html',
        }),
    ],

    cache: {
        type: 'filesystem',
    },

    output: {
        filename: 'bundle.js',
        path: path.resolve(process.cwd(), 'dist'),
        clean: true,
    }
};
