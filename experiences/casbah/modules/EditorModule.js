/**
 * EditorModule — Traca Replay
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsule tout l'éditeur de POIs :
 *   - Liste des POIs (sidebar)
 *   - Formulaire création / modification / suppression
 *   - Gestion des répliques (séquences de personnage)
 *   - Dropdown audio (scan via import.meta.glob)
 *   - Import / Export JSON du scénario
 *   - Liste et formulaire des AudioNodes spatiaux
 *   - Preview temps-réel d'un son spatial (Web Audio API)
 *   - API de sauvegarde côté serveur (_apiSaveScenario)
 *
 * Dépendances injectées : scene (Three.js), state, CSS2DObject, tracaAudio
 * Ne modifie JAMAIS l'UI hors-éditeur (pas de HUD, pas d'inventaire, etc.)
 */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { CSS2DObject } from 'https://unpkg.com/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js';

export class EditorModule {
    /**
     * @param {Object} deps
     * @param {THREE.Scene}  deps.scene
     * @param {Object}       deps.state           — state partagé (pois, audioNodes, isNight…)
     * @param {Object}       deps.tracaAudio
     * @param {Function}     deps.buildHtmlPoi     — callback(poi) pour créer le marqueur CSS2D
     * @param {Function}     deps.updatePoiVisibility — callback
     * @param {Function}     deps.updateAllPoiTexts   — callback
     * @param {Function}     deps.createGroundArrow   — callback
     */
    constructor(deps) {
        Object.assign(this, deps);
        this._realtimePreviewNode = null;
        this._audioCtx            = null;

        this._els = this._queryElements();
        this._bindEditorEvents();
    }

    // ── Éléments DOM ─────────────────────────────────────────────────────────

    _queryElements() {
        return {
            poiList:   document.getElementById('poi-list'),
            fHint:     document.getElementById('ced-hint'),
            fTitle:    document.getElementById('poi-title'),
            fX:        document.getElementById('poi-temp-x'),
            fY:        document.getElementById('poi-temp-y'),
            fZ:        document.getElementById('poi-temp-z'),
            fId:       document.getElementById('poi-edit-id'),
            fCol:      document.getElementById('ced-form'),
            btnSave:   document.getElementById('btn-poi-save'),
            btnDel:    document.getElementById('btn-poi-delete'),
            btnCancel: document.getElementById('btn-poi-cancel'),
            dynRepBox: document.getElementById('dynamic-replicas-container'),
            edStatus:  document.getElementById('ced-status'),
        };
    }

    _bindEditorEvents() {
        const el = this._els;

        if (el.btnSave)   el.btnSave.onclick   = () => this.saveFormPoi();
        if (el.btnDel)    el.btnDel.onclick    = () => this.deleteFormPoi();
        if (el.btnCancel) el.btnCancel.onclick = () => {
            this.state.isPlacingPoi = false;
            this.resetEdForm();
            if (el.fCol) el.fCol.style.display = 'none';
            this.renderEditorList();
        };

        const btnAddPoi = document.getElementById('btn-add-poi');
        if (btnAddPoi) btnAddPoi.onclick = () => {
            this.state.isPlacingAudio = false;
            this.state.isPlacingPoi   = true;
            this.resetEdForm();
            if (el.fCol) el.fCol.style.display = 'block';
        };

        const btnEdSave = document.getElementById('btn-ed-save');
        if (btnEdSave) btnEdSave.onclick = () => this.apiSaveScenario();

        const btnExport = document.getElementById('btn-export-scenario');
        if (btnExport) btnExport.onclick = () => this.exportJSON();

        const btnImport   = document.getElementById('btn-import-scenario');
        const fileImport  = document.getElementById('file-import');
        if (btnImport && fileImport) {
            btnImport.onclick = () => fileImport.click();
            fileImport.addEventListener('change', e => this.importLocalJSON(e));
        }

        const btnAddReplica = document.getElementById('btn-add-replica');
        if (btnAddReplica) btnAddReplica.onclick = () => {
            this.state.editorReplicas.push({ audio: '', description: '', transcript: '' });
            this.renderReplicasUI();
        };

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const tab = document.getElementById('tab-' + btn.dataset.tab);
                if (tab) tab.classList.add('active');
                this.state.isPlacingPoi = false;
                this.state.isPlacingAudio = false;
            });
        });

        // POI type toggle
        const typeSelectHidden = document.getElementById('poi-type-hidden');
        const wrapChar = document.getElementById('wrap-poi-character');
        const wrapObj  = document.getElementById('wrap-poi-object');
        const wrapNav  = document.getElementById('wrap-poi-navigation');
        const lblTitle = document.getElementById('lbl-poi-title');
        document.querySelectorAll('.poi-type-toggle .type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.poi-type-toggle .type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const val = btn.dataset.val;
                if (typeSelectHidden) typeSelectHidden.value = val;
                
                wrapChar && (wrapChar.style.display = 'none');
                wrapObj  && (wrapObj.style.display  = 'none');
                wrapNav  && (wrapNav.style.display  = 'none');
                
                if (val === 'character') {
                    wrapChar && (wrapChar.style.display = 'block');
                    lblTitle && (lblTitle.innerText = 'Nom du Personnage (Affiché en jeu)');
                } else if (val === 'navigation') {
                    wrapNav && (wrapNav.style.display = 'block');
                    lblTitle && (lblTitle.innerText = "Nom de la destination");
                } else {
                    wrapObj  && (wrapObj.style.display  = 'block');
                    lblTitle && (lblTitle.innerText = "Titre de l'Objet / Anecdote");
                }
            });
        });

        // AudioNode form buttons
        const btnAudSave = document.getElementById('btn-audio-save');
        const btnAudDel  = document.getElementById('btn-audio-delete');
        if (btnAudSave) btnAudSave.onclick = () => this.saveAudioNodeForm();
        if (btnAudDel)  btnAudDel.onclick  = () => this.deleteAudioNodeForm();

        // Volume / Distance sliders in audio form
        const volRange  = document.getElementById('audionode-vol');
        const distRange = document.getElementById('audionode-dist');
        if (volRange)  volRange.oninput  = e => {
            const v = parseFloat(e.target.value);
            const lbl = document.getElementById('lbl-audio-vol');
            if (lbl) lbl.innerText = Math.round(v * 100) + '%';
            this.updateRealtimePreview('volume', v);
        };
        if (distRange) distRange.oninput = e => {
            const d = parseFloat(e.target.value);
            const lbl = document.getElementById('lbl-audio-dist');
            if (lbl) lbl.innerText = d + 'm';
            this.updateRealtimePreview('distance', d);
        };

        const addAudioBtn = document.getElementById('btn-add-audio');
        if (addAudioBtn) addAudioBtn.onclick = () => {
            this.state.isPlacingPoi   = false;
            this.state.isPlacingAudio = true;
        };
    }

    // ── API publique ──────────────────────────────────────────────────────────

    populateAudioDropdown() {
        let allFiles = {};
        try {
            allFiles = import.meta.glob(
                '../../assets/audio/**/*.{mp3,wav,ogg,m4a,mp4,MP3,WAV,OGG,M4A,MP4}',
                { eager: true, as: 'url' }
            );
        } catch (_) {}

        const grouped = {};
        Object.keys(allFiles).forEach(path => {
            const rel = path.replace('../../assets/audio/', '');
            const parts = rel.split('/');
            const folder = parts.length > 1 ? parts[0] : 'Racine';
            const file = parts[parts.length - 1];
            if (!grouped[folder]) grouped[folder] = [];
            grouped[folder].push({ rel, file });
        });

        this.state.audioFolders = grouped;

        let html = '<option value="">-- Aucun audio --</option>';
        for (const [folder, files] of Object.entries(grouped).sort()) {
            html += `<optgroup label="${folder}">`;
            files.sort((a,b) => a.file.localeCompare(b.file)).forEach(({ rel, file }) => {
                html += `<option value="${rel}">${file}</option>`;
            });
            html += '</optgroup>';
        }

        document.querySelectorAll('select.rep-audio, select#poi-audio, select#audionode-file-select').forEach(sel => {
            sel.innerHTML = html;
        });
    }

    renderEditorList() {
        const el = this._els;
        if (!el.poiList) return;
        el.poiList.innerHTML = '';

        const currentMode  = this.state.isNight ? 'night' : 'day';
        const filtered     = this.state.pois.filter(p => (p.timeMode || 'day') === currentMode);

        if (filtered.length === 0) {
            el.poiList.innerHTML = '<li class="poi-empty">Aucun point dans ce mode temporel.</li>';
            return;
        }

        const currentEditId = el.fId?.value;
        filtered.forEach(p => {
            const li = document.createElement('li');
            li.className = 'poi-item';
            if (p.id === currentEditId) li.classList.add('selected');
            li.innerHTML = `
                <div style="flex:1;overflow:hidden">
                    <span class="poi-item-tit">${p.content?.fr?.title || 'Sans titre'}</span>
                    <span style="font-size:0.65rem;color:rgba(255,255,255,0.4)">${p.audio ? '🔊 ' + p.audio : '🔇 Muet'}</span>
                </div>
            `;
            li.onclick = () => this.loadPoiToForm(p);
            el.poiList.appendChild(li);
        });

        this.state.pois.forEach(p => {
            if (p._uiObj?.dot) {
                if (p.id === currentEditId) p._uiObj.dot.classList.add('editor-active');
                else p._uiObj.dot.classList.remove('editor-active');
            }
        });
    }

    renderReplicasUI() {
        const box = this._els.dynRepBox;
        if (!box) return;
        box.innerHTML = '';

        const folders = this.state.audioFolders || {};
        let audioOpts = '<option value="">-- Aucun audio --</option>';
        for (const [folder, files] of Object.entries(folders).sort()) {
            audioOpts += `<optgroup label="${folder}">`;
            files.sort((a,b) => a.file.localeCompare(b.file)).forEach(({ rel, file }) => {
                audioOpts += `<option value="${rel}">${file}</option>`;
            });
            audioOpts += '</optgroup>';
        }

        this.state.editorReplicas.forEach((rep, idx) => {
            const div = document.createElement('div');
            div.className = 'replica-card';
            div.style.cssText = 'background:rgba(255,255,255,0.05);padding:10px;border-radius:4px;border-left:2px solid #e7ba80;position:relative;';
            div.innerHTML = `
                <div style="font-size:0.75rem;color:#e7ba80;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                    <b>Séquence #${idx + 1}</b>
                    <button class="c-btn danger sm" style="padding:2px 6px;font-size:0.6rem;" onclick="window.__casbahApp?.editor?.removeReplica(${idx})">✕</button>
                </div>
                <div class="ced-field" style="margin-bottom:8px;">
                    <label>📝 Description</label>
                    <textarea class="dyn-rep-desc" rows="2">${rep.description || ''}</textarea>
                </div>
                <div class="ced-field" style="margin-bottom:8px;">
                    <label>🗣 Transcription</label>
                    <textarea class="dyn-rep-trans" rows="2">${rep.transcript || ''}</textarea>
                </div>
                <div class="ced-field">
                    <label>🎵 Audio</label>
                    <select class="rep-audio dyn-rep-audio">${audioOpts}</select>
                </div>
            `;
            box.appendChild(div);
            div.querySelector('.dyn-rep-audio').value       = rep.audio || '';
            div.querySelector('.dyn-rep-desc').oninput      = e => { this.state.editorReplicas[idx].description = e.target.value; };
            div.querySelector('.dyn-rep-trans').oninput     = e => { this.state.editorReplicas[idx].transcript = e.target.value; };
            div.querySelector('.dyn-rep-audio').onchange    = e => { this.state.editorReplicas[idx].audio = e.target.value; };
        });
    }

    removeReplica(idx) {
        this.state.editorReplicas.splice(idx, 1);
        this.renderReplicasUI();
    }

    resetEdForm() {
        const el = this._els;
        if (el.fId)    el.fId.value    = '';
        if (el.fX)     el.fX.value     = '';
        if (el.fY)     el.fY.value     = '';
        if (el.fZ)     el.fZ.value     = '';
        if (el.fTitle) el.fTitle.value = '';
        if (el.btnDel) el.btnDel.style.display = 'none';

        const inputDesc  = document.getElementById('poi-desc');
        const inputTrans = document.getElementById('poi-trans');
        const inputAudio = document.getElementById('poi-audio');
        const inputNav   = document.getElementById('poi-target-node');
        if (inputDesc)  inputDesc.value  = '';
        if (inputTrans) inputTrans.value = '';
        if (inputAudio) inputAudio.value = '';
        if (inputNav)   inputNav.value   = '';

        this.state.editorReplicas = [];
        this.renderReplicasUI();

        const typeHidden = document.getElementById('poi-type-hidden');
        if (typeHidden) {
            typeHidden.value = 'object';
            document.querySelector('.poi-type-toggle .type-btn[data-val="object"]')?.click();
        }

        if (el.fHint) {
            el.fHint.style.cssText = 'background:rgba(74,222,128,0.05);border:1px dashed #4ade80;color:#4ade80;';
            el.fHint.innerHTML     = `📍 Cliquez sur l'image 360 pour fixer l'emplacement du NOUVEAU point.`;
        }
    }

    loadPoiToForm(p) {
        const el = this._els;
        if (el.fCol)   el.fCol.style.display   = 'block';
        if (el.btnDel) el.btnDel.style.display  = 'inline-flex';

        if (el.fId)    el.fId.value    = p.id;
        if (el.fX)     el.fX.value     = p.position.x;
        if (el.fY)     el.fY.value     = p.position.y;
        if (el.fZ)     el.fZ.value     = p.position.z;
        if (el.fTitle) el.fTitle.value = p.content?.fr?.title || '';

        const inputDesc  = document.getElementById('poi-desc');
        const inputTrans = document.getElementById('poi-trans');
        const inputAudio = document.getElementById('poi-audio');
        const inputNav   = document.getElementById('poi-target-node');
        if (inputDesc)  inputDesc.value  = p.content?.fr?.description  || '';
        if (inputTrans) inputTrans.value = p.content?.fr?.transcript   || '';
        if (inputAudio) inputAudio.value = p.audio                     || '';
        if (inputNav)   inputNav.value   = p.targetNode                || '';

        this.state.editorReplicas = p.replicas ? JSON.parse(JSON.stringify(p.replicas)) : [];
        this.renderReplicasUI();

        const typeHidden = document.getElementById('poi-type-hidden');
        if (typeHidden) {
            typeHidden.value = p.poiType || 'object';
            document.querySelector(`.poi-type-toggle .type-btn[data-val="${p.poiType || 'object'}"]`)?.click();
        }

        this.renderEditorList();
    }

    saveFormPoi() {
        const el = this._els;
        const id    = el.fId?.value;
        const x     = parseFloat(el.fX?.value);
        const y     = parseFloat(el.fY?.value);
        const z     = parseFloat(el.fZ?.value);
        const title = el.fTitle?.value.trim();

        const typeHidden = document.getElementById('poi-type-hidden');
        const poiType    = typeHidden?.value || 'object';

        if (isNaN(x) || isNaN(y)) { alert("Veuillez d'abord cliquer sur la scène pour fixer une position."); return; }
        if (!title)                { alert("Le titre / nom du point est obligatoire"); return; }

        const descText  = document.getElementById('poi-desc')?.value.trim()  || '';
        const transText = document.getElementById('poi-trans')?.value.trim() || '';
        const audioFile = document.getElementById('poi-audio')?.value        || '';
        const targetNode = document.getElementById('poi-target-node')?.value.trim() || '';

        const cObj = {
            title,
            description: poiType === 'object' ? descText  : '',
            transcript:  poiType === 'object' ? transText : ''
        };
        const currentReplicas = poiType === 'character'
            ? JSON.parse(JSON.stringify(this.state.editorReplicas))
            : [];

        if (id) {
            const poi = this.state.pois.find(p => p.id === id);
            if (!poi) return;
            Object.assign(poi, {
                position: { x, y, z },
                audio:    poiType === 'object' ? audioFile : '',
                poiType,
                timeMode: this.state.isNight ? 'night' : 'day',
                _replicaIndex: 0,
                content:  { fr: { ...cObj }, en: { ...cObj }, ar: { ...cObj } },
                replicas: currentReplicas,
                targetNode: poiType === 'navigation' ? targetNode : undefined
            });
            poi._cssObj?.position.set(x, y, z);
            if (poi._uiObj?.dot) {
                poi._uiObj.dot.className = `poi-marker type-${poiType}`;
            }
            this._notify(`✔ Point modifié : ${title}`);
        } else {
            const poi = {
                id:           'poi_' + Date.now(),
                position:     { x, y, z },
                audio:        poiType === 'object' ? audioFile : '',
                poiType,
                timeMode:     this.state.isNight ? 'night' : 'day',
                replicas:     currentReplicas,
                _replicaIndex: 0,
                content:      { fr: { ...cObj }, en: { ...cObj }, ar: { ...cObj } },
                targetNode:   poiType === 'navigation' ? targetNode : undefined
            };
            this.state.pois.push(poi);
            this.buildHtmlPoi?.(poi);
            this._notify(`✔ Point créé : ${title}`);
        }

        this.updateAllPoiTexts?.();
        this.updatePoiVisibility?.();
        this.resetEdForm();
        if (el.fCol) el.fCol.style.display = 'none';
        this.renderEditorList();
    }

    deleteFormPoi() {
        const id = this._els.fId?.value;
        if (!id) return;
        if (!confirm("Supprimer ce point d'intérêt définitivement ?")) return;

        const idx = this.state.pois.findIndex(p => p.id === id);
        if (idx > -1) {
            const p = this.state.pois[idx];
            if (p._cssObj) this.scene.remove(p._cssObj);
            this.state.pois.splice(idx, 1);
        }
        this.resetEdForm();
        const el = this._els;
        if (el.fCol) el.fCol.style.display = 'none';
        this.renderEditorList();
        this._notify('🗑 Point supprimé.');
        this.apiSaveScenario();
    }

    // ── AudioNodes spatiaux ───────────────────────────────────────────────────

    renderAudioNodeList() {
        const list = document.getElementById('audionode-list');
        if (!list) return;
        list.innerHTML = '';
        if (!this.state.audioNodes?.length) {
            list.innerHTML = '<li class="poi-empty">Aucun son — Cliquez sur "+ Son"</li>';
            return;
        }
        const currentEditId = document.getElementById('audionode-edit-id')?.value;
        this.state.audioNodes.forEach(a => {
            const li = document.createElement('li');
            li.className = 'poi-item';
            if (a.id === currentEditId) li.classList.add('selected');
            li.innerHTML = `
                <div style="flex:1;overflow:hidden">
                    <span class="poi-item-tit">${a.file}</span>
                    <span style="font-size:0.65rem;color:rgba(255,255,255,0.4)">Vol: ${Math.round(a.volume * 100)}% | Dist: ${a.distance}</span>
                </div>
            `;
            li.onclick = () => this.loadAudioNodeToForm(a);
            list.appendChild(li);
        });
    }

    loadAudioNodeToForm(a) {
        const form = document.getElementById('ced-audio-form');
        if (form) form.hidden = false;
        const btnDel = document.getElementById('btn-audio-delete');
        if (btnDel) btnDel.hidden = false;

        ['audionode-edit-id', 'audionode-temp-x', 'audionode-temp-y', 'audionode-temp-z'].forEach((id, i) => {
            const vals = [a.id, a.position?.x, a.position?.y, a.position?.z];
            const el = document.getElementById(id);
            if (el) el.value = vals[i];
        });
        const fileSelect = document.getElementById('audionode-file-select');
        if (fileSelect) fileSelect.value = a.file || '';
        const vol  = a.volume  ?? 1;
        const dist = a.distance ?? 150;
        const volEl  = document.getElementById('audionode-vol');
        const distEl = document.getElementById('audionode-dist');
        if (volEl)  volEl.value  = vol;
        if (distEl) distEl.value = dist;
        document.getElementById('lbl-audio-vol')?.innerText && (document.getElementById('lbl-audio-vol').innerText  = Math.round(vol * 100) + '%');
        document.getElementById('lbl-audio-dist')?.innerText && (document.getElementById('lbl-audio-dist').innerText = dist + 'm');
        document.getElementById('ced-audio-hint')?.innerHTML && (document.getElementById('ced-audio-hint').innerHTML = `👉 Cliquez sur la scène pour DÉPLACER ce son.`);

        this.destroyRealtimePreview();
        this.updateRealtimePreview('file',     a.file);
        this.updateRealtimePreview('position', a.position);
        this.updateRealtimePreview('volume',   vol);
        this.updateRealtimePreview('distance', dist);
        this.renderAudioNodeList();
    }

    saveAudioNodeForm() {
        const id   = document.getElementById('audionode-edit-id')?.value;
        const x    = parseFloat(document.getElementById('audionode-temp-x')?.value);
        const y    = parseFloat(document.getElementById('audionode-temp-y')?.value);
        const z    = parseFloat(document.getElementById('audionode-temp-z')?.value);
        const file = document.getElementById('audionode-file-select')?.value;
        const vol  = parseFloat(document.getElementById('audionode-vol')?.value);
        const dist = parseFloat(document.getElementById('audionode-dist')?.value);

        if (isNaN(x) || isNaN(y)) { alert("Cliquez sur la scène d'abord."); return; }
        if (!file)                 { alert("Sélectionnez un fichier audio."); return; }

        if (id) {
            const node = this.state.audioNodes?.find(a => a.id === id);
            if (node) {
                Object.assign(node, { position: { x, y, z }, file, volume: vol, distance: dist });
                if (window._audioNodeCSSObjects?.[id]) {
                    window._audioNodeCSSObjects[id].position.set(x, y, z);
                }
                this._notify(`✔ Son modifié : ${file}`);
            }
        } else {
            const node = { id: 'aud_' + Date.now(), position: { x, y, z }, file, volume: vol, distance: dist };
            if (!this.state.audioNodes) this.state.audioNodes = [];
            this.state.audioNodes.push(node);
            this._buildHtmlAudioNode(node);
            this._notify(`✔ Son placé : ${file}`);
        }

        const form = document.getElementById('ced-audio-form');
        if (form) form.hidden = true;
        this.renderAudioNodeList();
    }

    deleteAudioNodeForm() {
        const id = document.getElementById('audionode-edit-id')?.value;
        if (!id) return;
        if (!confirm("Supprimer ce son spatial ?")) return;

        const idx = this.state.audioNodes?.findIndex(a => a.id === id) ?? -1;
        if (idx > -1) {
            if (window._audioNodeCSSObjects?.[id]) {
                this.scene.remove(window._audioNodeCSSObjects[id]);
                delete window._audioNodeCSSObjects[id];
            }
            this.state.audioNodes.splice(idx, 1);
        }
        const form = document.getElementById('ced-audio-form');
        if (form) form.hidden = true;
        this.renderAudioNodeList();
        this._notify('🗑 Son supprimé.');
    }

    _buildHtmlAudioNode(data) {
        const dot = document.createElement('div');
        dot.className = 'c-audio-node';
        dot.onclick = e => {
            e.stopPropagation();
            if (this.state.mode === 'EDIT') this.loadAudioNodeToForm(data);
        };
        const csso = new CSS2DObject(dot);
        csso.position.set(data.position.x, data.position.y, data.position.z);
        csso.element.style.display = 'none';
        this.scene.add(csso);
        if (!window._audioNodeCSSObjects) window._audioNodeCSSObjects = {};
        window._audioNodeCSSObjects[data.id] = csso;
    }

    // ── Preview audio temps réel ──────────────────────────────────────────────

    updateRealtimePreview(prop, value) {
        if (!this._audioCtx) {
            try { this._audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return; }
        }
        if (!this._realtimePreviewNode) {
            const el      = document.createElement('audio');
            el.loop       = true;
            const src     = this._audioCtx.createMediaElementSource(el);
            const panner  = this._audioCtx.createPanner();
            panner.panningModel   = 'HRTF';
            panner.distanceModel  = 'inverse';
            panner.refDistance    = 1;
            panner.maxDistance    = 150;
            panner.rolloffFactor  = 0.8;
            panner.coneInnerAngle = 360;
            panner.positionX.value = 0;
            panner.positionY.value = 0;
            panner.positionZ.value = -100;
            src.connect(panner);
            panner.connect(this._audioCtx.destination);
            this._realtimePreviewNode = { el, panner };
            if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
        }

        const node = this._realtimePreviewNode;
        if (prop === 'file'     && value)            { node.el.src = '../../assets/audio/' + value; node.el.play().catch(() => {}); }
        if (prop === 'volume')                       node.el.volume = value;
        if (prop === 'distance')                     node.dist = value;
        if (prop === 'position' && value?.x != null) node.dir  = new THREE.Vector3(value.x, value.y, value.z).normalize();

        if (node.dir) {
            const d = node.dist || 150;
            node.panner.positionX.value = node.dir.x * d;
            node.panner.positionY.value = node.dir.y * d;
            node.panner.positionZ.value = node.dir.z * d;
        }
    }

    destroyRealtimePreview() {
        if (this._realtimePreviewNode) {
            this._realtimePreviewNode.el.pause();
            this._realtimePreviewNode.el.src = '';
            this._realtimePreviewNode = null;
        }
    }

    // ── Import / Export JSON ──────────────────────────────────────────────────

    exportJSON() {
        const scenario = {
            metadata: {
                exportedAt:  new Date().toISOString(),
                description: 'Export Static Editor Casbah V11',
                version:     '11.0'
            },
            settings: this.state.scenarioData?.settings || {},
            pois:     this.state.pois.map(p => { const { _uiObj, _cssObj, ...clean } = p; return clean; })
        };
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scenario, null, 4));
        const a = document.createElement('a');
        a.setAttribute('href', dataStr);
        a.setAttribute('download', 'scenario_casbah_poi.json');
        a.click();
        this._notify('📥 JSON exporté ! Copiez-le dans /src/data/');
    }

    importLocalJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                this.state.pois?.forEach(p => { if (p._cssObj) this.scene.remove(p._cssObj); });
                // Le processLoadedData est géré par le controller principal via callback
                this.onImportJSON?.(data);
                this._notify('✅ JSON importé. Scène mise à jour.');
            } catch (err) {
                console.error('Erreur de parsing JSON', err);
                this._notify('❌ Erreur de lecture du JSON', true);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    async apiSaveScenario() {
        const scenario = {
            metadata: { savedAt: new Date().toISOString(), version: '11.0' },
            settings: this.state.scenarioData?.settings || {},
            pois:     this.state.pois.map(p => { const { _uiObj, _cssObj, ...clean } = p; return clean; }),
            audioNodes: this.state.audioNodes || []
        };
        try {
            const res = await fetch('/api/save-scenario', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ level: 'casbah', data: scenario })
            });
            if (res.ok) { this._notify('✅ Sauvegardé !'); }
            else        { this._notify(`❌ Erreur ${res.status}`, true); }
        } catch (err) {
            this._notify('❌ Erreur réseau', true);
            console.error(err);
        }
    }

    // ── Interne ───────────────────────────────────────────────────────────────

    _notify(txt, isErr = false) {
        const el = this._els.edStatus;
        if (!el) return;
        el.style.color = isErr ? 'var(--c-danger)' : '#4ade80';
        el.innerText   = txt;
        setTimeout(() => { el.innerText = ''; }, 3500);
    }
}
