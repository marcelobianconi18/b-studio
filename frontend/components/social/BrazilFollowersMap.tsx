import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STATE_LOCATIONS: Record<string, { lat: number; lng: number; intensity: number }> = {
    SP: { lat: -23.55, lng: -46.63, intensity: 10 },
    RJ: { lat: -22.9, lng: -43.17, intensity: 9 },
    MG: { lat: -19.91, lng: -43.93, intensity: 8 },
    DF: { lat: -15.78, lng: -47.92, intensity: 7 },
    BA: { lat: -12.97, lng: -38.5, intensity: 6 },
    RS: { lat: -30.03, lng: -51.22, intensity: 5 },
    PE: { lat: -8.04, lng: -34.87, intensity: 5 },
    CE: { lat: -3.71, lng: -38.54, intensity: 4 },
    PA: { lat: -1.45, lng: -48.5, intensity: 4 },
    AM: { lat: -3.1, lng: -60.02, intensity: 3 },
    GO: { lat: -16.68, lng: -49.26, intensity: 5 },
    PR: { lat: -25.42, lng: -49.27, intensity: 5 },
    SC: { lat: -27.59, lng: -48.54, intensity: 4 },
    ES: { lat: -20.31, lng: -40.33, intensity: 4 },
    MA: { lat: -2.53, lng: -44.3, intensity: 3 },
    MT: { lat: -15.6, lng: -56.09, intensity: 3 },
    MS: { lat: -20.46, lng: -54.62, intensity: 3 },
    RN: { lat: -5.79, lng: -35.2, intensity: 3 },
    PB: { lat: -7.11, lng: -34.86, intensity: 3 },
    AL: { lat: -9.66, lng: -35.73, intensity: 2 },
    SE: { lat: -10.94, lng: -37.07, intensity: 2 },
    PI: { lat: -5.09, lng: -42.8, intensity: 2 },
    TO: { lat: -10.17, lng: -48.33, intensity: 2 },
    RO: { lat: -8.76, lng: -63.9, intensity: 2 },
    AC: { lat: -9.97, lng: -67.82, intensity: 1 },
    AP: { lat: 0.03, lng: -51.06, intensity: 1 },
    RR: { lat: 2.82, lng: -60.67, intensity: 1 },
};

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, { value: number; state: string }>;
type ViewMode = 'gender' | 'age';
type GenderFilter = 'all' | 'female' | 'male';
type AgeFilter = '-18' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
type StateProfile = Record<string, number>;
let worldGeoJSONMemoryCache: GeoJSON.FeatureCollection | null = null;
const BRAZIL_VIEW_BOUNDS: maplibregl.LngLatBoundsLike = [[-74, -34], [-32, 6]];

const buildFollowersGeoJSON = (): FeatureCollection => {
    const points: Array<{ lat: number; lng: number; value: number; state: string }> = [];

    Object.entries(STATE_LOCATIONS).forEach(([state, location]) => {
        points.push({ lat: location.lat, lng: location.lng, value: location.intensity * 10, state });

        const count = location.intensity * 20;
        for (let i = 0; i < count; i++) {
            const radius = Math.random() * 2.5;
            const spread = (radius * (Math.random() + Math.random())) / 2;

            points.push({
                lat: location.lat + (Math.random() - 0.5) * spread,
                lng: location.lng + (Math.random() - 0.5) * spread,
                value: Math.random() * location.intensity * 10,
                state,
            });
        }
    });

    return {
        type: 'FeatureCollection',
        features: points.map((point) => ({
            type: 'Feature',
            properties: { value: point.value, state: point.state },
            geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
        })),
    };
};

const getStateBias = (state: string, key: string) => {
    const hash = Array.from(`${state}-${key}`).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 0.85 + (hash % 30) / 100;
};

const createBaseProfile = (value: number): StateProfile =>
    Object.keys(STATE_LOCATIONS).reduce((acc, state) => {
        acc[state] = value;
        return acc;
    }, {} as StateProfile);

const createProfileFromHighlights = (highlights: string[], strong = 2.8, base = 0.08): StateProfile => {
    const profile = createBaseProfile(base);
    highlights.forEach((state) => {
        profile[state] = strong;
    });
    return profile;
};

const FEMALE_PROFILE = createProfileFromHighlights(['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS', 'BA', 'PE', 'DF'], 2.9, 0.07);
const MALE_PROFILE = createProfileFromHighlights(['PA', 'AM', 'MT', 'MS', 'GO', 'RO', 'TO', 'RR', 'MA', 'CE'], 2.9, 0.07);

const AGE_PROFILES: Record<AgeFilter, StateProfile> = {
    '-18': createProfileFromHighlights(['PE', 'CE', 'BA', 'PA', 'AM', 'MA', 'PB', 'RN', 'AL'], 3.0, 0.06),
    '18-24': createProfileFromHighlights(['RJ', 'SP', 'BA', 'PE', 'CE', 'DF', 'GO', 'MG'], 3.0, 0.06),
    '25-34': createProfileFromHighlights(['SP', 'MG', 'PR', 'SC', 'RS', 'DF', 'ES', 'RJ'], 3.0, 0.06),
    '35-44': createProfileFromHighlights(['MG', 'GO', 'BA', 'PR', 'RS', 'MS', 'MT', 'SP'], 3.0, 0.06),
    '45-54': createProfileFromHighlights(['RS', 'SC', 'PR', 'SP', 'MG', 'RJ', 'ES'], 3.0, 0.06),
    '55-64': createProfileFromHighlights(['RS', 'SC', 'PR', 'MG', 'SP', 'RJ'], 3.0, 0.06),
    '65+': createProfileFromHighlights(['RS', 'SC', 'PR', 'MG', 'RJ', 'ES'], 3.0, 0.06),
};

const loadBrazilGeoJSON = async () => {
    const cacheKey = 'brazil-states-geojson';
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch {
        // Ignore storage access issues (quota/private mode).
    }

    const response = await fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson');
    const geojson = await response.json();
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(geojson));
    } catch {
        // Ignore quota errors: map can still work without persisted cache.
    }
    return geojson;
};

const loadWorldGeoJSON = async () => {
    const cacheKey = 'world-countries-geojson';
    if (worldGeoJSONMemoryCache) {
        return worldGeoJSONMemoryCache;
    }
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            worldGeoJSONMemoryCache = JSON.parse(cached) as GeoJSON.FeatureCollection;
            return worldGeoJSONMemoryCache;
        }
    } catch {
        // Ignore storage access issues (quota/private mode).
    }

    const response = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
    const geojson = await response.json() as GeoJSON.FeatureCollection;
    worldGeoJSONMemoryCache = geojson;
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(geojson));
    } catch {
        // Ignore quota errors for large world payload.
    }
    return geojson;
};

interface BrazilFollowersMapProps {
    title?: string;
    subtitle?: string;
    spanTwoRows?: boolean;
}

const BrazilFollowersMap = ({
    title = "Mapa de Calor",
    subtitle = "Concentração de seguidores por região",
    spanTwoRows = true,
}: BrazilFollowersMapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('gender');
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
    const [ageFilter, setAgeFilter] = useState<AgeFilter>('25-34');

    const baseMapData = useMemo(() => buildFollowersGeoJSON(), []);
    const mapData = useMemo(() => {
        const modeKey = viewMode === 'gender' ? `gender-${genderFilter}` : `age-${ageFilter}`;
        const profile = viewMode === 'gender'
            ? genderFilter === 'female'
                ? FEMALE_PROFILE
                : genderFilter === 'male'
                    ? MALE_PROFILE
                    : createBaseProfile(1)
            : AGE_PROFILES[ageFilter];

        return {
            type: 'FeatureCollection',
            features: baseMapData.features.map((feature) => {
                const state = feature.properties.state;
                const bias = getStateBias(state, modeKey);
                const profileMultiplier = profile[state] ?? 1;
                const nextValue = feature.properties.value * profileMultiplier * bias;
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        value: nextValue,
                    },
                };
            }),
        } as FeatureCollection;
    }, [ageFilter, baseMapData, genderFilter, viewMode]);

    useEffect(() => {
        const checkTheme = () => {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            setIsDarkMode(dark);
        };

        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, [baseMapData]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const container = containerRef.current;
        container.innerHTML = '';

        const initialDark = document.documentElement.getAttribute('data-theme') === 'dark';

        const map = new maplibregl.Map({
            container,
            style: {
                version: 8,
                sources: {},
                layers: [
                    {
                        id: 'background',
                        type: 'background',
                        paint: {
                            'background-color': initialDark ? '#18181b' : '#f4f4f5',
                        },
                    },
                ],
            },
            center: [-52, -15],
            zoom: 3.42,
            minZoom: 0.8,
            maxZoom: 8,
            dragRotate: false,
            pitchWithRotate: false,
            touchPitch: false,
            attributionControl: false,
            antialias: true,
            preserveDrawingBuffer: false,
        });

        mapRef.current = map;

        map.on('load', async () => {
            try {
                const [worldGeoJSON, brazilGeoJSON] = await Promise.all([
                    loadWorldGeoJSON(),
                    loadBrazilGeoJSON(),
                ]);
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

                map.addSource('world-countries', {
                    type: 'geojson',
                    data: worldGeoJSON,
                });

                map.addLayer({
                    id: 'world-fill',
                    type: 'fill',
                    source: 'world-countries',
                    paint: {
                        'fill-color': isDark ? '#111724' : '#e7edf7',
                        'fill-opacity': 1,
                    },
                });

                map.addLayer({
                    id: 'world-border',
                    type: 'line',
                    source: 'world-countries',
                    paint: {
                        'line-color': isDark ? '#273248' : '#b9c6db',
                        'line-width': 0.8,
                    },
                });

                map.addSource('brazil-states', {
                    type: 'geojson',
                    data: brazilGeoJSON,
                });

                map.addLayer({
                    id: 'brazil-fill',
                    type: 'fill',
                    source: 'brazil-states',
                    paint: {
                        'fill-color': isDark ? '#1a2333' : '#cfd8e9',
                        'fill-opacity': 1,
                    },
                });

                map.addLayer({
                    id: 'brazil-border',
                    type: 'line',
                    source: 'brazil-states',
                    paint: {
                        'line-color': isDark ? '#526384' : '#8ca1c1',
                        'line-width': 1.3,
                    },
                });

                map.addSource('followers', {
                    type: 'geojson',
                    data: mapData,
                });

                map.addLayer({
                    id: 'followers-heat',
                    type: 'heatmap',
                    source: 'followers',
                    maxzoom: 8,
                    paint: {
                        'heatmap-weight': [
                            'interpolate',
                            ['linear'],
                            ['get', 'value'],
                            0, 0,
                            100, 1,
                        ],
                        'heatmap-intensity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0.8, 0.25,
                            2.5, 0.8,
                            8, 1.8,
                        ],
                        'heatmap-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0.8, 4,
                            2.5, 12,
                            8, 34,
                        ],
                        'heatmap-opacity': 0.92,
                        'heatmap-color': [
                            'interpolate',
                            ['linear'],
                            ['heatmap-density'],
                            0, 'rgba(46, 138, 230, 0)',
                            0.2, '#2E8AE6',
                            0.4, '#69D1AB',
                            0.6, '#DAF291',
                            0.75, '#FFD85C',
                            0.9, '#FF9D4D',
                            1, '#FF6B3B',
                        ],
                    },
                });

                // Removed fitBounds to keep higher initial zoom
            } catch (error) {
                console.error('Failed to initialize Brazil followers map:', error);
            }
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            container.innerHTML = '';
        };
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(() => {
            mapRef.current?.resize();
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        const bg = isDarkMode ? '#18181b' : '#f4f4f5';
        const worldFill = isDarkMode ? '#111724' : '#e7edf7';
        const worldBorder = isDarkMode ? '#273248' : '#b9c6db';
        const brazilFill = isDarkMode ? '#1a2333' : '#cfd8e9';
        const brazilBorder = isDarkMode ? '#526384' : '#8ca1c1';

        if (map.getLayer('background')) {
            map.setPaintProperty('background', 'background-color', bg);
        }
        if (map.getLayer('world-fill')) {
            map.setPaintProperty('world-fill', 'fill-color', worldFill);
        }
        if (map.getLayer('world-border')) {
            map.setPaintProperty('world-border', 'line-color', worldBorder);
        }
        if (map.getLayer('brazil-fill')) {
            map.setPaintProperty('brazil-fill', 'fill-color', brazilFill);
        }
        if (map.getLayer('brazil-border')) {
            map.setPaintProperty('brazil-border', 'line-color', brazilBorder);
        }
    }, [isDarkMode]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getSource('followers')) return;

        const source = map.getSource('followers') as GeoJSONSource;
        source.setData(mapData);
    }, [mapData]);

    return (
        <div className={`bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl overflow-hidden flex flex-col h-full relative min-h-[400px] ${spanTwoRows ? "lg:row-span-2" : ""}`}>
            <div className="absolute top-0 left-0 w-full p-6 z-10 bg-gradient-to-b from-[var(--shell-surface)] to-transparent pointer-events-none">
                <div className="flex items-start justify-between gap-4">
                    <div className="max-w-[320px]">
                        <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">{title}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{subtitle}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">Visualização com dados simulados por perfil</p>
                    </div>

                    <div className="hidden md:flex items-stretch justify-end gap-3 pointer-events-auto ml-auto min-w-[320px]">
                        <div className="px-4 py-3 rounded-xl border border-blue-500/35 bg-gradient-to-r from-blue-500/20 to-blue-500/5 shadow-[0_0_0_1px_rgba(59,130,246,0.15)] min-w-[170px]">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Top Região</span>
                            <div className="text-base font-black text-blue-500 leading-tight mt-1">Sudeste (48%)</div>
                        </div>
                        <div className="px-4 py-3 rounded-xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 shadow-[0_0_0_1px_rgba(16,185,129,0.15)] min-w-[160px]">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Top Estado</span>
                            <div className="text-base font-black text-emerald-500 leading-tight mt-1">São Paulo</div>
                        </div>
                    </div>
                </div>

                <div className="mt-3 md:hidden flex items-stretch gap-2 pointer-events-auto">
                    <div className="px-3 py-2 rounded-xl border border-blue-500/35 bg-blue-500/10 min-w-[140px]">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Top Região</span>
                        <div className="text-sm font-black text-blue-500 leading-tight mt-0.5">Sudeste (48%)</div>
                    </div>
                    <div className="px-3 py-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 min-w-[130px]">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Top Estado</span>
                        <div className="text-sm font-black text-emerald-500 leading-tight mt-0.5">São Paulo</div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => setViewMode('gender')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${viewMode === 'gender'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-[var(--shell-surface)] text-zinc-500 border-[var(--shell-border)] hover:border-blue-400/60'
                            }`}
                    >
                        Gênero
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('age')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${viewMode === 'age'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-[var(--shell-surface)] text-zinc-500 border-[var(--shell-border)] hover:border-blue-400/60'
                            }`}
                    >
                        Faixa etária
                    </button>

                    {viewMode === 'gender' && (
                        <>
                            {(['all', 'female', 'male'] as const).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setGenderFilter(option)}
                                    className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors ${genderFilter === option
                                        ? 'bg-zinc-800 text-white border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                                        : 'bg-[var(--shell-surface)] text-zinc-500 border-[var(--shell-border)] hover:border-zinc-500/60'
                                        }`}
                                >
                                    {option === 'all' ? 'Todos' : option === 'female' ? 'Feminino' : 'Masculino'}
                                </button>
                            ))}
                        </>
                    )}

                    {viewMode === 'age' && (
                        <>
                            {(['-18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'] as const).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setAgeFilter(option)}
                                    className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors ${ageFilter === option
                                        ? 'bg-zinc-800 text-white border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                                        : 'bg-[var(--shell-surface)] text-zinc-500 border-[var(--shell-border)] hover:border-zinc-500/60'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>

            <div
                ref={containerRef}
                className="w-full h-full flex-1 relative z-0"
                style={{ minHeight: '400px' }}
            />

            <div className="absolute bottom-6 right-6 bg-[var(--shell-surface)]/90 backdrop-blur border border-[var(--shell-border)] p-2 rounded-lg text-[10px] z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#FF6B3B]"></span>
                    <span className="text-zinc-400">Alta Densidade</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2E8AE6]/50"></span>
                    <span className="text-zinc-600">Baixa Densidade</span>
                </div>
            </div>
        </div>
    );
};

export default BrazilFollowersMap;
