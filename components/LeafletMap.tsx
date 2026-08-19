'use client';

import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  Tooltip,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Consignment, ConsignmentStatus } from '@/lib/types';

// ── Fix Leaflet default icon paths in Next.js ─────────────────────────────
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// ── Surat Hub Coordinates ────────────────────────────────────────────────
export const SURAT_HUB_COORDS: [number, number] = [21.1702, 72.8311];

// ── Custom Truck Marker (Glowing Blue Dot with Pulse Halo) ─────────────────
function createTruckIcon(status: ConsignmentStatus, isResolved: boolean): L.DivIcon {
  const effectiveStatus = isResolved ? 'ON TRACK' : status;
  const isCrit = effectiveStatus === 'CRITICAL';
  const isMon = effectiveStatus === 'MONITORING';

  const glowColor = isCrit ? '#ef4444' : isMon ? '#f59e0b' : '#38bdf8';
  const dotColor = isCrit ? '#ef4444' : isMon ? '#f59e0b' : '#0284c7';
  const ringColor = isCrit ? 'rgba(239,68,68,0.4)' : isMon ? 'rgba(245,158,11,0.4)' : 'rgba(56,189,248,0.45)';

  return L.divIcon({
    className: 'truck-marker-icon',
    html: `
      <div class="glowing-truck-marker" title="Truck Location (${effectiveStatus})">
        <!-- Radar Pulsing Halo -->
        <div class="radar-halo" style="background: ${ringColor}; border: 1.5px solid ${glowColor};"></div>
        
        <!-- Outer Glow Ring -->
        <div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(15, 23, 42, 0.9);
          border: 2px solid ${glowColor};
          box-shadow: 0 0 16px ${glowColor}, inset 0 0 8px rgba(0,0,0,0.8);
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 2;
        ">
          <!-- Inner Glowing Core Dot -->
          <div style="
            width: 14px; height: 14px; border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #ffffff 0%, ${dotColor} 70%);
            box-shadow: 0 0 10px ${glowColor};
          "></div>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

// ── Hazard Marker (Pulsing Red Ring for Hazard Location) ───────────────────
function createHazardIcon(): L.DivIcon {
  return L.divIcon({
    className: 'hazard-marker-icon',
    html: `
      <div class="hazard-pulsing-marker" title="Incident Hazard Location">
        <!-- Multi-layer animated radar waves -->
        <div class="hazard-pulse-ring-1"></div>
        <div class="hazard-pulse-ring-2"></div>
        
        <!-- Central Danger Badge -->
        <div style="
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(15, 23, 42, 0.92);
          border: 2px solid #ef4444;
          box-shadow: 0 0 18px rgba(239, 68, 68, 0.8), inset 0 0 10px rgba(239, 68, 68, 0.3);
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 3;
          backdrop-filter: blur(8px);
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="#ef4444" opacity="0.9"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// ── Amber Diamond Marker (Logistics Hub / Surat Cross-Dock Relay) ─────────
function createLogisticsHubIcon(isHighlighted: boolean = true): L.DivIcon {
  return L.divIcon({
    className: 'hub-marker-icon',
    html: `
      <div class="amber-diamond-marker" title="Surat Cross-Dock Facility (Relay Point)">
        <!-- Pulsing diamond aura -->
        <div class="diamond-halo"></div>
        
        <!-- Rotated Diamond Container -->
        <div style="
          width: 32px; height: 32px;
          transform: rotate(45deg);
          border-radius: 6px;
          background: rgba(15, 23, 42, 0.95);
          border: 2px solid #f59e0b;
          box-shadow: 0 0 ${isHighlighted ? '20px' : '10px'} rgba(245, 158, 11, 0.8), inset 0 0 8px rgba(245, 158, 11, 0.35);
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 3;
          backdrop-filter: blur(8px);
        ">
          <!-- Unrotated Inner Hub Icon -->
          <div style="transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="22.08" x2="12" y2="12" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

// ── Resolved Checkpoint Marker ────────────────────────────────────────────
function createCheckpointIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 34px; height: 34px; border-radius: 50%;
        background: rgba(15, 23, 42, 0.92);
        border: 2px solid #10b981;
        box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(8px);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17l-5-5" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

// ── Origin / Destination Endpoint Markers ─────────────────────────────────
function createEndpointIcon(type: 'origin' | 'destination'): L.DivIcon {
  const isOrigin = type === 'origin';
  const color = isOrigin ? '#38bdf8' : '#c084fc';
  const label = isOrigin ? 'O' : 'D';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 28px; height: 28px; border-radius: 50%;
        background: rgba(15, 23, 42, 0.92);
        border: 2px solid ${color};
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 800; color: ${color};
        box-shadow: 0 0 14px ${color}80, 0 4px 8px rgba(0,0,0,0.6);
        backdrop-filter: blur(6px);
      ">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// ── Smooth Map Camera Controller ──────────────────────────────────────────
interface CameraControllerProps {
  incidentCenter: [number, number];
  truckCenter: [number, number];
  destination: [number, number];
  zoom: number;
  isResolved: boolean;
  hoveredStrategyId: 'OPT-1' | 'OPT-2' | null;
  bypassPolyline: [number, number][];
}

function CameraController({
  incidentCenter,
  truckCenter,
  destination,
  zoom,
  isResolved,
  hoveredStrategyId,
  bypassPolyline,
}: CameraControllerProps) {
  const map = useMap();
  const prevKey = useRef<string>('');

  useEffect(() => {
    // Strategy 1 (SH-17 Bypass): Focus on bypass detour corridor
    if (hoveredStrategyId === 'OPT-1' && bypassPolyline.length > 1) {
      const lats = bypassPolyline.map((p) => p[0]);
      const lngs = bypassPolyline.map((p) => p[1]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

      const boundsKey = `OPT-1-${centerLat.toFixed(2)},${centerLng.toFixed(2)}`;
      if (prevKey.current !== boundsKey) {
        map.flyTo([centerLat, centerLng], Math.max(6, zoom - 1), { animate: true, duration: 1.2, easeLinearity: 0.25 });
        prevKey.current = boundsKey;
      }
      return;
    }

    // Strategy 2 (Surat Hub Relay): Focus to encompass Truck, Surat Hub, and Destination comfortably
    if (hoveredStrategyId === 'OPT-2') {
      const boundsKey = `OPT-2-SURAT-VIEW`;
      if (prevKey.current !== boundsKey) {
        map.flyTo([20.0, 73.1], 5, { animate: true, duration: 1.2, easeLinearity: 0.25 });
        prevKey.current = boundsKey;
      }
      return;
    }

    // Default target: incident if active incident, truck if resolved
    const target: [number, number] = isResolved ? truckCenter : incidentCenter;
    const defaultKey = `DEFAULT-${target[0]},${target[1]},${zoom},${isResolved}`;

    if (prevKey.current !== defaultKey) {
      map.flyTo(target, zoom, { animate: true, duration: 1.2, easeLinearity: 0.25 });
      prevKey.current = defaultKey;
    }
  }, [incidentCenter, truckCenter, destination, zoom, isResolved, hoveredStrategyId, bypassPolyline, map]);

  return null;
}

// ── Main Leaflet Map Component ────────────────────────────────────────────
export interface LeafletMapProps {
  consignment: Consignment;
  isResolved: boolean;
  hoveredStrategyId?: 'OPT-1' | 'OPT-2' | null;
}

export default function LeafletMap({
  consignment,
  isResolved,
  hoveredStrategyId = null,
}: LeafletMapProps) {
  // Compute zoom from route extent
  const latDiff = Math.abs(consignment.origin.lat - consignment.destination.lat);
  const lngDiff = Math.abs(consignment.origin.lng - consignment.destination.lng);
  const maxDiff = Math.max(latDiff, lngDiff);
  const zoom = maxDiff > 8 ? 6 : maxDiff > 4 ? 7 : 8;

  const incidentCenter: [number, number] = [consignment.hazardPoint.lat, consignment.hazardPoint.lng];
  const truckCenter: [number, number] = [consignment.truckPosition.lat, consignment.truckPosition.lng];
  const destCoords: [number, number] = [consignment.destination.lat, consignment.destination.lng];

  // Initial map center
  const initialCenter: [number, number] = isResolved ? truckCenter : incidentCenter;

  const fullPolyline: [number, number][] = useMemo(
    () => consignment.polyline.map((p) => [p.lat, p.lng]),
    [consignment.polyline]
  );

  const bypassPolyline: [number, number][] = useMemo(
    () => consignment.bypassPolyline.map((p) => [p.lat, p.lng]),
    [consignment.bypassPolyline]
  );

  // Relay polyline for Strategy 2 (Surat Hub Relay corridor)
  const suratRelayPolyline: [number, number][] = useMemo(() => {
    return [
      truckCenter,
      SURAT_HUB_COORDS,
      destCoords,
    ];
  }, [truckCenter, destCoords]);

  // Split full polyline into travelled vs blocked-remaining
  const truckIdx = Math.max(
    0,
    fullPolyline.findIndex(
      ([lat, lng]) =>
        Math.abs(lat - consignment.truckPosition.lat) < 0.12 &&
        Math.abs(lng - consignment.truckPosition.lng) < 0.12
    )
  );
  const travelled: [number, number][] = fullPolyline.slice(0, truckIdx + 1);
  const blockedRemaining: [number, number][] = fullPolyline.slice(truckIdx);

  const isCriticalOrMonitoring = consignment.status === 'CRITICAL' || consignment.status === 'MONITORING';

  // Marker icons
  const truckIcon = useMemo(() => createTruckIcon(consignment.status, isResolved), [consignment.status, isResolved]);
  const hazardIcon = useMemo(() => createHazardIcon(), []);
  const logisticsHubIcon = useMemo(() => createLogisticsHubIcon(true), []);
  const checkpointIcon = useMemo(() => createCheckpointIcon(), []);
  const originIcon = useMemo(() => createEndpointIcon('origin'), []);
  const destIcon = useMemo(() => createEndpointIcon('destination'), []);

  return (
    <div style={{ isolation: 'isolate' }} className="w-full h-full">
    <MapContainer
      center={initialCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      className="w-full h-full rounded-2xl"
      zoomControl={true}
    >
      {/* ── CartoDB Dark Matter Tiles ── */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      {/* ── Smooth Camera Controller ── */}
      <CameraController
        incidentCenter={incidentCenter}
        truckCenter={truckCenter}
        destination={destCoords}
        zoom={zoom}
        isResolved={isResolved}
        hoveredStrategyId={hoveredStrategyId}
        bypassPolyline={bypassPolyline}
      />

      {/* ── BASELINE INCIDENT MODE ─────────────────────────────────────── */}
      {!isResolved && (
        <>
          {/* Ghost full route */}
          <Polyline
            positions={fullPolyline}
            pathOptions={{ color: '#334155', weight: 2, opacity: 0.35, dashArray: '4 6' }}
          />

          {/* Travelled section */}
          {travelled.length > 1 && (
            <Polyline
              positions={travelled}
              pathOptions={{ color: '#64748b', weight: 3, opacity: 0.65, dashArray: '6 4' }}
            />
          )}

          {/* Blocked remaining route — red dashed for CRITICAL/MONITORING */}
          {blockedRemaining.length > 1 && (
            <Polyline
              positions={blockedRemaining}
              pathOptions={
                isCriticalOrMonitoring
                  ? { color: '#ef4444', weight: 3.5, opacity: 0.75, dashArray: '8 5' }
                  : { color: '#38bdf8', weight: 3.5, opacity: 0.85 }
              }
            />
          )}

          {/* Pulsating hazard zone circles — for CRITICAL/MONITORING */}
          {isCriticalOrMonitoring && (
            <>
              <Circle
                center={incidentCenter}
                radius={consignment.incidentRadius * 1.6}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.05,
                  weight: 1,
                  opacity: 0.25,
                  dashArray: '6 4',
                  className: 'hazard-circle-outer',
                }}
              />
              <Circle
                center={incidentCenter}
                radius={consignment.incidentRadius}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.12,
                  weight: 2,
                  opacity: 0.6,
                  className: 'hazard-circle-inner',
                }}
              />
            </>
          )}

          {/* Pulsing red hazard marker */}
          {isCriticalOrMonitoring && (
            <Marker position={incidentCenter} icon={hazardIcon}>
              <Tooltip direction="top" className="dark-glass-tooltip">
                <div className="flex items-center gap-1.5 font-bold text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Corridor Hazard Zone ({consignment.status})
                </div>
              </Tooltip>
            </Marker>
          )}
        </>
      )}

      {/* ── RESOLVED MODE ─────────────────────────────────────────────── */}
      {isResolved && (
        <>
          {/* Original route — faint grey */}
          <Polyline
            positions={fullPolyline}
            pathOptions={{ color: '#1e293b', weight: 2, opacity: 0.35, dashArray: '4 8' }}
          />

          {/* Travelled section */}
          {travelled.length > 1 && (
            <Polyline
              positions={travelled}
              pathOptions={{ color: '#64748b', weight: 3, opacity: 0.5, dashArray: '6 4' }}
            />
          )}

          {/* Live Bypass Route (Resolved) */}
          {bypassPolyline.length > 1 && (
            <>
              <Polyline
                positions={bypassPolyline}
                pathOptions={{ color: '#10b981', weight: 8, opacity: 0.2 }}
              />
              <Polyline
                positions={bypassPolyline}
                pathOptions={{ color: '#10b981', weight: 4, opacity: 0.95 }}
              />
            </>
          )}

          {/* Checkpoint resolved marker at hazard point */}
          <Marker position={incidentCenter} icon={checkpointIcon}>
            <Tooltip direction="top" className="emerald-glass-tooltip">
              <div className="flex items-center gap-1 font-semibold text-emerald-300">
                ✓ Clearance Protocol Active
              </div>
            </Tooltip>
          </Marker>
        </>
      )}

      {/* ── DYNAMIC STRATEGY 1: SH-17 BYPASS HOVER / SELECTION ─────────── */}
      {!isResolved && hoveredStrategyId === 'OPT-1' && bypassPolyline.length > 1 && (
        <>
          {/* Emerald glow underlay */}
          <Polyline
            positions={bypassPolyline}
            pathOptions={{
              color: '#10b981',
              weight: 8,
              opacity: 0.28,
            }}
          />
          {/* Secondary dashed emerald green polyline: #10b981, dashArray: '6, 8', weight: 4 */}
          <Polyline
            positions={bypassPolyline}
            pathOptions={{
              color: '#10b981',
              dashArray: '6, 8',
              weight: 4,
              opacity: 0.95,
            }}
          />
          {/* Marker label at detour apex */}
          {bypassPolyline[Math.floor(bypassPolyline.length / 2)] && (
            <Marker
              position={bypassPolyline[Math.floor(bypassPolyline.length / 2)]}
              icon={checkpointIcon}
            >
              <Tooltip permanent direction="top" className="emerald-glass-tooltip">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Strategy 1: SH-17 Bypass Detour
                </div>
              </Tooltip>
            </Marker>
          )}
        </>
      )}

      {/* ── DYNAMIC STRATEGY 2: SURAT HUB RELAY HOVER / SELECTION ──────── */}
      {!isResolved && hoveredStrategyId === 'OPT-2' && (
        <>
          {/* Relay corridor polyline */}
          <Polyline
            positions={suratRelayPolyline}
            pathOptions={{
              color: '#f59e0b',
              dashArray: '6, 6',
              weight: 3.5,
              opacity: 0.85,
            }}
          />
          {/* Dedicated Amber Diamond Logistics Hub Marker */}
          <Marker position={SURAT_HUB_COORDS} icon={logisticsHubIcon}>
            <Tooltip permanent direction="top" className="dark-glass-tooltip">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Surat Cross-Dock Facility (Relay Point)
              </div>
            </Tooltip>
          </Marker>
        </>
      )}

      {/* ── Common Markers ─────────────────────────────────────────────── */}
      {/* Origin */}
      <Marker position={[consignment.origin.lat, consignment.origin.lng]} icon={originIcon}>
        <Tooltip direction="bottom" className="dark-glass-tooltip">
          <span className="font-medium text-slate-200">Origin: {consignment.origin.label ?? 'Origin'}</span>
        </Tooltip>
      </Marker>

      {/* Destination */}
      <Marker position={[consignment.destination.lat, consignment.destination.lng]} icon={destIcon}>
        <Tooltip direction="bottom" className="dark-glass-tooltip">
          <span className="font-medium text-slate-200">Dest: {consignment.destination.label ?? 'Destination'}</span>
        </Tooltip>
      </Marker>

      {/* Truck Location */}
      <Marker position={truckCenter} icon={truckIcon}>
        <Tooltip direction="top" className="dark-glass-tooltip">
          <div className="text-xs">
            <span className="font-bold text-sky-400">{consignment.id}</span>
            <span className="text-slate-400 ml-1">· {consignment.cargo}</span>
          </div>
        </Tooltip>
      </Marker>
    </MapContainer>
    </div>
  );
}
