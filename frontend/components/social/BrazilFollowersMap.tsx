import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Scene, HeatmapLayer, PointLayer, PolygonLayer } from '@antv/l7';
import { Map } from '@antv/l7-maps';

// Approximate coordinates for Brazil's major state centers to anchor the heatmap
const STATE_LOCATIONS: Record<string, { lat: number; lng: number; intensity: number }> = {
    'SP': { lat: -23.55, lng: -46.63, intensity: 10 },
    'RJ': { lat: -22.90, lng: -43.17, intensity: 9 },
    'MG': { lat: -19.91, lng: -43.93, intensity: 8 },
    'DF': { lat: -15.78, lng: -47.92, intensity: 7 },
    'BA': { lat: -12.97, lng: -38.50, intensity: 6 },
    'RS': { lat: -30.03, lng: -51.22, intensity: 5 },
    'PE': { lat: -8.04, lng: -34.87, intensity: 5 },
    'CE': { lat: -3.71, lng: -38.54, intensity: 4 },
    'PA': { lat: -1.45, lng: -48.50, intensity: 4 },
    'AM': { lat: -3.10, lng: -60.02, intensity: 3 },
    'GO': { lat: -16.68, lng: -49.26, intensity: 5 },
    'PR': { lat: -25.42, lng: -49.27, intensity: 5 },
    'SC': { lat: -27.59, lng: -48.54, intensity: 4 },
    'ES': { lat: -20.31, lng: -40.33, intensity: 4 },
    'MA': { lat: -2.53, lng: -44.30, intensity: 3 },
    'MT': { lat: -15.60, lng: -56.09, intensity: 3 },
    'MS': { lat: -20.46, lng: -54.62, intensity: 3 },
    'RN': { lat: -5.79, lng: -35.20, intensity: 3 },
    'PB': { lat: -7.11, lng: -34.86, intensity: 3 },
    'AL': { lat: -9.66, lng: -35.73, intensity: 2 },
    'SE': { lat: -10.94, lng: -37.07, intensity: 2 },
    'PI': { lat: -5.09, lng: -42.80, intensity: 2 },
    'TO': { lat: -10.17, lng: -48.33, intensity: 2 },
    'RO': { lat: -8.76, lng: -63.90, intensity: 2 },
    'AC': { lat: -9.97, lng: -67.82, intensity: 1 },
    'AP': { lat: 0.03, lng: -51.06, intensity: 1 },
    'RR': { lat: 2.82, lng: -60.67, intensity: 1 },
};

const BrazilFollowersMap = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<Scene | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark, will update on mount

    // Theme Detection
    useEffect(() => {
        // Function to check theme
        const checkTheme = () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            setIsDarkMode(isDark);
        };

        // Initial check
        checkTheme();

        // Observer for theme changes
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, []);

    // Generate heatmap data points based on state intensity
    const mapData = useMemo(() => {
        const points: Array<{ lat: number; lng: number; value: number }> = [];

        Object.values(STATE_LOCATIONS).forEach(loc => {
            // Add core point
            points.push({ ...loc, value: loc.intensity * 10 });

            // Add scattered points around the center for heatmap spread
            const count = loc.intensity * 20; // More points for higher intensity
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 2.5; // Spread radius in degrees approx
                // Gaussian-like distribution (center weighted)
                const r = radius * (Math.random() + Math.random()) / 2;

                points.push({
                    lat: loc.lat + (Math.random() - 0.5) * r,
                    lng: loc.lng + (Math.random() - 0.5) * r,
                    value: Math.random() * loc.intensity
                });
            }
        });
        return {
            type: 'FeatureCollection', features: points.map(p => ({
                type: 'Feature',
                properties: { value: p.value },
                geometry: { type: 'Point', coordinates: [p.lng, p.lat] }
            }))
        };
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        // Cleanup previous scene if exists to allow full re-render with new theme colors
        if (sceneRef.current) {
            sceneRef.current.destroy();
        }

        // Define colors based on theme
        // Light Mode: Light Gray states, Darker Gray borders
        // Dark Mode: Dark Gray states, Zinc borders
        const stateFillColor = isDarkMode ? '#1e1e1e' : '#e4e4e7';
        const stateStrokeColor = isDarkMode ? '#3f3f46' : '#d4d4d8';
        const stateHoverColor = isDarkMode ? '#27272a' : '#d4d4d8';

        // Initialize Scene with a Blank Map (we will draw GeoJSON)
        const scene = new Scene({
            id: containerRef.current.id,
            map: new Map({
                center: [-50, -15], // Approximate center of Brazil
                pitch: 0,
                style: 'blank', // No tiles, we draw our own world
                zoom: 3,
                minZoom: 2,
                maxZoom: 10,
                // Using style: 'blank' avoids the need for external tiles.
                // If tiles are needed, provide a token via env or props.
                // token: '...' 
            }),
            logoVisible: false,
        });

        sceneRef.current = scene;

        scene.on('loaded', async () => {
            // 0. Fetch Brazil GeoJSON for the Base Map
            try {
                // Check if we have cached data to avoid refetching
                let brazilGeoJSON;
                const cachedData = sessionStorage.getItem('brazil-states-geojson');
                if (cachedData) {
                    brazilGeoJSON = JSON.parse(cachedData);
                } else {
                    const response = await fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson');
                    brazilGeoJSON = await response.json();
                    sessionStorage.setItem('brazil-states-geojson', JSON.stringify(brazilGeoJSON));
                }

                // 1. Base Layer: Brazil States Shapes
                const brazilLayer = new PolygonLayer({})
                    .source(brazilGeoJSON)
                    .shape('fill')
                    .color(stateFillColor)
                    .style({
                        opacity: 1,
                        stroke: stateStrokeColor,
                        strokeWidth: 1
                    });

                scene.addLayer(brazilLayer);

                // 1.1 Highlight/Hover Layer
                const highlightLayer = new PolygonLayer({})
                    .source(brazilGeoJSON)
                    .shape('line')
                    .color(stateHoverColor)
                    .style({
                        opacity: 0.5
                    });
                scene.addLayer(highlightLayer);

                // 2. Heatmap Layer using parsed data
                const heatmapLayer = new HeatmapLayer({})
                    .source(mapData)
                    .shape('heatmap')
                    .size('value', [0, 1.0]) // Size scaling based on value
                    .style({
                        intensity: 3,
                        radius: 20,
                        opacity: 0.8, // Slightly less opaque to see states better
                        rampColors: {
                            colors: [
                                'rgba(46, 138, 230, 0)', // Transparent start
                                '#2E8AE6', // Light Blue (Low)
                                '#69D1AB', // Cyan/Green
                                '#DAF291', // Yellow-Green
                                '#FFD85C', // Orange
                                '#FF9D4D', // Red-Orange
                                '#FF6B3B', // Red (High)
                            ],
                            positions: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0],
                        },
                    });

                scene.addLayer(heatmapLayer);

                // 3. Point Layer for Major Cities (Pulsing Effect)
                const cityData = [
                    { name: 'São Paulo', lat: -23.55, lng: -46.63, value: 100 },
                    { name: 'Rio de Janeiro', lat: -22.90, lng: -43.17, value: 80 },
                    { name: 'Brasília', lat: -15.78, lng: -47.92, value: 60 }
                ];

                const pointLayer = new PointLayer()
                    .source(cityData, {
                        parser: {
                            type: 'json',
                            x: 'lng',
                            y: 'lat'
                        }
                    })
                    .shape('circle')
                    .size('value', [10, 20])
                    .color('#3b82f6')
                    .style({
                        opacity: 0.6,
                        strokeWidth: 2,
                        stroke: isDarkMode ? '#fff' : '#fff' // Always white stroke for contrast against blue dot
                    })
                    .animate(true);

                scene.addLayer(pointLayer);

            } catch (error) {
                console.error("Failed to fetch Brazil GeoJSON:", error);
            }
        });

        return () => {
            if (sceneRef.current) {
                sceneRef.current.destroy();
                sceneRef.current = null;
            }
        };
    }, [mapData, isDarkMode]); // Re-run when detection changes

    return (
        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl overflow-hidden flex flex-col h-full relative lg:row-span-2 min-h-[400px]">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 bg-gradient-to-b from-[var(--shell-surface)] to-transparent pointer-events-none">
                <h3 className="text-lg font-black italic tracking-tight text-blue-500">Mapa de Calor</h3>
                <p className="text-xs text-zinc-500 mt-1">Concentração de seguidores por região</p>

                {/* Stats Overlay */}
                <div className="flex gap-4 mt-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Top Região</span>
                        <span className="text-sm font-black text-[var(--foreground)]">Sudeste (48%)</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Top Estado</span>
                        <span className="text-sm font-black text-[var(--foreground)]">São Paulo</span>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div
                id="l7-map-container"
                ref={containerRef}
                className="w-full h-full flex-1 relative z-0"
                style={{
                    minHeight: '400px',
                    // Transparent bg to show parent color, but fallback if needed
                    backgroundColor: 'transparent'
                }}
            />

            {/* Legend */}
            <div className="absolute bottom-6 right-6 bg-[var(--shell-surface)]/90 backdrop-blur border border-[var(--shell-border)] p-2 rounded-lg text-[10px] z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#FF6B3B] animate-pulse"></span>
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
