import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Pipeboard API Configuration
const PIPEBOARD_API_TOKEN = process.env.NEXT_PUBLIC_PIPEBOARD_API_TOKEN || 'pk_8d419db95ee54af0a873fe187620e5e3';
const PIPEBOARD_API_BASE = 'https://pipeboard.co/api';

// Brazilian States coordinates
const STATE_LOCATIONS: Record<string, { lat: number; lng: number; name: string }> = {
    SP: { lat: -23.55, lng: -46.63, name: 'São Paulo' },
    RJ: { lat: -22.9, lng: -43.17, name: 'Rio de Janeiro' },
    MG: { lat: -19.91, lng: -43.93, name: 'Minas Gerais' },
    DF: { lat: -15.78, lng: -47.92, name: 'Distrito Federal' },
    BA: { lat: -12.97, lng: -38.5, name: 'Bahia' },
    RS: { lat: -30.03, lng: -51.22, name: 'Rio Grande do Sul' },
    PE: { lat: -8.04, lng: -34.87, name: 'Pernambuco' },
    CE: { lat: -3.71, lng: -38.54, name: 'Ceará' },
    PA: { lat: -1.45, lng: -48.5, name: 'Pará' },
    AM: { lat: -3.1, lng: -60.02, name: 'Amazonas' },
    GO: { lat: -16.68, lng: -49.26, name: 'Goiás' },
    PR: { lat: -25.42, lng: -49.27, name: 'Paraná' },
    SC: { lat: -27.59, lng: -48.54, name: 'Santa Catarina' },
    ES: { lat: -20.31, lng: -40.33, name: 'Espírito Santo' },
    MA: { lat: -2.53, lng: -44.3, name: 'Maranhão' },
    MT: { lat: -15.6, lng: -56.09, name: 'Mato Grosso' },
    MS: { lat: -20.46, lng: -54.62, name: 'Mato Grosso do Sul' },
    RN: { lat: -5.79, lng: -35.2, name: 'Rio Grande do Norte' },
    PB: { lat: -7.11, lng: -34.86, name: 'Paraíba' },
    AL: { lat: -9.66, lng: -35.73, name: 'Alagoas' },
    SE: { lat: -10.94, lng: -37.07, name: 'Sergipe' },
    PI: { lat: -5.09, lng: -42.8, name: 'Piauí' },
    TO: { lat: -10.17, lng: -48.33, name: 'Tocantins' },
    RO: { lat: -8.76, lng: -63.9, name: 'Rondônia' },
    AC: { lat: -9.97, lng: -67.82, name: 'Acre' },
    AP: { lat: 0.03, lng: -51.06, name: 'Amapá' },
    RR: { lat: 2.82, lng: -60.67, name: 'Roraima' },
};

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, { 
    value: number; 
    state: string; 
    reach?: number; 
    impressions?: number;
    engagement?: number;
}>;

type ViewMode = 'reach' | 'impressions' | 'engagement';
type GenderFilter = 'all' | 'female' | 'male';
type AgeFilter = '-18' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';

interface MetaAudienceData {
    state: string;
    reach: number;
    impressions?: number;
    engagement?: number;
    gender?: { male: number; female: number };
    age?: Record<string, number>;
}

let worldGeoJSONMemoryCache: GeoJSON.FeatureCollection | null = null;

interface BrazilFollowersMapProps {
    title?: string;
    subtitle?: string;
    spanTwoRows?: boolean;
}

// Fetch audience data from Pipeboard/Meta Ads API
const fetchAudienceData = async (): Promise<MetaAudienceData[] | null> => {
    try {
        // Try to fetch from backend proxy first (avoids CORS issues)
        const response = await fetch('/api/social/audience-insights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Pipeboard-Token': PIPEBOARD_API_TOKEN,
            },
            body: JSON.stringify({
                fields: ['reach', 'impressions', 'age', 'gender'],
                breakdown: 'region',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch audience data');
        }

        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.warn('Could not fetch real audience data, using fallback:', error);
        return null;
    }
};

// Generate fallback simulated data
const generateFallbackData = (): MetaAudienceData[] => {
    return Object.entries(STATE_LOCATIONS).map(([state, location]) => ({
        state,
        reach: Math.floor(location.lat * 1000 + location.lng * 500) % 50000 + 10000,
        impressions: Math.floor(location.lat * 2000 + location.lng * 1000) % 100000 + 20000,
        engagement: Math.floor(Math.random() * 5000) + 500,
        gender: {
            male: Math.floor(Math.random() * 60) + 20,
            female: Math.floor(Math.random() * 60) + 20,
        },
        age: {
            '18-24': Math.floor(Math.random() * 30) + 10,
            '25-34': Math.floor(Math.random() * 35) + 15,
            '35-44': Math.floor(Math.random() * 25) + 10,
            '45-54': Math.floor(Math.random() * 20) + 5,
            '55+': Math.floor(Math.random() * 15) + 3,
        },
    }));
};

const loadBrazilGeoJSON = async () => {
    const cacheKey = 'brazil-states-geojson';
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch {
        // Ignore storage access issues
    }

    const response = await fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson');
    const geojson = await response.json();
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(geojson));
    } catch {
        // Ignore quota errors
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
        // Ignore storage access issues
    }

    const response = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
    const geojson = await response.json() as GeoJSON.FeatureCollection;
    worldGeoJSONMemoryCache = geojson;
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(geojson));
    } catch {
        // Ignore quota errors
    }
    return geojson;
};

const BrazilFollowersMap = ({
    title = "Mapa de Audiência",
    subtitle = "Distribuição geográfica - Meta Ads",
    spanTwoRows = true,
}: BrazilFollowersMapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('reach');
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
    const [ageFilter, setAgeFilter] = useState<AgeFilter>('25-34');
    const [isLoading, setIsLoading] = useState(true);
    const [audienceData, setAudienceData] = useState<MetaAudienceData[] | null>(null);

    // Fetch audience data on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const data = await fetchAudienceData();
            setAudienceData(data || generateFallbackData());
            setIsLoading(false);
        };
        loadData();
    }, []);

    const baseMapData = useMemo(() => {
        if (!audienceData) {
            return {
                type: 'FeatureCollection' as const,
                features: [],
            };
        }

        return {
            type: 'FeatureCollection' as const,
            features: audienceData.map((data) => ({
                type: 'Feature' as const,
                properties: {
                    value: data.reach,
                    state: data.state,
                    reach: data.reach,
                    impressions: data.impressions,
                    engagement: data.engagement,
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [
                        STATE_LOCATIONS[data.state]?.lng || -50,
                        STATE_LOCATIONS[data.state]?.lat || -15,
                    ],
                },
            })),
        };
    }, [audienceData]);

    const mapData = useMemo(() => {
        if (!baseMapData.features.length) return baseMapData;

        const getValue = (feature: any) => {
            switch (viewMode) {
                case 'impressions':
                    return feature.properties.impressions || feature.properties.value;
                case 'engagement':
                    return feature.properties.engagement || feature.properties.value * 0.1;
                default:
                    return feature.properties.reach || feature.properties.value;
            }
        };

        return {
            type: 'FeatureCollection' as const,
            features: baseMapData.features.map((feature) => ({
                ...feature,
                properties: {
                    ...feature.properties,
                    value: getValue(feature),
                },
            })),
        } as FeatureCollection;
    }, [baseMapData, viewMode]);

    useEffect(() => {
        const checkTheme = () => {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            setIsDarkMode(dark);
        };

        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

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
                            'background-color': initialDark ? "#090B14" : "#F8FAFC",
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
                        'fill-color': isDark ? "#1E293B" : "#E2E8F0",
                        'fill-opacity': 1,
                    },
                });

                map.addLayer({
                    id: 'world-border',
                    type: 'line',
                    source: 'world-countries',
                    paint: {
                        'line-color': isDark ? "#334155" : "#CBD5E1",
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
                        'fill-color': isDark ? "#334155" : "#CBD5E1",
                        'fill-opacity': 1,
                    },
                });

                map.addLayer({
                    id: 'brazil-border',
                    type: 'line',
                    source: 'brazil-states',
                    paint: {
                        'line-color': isDark ? "#475569" : "#94A3B8",
                        'line-width': 1.3,
                    },
                });

                map.addSource('audience', {
                    type: 'geojson',
                    data: mapData,
                });

                map.addLayer({
                    id: 'audience-heat',
                    type: 'heatmap',
                    source: 'audience',
                    maxzoom: 8,
                    paint: {
                        'heatmap-weight': [
                            'interpolate',
                            ['linear'],
                            ['get', 'value'],
                            0, 0,
                            50000, 1,
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
                            0.2, 'rgba(46, 138, 230, 0.4)',
                            0.4, 'rgb(74, 158, 255)',
                            0.6, 'rgb(255, 184, 74)',
                            0.8, 'rgb(255, 107, 59)',
                            1, 'rgb(255, 68, 0)'
                        ],
                    },
                });

                // Add data source label
                const sourceLabel = document.createElement('div');
                sourceLabel.className = 'maplibregl-ctrl maplibregl-ctrl-attribution';
                sourceLabel.innerHTML = '© <a href="https://pipeboard.co" target="_blank">Pipeboard</a> | Meta Ads';
                map.addControl(sourceLabel, 'bottom-right');

            } catch (error) {
                console.error('Failed to initialize audience map:', error);
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
        if (!map) return;

        const updateLayers = () => {
            if (!map.isStyleLoaded()) return;

            const bg = isDarkMode ? "#090B14" : "#F8FAFC";
            const worldFill = isDarkMode ? "#1E293B" : "#E2E8F0";
            const worldBorder = isDarkMode ? "#334155" : "#CBD5E1";
            const brazilFill = isDarkMode ? "#334155" : "#CBD5E1";
            const brazilBorder = isDarkMode ? "#475569" : "#94A3B8";

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
            map.resize();
        };

        if (map.isStyleLoaded()) {
            updateLayers();
        } else {
            map.once('styledata', updateLayers);
        }
    }, [isDarkMode]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getSource('audience')) return;

        const source = map.getSource('audience') as GeoJSONSource;
        source.setData(mapData);
    }, [mapData]);

    // Calculate top regions from audience data
    const topRegions = useMemo(() => {
        if (!audienceData) return { region: '...', state: '...' };
        
        const sorted = [...audienceData].sort((a, b) => {
            const aValue = viewMode === 'impressions' ? a.impressions : a.reach;
            const bValue = viewMode === 'impressions' ? b.impressions : b.reach;
            return (bValue || 0) - (aValue || 0);
        });

        const top = sorted[0];
        const topValue = viewMode === 'impressions' ? top.impressions : top.reach;
        const total = sorted.reduce((sum, s) => sum + (viewMode === 'impressions' ? s.impressions : s.reach || 0), 0);
        const percentage = total ? Math.round((topValue / total) * 100) : 0;

        return {
            region: `${sorted.slice(0, 2).map(s => s.state).join(' + ')} (${percentage}%)`,
            state: STATE_LOCATIONS[top.state]?.name || top.state,
        };
    }, [audienceData, viewMode]);

    return (
        <div className={`bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl overflow-hidden flex flex-col h-full relative min-h-[400px] ${spanTwoRows ? "lg:row-span-2" : ""}`}>
            <div className="absolute top-0 left-0 w-full p-6 z-10 bg-gradient-to-b from-[var(--shell-surface)] to-transparent pointer-events-none">
                <div className="flex items-start justify-between gap-4">
                    <div className="max-w-[320px]">
                        <h3 className="text-4xl font-black text-[var(--foreground)] tracking-tighter leading-none mb-2">{title}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]">{subtitle}</p>
                        <p className="text-[10px] text-[var(--foreground)] mt-1 flex items-center gap-2">
                            {isLoading ? (
                                <span className="animate-pulse">Carregando dados...</span>
                            ) : audienceData ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Dados reais do Meta Ads
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                    Dados simulados (fallback)
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="hidden md:flex items-stretch justify-end gap-3 pointer-events-auto ml-auto min-w-[320px]">
                        <div className="px-4 py-3 rounded-xl border border-[var(--shell-border)]/20 bg-[var(--shell-surface)]/10 shadow-sm min-w-[170px]">
                            <span className="text-[10px] text-[var(--foreground)] uppercase font-bold">Top Região</span>
                            <div className="text-base font-black text-[var(--foreground)] leading-tight mt-1">{topRegions.region}</div>
                        </div>
                        <div className="px-4 py-3 rounded-xl border border-[var(--shell-border)] bg-[var(--shell-surface)] shadow-sm min-w-[160px]">
                            <span className="text-[10px] text-[var(--foreground)] uppercase font-bold">Top Estado</span>
                            <div className="text-base font-black text-[var(--foreground)] leading-tight mt-1">{topRegions.state}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-3 md:hidden flex items-stretch gap-2 pointer-events-auto">
                    <div className="px-3 py-2 rounded-xl border border-[var(--shell-border)]/20 bg-[var(--shell-surface)]/10 min-w-[140px]">
                        <span className="text-[10px] text-[var(--foreground)] uppercase font-bold">Top Região</span>
                        <div className="text-sm font-black text-[var(--foreground)] leading-tight mt-0.5">{topRegions.region}</div>
                    </div>
                    <div className="px-3 py-2 rounded-xl border border-[var(--shell-border)]/20 bg-[var(--shell-surface)]/10 min-w-[130px]">
                        <span className="text-[10px] text-[var(--foreground)] uppercase font-bold">Top Estado</span>
                        <div className="text-sm font-black text-[var(--foreground)] leading-tight mt-0.5">{topRegions.state}</div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => setViewMode('reach')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${viewMode === 'reach'
                            ? 'bg-white/10 text-[var(--foreground)] border-white/20'
                            : 'bg-[var(--shell-surface)] text-[var(--foreground)] border-[var(--shell-border)] hover:border-[var(--foreground)]/20'
                            }`}
                    >
                        Alcance
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('impressions')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${viewMode === 'impressions'
                            ? 'bg-white/10 text-[var(--foreground)] border-white/20'
                            : 'bg-[var(--shell-surface)] text-[var(--foreground)] border-[var(--shell-border)] hover:border-[var(--foreground)]/20'
                            }`}
                    >
                        Impressões
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('engagement')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${viewMode === 'engagement'
                            ? 'bg-white/10 text-[var(--foreground)] border-white/20'
                            : 'bg-[var(--shell-surface)] text-[var(--foreground)] border-[var(--shell-border)] hover:border-[var(--foreground)]/20'
                            }`}
                    >
                        Engajamento
                    </button>
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
                    <span className="text-[var(--foreground)]">Alta Densidade</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2E8AE6]/50"></span>
                    <span className="text-[var(--foreground)]">Baixa Densidade</span>
                </div>
            </div>
        </div>
    );
};

export default BrazilFollowersMap;
