module.exports = {
    useTabs: false,
    printWidth: 120,
    tabWidth: 4,
    singleQuote: true,
    arrowParens: 'avoid',
    semi: true,
    trailingComma: 'all',
    quoteProps: 'as-needed',
    bracketSpacing: true,
    overrides: [
        {
            files: '*.component.html',
            options: {
                parser: 'angular',
            },
        },
        {
            files: '*.html',
            options: {
                parser: 'html',
            },
        },
    ],
};
