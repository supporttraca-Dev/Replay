import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { CSS2DObject } from 'https://unpkg.com/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js';

export class PoiManager {
    constructor(sceneEngine, uiManager, audioManager) {
        this.sceneEngine   = sceneEngine;
        this.uiManager     = uiManager;
        this.audioManager  = audioManager;
        this.pois          = [];
        this.poiObjects    = [];

        this.onNavigate = null;
        this._bindEvents();
    }

    _bindEvents() {
        const wrap = document.getElementById('c-canvas-wrap');
        if (wrap) {
            wrap.addEventListener('pointerdown', this._onPointerDown.bind(this));
        }
    }

    // ─── Chargement ─────────────────────────────────────────────────────────

    loadPois(poiDataArray = [], currentLang = 'fr', currentTimeMode = 'day') {
        this.clearPois();
        this.pois = poiDataArray;

        this.pois.forEach(poiData => {
            const mesh = this._createPoiObject(poiData, currentLang);
            if (mesh) {
                this.sceneEngine.add(mesh);
                this.poiObjects.push({ data: poiData, mesh });
            }
        });

        this.updateVisibility(currentTimeMode);
    }

    updateVisibility(timeMode) {
        this.poiObjects.forEach(({ data, mesh }) => {
            // Afficher si pas de timeMode défini, ou si ça correspond au mode actuel
            if (!data.timeMode || data.timeMode === timeMode) {
                if (data._cssObj) {
                    data._cssObj.element.style.opacity = '1';
                    data._cssObj.element.style.pointerEvents = 'auto';
                }
            } else {
                if (data._cssObj) {
                    data._cssObj.element.style.opacity = '0';
                    data._cssObj.element.style.pointerEvents = 'none';
                }
            }
        });
    }

    // ─── Création des marqueurs ──────────────────────────────────────────────

    _createPoiObject(poiData, currentLang) {
        if (poiData.poiType === 'navigation') {
            return this._createNavMarker(poiData, currentLang);
        }
        return this._createStandardMarker(poiData);
    }

    _createStandardMarker(poiData) {
        const geo  = new THREE.SphereGeometry(18, 16, 16);
        const mat  = new THREE.MeshBasicMaterial({ visible: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(poiData.position.x, poiData.position.y, poiData.position.z);
        mesh.userData = { type: 'poi', data: poiData };

        const currentLang = this._getLang();
        const labelText = poiData.content?.[currentLang]?.title || '';

        const wrapper = document.createElement('div');
        wrapper.className = 'poi-wrapper';

        const dot = document.createElement('div');
        dot.className = 'poi-marker';
        if (poiData.poiType === 'character') {
            dot.classList.add('character'); // style.css uses .poi-marker.character
        }

        dot.innerHTML = `
            <div class="poi-icon">
                <div class="icon-inner">✦</div>
            </div>
            ${labelText ? `<div class="poi-label">${labelText}</div>` : ''}
        `;

        wrapper.appendChild(dot);

        const css = new CSS2DObject(wrapper);
        mesh.add(css);
        poiData._cssObj = css;
        poiData._uiObj = { dot }; 
        return mesh;
    }

    _createNavMarker(poiData, currentLang) {
        const geo  = new THREE.SphereGeometry(35, 16, 16);
        const mat  = new THREE.MeshBasicMaterial({ visible: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(poiData.position.x, poiData.position.y, poiData.position.z);
        mesh.userData = { type: 'poi', data: poiData };

        const label = poiData.content?.[currentLang]?.title || '↑';

        const div = document.createElement('div');
        div.className = 'nav-marker';
        div.innerHTML = `
            <div class="nav-arrow">
                <svg viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="20,2 38,48 20,36 2,48" fill="rgba(231, 186, 128, 0.95)" />
                </svg>
            </div>
            <span class="nav-label">${label}</span>
        `;

        const css = new CSS2DObject(div);
        mesh.add(css);
        poiData._cssObj = css;
        return mesh;
    }

    // ─── Interaction ─────────────────────────────────────────────────────────

    _onPointerDown(event) {
        if (event.target.closest('#c-popup, .screen, #c-menu, #c-hud')) return;

        const intersects = this.sceneEngine.updateRaycaster(event);
        const hit = intersects.find(i => i.object?.userData?.type === 'poi');
        if (hit) this._handleClick(hit.object.userData.data);
    }

    _handleClick(poiData) {
        // Navigation
        if (poiData.poiType === 'navigation') {
            if (poiData.targetNode && this.onNavigate) {
                this._teleport(poiData.targetNode);
            }
            return;
        }

        // Marquer comme visité (feedback visuel sur le point)
        if (poiData._uiObj && poiData._uiObj.dot) {
            poiData._uiObj.dot.classList.add('visited');
        }

        // Audio
        const lang = this._getLang();
        if (poiData.audio) {
            this.audioManager.playNarration?.(poiData.audio);
        } else if (poiData.replicas?.length > 0) {
            const idx = poiData._replicaIndex || 0;
            const rep = poiData.replicas[idx];
            if (rep?.audio) this.audioManager.playNarration?.(rep.audio);
            poiData._replicaIndex = (idx + 1) % poiData.replicas.length;
        }

        // Popup central
        const content = poiData.content?.[lang];
        if (content?.title || content?.description) {
            this.uiManager.showPopup(content.title, content.description, content.transcript);
        }
    }

    _getLang() {
        return document.documentElement.lang || 'fr';
    }

    // ─── Téléportation ───────────────────────────────────────────────────────

    _teleport(targetNodeId) {
        let veil = document.getElementById('teleport-veil');
        if (!veil) {
            veil = document.createElement('div');
            veil.id = 'teleport-veil';
            Object.assign(veil.style, {
                position: 'fixed', inset: '0', background: '#000',
                pointerEvents: 'none', zIndex: '9999', opacity: '0',
                transition: 'opacity 0.5s ease'
            });
            document.body.appendChild(veil);
        }

        if (window.gsap) {
            window.gsap.to(veil, {
                opacity: 1, duration: 0.45, ease: 'power2.in',
                onComplete: () => {
                    this.onNavigate(targetNodeId).then(() => {
                        window.gsap.to(veil, { opacity: 0, duration: 0.55, ease: 'power2.out' });
                    });
                }
            });
        } else {
            veil.style.opacity = '1';
            setTimeout(() => {
                this.onNavigate(targetNodeId).then(() => {
                    veil.style.opacity = '0';
                });
            }, 450);
        }
    }

    // ─── Cleanup ─────────────────────────────────────────────────────────────

    clearPois() {
        this.poiObjects.forEach(({ data, mesh }) => {
            if (data._cssObj) {
                data._cssObj.element?.remove();
                mesh.remove(data._cssObj);
            }
            this.sceneEngine.remove(mesh);
            mesh.geometry?.dispose();
            mesh.material?.dispose();
        });
        this.poiObjects = [];
        this.pois = [];
    }
}
