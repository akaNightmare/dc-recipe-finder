process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fetch = require('node-fetch');
const images = require('../src/data/ingredients.json');

const BATCH_COUNT = 50;

const API_KEY = 'ak_344e8b04be7b3de8a876d469686ab4da65606bfead0d35e7f08b2174ecf82b1f';

(async () => {
    const promises = [];
    for (const { name } of images) {
        if (promises.length < BATCH_COUNT) {
            promises.push(purgeImage(name).then(() => {
                console.log(`[PURGE IMAGE] processed ${name} image`);
            }));
            continue;
        }
        await Promise.all(promises);
        promises.length = 0;
    }
    if (promises.length > 0) {
        await Promise.all(promises);
    }
})();

async function purgeImage(imageName) {
    const res = await fetch('https://api.imgix.com/api/v1/purge', {
        method: 'post',
        body: JSON.stringify({
            data: { type: 'purges', attributes: { url: `https://dc-recipe-finder.imgix.net/assets/images/ingredients/${encodeURIComponent(imageName)}.png` } },
        }),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    });
    return res.json();
}



