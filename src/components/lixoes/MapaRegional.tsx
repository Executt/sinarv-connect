import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import type { GeoJSON as LeafletGeoJSON, LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Layers, Loader2 } from "lucide-react";
import { useLixoesPnrs } from "./ConformidadePNRS";

export type IndicadorUF = {
  uf: string;
  lixoes_ativos: number;
  volume_estocado_m3_total: number;
  volume_removido_m3_total: number;
  taxa_reducao_pct: number;
  volume_reciclado_ton_uf: number;
};

export type MunicipioPonto = {
  id: string;
  nome: string;
  municipio: string;
  uf: string;
  latitude: number;
  longitude: number;
  status: string;
};

type Conf = {
  key: string;
  grupo: "Indicadores operacionais" | "Conformidade PNRS" | "Roteiro de encerramento" | "Diagnóstico MUNIC 2023";
  label: string;
  unidade: string;
  escala: string[];
  invertido?: boolean;
};

const ESCALA_VERMELHO = ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
const ESCALA_LARANJA = ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d", "#a63603"];
const ESCALA_AZUL = ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"];
const ESCALA_VERDE = ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"];
const ESCALA_TEAL = ["#edf8fb", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c"];
const ESCALA_ROXO = ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f"];

const INDICADORES: Conf[] = [
  { key: "lixoes_ativos", grupo: "Indicadores operacionais", label: "Lixões ativos", unidade: "áreas", escala: ESCALA_VERMELHO },
  { key: "volume_estocado_m3_total", grupo: "Indicadores operacionais", label: "Volume estocado", unidade: "m³", escala: ESCALA_LARANJA },
  { key: "volume_removido_m3_total", grupo: "Indicadores operacionais", label: "Volume removido", unidade: "m³", escala: ESCALA_AZUL },
  { key: "taxa_reducao_pct", grupo: "Indicadores operacionais", label: "Taxa de redução", unidade: "%", escala: ESCALA_VERDE },
  { key: "volume_reciclado_ton_uf", grupo: "Indicadores operacionais", label: "Volume reciclado", unidade: "ton", escala: ESCALA_TEAL },
  { key: "pnrs_vencidos", grupo: "Conformidade PNRS", label: "Áreas com prazo vencido", unidade: "áreas", escala: ESCALA_VERMELHO },
  { key: "pnrs_conformes_pct", grupo: "Conformidade PNRS", label: "Áreas conformes", unidade: "%", escala: ESCALA_VERDE },
  { key: "pnrs_populacao_afetada", grupo: "Conformidade PNRS", label: "População afetada", unidade: "hab.", escala: ESCALA_ROXO },
  { key: "etapas_progresso_pct", grupo: "Roteiro de encerramento", label: "Progresso médio do roteiro", unidade: "%", escala: ESCALA_VERDE },
  { key: "etapas_concluidas", grupo: "Roteiro de encerramento", label: "Etapas concluídas", unidade: "etapas", escala: ESCALA_AZUL },
  { key: "munic_pct_lixao", grupo: "Diagnóstico MUNIC 2023", label: "Municípios com lixão (região)", unidade: "%", escala: ESCALA_VERMELHO },
  { key: "munic_pct_coleta_seletiva", grupo: "Diagnóstico MUNIC 2023", label: "Municípios com coleta seletiva (região)", unidade: "%", escala: ESCALA_VERDE },
];

const REGIAO_UFS: Record<string, string[]> = {
  norte: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
  nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  sudeste: ["ES", "MG", "RJ", "SP"],
  sul: ["PR", "RS", "SC"],
  "centro-oeste": ["DF", "GO", "MT", "MS"],
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const STATUS_COR: Record<string, string> = {
  ativo: "#BB0000",
  em_encerramento: "#E9730C",
  encerrado: "#0A6ED1",
  recuperado: "#107E3E",
};

const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);

type Props = {
  indicadores: IndicadorUF[];
  municipios?: MunicipioPonto[];
  onSelectUF?: (uf: string) => void;
  onSelectMunicipio?: (id: string) => void;
};

const MapaRegional = ({ indicadores, municipios = [], onSelectUF, onSelectMunicipio }: Props) => {
  const [indicador, setIndicador] = useState<string>("lixoes_ativos");
  const [camadaCoropletica, setCamadaCoropletica] = useState(true);
  const [camadaMunicipios, setCamadaMunicipios] = useState(true);
  const [camadaRotulos, setCamadaRotulos] = useState(false);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletGeoJSON | null>(null);
  const pontosRef = useRef<LayerGroup | null>(null);
  const rotulosRef = useRef<LayerGroup | null>(null);

  const { data: pnrs = [] } = useLixoesPnrs();

  const { data: munic = [] } = useQuery({
    queryKey: ["munic-diagnostico-mapa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("munic_diagnostico")
        .select("regiao,pct_lixao,pct_coleta_seletiva,ano_referencia")
        .order("ano_referencia", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as {
        regiao: string;
        pct_lixao: number | null;
        pct_coleta_seletiva: number | null;
      }[];
    },
  });

  const conf = INDICADORES.find((i) => i.key === indicador) ?? INDICADORES[0];

  /** Valores consolidados por UF para todos os indicadores disponíveis. */
  const dadosUF = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    const get = (uf: string) => {
      if (!m.has(uf)) m.set(uf, {});
      return m.get(uf)!;
    };

    indicadores.forEach((i) => {
      const d = get(i.uf);
      d.lixoes_ativos = Number(i.lixoes_ativos) || 0;
      d.volume_estocado_m3_total = Number(i.volume_estocado_m3_total) || 0;
      d.volume_removido_m3_total = Number(i.volume_removido_m3_total) || 0;
      d.taxa_reducao_pct = Number(i.taxa_reducao_pct) || 0;
      d.volume_reciclado_ton_uf = Number(i.volume_reciclado_ton_uf) || 0;
    });

    const agg = new Map<string, { total: number; conformes: number; vencidos: number; pop: number; prog: number; etapas: number }>();
    pnrs.forEach((p) => {
      const a = agg.get(p.uf) ?? { total: 0, conformes: 0, vencidos: 0, pop: 0, prog: 0, etapas: 0 };
      a.total += 1;
      if (p.situacao_pnrs === "conforme") a.conformes += 1;
      if (p.situacao_pnrs === "prazo_vencido") a.vencidos += 1;
      a.pop += Number(p.populacao_municipio ?? 0);
      a.prog += Number(p.progresso_encerramento_pct ?? 0);
      a.etapas += Number(p.etapas_concluidas ?? 0);
      agg.set(p.uf, a);
    });
    agg.forEach((a, uf) => {
      const d = get(uf);
      d.pnrs_vencidos = a.vencidos;
      d.pnrs_conformes_pct = a.total > 0 ? (100 * a.conformes) / a.total : 0;
      d.pnrs_populacao_afetada = a.pop;
      d.etapas_progresso_pct = a.total > 0 ? a.prog / a.total : 0;
      d.etapas_concluidas = a.etapas;
    });

    const porRegiao = new Map<string, { lixao: number; seletiva: number }>();
    munic.forEach((r) => {
      const key = norm(r.regiao);
      if (porRegiao.has(key)) return; // usa o ano mais recente
      porRegiao.set(key, {
        lixao: Number(r.pct_lixao ?? 0),
        seletiva: Number(r.pct_coleta_seletiva ?? 0),
      });
    });
    porRegiao.forEach((v, regiao) => {
      (REGIAO_UFS[regiao] ?? []).forEach((uf) => {
        const d = get(uf);
        d.munic_pct_lixao = v.lixao;
        d.munic_pct_coleta_seletiva = v.seletiva;
      });
    });

    return m;
  }, [indicadores, pnrs, munic]);

  const max = useMemo(() => {
    let m = 0;
    dadosUF.forEach((d) => {
      m = Math.max(m, Number(d[indicador]) || 0);
    });
    return Math.max(1, m);
  }, [dadosUF, indicador]);

  const municipiosPorUF = useMemo(() => {
    const m = new Map<string, MunicipioPonto[]>();
    municipios.forEach((p) => {
      const arr = m.get(p.uf) ?? [];
      arr.push(p);
      m.set(p.uf, arr);
    });
    return m;
  }, [municipios]);

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
      maxZoom: 9,
      maxBounds: brazilBounds,
      maxBoundsViscosity: 1,
      attributionControl: true,
      preferCanvas: false,
    });
    map.fitBounds(brazilBounds);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      pontosRef.current = null;
      rotulosRef.current = null;
    };
  }, []);

  /* Camada coroplética + rótulos */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geojson) return;

    layerRef.current?.remove();
    layerRef.current = null;
    rotulosRef.current?.remove();
    rotulosRef.current = null;

    const cor = (valor: number) => {
      if (!valor) return "#e5e7eb";
      const idx = Math.min(conf.escala.length - 1, Math.floor((valor / max) * conf.escala.length));
      return conf.escala[idx];
    };

    if (camadaCoropletica) {
      const layer = L.geoJSON(geojson, {
        style: (feature) => {
          const uf = String(feature?.properties?.sigla ?? "");
          const valor = Number(dadosUF.get(uf)?.[indicador] ?? 0);
          return { fillColor: cor(valor), weight: 1, color: "#ffffff", fillOpacity: 0.85 };
        },
        onEachFeature: (feature, lyr) => {
          const uf = String(feature?.properties?.sigla ?? "");
          const nome = String(feature?.properties?.name ?? uf);
          const dado = dadosUF.get(uf);
          const linhas = dado
            ? INDICADORES.map(
                (i) => `<div style="font-size:11px">${i.label}: <b>${fmt(Number(dado[i.key]) || 0)}</b> ${i.unidade}</div>`,
              ).join("")
            : `<div style="font-size:11px;color:#666">Sem indicadores para este estado</div>`;
          const qtd = municipiosPorUF.get(uf)?.length ?? 0;
          lyr.bindPopup(
            `<div style="max-height:220px;overflow:auto"><div style="font-weight:600">${nome} (${uf})</div>` +
              `<div style="font-size:11px;color:#666;margin-bottom:4px">${qtd} município(s) monitorado(s)</div>${linhas}</div>`,
          );
          lyr.on("mouseover", () => (lyr as L.Path).setStyle({ weight: 2.5, color: "#111827" }));
          lyr.on("mouseout", () => (lyr as L.Path).setStyle({ weight: 1, color: "#ffffff" }));
          lyr.on("click", () => onSelectUF?.(uf));
        },
      }).addTo(map);
      layerRef.current = layer;
    }

    if (camadaRotulos) {
      const grupo = L.layerGroup();
      (geojson.features ?? []).forEach((f) => {
        const uf = String((f.properties as Record<string, unknown>)?.sigla ?? "");
        if (!uf) return;
        const c = L.geoJSON(f).getBounds().getCenter();
        L.marker(c, {
          interactive: false,
          icon: L.divIcon({
            className: "",
            html: `<span style="font-size:10px;font-weight:700;color:#111827;text-shadow:0 0 3px #fff">${uf}</span>`,
            iconSize: [20, 12],
          }),
        }).addTo(grupo);
      });
      grupo.addTo(map);
      rotulosRef.current = grupo;
    }

    setTimeout(() => map.invalidateSize(), 0);
  }, [geojson, dadosUF, indicador, max, conf, camadaCoropletica, camadaRotulos, municipiosPorUF, onSelectUF]);

  /* Camada de municípios monitorados */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    pontosRef.current?.remove();
    pontosRef.current = null;
    if (!camadaMunicipios) return;

    const grupo = L.layerGroup();
    municipios.forEach((p) => {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const marker = L.circleMarker([lat, lng], {
        radius: 6,
        color: "#ffffff",
        weight: 1.5,
        fillColor: STATUS_COR[p.status] ?? "#6B7280",
        fillOpacity: 0.95,
      });
      marker.bindTooltip(`${p.municipio}/${p.uf} — ${p.nome}`, { direction: "top" });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e as unknown as Event);
        onSelectMunicipio?.(p.id);
      });
      marker.addTo(grupo);
    });
    grupo.addTo(map);
    pontosRef.current = grupo;
  }, [municipios, camadaMunicipios, onSelectMunicipio]);

  const grupos = useMemo(() => {
    const g = new Map<string, Conf[]>();
    INDICADORES.forEach((i) => g.set(i.grupo, [...(g.get(i.grupo) ?? []), i]));
    return Array.from(g.entries());
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Mapa regional de indicadores
          </CardTitle>
          <p className="text-xs text-muted-foreground max-w-xl">
            Camada coroplética por unidade federativa, no padrão de portais geoespaciais (GeoNode / GeoNetwork).
            Alterne a perspectiva entre indicadores operacionais, conformidade PNRS, Roteiro de Encerramento e
            Diagnóstico MUNIC 2023. Clique num estado para filtrar e num município para abrir o painel de detalhes.
          </p>
        </div>
        <div className="space-y-2 min-w-[280px]">
          <Select value={indicador} onValueChange={setIndicador}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {grupos.map(([grupo, itens]) => (
                <SelectGroup key={grupo}>
                  <SelectLabel>{grupo}</SelectLabel>
                  {itens.map((i) => (
                    <SelectItem key={i.key} value={i.key}>{i.label}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <div className="rounded-md border p-2 space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground">Controle de camadas</p>
            {[
              { id: "coropletica", label: "Coroplética por UF", checked: camadaCoropletica, set: setCamadaCoropletica },
              { id: "municipios", label: `Municípios monitorados (${municipios.length})`, checked: camadaMunicipios, set: setCamadaMunicipios },
              { id: "rotulos", label: "Rótulos das UFs", checked: camadaRotulos, set: setCamadaRotulos },
            ].map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={c.checked} onCheckedChange={(v) => c.set(!!v)} />
                {c.label}
              </label>
            ))}
          </div>
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
          id="mapa-regional-lixoes"
          ref={containerRef}
          aria-label="Mapa coroplético de indicadores por estado"
          className="rounded-md overflow-hidden border"
          style={{ height: 460, width: "100%", display: geojson && !erro ? "block" : "none" }}
        />

        {/* Legenda */}
        <div className="grid gap-3 sm:grid-cols-2 rounded-md border p-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold">{conf.label} ({conf.unidade})</p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>0</span>
              {conf.escala.map((c) => (
                <span key={c} className="inline-block h-3 w-8 rounded-sm" style={{ background: c }} />
              ))}
              <span>{fmt(max)}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-block h-3 w-8 rounded-sm" style={{ background: "#e5e7eb" }} /> sem dados
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold">Municípios monitorados — situação da área</p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              {[
                ["ativo", "Ativo"],
                ["em_encerramento", "Em encerramento"],
                ["encerrado", "Encerrado"],
                ["recuperado", "Recuperado"],
              ].map(([k, label]) => (
                <span key={k} className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full border border-white" style={{ background: STATUS_COR[k] }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapaRegional;
