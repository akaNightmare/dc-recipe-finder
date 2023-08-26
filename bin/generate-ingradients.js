const path = require('node:path');
const fs = require('node:fs').promises;

const directoryPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'ingredients');
const dataPath = path.join(__dirname, '..', 'src', 'app', 'mock-api', 'common', 'ingredient', 'data.json');

(async () => {
    const files = await fs.readdir(directoryPath);
    const ingredients = [];
    for (const file of files) {
        ingredients.push({
            image_path: file,
            name: file.replace(/(\.png|\.jpg)/, ''),
        });
    }
    await fs.writeFile(dataPath, JSON.stringify(ingredients, null, 2));
})();

