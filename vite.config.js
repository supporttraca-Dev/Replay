import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import basicSsl from '@vitejs/plugin-basic-ssl';

// ═══════════════════════════════════════════════════════════════
//  TRACA SCENARIO WRITER — Vite Plugin
//  Ajoute un endpoint HTTP POST /api/save-scenario qui écrit
//  physiquement le fichier JSON du scénario sur le disque.
// ═══════════════════════════════════════════════════════════════
function scenarioWriterPlugin() {
    return {
        name: 'traca-scenario-writer',
        configureServer(server) {
            server.middlewares.use('/api/save-scenario', (req, res) => {
                if (req.method !== 'POST') {
                    res.statusCode = 405;
                    res.end('Method Not Allowed');
                    return;
                }

                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => {
                    try {
                        const payload = JSON.parse(body);
                        const { experienceId, chapters, audioNodes, settings } = payload;

                        if (!experienceId) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({ error: 'Missing experienceId' }));
                            return;
                        }

                        // ── Ensure data directory exists ──
                        const dataDir = path.resolve(process.cwd(), 'src/data');
                        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

                        // ── Write full scenario JSON (chapters + audioNodes + settings) ──
                        const filePath = path.join(dataDir, `scenario_${experienceId}.json`);
                        const fileContent = JSON.stringify({ 
                            experienceId,
                            savedAt: new Date().toISOString(),
                            chapters:    chapters    || [],
                            audioNodes:  audioNodes  || [],
                            settings:    settings    || {}
                        }, null, 2);

                        fs.writeFileSync(filePath, fileContent, 'utf-8');

                        console.log(`[TRACA Director] ✅ Scénario '${experienceId}' sauvegardé → ${filePath}`);

                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.end(JSON.stringify({ success: true, path: filePath }));

                    } catch (err) {
                        console.error('[TRACA Director] ❌ Erreur:', err);
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: err.message }));
                    }
                });
            });
        }
    };
}

// ═══════════════════════════════════════════════════════════════
//  LEVEL EXPORTER — /api/export-level
//  Crée un dossier "exports" à la racine et enregistre le niveau 
//  avec l'heure exacte.
// ═══════════════════════════════════════════════════════════════
function exportLevelPlugin() {
    return {
        name: 'traca-level-exporter',
        configureServer(server) {
            server.middlewares.use('/api/export-level', (req, res) => {
                if (req.method !== 'POST') {
                    res.statusCode = 405;
                    res.end('Method Not Allowed');
                    return;
                }

                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => {
                    try {
                        const payload = JSON.parse(body);

                        // ── Créer dossier exports à la racine ──
                        const exportsDir = path.resolve(process.cwd(), 'exports');
                        if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

                        // ── Nom de fichier HH_MM_SS ──
                        const now = new Date();
                        const timeString = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}m${String(now.getSeconds()).padStart(2, '0')}s`;
                        const dateString = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        const fileName = `Export_${dateString}_${timeString}.js`;
                        const filePath = path.join(exportsDir, fileName);

                        // ── Contenu du fichier JS ──
                        const fileContent = `// Export auto généré le ${dateString} à ${timeString}
export const CASBAH_SCENARIO = ${JSON.stringify(payload.levelData, null, 4)};
`;

                        fs.writeFileSync(filePath, fileContent, 'utf-8');
                        console.log(`[Level Exporter] ✅ Niveau sauvegardé → ${filePath}`);

                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.end(JSON.stringify({ success: true, path: filePath, fileName }));

                    } catch (err) {
                        console.error('[Level Exporter] ❌ Erreur:', err);
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: err.message }));
                    }
                });
            });
        }
    };
}

// ═══════════════════════════════════════════════════════════════
//  AUDIO LISTER — /api/list-audio?dir=casbah/narrations
//  Retourne la liste des .mp3 disponibles dans assets/audio/
// ═══════════════════════════════════════════════════════════════
function audioListerPlugin() {
    return {
        name: 'traca-audio-lister',
        configureServer(server) {
            server.middlewares.use('/api/list-audio', (req, res) => {
                const urlParams = new URL(req.url, 'http://localhost').searchParams;
                // Si '?dir=' est défini, on l'utilise (même vide), sinon on regarde le root audio.
                const dir = urlParams.has('dir') ? urlParams.get('dir') : '';
                const audioPath = path.resolve(process.cwd(), 'assets/audio', dir);

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');

                if (!fs.existsSync(audioPath)) {
                    res.end(JSON.stringify({ files: [] }));
                    return;
                }

                const files = fs.readdirSync(audioPath)
                    .filter(f => /\.(mp3|ogg|wav|m4a)$/i.test(f))
                    .sort();

                res.end(JSON.stringify({ files }));
            });
        }
    };
}

// Helper: only include entry if file exists
function safeEntry(label, filePath) {
    if (fs.existsSync(filePath)) return { [label]: filePath };
    return {};
}

export default defineConfig({
    plugins: [basicSsl(), scenarioWriterPlugin(), exportLevelPlugin(), audioListerPlugin()],

    // Multi-page setup — only include pages that actually exist
    build: {
        rollupOptions: {
            input: Object.assign(
                {},
                safeEntry('main',      path.resolve(process.cwd(), 'index.html')),
                safeEntry('casbah',    path.resolve(process.cwd(), 'experiences/casbah/index.html')),
                safeEntry('synagogue', path.resolve(process.cwd(), 'experiences/synagogue/index.html')),
                safeEntry('tombeau',   path.resolve(process.cwd(), 'experiences/tombeau/index.html')),
                safeEntry('editor',    path.resolve(process.cwd(), 'editor/index.html')),
            )
        }
    },

    server: {
        https: true,
        host: true,
        port: 5173,
        open: false,
    }
});
