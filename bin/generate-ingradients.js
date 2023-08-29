#!/usr/bin/node

const path = require('node:path');
const fs = require('node:fs').promises;

const directoryPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'ingredients');
const dataPath = path.join(__dirname, '..', 'src', 'data', 'ingredients.json');

const imageRe = /(\.png|\.jpg)/i;

(async () => {
    const files = await fs.readdir(directoryPath);
    const ingredients = [];
    for (const file of files) {
        ingredients.push({ name: file.replace(imageRe, '') });
    }
    await fs.writeFile(dataPath, JSON.stringify(ingredients, null, 4));
})();
