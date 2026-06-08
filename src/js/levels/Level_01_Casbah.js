export const CASBAH_SCENARIO = {
    settings: {
        startNode: 'patio'
    },
    nodes: {
        'patio': {
            backgrounds: {
                day: '../../assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/background/01_bg.png',
                night: '../../assets/levels/level_01_casbah/scenes/02_rez_de_chaussee_nuit/background/02_bg.png'
            },
            ambience: {
                day:   '/assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/ambience/01_ambience_day.mp3',
                night: '/assets/levels/level_01_casbah/scenes/02_rez_de_chaussee_nuit/elements/ambience/02_ambience_night.mp3'
            },
            startCam: { az: 1.5856460275171018, pol: 1.3762056082747058 },
            pois: [
                {
                    id: 'poi_ain_sebaa',
                    position: { x: 75.11435879621929, y: -73.5111009784146, z: -487.98100573597793 },
                    audio: '../../assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/narration/01_narration.mp3',
                    poiType: 'object',
                    timeMode: 'day',
                    replicas: [],
                    _replicaIndex: 0,
                    content: {
                        fr: {
                            title: '\u0639\u064a\u0646 \u0627\u0644\u0633\u0628\u0639',
                            description: 'Cette porte de villa \u00e0 A\u00efn Seba\u00e2 est une pi\u00e8ce unique issue de l\'artisanat traditionnel. Fabriqu\u00e9e en bois robuste avec des d\u00e9tails en fer forg\u00e9, elle incarne l\'identit\u00e9 et l\'\u00e2me de la maison. Elle m\u00eale modernit\u00e9 et tradition, offrant intimit\u00e9 et annonc\u00e7ant une nouvelle histoire \u00e0 chaque visiteur.',
                            transcript: '\u0641\u064a \u0639\u064a\u0646 \u0627\u0644\u0633\u0628\u0639\u060c \u0647\u0627\u062f \u0627\u0644\u0628\u0627\u0628 \u062f \u0627\u0644\u0641\u064a\u0644\u0651\u0627 \u0639\u0646\u062f\u0648 \u062d\u0643\u0627\u064a\u0629 \u062e\u0627\u0635\u0629 \u0628\u064a\u0647. \u062a\u0635\u0627\u0648\u0628 \u0628\u0627\u0644\u062d\u0631\u0641\u0629 \u0645\u0646 \u062e\u0634\u0628 \u0642\u0648\u064a \u0648\u0645\u0639\u0627\u0647 \u062a\u0641\u0627\u0635\u064a\u0644 \u0645\u0646 \u062d\u062f\u064a\u062f \u0645\u062e\u062f\u0648\u0645\u064a\u0646 \u0628\u0627\u0644\u062f\u0642\u0629\u060c \u0645\u0633\u062a\u0648\u062d\u064a \u0645\u0646 \u0627\u0644\u0635\u0646\u0627\u0639\u0629 \u0627\u0644\u062a\u0642\u0644\u064a\u062f\u064a\u0629.'
                        },
                        en: {
                            title: '\u0639\u064a\u0646 \u0627\u0644\u0633\u0628\u0639',
                            description: 'Traditional handcrafted villa door combining wood and forged iron, representing identity, privacy and the beginning of a new story.',
                            transcript: ''
                        },
                        ar: {
                            title: '\u0639\u064a\u0646 \u0627\u0644\u0633\u0628\u0639',
                            description: '',
                            transcript: '\u0641\u064a \u0639\u064a\u0646 \u0627\u0644\u0633\u0628\u0639\u060c \u0647\u0627\u062f \u0627\u0644\u0628\u0627\u0628 \u062f \u0627\u0644\u0641\u064a\u0644\u0651\u0627 \u0639\u0646\u062f\u0648 \u062d\u0643\u0627\u064a\u0629 \u062e\u0627\u0635\u0629 \u0628\u064a\u0647...'
                        }
                    }
                },
                {
                    id: 'poi_fawara',
                    position: { x: -356.32605921840184, y: -350.3443533765454, z: 3.6971606671478394 },
                    audio: '../../assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/narration/01_narration_fawara.mp3',
                    poiType: 'object',
                    timeMode: 'day',
                    replicas: [],
                    _replicaIndex: 0,
                    content: {
                        fr: {
                            title: '\u0641\u0648\u0627\u0631\u0629',
                            description: 'La fw\u0101ra est le c\u0153ur battant de la maison. Fontaine en marbre et zellige, elle apporte fra\u00eecheur et s\u00e9r\u00e9nit\u00e9. Son murmure apaise l\'esprit et rassemble la famille.',
                            transcript: '\u0648\u0633\u0637 \u0627\u0644\u062f\u0627\u0631\u060c \u0643\u0627\u064a\u0646 \u0642\u0644\u0628 \u064a\u0646\u0628\u0636 \u0628\u0627\u0644\u062d\u064a\u0627\u0629.. \u0647\u064a \u0627\u0644\u0641\u0648\u0627\u0631\u0629.\n\n\u0645\u062d\u0637\u0648\u0637\u0629 \u062a\u0645\u0627 \u0641\u064a \u0646\u0635 \u0627\u0644\u0628\u0627\u062a\u064a\u0648...'
                        },
                        en: {
                            title: '\u0641\u0648\u0627\u0631\u0629',
                            description: 'Central fountain bringing calm, freshness and family gathering.',
                            transcript: ''
                        },
                        ar: {
                            title: '\u0641\u0648\u0627\u0631\u0629',
                            description: '',
                            transcript: '\u0648\u0633\u0637 \u0627\u0644\u062f\u0627\u0631\u060c \u0643\u0627\u064a\u0646 \u0642\u0644\u0628 \u064a\u0646\u0628\u0636 \u0628\u0627\u0644\u062d\u064a\u0627\u0629.. \u0647\u064a \u0627\u0644\u0641\u0648\u0627\u0631\u0629.'
                        }
                    }
                },
                {
                    id: 'poi_zahra',
                    position: { x: -251.55933693635822, y: -264.9734933434627, z: -340.91325525149335 },
                    audio: '',
                    poiType: 'character',
                    timeMode: 'night',
                    replicas: [
                        {
                            audio: '../../assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/expression/01_zahra_replique_01.mp3',
                            description: 'La porte par laquelle te vient le vent, bouche-la et tu te reposeras.\n\nCoupe la source du problème à la racine pour retrouver la paix.',
                            transcript: 'الباب لي يجيك منو الريح سدو و ستريح'
                        },
                        {
                            audio: '../../assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/expression/01_zahra_replique_02.mp3',
                            description: 'Celui que la chance trahit dit : "La sorcellerie m\'a trahi."\n\nCelui qui manque de chance accuse le mauvais œil au lieu de se remettre en question.',
                            transcript: 'لي خانو الزهر يقول السحور بيا'
                        }
                    ],
                    _replicaIndex: 0,
                    content: {
                        fr: { title: '\u0632\u064f\u0647\u0631\u0629', description: '', transcript: '' },
                        en: { title: 'Zahra', description: '', transcript: '' },
                        ar: { title: '\u0632\u064f\u0647\u0631\u0629', description: '', transcript: '' }
                    }
                },
                {
                    id: 'poi_aicha',
                    position: { x: -121.33867479629063, y: -292.79912179175983, z: -386.4468992940637 },
                    audio: '',
                    poiType: 'character',
                    timeMode: 'night',
                    replicas: [
                        {
                            audio: '../../assets/levels/level_01_casbah/scenes/03_etage/elements/expression/03_aicha_replique_01.mp3',
                            description: 'C\'est quelle chorba qui t\'a brûlé les lèvres ?\n\nPourquoi te sens-tu concerné par cette affaire ?',
                            transcript: 'واش من شربة حرقتلك شواربك'
                        }
                    ],
                    _replicaIndex: 0,
                    content: {
                        fr: { title: '\u0639\u0627\u0626\u0634\u0629', description: '', transcript: '' },
                        en: { title: 'Aicha', description: '', transcript: '' },
                        ar: { title: '\u0639\u0627\u0626\u0634\u0629', description: '', transcript: '' }
                    }
                },
                // --- POI NAVIGATION VERS L'ÉTAGE ---
                {
                    id: 'nav_upstairs',
                    position: { x: 331.55, y: -373.75, z: 2.97 }, // Position de l'escalier
                    audio: '',
                    poiType: 'navigation', // TYPE SPÉCIAL
                    targetNode: 'upstairs', // Le nom du nœud cible
                    timeMode: 'day', // Toujours visible
                    content: {
                        fr: { title: 'Monter à l\'étage', description: 'Accéder à la terrasse de la Casbah.', transcript: '' },
                        en: { title: 'Go upstairs', description: 'Access the terrace.', transcript: '' },
                        ar: { title: 'اصعد', description: 'الوصول إلى الشرفة.', transcript: '' }
                    }
                },
                // --- POI NAVIGATION VERS LE SOUS-SOL (VERROUILLÉ PAR LA CLÉ) ---
                {
                    id: 'nav_basement',
                    position: { x: 217.51, y: -147.06, z: -301.77 },
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'basement',
                    timeMode: 'day',
                    content: {
                        fr: { title: 'Porte de la Matmoura', description: 'Porte secrète verrouillée.', transcript: '' },
                        en: { title: 'Matmoura Door', description: 'Secret door is locked.', transcript: '' },
                        ar: { title: 'باب المطمورة', description: 'باب مقفل.', transcript: '' }
                    }
                },
                // --- POI NAVIGATION SORTIE VERS LA RUE (HUB) ---
                {
                    id: 'nav_exit_rue',
                    position: { x: -191.99, y: -182.70, z: 299.60 },
                    audio: '',
                    poiType: 'navigation',
                    isExit: true,
                    targetNode: 'hub_rue',
                    timeMode: 'day', // ou sans timeMode pour l'avoir tout le temps, pour l'instant day
                    content: {
                        fr: { title: 'Sortir', description: 'Quitter la maison pour la rue.', transcript: '' },
                        en: { title: 'Exit', description: 'Leave the house to the street.', transcript: '' },
                        ar: { title: 'خروج', description: 'مغادرة المنزل إلى الشارع.', transcript: '' }
                    }
                }
            ]
        },
        'upstairs': {
            backgrounds: {
                day: '../../assets/levels/level_01_casbah/scenes/03_etage/background/03_bg.png',
                night: '../../assets/levels/level_01_casbah/scenes/03_etage/background/03_bg.png'
            },
            ambience: {
                day:   '/assets/levels/level_01_casbah/scenes/03_etage/ambience/01_ambience_day_etage.mp3',
                night: '/assets/levels/level_01_casbah/scenes/03_etage/ambience/01_ambience_day_etage.mp3'
            },
            startCam: { az: 0, pol: 1.57 },
            pois: [
                // --- POI NAVIGATION RETOUR AU PATIO ---
                {
                    id: 'nav_downstairs',
                    position: { x: 257.31, y: -214.01, z: 219.06 }, // Vraie position vers le patio
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'patio',
                    timeMode: 'day', // Visible toujours
                    content: {
                        fr: { title: 'Redescendre', description: 'Retourner dans le patio principal.', transcript: '' },
                        en: { title: 'Go down', description: 'Return to the main patio.', transcript: '' },
                        ar: { title: 'انزل', description: 'العودة إلى الفناء.', transcript: '' }
                    }
                },
                // --- POI NAVIGATION VERS LA CHAMBRE ---
                {
                    id: 'nav_to_room',
                    position: { x: 464.30, y: -98.32, z: 155.46 }, // Vraie position vers la chambre
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'room',
                    timeMode: 'day', // Visible toujours
                    content: {
                        fr: { title: 'Entrer dans la chambre', description: 'Découvrir la chambre mauresque.', transcript: '' },
                        en: { title: 'Enter the room', description: 'Discover the Moorish room.', transcript: '' },
                        ar: { title: 'دخول الغرفة', description: 'اكتشاف الغرفة المغاربية.', transcript: '' }
                    }
                }
            ]
        },
        'room': {
            backgrounds: {
                day: '../../assets/levels/level_01_casbah/scenes/04_chambre/background/04_bg.png',
                night: '../../assets/levels/level_01_casbah/scenes/04_chambre/background/04_bg.png'
            },
            ambience: {
                day:   '/assets/levels/level_01_casbah/scenes/04_chambre/ambience/01_ambience_day_chambre.mp3',
                night: '/assets/levels/level_01_casbah/scenes/04_chambre/ambience/01_ambience_day_chambre.mp3'
            },
            startCam: { az: 0, pol: 1.57 },
            pois: [
                // --- POI NAVIGATION RETOUR A LA TERRASSE ---
                {
                    id: 'nav_to_upstairs',
                    position: { x: -162.75, y: -174.24, z: 321.17 },
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'upstairs',
                    timeMode: 'day',
                    content: {
                        fr: { title: 'Retourner à la terrasse', description: 'Sortir de la chambre.', transcript: '' },
                        en: { title: 'Return to terrace', description: 'Leave the room.', transcript: '' },
                        ar: { title: 'العودة إلى الشرفة', description: 'الخروج من الغرفة.', transcript: '' }
                    }
                }
            ]
        },
        'basement': {
            backgrounds: {
                day: '../../assets/levels/level_01_casbah/scenes/05_sous_sol/background/05_bg.png',
                night: '../../assets/levels/level_01_casbah/scenes/05_sous_sol/background/05_bg.png'
            },
            ambience: {
                day:   '/assets/levels/level_01_casbah/scenes/05_sous_sol/ambiance/01_ambience_day_sous sol.mp3',
                night: '/assets/levels/level_01_casbah/scenes/05_sous_sol/ambiance/01_ambience_day_sous sol.mp3'
            },
            startCam: { az: 3.14, pol: 1.57 },
            pois: [
                // --- POI NAVIGATION RETOUR AU PATIO ---
                {
                    id: 'nav_basement_to_patio',
                    position: { x: -66.31, y: -171.87, z: -355.06 },
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'patio',
                    timeMode: 'day',
                    content: {
                        fr: { title: 'Remonter au patio', description: 'Retourner au rez-de-chaussée.', transcript: '' },
                        en: { title: 'Go up to patio', description: 'Return to ground floor.', transcript: '' },
                        ar: { title: 'الصعود إلى الفناء', description: 'العودة إلى الطابق الأرضي.', transcript: '' }
                    }
                }
            ]
        },
        'hub_rue': {
            backgrounds: {
                day: '../../assets/levels/level_02_casbah_rue/scenes/01_hub_rue_devant%20la%20porte/background/01_bg.png',
                night: '../../assets/levels/level_02_casbah_rue/scenes/01_hub_rue_devant%20la%20porte/background/01_bg.png'
            },
            ambience: {
                day:   null,
                night: null
            },
            startCam: { az: 3.14, pol: 1.57 },
            pois: [
                // --- RETOUR À LA MAISON (icône porte) ---
                {
                    id: 'nav_hub_to_patio',
                    position: { x: 393.55, y: -71.24, z: 6.51 },
                    audio: '',
                    poiType: 'navigation',
                    iconUrl: '../../assets/levels/level_02_casbah_rue/global/door_icone.svg',
                    targetNode: 'patio',
                    timeMode: 'day',
                    content: {
                        fr: { title: 'Entrer dans la maison', description: 'Retourner dans le patio.', transcript: '' },
                        en: { title: 'Enter the house', description: 'Return to the patio.', transcript: '' },
                        ar: { title: 'دخول المنزل', description: 'العودة إلى الفناء.', transcript: '' }
                    }
                },
                // --- VERS LA PORTE (RUE) ---
                {
                    id: 'nav_hub_to_rue_porte',
                    position: { x: -233.44, y: -323.80, z: -25.70 },
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'rue_porte',
                    timeMode: 'day',
                    content: {
                        fr: { title: 'Vers la porte', description: 'Explorer la rue près de la porte.', transcript: '' },
                        en: { title: 'Towards the door', description: 'Explore the street near the door.', transcript: '' },
                        ar: { title: 'نحو الباب', description: 'استكشاف الشارع بالقرب من الباب.', transcript: '' }
                    }
                },
                // --- VERS LES HAUTEURS DE LA CASBAH ---
                {
                    id: 'nav_hub_to_hauteurs',
                    position: { x: 88, y: -182, z: 456 },
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'hauteurs',
                    timeMode: 'day',
                    content: {
                        fr: { title: 'Les hauteurs', description: 'Monter vers les hauteurs de la Casbah.', transcript: '' },
                        en: { title: 'The heights', description: 'Climb towards the Casbah heights.', transcript: '' },
                        ar: { title: 'المرتفعات', description: 'الصعود نحو مرتفعات القصبة.', transcript: '' }
                    }
                },
                // --- VERS LE MARCHÉ ---
                {
                    id: 'nav_hub_to_marche',
                    position: { x: 75.48, y: -237.20, z: -313.11 },
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'marche',
                    timeMode: 'day',
                    content: {
                        fr: { title: 'Le marché', description: 'Se diriger vers le marché.', transcript: '' },
                        en: { title: 'The market', description: 'Head towards the market.', transcript: '' },
                        ar: { title: 'السوق', description: 'التوجه نحو السوق.', transcript: '' }
                    }
                }
            ]
        },
        // ── PLACEHOLDER NODES (Level 2 – à compléter) ─────────────────────────
        'rue_porte': {
            backgrounds: {
                day: '../../assets/levels/level_02_casbah_rue/scenes/01_hub_rue_devant%20la%20porte/background/01_bg.png',
                night: '../../assets/levels/level_02_casbah_rue/scenes/01_hub_rue_devant%20la%20porte/background/01_bg.png'
            },
            ambience: { day: null, night: null },
            startCam: { az: 0, pol: 1.57 },
            pois: [
                {
                    id: 'nav_rue_porte_back',
                    position: { x: 0, y: 0, z: -400 },
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'hub_rue',
                    timeMode: 'day',
                    content: {
                        fr: { title: 'Retour au hub', description: '', transcript: '' },
                        en: { title: 'Back to hub', description: '', transcript: '' },
                        ar: { title: 'العودة', description: '', transcript: '' }
                    }
                }
            ]
        },
        'hauteurs': {
            backgrounds: {
                day: '../../assets/levels/level_02_casbah_rue/scenes/01_hub_rue_devant%20la%20porte/background/01_bg.png',
                night: '../../assets/levels/level_02_casbah_rue/scenes/01_hub_rue_devant%20la%20porte/background/01_bg.png'
            },
            ambience: { day: null, night: null },
            startCam: { az: 0, pol: 1.57 },
            pois: [
                {
                    id: 'nav_hauteurs_back',
                    position: { x: 0, y: 0, z: -400 },
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'hub_rue',
                    timeMode: 'day',
                    content: {
                        fr: { title: 'Retour au hub', description: '', transcript: '' },
                        en: { title: 'Back to hub', description: '', transcript: '' },
                        ar: { title: 'العودة', description: '', transcript: '' }
                    }
                }
            ]
        },
        'marche': {
            backgrounds: {
                day: '../../assets/levels/level_02_casbah_rue/scenes/01_hub_rue_devant%20la%20porte/background/01_bg.png',
                night: '../../assets/levels/level_02_casbah_rue/scenes/01_hub_rue_devant%20la%20porte/background/01_bg.png'
            },
            ambience: { day: null, night: null },
            startCam: { az: 0, pol: 1.57 },
            pois: [
                {
                    id: 'nav_marche_back',
                    position: { x: 0, y: 0, z: -400 },
                    audio: '',
                    poiType: 'navigation',
                    targetNode: 'hub_rue',
                    timeMode: 'day',
                    content: {
                        fr: { title: 'Retour au hub', description: '', transcript: '' },
                        en: { title: 'Back to hub', description: '', transcript: '' },
                        ar: { title: 'العودة', description: '', transcript: '' }
                    }
                }
            ]
        }
    }
};
