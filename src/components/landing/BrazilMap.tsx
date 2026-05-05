import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { Card } from "@/components/ui/card";
import { MapPin, Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Feature = {
  type: "Feature";
  properties: { name: string; sigla?: string };
  geometry: GeoJSON.Geometry;
};

type GeoData = { type: "FeatureCollection"; features: Feature[] };

// Mapeamento nome → sigla
const UF_MAP: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
  "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
  "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
  "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
  "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
};

type Ponto = {
  nome: string;
  uf: string;
  cidade: string;
  tipo: string;
  materiais: string[];
};

const usePontosColeta = () =>
  useQuery({
    queryKey: ["mapa-pontos-coleta"],
    queryFn: async (): Promise<Ponto[]> => {
      // pontos via contenedor_localizacoes (contenedores físicos)
      const { data: locs, error } = await supabase
        .from("contenedor_localizacoes")
        .select("nome_local, cidade, uf, contenedor_id, contenedores(material)")
        .eq("status_operacional", "Ativo");
      if (error) throw error;

      const grouped = new Map<string, Ponto>();
      (locs || []).forEach((l: any) => {
        const key = `${l.nome_local}|${l.cidade}|${l.uf}`;
        const material = l.contenedores?.material;
        if (!grouped.has(key)) {
          grouped.set(key, {
            nome: l.nome_local,
            cidade: l.cidade,
            uf: l.uf,
            tipo: "Ponto de Coleta",
            materiais: [],
          });
        }
        if (material && !grouped.get(key)!.materiais.includes(material)) {
          grouped.get(key)!.materiais.push(material);
        }
      });

      // cooperativas
      const { data: coops } = await supabase
        .from("cooperativas")
        .select("nome, cidade, estado");
      (coops || []).forEach((c: any) => {
        grouped.set(`coop-${c.nome}`, {
          nome: c.nome,
          cidade: c.cidade,
          uf: c.estado,
          tipo: "Cooperativa",
          materiais: [],
        });
      });

      // indústrias
      const { data: inds } = await supabase
        .from("industrias")
        .select("nome, cidade, estado");
      (inds || []).forEach((i: any) => {
        grouped.set(`ind-${i.nome}`, {
          nome: i.nome,
          cidade: i.cidade,
          uf: i.estado,
          tipo: "Indústria",
          materiais: [],
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const { data: pontos = [], isLoading } = usePontosColeta();

  useEffect(() => {
    fetch("/brazil-states.geojson")
      .then((r) => r.json())
      .then((d) => setGeo(d))
      .catch(() => setGeo(null));
  }, []);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const height = Math.round(width * 1.0);

  const { paths, centroids } = useMemo(() => {
    if (!geo) return { paths: [], centroids: [] };
    const projection = geoMercator().fitSize([width, height], geo as any);
    const pathGen = geoPath(projection);
    const paths = geo.features.map((f) => ({
      d: pathGen(f as any) || "",
      name: f.properties.name,
      sigla: UF_MAP[f.properties.name] || "",
    }));
    const centroids = geo.features.map((f) => {
      const c = pathGen.centroid(f as any);
      return { x: c[0], y: c[1], sigla: UF_MAP[f.properties.name] || "", name: f.properties.name };
    });
    return { paths, centroids };
  }, [geo, width, height]);

  const materiaisDisponiveis = useMemo(() => {
    const set = new Set<string>();
    pontos.forEach((p) => p.materiais.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [pontos]);

  const pontosFiltrados = pontos.filter((p) => {
    if (filtroUF !== "all" && p.uf !== filtroUF) return false;
    if (filtroCidade && !p.cidade.toLowerCase().includes(filtroCidade.toLowerCase())) return false;
    if (filtroMaterial !== "all" && !p.materiais.includes(filtroMaterial)) return false;
    return true;
  });

  // contagem de pontos por UF (para destaque visual no mapa)
  const pontosPorUF = useMemo(() => {
    const map: Record<string, number> = {};
    pontos.forEach((p) => { map[p.uf] = (map[p.uf] || 0) + 1; });
    return map;
  }, [pontos]);

  const handleClickEstado = (sigla: string) => {
    setFiltroUF((prev) => (prev === sigla ? "all" : sigla));
  };

  return (
    <section id="mapa" className="bg-surface py-16 md:py-20">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Encontre Pontos de Coleta no Brasil</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore o mapa interativo. Clique em um estado para filtrar ou use os filtros ao lado para localizar pontos de coleta e os materiais aceitos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Mapa */}
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
                        fill={
                          isSelected
                            ? "hsl(var(--primary))"
                            : isHovered
                            ? "hsl(var(--primary-glow))"
                            : `hsl(var(--primary) / ${0.15 + intensity * 0.45})`
                        }
                        stroke="hsl(var(--card))"
                        strokeWidth={1}
                        className="cursor-pointer transition-colors"
                        onMouseEnter={() => setHovered(p.sigla)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => handleClickEstado(p.sigla)}
                      >
                        <title>{`${p.name} — ${count} ponto(s)`}</title>
                      </path>
                    );
                  })}
                  {centroids.map((c) => (
                    <text
                      key={`label-${c.sigla}`}
                      x={c.x}
                      y={c.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none select-none"
                      fontSize={Math.max(9, width / 70)}
                      fill="hsl(var(--primary-foreground))"
                      fontWeight={600}
                    >
                      {c.sigla}
                    </text>
                  ))}
                </svg>
              ) : (
                <div className="h-[500px] flex items-center justify-center text-muted-foreground">Carregando mapa...</div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground items-center">
              <span>Densidade de pontos:</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ background: "hsl(var(--primary) / 0.15)" }} /> baixa
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ background: "hsl(var(--primary) / 0.4)" }} /> média
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ background: "hsl(var(--primary) / 0.6)" }} /> alta
              </span>
              {hovered && <Badge variant="secondary" className="ml-auto">Estado: {hovered}</Badge>}
            </div>
          </Card>

          {/* Filtros + Lista */}
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
                  <Input
                    value={filtroCidade}
                    onChange={(e) => setFiltroCidade(e.target.value)}
                    placeholder="Buscar cidade..."
                    className="pl-8"
                  />
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFiltroUF("all"); setFiltroCidade(""); setFiltroMaterial("all"); }}
                  className="w-full"
                >
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
                {pontosFiltrados.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum ponto encontrado com os filtros atuais.
                  </p>
                )}
                {pontosFiltrados.map((p) => (
                  <div key={p.nome} className="border border-border rounded-md p-3 hover:border-primary/40 transition-colors">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.cidade} — {p.uf} · <span className="text-primary">{p.tipo}</span></p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {p.materiais.map((m) => (
                            <Badge key={m} variant="outline" className="text-[10px] py-0 px-1.5">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BrazilMap;
