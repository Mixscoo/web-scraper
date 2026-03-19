"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { COUNTRIES } from "@/lib/constants";

// Dynamic import — Leaflet does not work with SSR
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

export default function MapPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Fix Leaflet default marker icon paths (broken by bundlers)
    import("leaflet").then((L) => {
      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = DefaultIcon;
      setMounted(true);
    });
  }, []);

  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Map View</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Visual overview of job opportunities across the Middle East.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card overflow-hidden"
          style={{ height: "calc(100vh - 280px)", minHeight: 500 }}
        >
          {!mounted ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-amber-400" />
            </div>
          ) : (
            <MapContainer
              center={[27, 45]}
              zoom={5}
              className="h-full w-full z-0"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {COUNTRIES.map((country) => (
                <Marker
                  key={country.code}
                  position={[country.coordinates.lat, country.coordinates.lng]}
                >
                  <Popup>
                    <div className="text-center">
                      <img
                        src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                        alt=""
                        width={32}
                        height={24}
                        style={{ display: "inline-block" }}
                      />
                      <p className="font-semibold mt-1">{country.name}</p>
                      <a
                        href={`/jobs?country=${encodeURIComponent(country.name)}`}
                        className="text-indigo-600 dark:text-amber-400 text-sm hover:underline mt-1 block"
                      >
                        Browse jobs →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
