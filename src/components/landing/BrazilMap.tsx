import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { Card } from "@/components/ui/card";
import { MapPin, Search, Filter, Loader2, Calendar, Gauge, AlertTriangle, Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
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

const BrazilMap = () => {
  const [geo, setGeo] = useState<GeoData | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [filtroUF, setFiltroUF] = useState<string>("all");
  const [filtroCidade, setFiltroCidade] = useState<string>("");
  const [filtroMaterial, setFiltroMaterial] = useState<string>("all");
  const [pontoSelecionado, setPontoSelecionado] = useState<Ponto | null>(null);
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

  return (
    <section id="mapa" className="bg-surface py-16 md:py-20">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Encontre Pontos de Coleta no Brasil</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Clique em um marcador no mapa para ver detalhes do ponto, materiais coletados e telemetria mais recente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-3 p-4 bg-card">
            <div ref={containerRef} className="w-full">
              {geo ? (
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
                    return (
                      <g key={ponto.id} className="cursor-pointer" onClick={() => setPontoSelecionado(ponto)}>
                        {status === "critico" && (
                          <circle cx={x} cy={y} r={10} fill={cor} opacity={0.35}>
                            <animate attributeName="r" values="6;14;6" dur="1.6s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.45;0;0.45" dur="1.6s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <circle cx={x} cy={y} r={6} fill="hsl(var(--card))" stroke={cor} strokeWidth={2} />
                        <circle cx={x} cy={y} r={3} fill={cor} />
                        <title>{`${ponto.nome} — ${ponto.cidade}/${ponto.uf} · ${STATUS_STYLES[status].label}`}</title>
                      </g>
                    );
                  })}
                </svg>
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

          <Card className="lg:col-span-2 p-4 bg-card flex flex-col">
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
              {(filtroUF !== "all" || filtroCidade || filtroMaterial !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setFiltroUF("all"); setFiltroCidade(""); setFiltroMaterial("all"); }} className="w-full">
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

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-primary" /> Telemetria por material
                  </h4>
                  {pontoSelecionado.materiais.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-md">
                      Sem dados de telemetria para este ponto.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pontoSelecionado.materiais.map((m) => (
                        <div key={m.material} className="border border-border rounded-md p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{m.material}</p>
                              {m.contenedor && <p className="text-xs text-muted-foreground">{m.contenedor}</p>}
                            </div>
                            <Badge variant="outline" className="text-xs">{m.nivelPreenchimento}%</Badge>
                          </div>
                          <Progress value={m.nivelPreenchimento} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{m.litrosEstimados} L de {m.capacidadeLitros} L</span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {m.ultimaColeta ? `Coleta: ${fmtData(m.ultimaColeta)}` : `Atualiz.: ${fmtData(m.atualizadoEm)}`}
                            </span>
                          </div>
                        </div>
                      ))}
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
