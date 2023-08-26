const path = require('node:path');
const fs = require('node:fs').promises;

const directoryPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'ingredients');

(async () => {
    const files = await fs.readdir(directoryPath);
    for (const file of files) {
        await fs.rename(path.join(directoryPath, file), path.join(directoryPath, file.toLowerCase().replace(/ui_loot_/g, '')));
    }
})();
