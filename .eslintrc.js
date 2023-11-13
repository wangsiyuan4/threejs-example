module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
    // 解决let被强转为const问题
        "prefer-const": 0,
        // 保存代码时缩进4个空格
        "indent": ['error', 4],
    }
}
