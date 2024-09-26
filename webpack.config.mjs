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
        ],
    },

    devServer: {
        static: './',
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
