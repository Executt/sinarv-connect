import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { Card } from "@/components/ui/card";
import { MapPin, Search, Filter, Loader2, Calendar, Gauge, AlertTriangle, Settings2, Pin, ExternalLink, TrendingUp, Truck } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip, ReferenceLine, CartesianGrid } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Feature = {
  type: "Feature";
  properties: { name: string; sigla?: string };
  geometry: GeoJSON.Geometry;
};

type GeoData = { type: "FeatureCollection"; features: Feature[] };

const UF_MAP: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
  "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
  "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
  "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
  "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
};

type MaterialInfo = {
  material: string;
  contenedor?: string;
  nivelPreenchimento: number;
  capacidadeLitros: number;
  litrosEstimados: number;
  ultimaColeta: string | null;
  atualizadoEm: string | null;
};

type Ponto = {
  id: string;
  nome: string;
  uf: string;
  cidade: string;
  tipo: string;
  lat?: number | null;
  lng?: number | null;
  materiais: MaterialInfo[];
  atualizadoEm: string | null;
};

const fmtData = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const DEFAULT_LIMITES = { atencao: 70, critico: 90 };
const LIMITES_STORAGE_KEY = "sinarv:limites-preenchimento";

type Limites = { atencao: number; critico: number };
type StatusNivel = "ok" | "atencao" | "critico";

const getStatus = (nivel: number, lim: Limites): StatusNivel =>
  nivel >= lim.critico ? "critico" : nivel >= lim.atencao ? "atencao" : "ok";

const STATUS_STYLES: Record<StatusNivel, { label: string; badge: string; text: string; bg: string; ring: string; marker: string }> = {
  ok: {
    label: "Normal",
    badge: "bg-success/10 text-success border-success/30",
    text: "text-success",
    bg: "bg-success",
    ring: "border-success/40",
    marker: "hsl(var(--success))",
  },
  atencao: {
    label: "Atenção",
    badge: "bg-warning/10 text-warning border-warning/30",
    text: "text-warning",
    bg: "bg-warning",
    ring: "border-warning/50",
    marker: "hsl(var(--warning))",
  },
  critico: {
    label: "Crítico",
    badge: "bg-destructive/10 text-destructive border-destructive/30",
    text: "text-destructive",
    bg: "bg-destructive",
    ring: "border-destructive/60",
    marker: "hsl(var(--destructive))",
  },
};

const usePontosColeta = () =>
  useQuery({
    queryKey: ["mapa-pontos-coleta"],
    queryFn: async (): Promise<Ponto[]> => {
      const { data: locs, error } = await supabase
        .from("contenedor_localizacoes")
        .select("id, nome_local, cidade, uf, latitude, longitude, nivel_preenchimento, capacidade_litros, ultima_coleta, updated_at, contenedor_id, contenedores(material, nome)")
        .eq("status_operacional", "Ativo");
      if (error) throw error;

      const grouped = new Map<string, Ponto>();
      (locs || []).forEach((l: any) => {
        const key = `${l.nome_local}|${l.cidade}|${l.uf}`;
        const material = l.contenedores?.material;
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: l.id,
            nome: l.nome_local,
            cidade: l.cidade,
            uf: l.uf,
            tipo: "Ponto de Coleta",
            lat: l.latitude,
            lng: l.longitude,
            materiais: [],
            atualizadoEm: l.updated_at,
          });
        }
        const p = grouped.get(key)!;
        if (l.updated_at && (!p.atualizadoEm || l.updated_at > p.atualizadoEm)) p.atualizadoEm = l.updated_at;
        if (material && !p.materiais.some((m) => m.material === material)) {
          const cap = Number(l.capacidade_litros) || 0;
          const nivel = Number(l.nivel_preenchimento) || 0;
          p.materiais.push({
            material,
            contenedor: l.contenedores?.nome,
            nivelPreenchimento: nivel,
            capacidadeLitros: cap,
            litrosEstimados: Math.round((cap * nivel) / 100),
            ultimaColeta: l.ultima_coleta,
            atualizadoEm: l.updated_at,
          });
        }
      });

      const { data: coops } = await supabase.from("cooperativas").select("id, nome, cidade, estado, updated_at");
      (coops || []).forEach((c: any) => {
        grouped.set(`coop-${c.id}`, {
          id: c.id, nome: c.nome, cidade: c.cidade, uf: c.estado,
          tipo: "Cooperativa", materiais: [], atualizadoEm: c.updated_at,
        });
      });

      const { data: inds } = await supabase.from("industrias").select("id, nome, cidade, estado, updated_at");
      (inds || []).forEach((i: any) => {
        grouped.set(`ind-${i.id}`, {
          id: i.id, nome: i.nome, cidade: i.cidade, uf: i.estado,
          tipo: "Indústria", materiais: [], atualizadoEm: i.updated_at,
        });
      });

      return Array.from(grouped.values());
    },
  });

type BrazilMapProps = { embedded?: boolean; hideHeading?: boolean };

const BrazilMap = ({ embedded = false, hideHeading = false }: BrazilMapProps = {}) => {
  const [geo, setGeo] = useState<GeoData | null>(null);
  const materiaisListRef = useRef<HTMLDivElement>(null);
  const primeiroAlertaRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [filtroUF, setFiltroUF] = useState<string>("all");
  const [filtroCidade, setFiltroCidade] = useState<string>("");
  const [filtroMaterial, setFiltroMaterial] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [pontoSelecionado, setPontoSelecionado] = useState<Ponto | null>(null);
  const [pinnedTooltipId, setPinnedTooltipId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const { data: pontos = [], isLoading } = usePontosColeta();

  const [limiteGlobal, setLimiteGlobal] = useState<Limites>(DEFAULT_LIMITES);
  const [limitesPorMaterial, setLimitesPorMaterial] = useState<Record<string, Limites>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIMITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.global) setLimiteGlobal(parsed.global);
        if (parsed.porMaterial) setLimitesPorMaterial(parsed.porMaterial);
      }
    } catch {}
  }, []);

  const persistLimites = (global: Limites, porMaterial: Record<string, Limites>) => {
    try {
      localStorage.setItem(LIMITES_STORAGE_KEY, JSON.stringify({ global, porMaterial }));
    } catch {}
  };

  const getLimitePara = (material: string): Limites =>
    limitesPorMaterial[material] || limiteGlobal;

  useEffect(() => {
    fetch("/brazil-states.geojson").then((r) => r.json()).then(setGeo).catch(() => setGeo(null));
  }, []);

  useEffect(() => {
    const update = () => { if (containerRef.current) setWidth(containerRef.current.clientWidth); };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const height = Math.round(width * 1.0);

  const projection = useMemo(() => {
    if (!geo) return null;
    return geoMercator().fitSize([width, height], geo as any);
  }, [geo, width, height]);

  const { paths, centroids } = useMemo(() => {
    if (!geo || !projection) return { paths: [], centroids: [] };
    const pathGen = geoPath(projection);
    const paths = geo.features.map((f) => ({
      d: pathGen(f as any) || "", name: f.properties.name, sigla: UF_MAP[f.properties.name] || "",
    }));
    const centroids = geo.features.map((f) => {
      const c = pathGen.centroid(f as any);
      return { x: c[0], y: c[1], sigla: UF_MAP[f.properties.name] || "", name: f.properties.name };
    });
    return { paths, centroids };
  }, [geo, projection]);

  const materiaisDisponiveis = useMemo(() => {
    const set = new Set<string>();
    pontos.forEach((p) => p.materiais.forEach((m) => set.add(m.material)));
    return Array.from(set).sort();
  }, [pontos]);

  const pontosFiltrados = pontos.filter((p) => {
    if (filtroUF !== "all" && p.uf !== filtroUF) return false;
    if (filtroCidade && !p.cidade.toLowerCase().includes(filtroCidade.toLowerCase())) return false;
    if (filtroMaterial !== "all" && !p.materiais.some((m) => m.material === filtroMaterial)) return false;
    if (filtroStatus !== "all") {
      const status = piorStatus(p);
      if (filtroStatus === "alerta") {
        if (status === "ok") return false;
      } else if (status !== filtroStatus) {
        return false;
      }
    }
    return true;
  });

  const pontosPorUF = useMemo(() => {
    const map: Record<string, number> = {};
    pontos.forEach((p) => { map[p.uf] = (map[p.uf] || 0) + 1; });
    return map;
  }, [pontos]);

  const piorStatus = (p: Ponto): StatusNivel => {
    let pior: StatusNivel = "ok";
    p.materiais.forEach((m) => {
      const s = getStatus(m.nivelPreenchimento, getLimitePara(m.material));
      if (s === "critico") pior = "critico";
      else if (s === "atencao" && pior === "ok") pior = "atencao";
    });
    return pior;
  };

  const totaisAlertas = useMemo(() => {
    let atencao = 0, critico = 0;
    pontos.forEach((p) => {
      const s = piorStatus(p);
      if (s === "critico") critico++;
      else if (s === "atencao") atencao++;
    });
    return { atencao, critico };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontos, limiteGlobal, limitesPorMaterial]);

  const marcadores = useMemo(() => {
    if (!projection) return [];
    return pontosFiltrados
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => {
        const xy = projection([Number(p.lng), Number(p.lat)] as [number, number]);
        return xy ? { ponto: p, x: xy[0], y: xy[1], status: piorStatus(p) } : null;
      })
      .filter((v): v is { ponto: Ponto; x: number; y: number; status: StatusNivel } => !!v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontosFiltrados, projection, limiteGlobal, limitesPorMaterial]);

  const indicePrimeiroAlerta = useMemo(() => {
    if (!pontoSelecionado) return -1;
    return pontoSelecionado.materiais.findIndex(
      (m) => getStatus(m.nivelPreenchimento, getLimitePara(m.material)) !== "ok"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontoSelecionado, limiteGlobal, limitesPorMaterial]);

  useEffect(() => {
    if (!pontoSelecionado || indicePrimeiroAlerta < 0) return;
    const t = setTimeout(() => {
      primeiroAlertaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
    return () => clearTimeout(t);
  }, [pontoSelecionado, indicePrimeiroAlerta]);

  useEffect(() => {
    if (!pinnedTooltipId) return;
    const p = pontos.find((x) => x.id === pinnedTooltipId);
    if (p) setPontoSelecionado(p);
  }, [pinnedTooltipId, pontos]);

  return (
    <section id="mapa" className={embedded ? "" : "bg-surface py-16 md:py-20"}>
      <div className={embedded ? "w-full" : "container max-w-7xl mx-auto px-4"}>
        {!hideHeading && (
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Encontre Pontos de Coleta no Brasil</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Clique em um marcador no mapa para ver detalhes do ponto, materiais coletados e telemetria mais recente.
            </p>
          </div>
        )}

        <div className={embedded ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-5 gap-6"}>
          <Card className={embedded ? "p-3 bg-card" : "lg:col-span-3 p-4 bg-card"}>
            <div ref={containerRef} className="w-full">
              {geo ? (
                <TooltipProvider delayDuration={150}>
                  <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Mapa do Brasil interativo">
                  {paths.map((p) => {
                    const isHovered = hovered === p.sigla;
                    const isSelected = filtroUF === p.sigla;
                    const count = pontosPorUF[p.sigla] || 0;
                    const intensity = Math.min(count / 3, 1);
                    return (
                      <path
                        key={p.sigla || p.name}
                        d={p.d}
                        fill={isSelected ? "hsl(var(--primary))" : isHovered ? "hsl(var(--primary-glow))" : `hsl(var(--primary) / ${0.15 + intensity * 0.45})`}
                        stroke="hsl(var(--card))" strokeWidth={1}
                        className="cursor-pointer transition-colors"
                        onMouseEnter={() => setHovered(p.sigla)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setFiltroUF((prev) => prev === p.sigla ? "all" : p.sigla)}
                      >
                        <title>{`${p.name} — ${count} ponto(s)`}</title>
                      </path>
                    );
                  })}
                  {centroids.map((c) => (
                    <text key={`label-${c.sigla}`} x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle"
                      className="pointer-events-none select-none" fontSize={Math.max(9, width / 70)}
                      fill="hsl(var(--primary-foreground))" fontWeight={600}>
                      {c.sigla}
                    </text>
                  ))}
                  {marcadores.map(({ ponto, x, y, status }) => {
                    const cor = STATUS_STYLES[status].marker;
                    const isSelecionado = pontoSelecionado?.id === ponto.id;
                    const isPinned = pinnedTooltipId === ponto.id;
                    const statusLabel = STATUS_STYLES[status].label;
                    const materiaisTooltip = ponto.materiais.slice(0, 3);
                    const maisCount = ponto.materiais.length - materiaisTooltip.length;
                    return (
                      <Tooltip
                        key={ponto.id}
                        open={isPinned ? true : undefined}
                        onOpenChange={(o) => { if (isPinned && !o) return; }}
                      >
                        <TooltipTrigger asChild>
                          <g
                            className="cursor-pointer outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPinnedTooltipId((prev) => (prev === ponto.id ? null : ponto.id));
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`${ponto.nome} — ${ponto.cidade}/${ponto.uf}`}
                            aria-pressed={isPinned}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setPinnedTooltipId((prev) => (prev === ponto.id ? null : ponto.id));
                              }
                            }}
                          >
                            {status === "critico" && (
                              <circle cx={x} cy={y} r={10} fill={cor} opacity={0.35}>
                                <animate attributeName="r" values="6;14;6" dur="1.6s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.45;0;0.45" dur="1.6s" repeatCount="indefinite" />
                              </circle>
                            )}
                            {(isSelecionado || isPinned) && (
                              <>
                                <circle cx={x} cy={y} r={16} fill="none" stroke={cor} strokeWidth={2} opacity={0.55}>
                                  <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
                                  <animate attributeName="opacity" values="0.7;0.15;0.7" dur="2s" repeatCount="indefinite" />
                                </circle>
                                <circle cx={x} cy={y} r={11} fill="none" stroke={cor} strokeWidth={2.5} opacity={0.9} />
                                <circle cx={x} cy={y} r={9} fill="none" stroke="hsl(var(--card))" strokeWidth={1.5} />
                              </>
                            )}
                            <circle
                              cx={x}
                              cy={y}
                              r={isSelecionado || isPinned ? 7.5 : 6}
                              fill="hsl(var(--card))"
                              stroke={cor}
                              strokeWidth={isSelecionado || isPinned ? 3 : 2}
                              style={{ transition: "r 200ms ease, stroke-width 200ms ease" }}
                            />
                            <circle cx={x} cy={y} r={isSelecionado || isPinned ? 4 : 3} fill={cor} style={{ transition: "r 200ms ease" }} />
                          </g>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={8}
                          className="max-w-[280px] p-3 space-y-2 bg-popover border border-border shadow-lg"
                          onPointerDownOutside={(e) => { if (isPinned) e.preventDefault(); }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight">{ponto.nome}</p>
                            <Badge className={`text-[10px] py-0 px-1.5 border ${STATUS_STYLES[status].badge}`}>{statusLabel}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{ponto.cidade} — {ponto.uf}</p>
                          {ponto.materiais.length > 0 && (
                            <div className="space-y-1 pt-1 border-t border-border">
                              {materiaisTooltip.map((m) => {
                                const lim = getLimitePara(m.material);
                                const ms = getStatus(m.nivelPreenchimento, lim);
                                const msStyle = STATUS_STYLES[ms];
                                return (
                                  <div key={m.material} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate max-w-[140px]">{m.material}</span>
                                    <span className="shrink-0 inline-flex items-center gap-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${msStyle.bg}`} />
                                      {m.litrosEstimados} L <span className="text-muted-foreground">/ {m.capacidadeLitros} L</span>
                                    </span>
                                  </div>
                                );
                              })}
                              {maisCount > 0 && (
                                <p className="text-[10px] text-muted-foreground">+{maisCount} material(is)</p>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-2 border-t border-border">
                            <Button
                              size="sm"
                              className="h-7 text-xs flex-1 gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPontoSelecionado(ponto);
                              }}
                            >
                              <ExternalLink className="h-3 w-3" /> Ver detalhes
                            </Button>
                            {isPinned ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={(e) => { e.stopPropagation(); setPinnedTooltipId(null); }}
                                aria-label="Desafixar tooltip"
                              >
                                <Pin className="h-3 w-3 fill-current" /> Fixado
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                                <Pin className="h-3 w-3" /> clique p/ fixar
                              </span>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  </svg>
                </TooltipProvider>
              ) : (
                <div className="h-[500px] flex items-center justify-center text-muted-foreground">Carregando mapa...</div>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs items-center">
              <span className="text-muted-foreground">Status:</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-success" /> Normal</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-warning" /> Atenção (≥{limiteGlobal.atencao}%)</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-destructive" /> Crítico (≥{limiteGlobal.critico}%)</span>
              <div className="ml-auto flex items-center gap-2">
                {totaisAlertas.critico > 0 && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/30 border gap-1">
                    <AlertTriangle className="h-3 w-3" /> {totaisAlertas.critico} crítico(s)
                  </Badge>
                )}
                {totaisAlertas.atencao > 0 && (
                  <Badge className="bg-warning/10 text-warning border-warning/30 border">
                    {totaisAlertas.atencao} em atenção
                  </Badge>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                      <Settings2 className="h-3 w-3" /> Limites
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 bg-popover">
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-semibold">Limites de preenchimento</h5>
                        <p className="text-xs text-muted-foreground">Define quando alertar visualmente cada ponto.</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Padrão (todos os materiais)</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-warning">Atenção (%)</label>
                            <Input type="number" min={0} max={100} value={limiteGlobal.atencao}
                              onChange={(e) => {
                                const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                const next = { ...limiteGlobal, atencao: v };
                                setLimiteGlobal(next); persistLimites(next, limitesPorMaterial);
                              }} className="h-8" />
                          </div>
                          <div>
                            <label className="text-[10px] text-destructive">Crítico (%)</label>
                            <Input type="number" min={0} max={100} value={limiteGlobal.critico}
                              onChange={(e) => {
                                const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                const next = { ...limiteGlobal, critico: v };
                                setLimiteGlobal(next); persistLimites(next, limitesPorMaterial);
                              }} className="h-8" />
                          </div>
                        </div>
                      </div>
                      {materiaisDisponiveis.length > 0 && (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          <p className="text-xs font-medium text-muted-foreground">Por material (opcional)</p>
                          {materiaisDisponiveis.map((mat) => {
                            const lim = limitesPorMaterial[mat] || limiteGlobal;
                            const custom = !!limitesPorMaterial[mat];
                            return (
                              <div key={mat} className="border border-border rounded-md p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">{mat}</span>
                                  {custom && (
                                    <Button variant="ghost" size="sm" className="h-5 text-[10px]"
                                      onClick={() => {
                                        const next = { ...limitesPorMaterial };
                                        delete next[mat];
                                        setLimitesPorMaterial(next); persistLimites(limiteGlobal, next);
                                      }}>resetar</Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <Input type="number" min={0} max={100} value={lim.atencao}
                                    onChange={(e) => {
                                      const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                      const next = { ...limitesPorMaterial, [mat]: { ...lim, atencao: v } };
                                      setLimitesPorMaterial(next); persistLimites(limiteGlobal, next);
                                    }} className="h-7 text-xs" />
                                  <Input type="number" min={0} max={100} value={lim.critico}
                                    onChange={(e) => {
                                      const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                      const next = { ...limitesPorMaterial, [mat]: { ...lim, critico: v } };
                                      setLimitesPorMaterial(next); persistLimites(limiteGlobal, next);
                                    }} className="h-7 text-xs" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>

          <Card className={embedded ? "p-3 bg-card flex flex-col" : "lg:col-span-2 p-4 bg-card flex flex-col"}>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">Filtros</h4>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Estado (UF)</label>
                <Select value={filtroUF} onValueChange={setFiltroUF}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72 bg-popover">
                    <SelectItem value="all">Todos os estados</SelectItem>
                    {Object.entries(UF_MAP).map(([nome, sigla]) => (
                      <SelectItem key={sigla} value={sigla}>{sigla} — {nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} placeholder="Buscar cidade..." className="pl-8" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Material aceito</label>
                <Select value={filtroMaterial} onValueChange={setFiltroMaterial}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">Todos os materiais</SelectItem>
                    {materiaisDisponiveis.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status do ponto</label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="alerta">Atenção + Crítico</SelectItem>
                    <SelectItem value="atencao">Somente Atenção</SelectItem>
                    <SelectItem value="critico">Somente Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(filtroUF !== "all" || filtroCidade || filtroMaterial !== "all" || filtroStatus !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setFiltroUF("all"); setFiltroCidade(""); setFiltroMaterial("all"); setFiltroStatus("all"); }} className="w-full">
                  Limpar filtros
                </Button>
              )}
            </div>

            <div className="border-t border-border pt-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-semibold">Resultados</h5>
                <Badge variant="secondary">{pontosFiltrados.length}</Badge>
              </div>
              <div className="overflow-y-auto space-y-2 max-h-[420px] pr-1">
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando pontos...
                  </div>
                )}
                {!isLoading && pontosFiltrados.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum ponto encontrado com os filtros atuais.</p>
                )}
                {pontosFiltrados.map((p) => {
                  const status = piorStatus(p);
                  const styles = STATUS_STYLES[status];
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPontoSelecionado(p)}
                      className={`w-full text-left border rounded-md p-3 transition-colors hover:bg-accent/30 ${status === "ok" ? "border-border hover:border-primary/40" : styles.ring}`}
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className={`h-4 w-4 mt-0.5 shrink-0 ${status === "ok" ? "text-primary" : styles.text}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{p.nome}</p>
                            {status !== "ok" && (
                              <Badge className={`text-[10px] py-0 px-1.5 border ${styles.badge}`}>
                                {status === "critico" && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                                {styles.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{p.cidade} — {p.uf} · <span className="text-primary">{p.tipo}</span></p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.materiais.slice(0, 4).map((m) => (
                              <Badge key={m.material} variant="outline" className="text-[10px] py-0 px-1.5">{m.material}</Badge>
                            ))}
                            {p.materiais.length > 4 && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5">+{p.materiais.length - 4}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Sheet open={!!pontoSelecionado} onOpenChange={(o) => !o && setPontoSelecionado(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {pontoSelecionado && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {pontoSelecionado.nome}
                </SheetTitle>
                <SheetDescription>
                  {pontoSelecionado.cidade} — {pontoSelecionado.uf} · {pontoSelecionado.tipo}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {(() => {
                  const status = piorStatus(pontoSelecionado);
                  const styles = STATUS_STYLES[status];
                  return (
                    <div className={`rounded-md border p-3 flex items-center gap-2 ${styles.badge}`}>
                      {status === "ok" ? <Gauge className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      <span className="text-sm font-medium">Status geral: {styles.label}</span>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="border border-border rounded-md p-3">
                    <p className="text-xs text-muted-foreground">Materiais</p>
                    <p className="font-semibold text-lg">{pontoSelecionado.materiais.length}</p>
                  </div>
                  <div className="border border-border rounded-md p-3">
                    <p className="text-xs text-muted-foreground">Atualizado</p>
                    <p className="font-semibold text-sm">{fmtData(pontoSelecionado.atualizadoEm)}</p>
                  </div>
                </div>

                {pontoSelecionado.materiais.length > 0 && (() => {
                  const totalCap = pontoSelecionado.materiais.reduce((s, m) => s + m.capacidadeLitros, 0);
                  const totalUsado = pontoSelecionado.materiais.reduce((s, m) => s + m.litrosEstimados, 0);
                  const pct = totalCap > 0 ? Math.round((totalUsado / totalCap) * 100) : 0;
                  const status = getStatus(pct, limiteGlobal);
                  const styles = STATUS_STYLES[status];
                  return (
                    <div className="border border-border rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-primary" /> Capacidade total
                        </h4>
                        <Badge className={`text-xs border ${styles.badge}`}>{pct}% · {styles.label}</Badge>
                      </div>
                      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                        <div className={`h-full ${styles.bg} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
                        <div className="absolute top-0 h-full border-l border-warning/70" style={{ left: `${limiteGlobal.atencao}%` }} />
                        <div className="absolute top-0 h-full border-l border-destructive/70" style={{ left: `${limiteGlobal.critico}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{totalUsado.toLocaleString("pt-BR")} L em uso</span>
                        <span>de {totalCap.toLocaleString("pt-BR")} L</span>
                      </div>
                    </div>
                  );
                })()}

                {pontoSelecionado.materiais.length > 0 && (() => {
                  // Histórico sintético determinístico (14 dias) por ponto + eventos de coleta
                  const seedStr = pontoSelecionado.id;
                  let seed = 0;
                  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
                  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed & 0xffff) / 0xffff; };
                  const totalCap = pontoSelecionado.materiais.reduce((s, m) => s + m.capacidadeLitros, 0);
                  const totalUsado = pontoSelecionado.materiais.reduce((s, m) => s + m.litrosEstimados, 0);
                  const pctAtual = totalCap > 0 ? (totalUsado / totalCap) * 100 : 0;
                  const dias = 14;
                  let nivel = Math.max(5, pctAtual - 30 - rand() * 20);
                  const data: { dia: string; nivel: number; coleta?: number }[] = [];
                  for (let i = dias - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                    // tendência rumo ao valor atual + ruído
                    const incremento = ((pctAtual - nivel) / Math.max(1, i + 1)) + (rand() * 8 - 2);
                    nivel = Math.max(0, Math.min(100, nivel + incremento));
                    let coleta: number | undefined;
                    if (i !== 0 && nivel > limiteGlobal.atencao && rand() < 0.18) {
                      coleta = Math.round(nivel);
                      nivel = Math.max(5, nivel - (35 + rand() * 25));
                    }
                    data.push({ dia: label, nivel: Math.round(nivel), coleta });
                  }
                  // garantir que o último ponto reflita o valor atual
                  data[data.length - 1].nivel = Math.round(pctAtual);
                  const eventos = data.filter((d) => d.coleta != null);
                  return (
                    <div className="border border-border rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" /> Histórico de telemetria
                        </h4>
                        <span className="text-[10px] text-muted-foreground">últimos 14 dias</span>
                      </div>
                      <div className="h-36 -mx-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="fillNivel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={2} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} ticks={[0, 50, 100]} axisLine={false} tickLine={false} />
                            <ReTooltip
                              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                              formatter={(v: number, n) => n === "coleta" ? [`${v}% antes`, "Coleta"] : [`${v}%`, "Nível"]}
                            />
                            <ReferenceLine y={limiteGlobal.atencao} stroke="hsl(var(--warning))" strokeDasharray="3 3" />
                            <ReferenceLine y={limiteGlobal.critico} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                            <Area type="monotone" dataKey="nivel" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#fillNivel)" />
                            <Area type="monotone" dataKey="coleta" stroke="hsl(var(--success))" strokeWidth={0} fill="hsl(var(--success))" fillOpacity={0.6} dot={{ r: 4, fill: "hsl(var(--success))" }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Nível médio</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Evento de coleta</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-0.5 bg-warning" /> Atenção</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-0.5 bg-destructive" /> Crítico</span>
                      </div>
                      {eventos.length > 0 && (
                        <div className="pt-2 border-t border-border space-y-1">
                          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                            <Truck className="h-3 w-3" /> Eventos recentes
                          </p>
                          {eventos.slice(-3).reverse().map((e, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">{e.dia}</span>
                              <span>Coleta · esvaziou de <strong>{e.coleta}%</strong></span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-primary" /> Telemetria por material
                  </h4>
                  {pontoSelecionado.materiais.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-md">
                      Sem dados de telemetria para este ponto.
                    </p>
                  ) : (
                    <div ref={materiaisListRef} className="space-y-3">
                      {pontoSelecionado.materiais.map((m, idx) => {
                        const lim = getLimitePara(m.material);
                        const status = getStatus(m.nivelPreenchimento, lim);
                        const styles = STATUS_STYLES[status];
                        const isPrimeiroAlerta = idx === indicePrimeiroAlerta;
                        return (
                          <div
                            key={m.material}
                            ref={isPrimeiroAlerta ? primeiroAlertaRef : undefined}
                            className={`border rounded-md p-3 space-y-2 transition-shadow ${status === "ok" ? "border-border" : styles.ring} ${isPrimeiroAlerta ? "ring-2 ring-offset-2 ring-offset-background " + (status === "critico" ? "ring-destructive/60" : "ring-warning/60") : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">{m.material}</p>
                                {m.contenedor && <p className="text-xs text-muted-foreground">{m.contenedor}</p>}
                              </div>
                              <Badge className={`text-xs border ${styles.badge}`}>
                                {status !== "ok" && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {m.nivelPreenchimento}% · {styles.label}
                              </Badge>
                            </div>
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <div className={`h-full ${styles.bg} transition-all`} style={{ width: `${Math.min(100, m.nivelPreenchimento)}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{m.litrosEstimados} L de {m.capacidadeLitros} L</span>
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {m.ultimaColeta ? `Coleta: ${fmtData(m.ultimaColeta)}` : `Atualiz.: ${fmtData(m.atualizadoEm)}`}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Limites: atenção ≥ {lim.atencao}% · crítico ≥ {lim.critico}%
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default BrazilMap;
