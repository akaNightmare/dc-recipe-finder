module.exports = {
    root: true,
    ignorePatterns: ['projects/**/*'],
    overrides: [
        {
            files: ['*.ts'],
            parserOptions: {
                project: ['tsconfig.*?.json'],
                createDefaultProgram: true,
            },
            plugins: ['prettier', 'simple-import-sort', 'import'],
            extends: [
                'plugin:@angular-eslint/recommended',
                "plugin:@angular-eslint/recommended--extra",
                'plugin:@angular-eslint/template/process-inline-templates',
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
                // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
                'plugin:prettier/recommended',
            ],
            rules: {
                // '@angular-eslint/component-selector': [
                //     'error',
                //     {
                //         'type': 'element',
                //         'prefix': 'app',
                //         'style': 'kebab-case',
                //     },
                // ],
                '@angular-eslint/directive-selector': [
                    'error',
                    {
                        type: 'attribute',
                        prefix: 'app',
                        style: 'camelCase',
                    },
                ],
                '@typescript-eslint/no-unused-vars': [
                    'warn',
                    { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
                ],
                //
                // eslint-plugin-import
                //
                'import/first': 'error',
                'import/newline-after-import': 'error',
                'import/no-absolute-path': 'error',
                'import/no-amd': 'error',
                // 'import/no-default-export': 'error',
                'import/no-self-import': 'error',
                'import/no-named-default': 'error',
                'import/no-mutable-exports': 'error',
                'simple-import-sort/imports': 'error',
                'simple-import-sort/exports': 'error',
                'import/no-duplicates': 'error',
                'prettier/prettier': 'error',
            },
        },
        {
            files: ['*.html'],
            extends: ['plugin:@angular-eslint/template/recommended', 'plugin:prettier/recommended'],
            rules: {},
        },
        {
            files: ['*.component.ts'],
            extends: ['plugin:@angular-eslint/template/process-inline-templates'],
        },
    ],
};
