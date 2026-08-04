import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { GeoJSON as LeafletGeoJSON, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Loader2 } from "lucide-react";

export type IndicadorUF = {
  uf: string;
  lixoes_ativos: number;
  volume_estocado_m3_total: number;
  volume_removido_m3_total: number;
  taxa_reducao_pct: number;
  volume_reciclado_ton_uf: number;
};

type IndicadorKey = keyof Omit<IndicadorUF, "uf">;

const INDICADORES: { key: IndicadorKey; label: string; unidade: string; escala: string[] }[] = [
  {
    key: "lixoes_ativos",
    label: "Lixões ativos",
    unidade: "áreas",
    escala: ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"],
  },
  {
    key: "volume_estocado_m3_total",
    label: "Volume estocado (m³)",
    unidade: "m³",
    escala: ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d", "#a63603"],
  },
  {
    key: "volume_removido_m3_total",
    label: "Volume removido (m³)",
    unidade: "m³",
    escala: ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
  },
  {
    key: "taxa_reducao_pct",
    label: "Taxa de redução (%)",
    unidade: "%",
    escala: ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"],
  },
  {
    key: "volume_reciclado_ton_uf",
    label: "Volume reciclado (ton)",
    unidade: "ton",
    escala: ["#edf8fb", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c"],
  },
];

const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);

type Props = { indicadores: IndicadorUF[]; onSelectUF?: (uf: string) => void };

const MapaRegional = ({ indicadores, onSelectUF }: Props) => {
  const [indicador, setIndicador] = useState<IndicadorKey>("lixoes_ativos");
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletGeoJSON | null>(null);

  const conf = INDICADORES.find((i) => i.key === indicador)!;

  const porUF = useMemo(() => {
    const m = new Map<string, IndicadorUF>();
    indicadores.forEach((i) => m.set(i.uf, i));
    return m;
  }, [indicadores]);

  const max = useMemo(
    () => Math.max(1, ...indicadores.map((i) => Number(i[indicador]) || 0)),
    [indicadores, indicador],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/brazil-states.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => !cancelled && setGeojson(json))
      .catch((e) => !cancelled && setErro(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const brazilBounds = L.latLngBounds([-33.75, -73.99], [5.27, -34.79]);
    const map = L.map(containerRef.current, {
      center: [-14.235, -51.9253],
      zoom: 4,
      minZoom: 3,
      maxZoom: 8,
      maxBounds: brazilBounds,
      maxBoundsViscosity: 1,
      attributionControl: true,
    });
    map.fitBounds(brazilBounds);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }

    const cor = (valor: number) => {
      if (!valor) return "#e5e7eb";
      const idx = Math.min(conf.escala.length - 1, Math.floor((valor / max) * conf.escala.length));
      return conf.escala[idx];
    };

    const layer = L.geoJSON(geojson, {
      style: (feature) => {
        const uf = String(feature?.properties?.sigla ?? "");
        const valor = Number(porUF.get(uf)?.[indicador] ?? 0);
        return { fillColor: cor(valor), weight: 1, color: "#ffffff", fillOpacity: 0.85 };
      },
      onEachFeature: (feature, lyr) => {
        const uf = String(feature?.properties?.sigla ?? "");
        const nome = String(feature?.properties?.name ?? uf);
        const dado = porUF.get(uf);
        const linhas = dado
          ? INDICADORES.map(
              (i) => `<div style="font-size:11px">${i.label}: <b>${fmt(Number(dado[i.key]) || 0)}</b></div>`,
            ).join("")
          : `<div style="font-size:11px;color:#666">Sem indicadores para este estado</div>`;
        lyr.bindPopup(`<div><div style="font-weight:600">${nome} (${uf})</div>${linhas}</div>`);
        lyr.on("mouseover", () => (lyr as L.Path).setStyle({ weight: 2.5, color: "#111827" }));
        lyr.on("mouseout", () => (lyr as L.Path).setStyle({ weight: 1, color: "#ffffff" }));
        lyr.on("click", () => onSelectUF?.(uf));
      },
    }).addTo(map);

    layerRef.current = layer;
    setTimeout(() => map.invalidateSize(), 0);
  }, [geojson, porUF, indicador, max, conf, onSelectUF]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Mapa regional de indicadores
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Camada coroplética por unidade federativa, no padrão de portais geoespaciais (GeoNode / GeoNetwork).
            Clique em um estado para filtrar os municípios monitorados.
          </p>
        </div>
        <div className="min-w-[240px]">
          <Select value={indicador} onValueChange={(v) => setIndicador(v as IndicadorKey)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INDICADORES.map((i) => (
                <SelectItem key={i.key} value={i.key}>{i.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {erro ? (
          <div className="h-[420px] rounded-md border border-dashed flex items-center justify-center text-sm text-muted-foreground">
            Não foi possível carregar a malha territorial ({erro}).
          </div>
        ) : !geojson ? (
          <div className="h-[420px] rounded-md border flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando malha territorial…
          </div>
        ) : null}
        <div
          ref={containerRef}
          aria-label="Mapa coroplético de indicadores por estado"
          className="rounded-md overflow-hidden border"
          style={{ height: 420, width: "100%", display: geojson && !erro ? "block" : "none" }}
        />
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>{conf.label} ({conf.unidade}):</span>
          <span>0</span>
          {conf.escala.map((c) => (
            <span key={c} className="inline-block h-3 w-8 rounded-sm" style={{ background: c }} />
          ))}
          <span>{fmt(max)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapaRegional;
