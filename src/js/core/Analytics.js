/**
 * Analytics.js — TRACA Google Analytics 4 Custom Tracking Suite
 * 
 * Centralized, safe tracking module for immersive 3D/360 experiences, 
 * auditory channels, and general visitor behaviors.
 * Avoids errors when gtag is blocked by ad-blockers.
 */

export class Analytics {
    /**
     * Dispatch a standard or custom event to GA4
     * @param {string} eventName Name of the event
     * @param {Object} params Custom parameters for the event
     */
    static event(eventName, params = {}) {
        if (typeof window.gtag === 'function') {
            try {
                // Merge default project metadata
                const enrichedParams = {
                    project: 'TRACA',
                    platform_version: '1.0.0',
                    timestamp: new Date().toISOString(),
                    ...params
                };
                window.gtag('event', eventName, enrichedParams);
                console.info(`[Analytics] Event dispatched: ${eventName}`, enrichedParams);
            } catch (err) {
                console.warn('[Analytics] Failed to send event:', err);
            }
        } else {
            // Safe fallback during development or when blocked
            console.debug(`[Analytics (Offline)] Event recorded: ${eventName}`, params);
        }
    }

    /**
     * Track page/immersion views
     * @param {string} pagePath Relative path of the page
     * @param {string} pageTitle Descriptive title
     */
    static trackPageview(pagePath, pageTitle) {
        this.event('page_view', {
            page_path: pagePath,
            page_title: pageTitle,
            page_location: window.location.href
        });
    }

    /**
     * Track entering an interactive experience
     * @param {string} experienceName Name of the experience (e.g. 'casbah', 'tombeau', 'synagogue')
     */
    static trackExperienceEntry(experienceName) {
        this.event('experience_enter', {
            experience_name: experienceName,
            device_type: window.innerWidth <= 768 ? 'mobile' : 'desktop',
            screen_orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
        });
    }

    /**
     * Track scroll or click navigation to a story chapter in a 3D experience
     * @param {string} experienceName 'tombeau' or 'synagogue'
     * @param {string} chapterId e.g. 'ch1', 'ch2'
     * @param {number} chapterIndex 0-indexed number of the chapter
     * @param {string} chapterTitle Text heading of the chapter
     */
    static trackChapterView(experienceName, chapterId, chapterIndex, chapterTitle) {
        this.event('chapter_view', {
            experience_name: experienceName,
            chapter_id: chapterId,
            chapter_index: chapterIndex + 1,
            chapter_title: chapterTitle
        });
    }

    /**
     * Track AR (Augmented Reality) activation clicks
     * @param {string} experienceName Name of the experience (e.g. 'tombeau')
     */
    static trackARActivation(experienceName) {
        this.event('ar_activation', {
            experience_name: experienceName,
            supported: !!document.getElementById('mausoleum-model')?.canActivateAR
        });
    }

    /**
     * Track 3D model loading milestones & duration
     * @param {string} experienceName Name of the experience
     * @param {string} status 'start' | 'success' | 'timeout' | 'error'
     * @param {number} loadTimeSec Optional load time in seconds
     */
    static track3DModelLoad(experienceName, status, loadTimeSec = null) {
        this.event('3d_model_load', {
            experience_name: experienceName,
            status: status,
            load_time_seconds: loadTimeSec
        });
    }

    /**
     * Track interactive 360-degree virtual tour dimensions (time travel day/night)
     * @param {string} dimensionName 'day' | 'night'
     */
    static trackTimeTravel(dimensionName) {
        this.event('time_travel', {
            target_dimension: dimensionName
        });
    }

    /**
     * Track clicks on interactive elements (Point of Interests - POIs)
     * @param {string} poiId ID of the POI
     * @param {string} poiTitle Title/Name of the POI (e.g. "La Source d'Alger")
     * @param {string} poiType 'object' | 'character'
     */
    static trackPOIClick(poiId, poiTitle, poiType) {
        this.event('poi_click', {
            poi_id: poiId,
            poi_title: poiTitle,
            poi_type: poiType
        });
    }

    /**
     * Track auditory experiences (ambient, narration, music, or SFX)
     * @param {string} channel 'ambience' | 'music' | 'narration' | 'sfx'
     * @param {string} action 'play' | 'stop' | 'ended'
     * @param {string} fileName Name of the audio asset or chapter ID
     */
    static trackAudioPlayback(channel, action, fileName) {
        this.event('audio_playback', {
            audio_channel: channel,
            audio_action: action,
            audio_file: fileName
        });
    }

    /**
     * Track when user toggles sound global state
     * @param {boolean} isMuted Current state of mute
     * @param {string} source 'hud' | 'menu'
     */
    static trackAudioMute(isMuted, source = 'hud') {
        this.event('audio_mute_toggle', {
            is_muted: isMuted,
            source: source
        });
    }

    /**
     * Track changes inside the interactive audio mixer
     * @param {string} channel 'music' | 'ambience' | 'narration' | 'sfx'
     * @param {number} volume Volume level between 0 and 1
     */
    static trackMixerChange(channel, volume) {
        this.event('audio_mixer_change', {
            audio_channel: channel,
            volume_percent: Math.round(volume * 100)
        });
    }

    /**
     * Track language customization choices
     * @param {string} langCode 'ar' | 'fr' | 'en'
     */
    static trackLanguageChange(langCode) {
        this.event('language_change', {
            selected_language: langCode
        });
    }
}
