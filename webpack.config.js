const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const list = require("./src/list.json")
let fileList = list.fileNameList
function getEntry() {

    let obj = {
        file: {},
        plugin: []
    }
    for (let i = 0; i < fileList.length; i++) {
        obj.file[fileList[i]] = `./src/js/${ fileList[i] }.js`
        obj.plugin.push(
            new HtmlWebpackPlugin({
                template: `./src/page/${ fileList[i] }.html`,
                chunks: [fileList[i]],
                filename: `${ fileList[i] }.html`
            })
        )
    }
    return obj
}

module.exports = {
    entry: getEntry().file,
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
        assetModuleFilename: 'images/[hash][ext][query]',
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.html$/i,
                loader: "html-loader",
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|jpg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'img/[name][ext]'
                }
            },
            {
                test: /\.(gltf|obj|mtl)$/i,
                type: "asset",
                generator: {
                    filename: 'model/[hash][ext][query]'
                }
            },
            {
                test: /\.(json)$/i,
                type: "asset",
                generator: {
                    filename: 'json/[hash][ext][query]'
                }
            },
        ]
    },
    plugins: [
        ...getEntry().plugin,
    ],
    devServer: {
        hot: true,
        static: {
            directory: path.join(__dirname, 'src'),
        },
        port: 8088,
        // https: true,
    }
}