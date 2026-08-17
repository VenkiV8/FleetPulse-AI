'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
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

// ── Custom Truck Marker ───────────────────────────────────────────────────
function createTruckIcon(status: ConsignmentStatus, isResolved: boolean): L.DivIcon {
  const effectiveStatus = isResolved ? 'ON TRACK' : status;
  const statusClass = effectiveStatus === 'CRITICAL' ? 'critical' : effectiveStatus === 'MONITORING' ? 'monitoring' : 'ontrack';
  const color = effectiveStatus === 'CRITICAL' ? '#ef4444' : effectiveStatus === 'MONITORING' ? '#f59e0b' : '#22c55e';

  return L.divIcon({
    className: 'truck-marker-icon',
    html: `
      <div class="truck-marker-pulse ${statusClass}" title="${effectiveStatus}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 3h15v13H1z" fill="${color}" opacity="0.9"/>
          <path d="M16 8h4l3 3v5h-7V8z" fill="${color}" opacity="0.7"/>
          <circle cx="5.5" cy="18.5" r="2.5" fill="${color}"/>
          <circle cx="18.5" cy="18.5" r="2.5" fill="${color}"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// ── Hazard / Incident Marker (shown only when NOT resolved) ───────────────
function createHazardIcon(): L.DivIcon {
  return L.divIcon({
    className: 'hazard-marker-icon',
    html: `
      <div style="position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(239,68,68,0.12);animation:pulse-ring 2s infinite;"></div>
        <div style="
          width:34px;height:34px;border-radius:50%;
          background:rgba(239,68,68,0.15);
          border:2px solid rgba(239,68,68,0.6);
          display:flex;align-items:center;justify-content:center;
          backdrop-filter:blur(4px);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="#ef4444" opacity="0.85"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

// ── Resolved Checkpoint Marker ────────────────────────────────────────────
function createCheckpointIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:rgba(34,197,94,0.15);
        border:2px solid rgba(34,197,94,0.7);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 12px rgba(34,197,94,0.3);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17l-5-5" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// ── Origin / Destination Endpoint Markers ─────────────────────────────────
function createEndpointIcon(type: 'origin' | 'destination'): L.DivIcon {
  const bg = type === 'origin' ? '#3b82f6' : '#a855f7';
  const label = type === 'origin' ? 'O' : 'D';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:26px;height:26px;border-radius:50%;
        background:${bg};border:2px solid white;
        display:flex;align-items:center;justify-content:center;
        font-size:10px;font-weight:700;color:white;
        box-shadow:0 2px 8px rgba(0,0,0,0.5);
      ">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

// ── Smooth Map Fly-To Controller ──────────────────────────────────────────
// On incident mode → flies to hazard point. On resolved → flies to truck.
interface MapFlyToProps {
  incidentCenter: [number, number];
  truckCenter: [number, number];
  zoom: number;
  isResolved: boolean;
}

function MapFlyTo({ incidentCenter, truckCenter, zoom, isResolved }: MapFlyToProps) {
  const map = useMap();
  const prevTarget = useRef<string>('');

  useEffect(() => {
    const target: [number, number] = isResolved ? truckCenter : incidentCenter;
    const targetKey = `${target[0]},${target[1]},${zoom},${isResolved}`;

    if (prevTarget.current !== targetKey) {
      map.flyTo(target, zoom, { animate: true, duration: 1.4, easeLinearity: 0.25 });
      prevTarget.current = targetKey;
    }
  }, [incidentCenter, truckCenter, zoom, isResolved, map]);

  return null;
}

// ── Main Leaflet Map Component ────────────────────────────────────────────
export interface LeafletMapProps {
  consignment: Consignment;
  isResolved: boolean;
}

export default function LeafletMap({ consignment, isResolved }: LeafletMapProps) {
  // Compute zoom from route extent
  const latDiff = Math.abs(consignment.origin.lat - consignment.destination.lat);
  const lngDiff = Math.abs(consignment.origin.lng - consignment.destination.lng);
  const maxDiff = Math.max(latDiff, lngDiff);
  const zoom = maxDiff > 8 ? 6 : maxDiff > 4 ? 7 : 8;

  const incidentCenter: [number, number] = [consignment.hazardPoint.lat, consignment.hazardPoint.lng];
  const truckCenter: [number, number] = [consignment.truckPosition.lat, consignment.truckPosition.lng];

  // Initial map center: hazard if incident, truck if resolved
  const initialCenter: [number, number] = isResolved ? truckCenter : incidentCenter;

  const fullPolyline: [number, number][] = consignment.polyline.map((p) => [p.lat, p.lng]);
  const bypassPolyline: [number, number][] = consignment.bypassPolyline.map((p) => [p.lat, p.lng]);

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

  const truckIcon = createTruckIcon(consignment.status, isResolved);
  const hazardIcon = createHazardIcon();
  const checkpointIcon = createCheckpointIcon();
  const originIcon = createEndpointIcon('origin');
  const destIcon = createEndpointIcon('destination');

  return (
    <MapContainer
      center={initialCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      className="w-full h-full rounded-xl"
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      {/* Smooth fly-to controller */}
      <MapFlyTo
        incidentCenter={incidentCenter}
        truckCenter={truckCenter}
        zoom={zoom}
        isResolved={isResolved}
      />

      {/* ── INCIDENT MODE ─────────────────────────────────────────────── */}
      {!isResolved && (
        <>
          {/* Ghost full route */}
          <Polyline
            positions={fullPolyline}
            pathOptions={{ color: '#1e3a5f', weight: 2, opacity: 0.3, dashArray: '4 6' }}
          />

          {/* Travelled section */}
          {travelled.length > 1 && (
            <Polyline
              positions={travelled}
              pathOptions={{ color: '#475569', weight: 3, opacity: 0.55, dashArray: '6 4' }}
            />
          )}

          {/* Blocked remaining route — red dashed for CRITICAL/MONITORING */}
          {blockedRemaining.length > 1 && (
            <Polyline
              positions={blockedRemaining}
              pathOptions={
                isCriticalOrMonitoring
                  ? { color: '#ef4444', weight: 3, opacity: 0.65, dashArray: '8 5' }
                  : { color: '#3b82f6', weight: 3.5, opacity: 0.85 }
              }
            />
          )}

          {/* Pulsating hazard zone circle — only for CRITICAL/MONITORING */}
          {isCriticalOrMonitoring && (
            <>
              {/* Outer pulse ring */}
              <Circle
                center={incidentCenter}
                radius={consignment.incidentRadius * 1.6}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.04,
                  weight: 1,
                  opacity: 0.2,
                  dashArray: '6 4',
                  className: 'hazard-circle-outer',
                }}
              />
              {/* Inner fill circle */}
              <Circle
                center={incidentCenter}
                radius={consignment.incidentRadius}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.10,
                  weight: 2,
                  opacity: 0.55,
                  className: 'hazard-circle-inner',
                }}
              />
            </>
          )}

          {/* Hazard marker */}
          {isCriticalOrMonitoring && (
            <Marker position={incidentCenter} icon={hazardIcon} />
          )}
        </>
      )}

      {/* ── RESOLVED MODE ─────────────────────────────────────────────── */}
      {isResolved && (
        <>
          {/* Original route — faint grey to show what was blocked */}
          <Polyline
            positions={fullPolyline}
            pathOptions={{ color: '#334155', weight: 2, opacity: 0.3, dashArray: '4 8' }}
          />

          {/* Travelled section */}
          {travelled.length > 1 && (
            <Polyline
              positions={travelled}
              pathOptions={{ color: '#475569', weight: 3, opacity: 0.5, dashArray: '6 4' }}
            />
          )}

          {/* Green bypass route */}
          {bypassPolyline.length > 1 && (
            <>
              {/* Glow under-layer */}
              <Polyline
                positions={bypassPolyline}
                pathOptions={{ color: '#22c55e', weight: 8, opacity: 0.15 }}
              />
              {/* Main bypass line */}
              <Polyline
                positions={bypassPolyline}
                pathOptions={{ color: '#22c55e', weight: 3.5, opacity: 0.9 }}
              />
            </>
          )}

          {/* Checkpoint resolved marker at hazard point */}
          <Marker position={incidentCenter} icon={checkpointIcon} />
        </>
      )}

      {/* ── Common Elements ─────────────────────────────────────────────── */}
      {/* Origin */}
      <Marker position={[consignment.origin.lat, consignment.origin.lng]} icon={originIcon} />

      {/* Destination */}
      <Marker position={[consignment.destination.lat, consignment.destination.lng]} icon={destIcon} />

      {/* Truck */}
      <Marker position={truckCenter} icon={truckIcon} />
    </MapContainer>
  );
}
