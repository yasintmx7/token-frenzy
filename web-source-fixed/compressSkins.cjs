const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SKINS_DIR = path.join(__dirname, 'src', 'assets', 'skins');
const TO_DELETE = [
    'solaris-core.png',
    'dragon-scale.png',
    'crystal-peak.png',
    'molten-gold.png',
    'supernova.png',
    'ice-prism.png',
    'circuit-trace.png',
    'rainbow-glass.png',
    'sunburst.png'
];

async function processSkins() {
    const files = fs.readdirSync(SKINS_DIR);

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') continue;

        // NOTE: hero-bg.png is in src/assets! We should process it separately if we want
        if (TO_DELETE.includes(file)) {
            console.log(`Deleting ${file}`);
            fs.unlinkSync(path.join(SKINS_DIR, file));
            continue;
        }

        console.log(`Compressing ${file}`);
        const fullPath = path.join(SKINS_DIR, file);
        const name = path.basename(file, ext);
        const outPath = path.join(SKINS_DIR, `${name}.webp`);

        await sharp(fullPath)
            .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 75 })
            .toFile(outPath);

        // Delete the original after converting
        fs.unlinkSync(fullPath);
    }

    // Also compress hero-bg.png
    const heroBg = path.join(__dirname, 'src', 'assets', 'hero-bg.png');
    if (fs.existsSync(heroBg)) {
        console.log('Compressing hero-bg.png');
        const outPath = path.join(__dirname, 'src', 'assets', 'hero-bg.webp');
        await sharp(heroBg)
            .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 75 })
            .toFile(outPath);
        fs.unlinkSync(heroBg);
    }
}

processSkins().then(() => console.log('Done')).catch(console.error);
