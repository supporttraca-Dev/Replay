/**
 * main_editor.js — Replay Studio
 * Steps 1-4 : Scène 360° + Sélecteur + POIs visibles + Placement au clic
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { CSS2DRenderer, CSS2DObject } from 'https://unpkg.com/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js';
import { CASBAH_SCENARIO } from '../src/js/levels/Level_01_Casbah.js';

// ─── ÉTAT ────────────────────────────────────────────────────────────────────
const levelData     = JSON.parse(JSON.stringify(CASBAH_SCENARIO));
let   currentNodeId = levelData.settings?.startNode || Object.keys(levelData.nodes)[0];
let   currentMode   = 'day';
let   placementMode = false;
let   editingPoi    = null;   // POI en cours d'édition
const cssObjects    = [];     // CSS2DObjects des marqueurs

// ─── THREE.JS ────────────────────────────────────────────────────────────────
const wrap = document.getElementById('c-canvas-wrap');
const W    = () => wrap.getBoundingClientRect().width;
const H    = () => wrap.getBoundingClientRect().height;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
wrap.appendChild(renderer.domElement);

const cssRenderer = new CSS2DRenderer();
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top      = '0';
cssRenderer.domElement.style.left     = '0';
cssRenderer.domElement.style.pointerEvents = 'none';
wrap.appendChild(cssRenderer.domElement);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
camera.position.set(0, 0, 0.01);

function resizeAll() {
    const w = W(), h = H();
    renderer.setSize(w, h, false);
    cssRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
setTimeout(resizeAll, 50);
window.addEventListener('resize', resizeAll);

// ─── SPHÈRE 360° ─────────────────────────────────────────────────────────────
const sphereGeo = new THREE.SphereGeometry(500, 60, 40);
sphereGeo.scale(-1, 1, 1);
const sphereMat = new THREE.MeshBasicMaterial();
const sphere    = new THREE.Mesh(sphereGeo, sphereMat);
sphere.userData.isSphere = true;
scene.add(sphere);

const texLoader = new THREE.TextureLoader();

function loadScene(nodeId, mode) {
    currentNodeId = nodeId;
    currentMode   = mode;
    const nodeData = levelData.nodes[nodeId];
    if (!nodeData) { setStatus('⚠️ Nœud introuvable'); return; }

    const raw = nodeData.backgrounds?.[mode] || nodeData.backgrounds?.day;
    if (!raw)  { setStatus('⚠️ Pas d\'image pour ce mode'); return; }

    const url = raw.replace(/^(\.\.\/)+/, '/');
    setStatus('⏳ Chargement…');

    texLoader.load(url,
        tex => {
            sphereMat.map = tex;
            sphereMat.needsUpdate = true;
            setStatus(`✅ ${nodeId} — ${mode}`);
            renderPoiMarkers();
            renderPoiList();
        },
        undefined,
        () => setStatus(`❌ Image introuvable : ${url}`)
    );
}
loadScene(currentNodeId, currentMode);

// ─── MARQUEURS POI (CSS2D) ────────────────────────────────────────────────────
function renderPoiMarkers() {
    // Nettoyer les anciens
    cssObjects.forEach(o => scene.remove(o));
    cssObjects.length = 0;

    const pois = levelData.nodes[currentNodeId]?.pois || [];
    pois.forEach(poi => {
        const dot = document.createElement('div');
        dot.style.cssText = `
            width:16px; height:16px; border-radius:50%;
            border:2px solid #fff; cursor:pointer;
            box-shadow: 0 0 10px rgba(231,186,128,0.8);
            transition: transform 0.15s;
        `;
        // Couleur selon type
        if (poi.poiType === 'character')   dot.style.background = '#c8a0ff';
        else if (poi.poiType === 'navigation') dot.style.background = '#60d0ff';
        else                               dot.style.background = '#e7ba80';

        dot.title = poi.content?.fr?.title || poi.id;
        dot.style.pointerEvents = 'auto';

        dot.addEventListener('click', e => {
            e.stopPropagation();
            openPoiForm(poi);
        });
        dot.addEventListener('mouseenter', () => dot.style.transform = 'scale(1.4)');
        dot.addEventListener('mouseleave', () => dot.style.transform = 'scale(1)');

        const obj = new CSS2DObject(dot);
        obj.position.set(poi.position.x, poi.position.y, poi.position.z);
        scene.add(obj);
        cssObjects.push(obj);
    });
}

// ─── CONTRÔLES CAMÉRA ────────────────────────────────────────────────────────
let isDragging = false, prevX = 0, prevY = 0, hasDragged = false;
let rotY = 0, rotX = 0;

renderer.domElement.addEventListener('mousedown', e => {
    isDragging = true; hasDragged = false;
    prevX = e.clientX; prevY = e.clientY;
});
window.addEventListener('mouseup', e => {
    if (!hasDragged && isDragging) handleSceneClick(e);
    isDragging = false;
});
window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevX, dy = e.clientY - prevY;
    if (Math.abs(dx) + Math.abs(dy) > 3) hasDragged = true;
    rotY -= dx * 0.003;
    rotX -= dy * 0.003;
    rotX  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotX));
    prevX = e.clientX; prevY = e.clientY;
});
renderer.domElement.addEventListener('wheel', e => {
    camera.fov = Math.max(30, Math.min(100, camera.fov + e.deltaY * 0.05));
    camera.updateProjectionMatrix();
}, { passive: true });

// ─── CLIC POUR PLACEMENT ─────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

function handleSceneClick(e) {
    if (!placementMode) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObject(sphere);
    if (!hits.length) return;

    const pt = hits[0].point;
    document.getElementById('form-x').value = pt.x.toFixed(2);
    document.getElementById('form-y').value = pt.y.toFixed(2);
    document.getElementById('form-z').value = pt.z.toFixed(2);

    exitPlacementMode();
    setStatus(`📍 Position capturée — ajustez le formulaire et sauvegardez.`);
}

function enterPlacementMode() {
    placementMode = true;
    renderer.domElement.style.cursor = 'crosshair';
    setStatus('🎯 Cliquez sur la scène pour placer le point…');
}
function exitPlacementMode() {
    placementMode = false;
    renderer.domElement.style.cursor = 'grab';
}

// ─── BOUCLE RENDER ───────────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = rotY;
    camera.rotation.x = rotX;
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
}
animate();

// ─── SIDEBAR : Sélecteurs ────────────────────────────────────────────────────
const sceneSelect = document.getElementById('scene-select');
const modeSelect  = document.getElementById('mode-select');

Object.keys(levelData.nodes).forEach(nodeId => {
    const opt = document.createElement('option');
    opt.value = nodeId;
    opt.textContent = nodeId;
    if (nodeId === currentNodeId) opt.selected = true;
    sceneSelect.appendChild(opt);
});
sceneSelect.addEventListener('change', () => loadScene(sceneSelect.value, currentMode));
modeSelect.addEventListener('change',  () => loadScene(currentNodeId, modeSelect.value));

// ─── SIDEBAR : Liste POIs ────────────────────────────────────────────────────
function renderPoiList() {
    const list = document.getElementById('poi-list');
    list.innerHTML = '';
    const pois = levelData.nodes[currentNodeId]?.pois || [];

    if (!pois.length) {
        list.innerHTML = '<li style="color:rgba(255,255,255,0.3);font-size:0.75rem;padding:8px 0">Aucun point dans cette scène.</li>';
        return;
    }

    pois.forEach(poi => {
        const li = document.createElement('li');
        li.dataset.id = poi.id;
        const title = poi.content?.fr?.title || poi.id;
        const color = poi.poiType === 'character' ? '#c8a0ff' : poi.poiType === 'navigation' ? '#60d0ff' : '#e7ba80';
        li.innerHTML = `
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px;flex-shrink:0"></span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</span>
            <span style="font-size:0.65rem;color:rgba(255,255,255,0.3);flex-shrink:0">${poi.poiType}</span>
        `;
        li.style.cssText = 'display:flex;align-items:center;padding:7px 4px;cursor:pointer;border-radius:4px;font-size:0.78rem;';
        li.addEventListener('mouseenter', () => li.style.background = 'rgba(255,255,255,0.06)');
        li.addEventListener('mouseleave', () => li.style.background = editingPoi?.id === poi.id ? 'rgba(231,186,128,0.1)' : '');
        li.addEventListener('click', () => openPoiForm(poi));
        list.appendChild(li);
    });
}

// ─── FORMULAIRE POI ──────────────────────────────────────────────────────────
function openPoiForm(poi) {
    editingPoi = poi;
    document.getElementById('poi-form').style.display = 'block';
    document.getElementById('form-id').value    = poi.id;
    document.getElementById('form-x').value     = poi.position.x;
    document.getElementById('form-y').value     = poi.position.y;
    document.getElementById('form-z').value     = poi.position.z;
    document.getElementById('form-type').value  = poi.poiType || 'object';
    document.getElementById('form-time').value  = poi.timeMode || 'day';
    document.getElementById('form-title').value = poi.content?.fr?.title || '';
    document.getElementById('form-desc').value  = poi.content?.fr?.description || '';
    document.getElementById('form-audio').value = poi.audio || '';
    renderPoiList();
}

function savePoiForm() {
    const id   = document.getElementById('form-id').value;
    const x    = parseFloat(document.getElementById('form-x').value);
    const y    = parseFloat(document.getElementById('form-y').value);
    const z    = parseFloat(document.getElementById('form-z').value);
    const type = document.getElementById('form-type').value;
    const time = document.getElementById('form-time').value;
    const title= document.getElementById('form-title').value.trim();
    const desc = document.getElementById('form-desc').value.trim();
    const audio= document.getElementById('form-audio').value;

    if (isNaN(x)) { alert('Cliquez sur la scène pour fixer la position.'); return; }
    if (!title)   { alert('Le titre est obligatoire.');                     return; }

    let pois = levelData.nodes[currentNodeId].pois;
    if (!pois) pois = levelData.nodes[currentNodeId].pois = [];

    const content = { fr: { title, description: desc, transcript: desc }, en: { title, description: desc, transcript: '' }, ar: { title, description: desc, transcript: '' } };

    if (id) {
        const idx = pois.findIndex(p => p.id === id);
        if (idx >= 0) pois[idx] = { ...pois[idx], position: {x,y,z}, poiType: type, timeMode: time, content, audio };
    } else {
        pois.push({ id: 'poi_' + Date.now(), position: {x,y,z}, poiType: type, timeMode: time, content, audio, replicas: [] });
    }

    document.getElementById('poi-form').style.display = 'none';
    editingPoi = null;
    renderPoiMarkers();
    renderPoiList();
    setStatus('✅ Point sauvegardé');
}

function deletePoi() {
    const id = document.getElementById('form-id').value;
    if (!id || !confirm('Supprimer ce point ?')) return;
    const pois = levelData.nodes[currentNodeId].pois;
    const idx  = pois.findIndex(p => p.id === id);
    if (idx >= 0) pois.splice(idx, 1);
    document.getElementById('poi-form').style.display = 'none';
    editingPoi = null;
    renderPoiMarkers();
    renderPoiList();
    setStatus('🗑️ Point supprimé');
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────
async function exportLevel() {
    try {
        const res  = await fetch('/api/export-level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ levelData })
        });
        const data = await res.json();
        if (data.success) setStatus(`💾 Exporté → exports/${data.fileName}`);
        else              setStatus(`❌ Erreur : ${data.error}`);
    } catch { setStatus('❌ Serveur Vite inaccessible'); }
}

// ─── BINDINGS UI ─────────────────────────────────────────────────────────────
document.getElementById('btn-add-poi').addEventListener('click', () => {
    editingPoi = null;
    document.getElementById('poi-form').style.display = 'block';
    document.getElementById('form-id').value    = '';
    document.getElementById('form-x').value     = '';
    document.getElementById('form-y').value     = '';
    document.getElementById('form-z').value     = '';
    document.getElementById('form-title').value = '';
    document.getElementById('form-desc').value  = '';
    document.getElementById('form-audio').value = '';
    enterPlacementMode();
});
document.getElementById('btn-place-poi').addEventListener('click', enterPlacementMode);
document.getElementById('btn-save-poi').addEventListener('click', savePoiForm);
document.getElementById('btn-del-poi').addEventListener('click', deletePoi);
document.getElementById('btn-export').addEventListener('click', exportLevel);

// ─── AUDIO LIST ──────────────────────────────────────────────────────────────
fetch('/api/list-audio').then(r => r.json()).then(d => {
    const sel = document.getElementById('form-audio');
    d.files?.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f; opt.textContent = f;
        sel.appendChild(opt);
    });
}).catch(() => {});

// ─── UTILITAIRE ──────────────────────────────────────────────────────────────
function setStatus(msg) {
    const el = document.getElementById('status');
    if (el) el.textContent = msg;
}
