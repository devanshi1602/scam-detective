// Inlines all scripts into a single self-contained dist/index.html (ready for GitHub Pages).
const fs = require('fs'), path = require('path');
const src = p => fs.readFileSync(path.join(__dirname, 'src', p), 'utf8');
let html = src('index.html');
const scripts = ['math.js', 'cases.js', 'stories.js', 'investigations.js', 'i18n.js', 'lang/hi-ui.js', 'lang/hi-cases.js', 'lang/hi-stories.js', 'lang/hi-inv.js', 'gl.js', 'textures.js', 'sound.js', 'game.js', 'faces.js', 'models.js', 'characters.js', 'people.js', 'investigate.js', 'scenes.js', 'puzzles.js', 'interact.js'].map(f => `<script>/* ${f} */\n${src(f)}\n</script>`).join('\n');
html = html.replace(/<!--SCRIPTS-->[\s\S]*<!--\/SCRIPTS-->/, scripts);
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), html);
console.log('dist/index.html', (html.length / 1024).toFixed(1) + ' KB');
