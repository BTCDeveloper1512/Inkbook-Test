import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, ExternalLink } from "lucide-react";

// Custom black/white marker matching the app style
const customIcon = new L.DivIcon({
  html: `
    <div style="
      width: 36px; height: 36px;
      background: #18181b;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
    "></div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
  className: "",
});

// Smooth re-center when coords change
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function StudioMap({ address, city, studioName, hidden = false }) {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const fetched = useRef(false);

  useEffect(() => {
    if (!address && !city) { setStatus("error"); return; }
    if (fetched.current) return;
    fetched.current = true;

    const query = encodeURIComponent(`${address || ""}, ${city || ""}`);
    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { "Accept-Language": "de", "User-Agent": "StudioOS-App/1.0" },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.[0]) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          setStatus("ok");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [address, city]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address || ""}, ${city || ""}`)}`;

  if (status === "loading") {
    return (
      <div className="w-full rounded-2xl bg-zinc-100 animate-pulse flex items-center justify-center" style={{ height: 220 }}>
        <div className="flex items-center gap-2 text-zinc-400 font-inter text-sm">
          <MapPin size={16} strokeWidth={1.5} className="animate-bounce" />
          Karte wird geladen…
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center gap-2 py-8">
        <MapPin size={22} className="text-zinc-300" strokeWidth={1.5} />
        <p className="text-xs text-zinc-400 font-inter">Karte nicht verfügbar</p>
        {(address || city) && (
          <a href={mapsUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-600 underline underline-offset-2 font-inter hover:text-zinc-900 transition-colors">
            In Google Maps öffnen <ExternalLink size={11} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-zinc-100"
      style={{ height: 220, visibility: hidden ? "hidden" : "visible", pointerEvents: hidden ? "none" : "auto" }}
    >
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <Recenter lat={coords.lat} lng={coords.lng} />
        <Marker position={[coords.lat, coords.lng]} icon={customIcon}>
          <Popup className="inkbook-popup">
            <span className="font-inter font-semibold text-zinc-900 text-sm">{studioName}</span>
            <br />
            <span className="font-inter text-zinc-500 text-xs">{address}, {city}</span>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Google Maps link overlay */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2.5 right-2.5 z-[999] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-zinc-200 px-2.5 py-1.5 rounded-full text-[11px] font-inter text-zinc-600 hover:text-zinc-900 hover:bg-white transition-all shadow-sm"
        data-testid="open-google-maps-btn"
      >
        <ExternalLink size={10} strokeWidth={2} />
        In Maps öffnen
      </a>
    </div>
  );
}
