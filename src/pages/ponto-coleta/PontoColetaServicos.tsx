import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Recycle, Box, Truck, Calendar, ClipboardCheck, AlertTriangle,
  Leaf, Zap, Beaker, HardHat, Package, Info, MapPin,
} from "lucide-react";
import L from "leaflet";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const COR_HEX: Record<string, string> = {
  blue: "#3b82f6", yellow: "#eab308", green: "#16a34a",
  orange: "#f97316", gray: "#6b7280",
};

const createColorIcon = (color: string) =>
  new L.DivIcon({
    className: "",
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

type EcopontosMapProps = {
  points: any[];
};

const EcopontosMap = ({ points }: EcopontosMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerGroupRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-15.78, -47.93],
      zoom: 4,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    points.forEach((point: any) => {
      const latitude = Number(point.latitude);
      const longitude = Number(point.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      bounds.push([latitude, longitude]);
      const cor = point.contenedores?.cor || "gray";
      const marker = L.marker([latitude, longitude], { icon: createColorIcon(COR_HEX[cor] || "#6b7280") });

      const popup = document.createElement("div");
      popup.className = "text-xs space-y-1 min-w-[160px]";

      const nome = document.createElement("p");
      nome.className = "font-bold";
      nome.textContent = point.nome_local;
      popup.appendChild(nome);

      const endereco = document.createElement("p");
      endereco.className = "text-gray-500";
      endereco.textContent = point.endereco;
      popup.appendChild(endereco);

      const cidade = document.createElement("p");
      cidade.textContent = `${point.cidade}/${point.uf} — ${point.capacidade_litros}L`;
      popup.appendChild(cidade);

      marker.bindPopup(popup);
      marker.addTo(layerGroup);
    });

    if (bounds.length > 0) map.fitBounds(L.latLngBounds(bounds), { padding: [28, 28], maxZoom: 6 });
    setTimeout(() => map.invalidateSize(), 0);
  }, [points]);

  return <div ref={containerRef} className="z-0 h-[400px] w-full" aria-label="Mapa de ecopontos ativos" />;
};

const ICON_MAP: Record<string, any> = { Recycle, Box, Beaker, Leaf, Package, Zap, AlertTriangle, HardHat };
const COR_CLASS: Record<string, string> = {
  blue: "bg-blue-500", yellow: "bg-yellow-400", green: "bg-green-600",
  orange: "bg-orange-500", gray: "bg-gray-700", red: "bg-red-500",
};

const COLETA_ESPECIFICA = [
  { tipo: "REEE (Resíduos Eletroeletrônicos)", icone: Zap, exemplos: "Computadores, celulares, TVs, impressoras, cabos", procedimento: "Depositar em Ecoponto especializado ou solicitar coleta agendada", regulamentacao: "PNRS Art. 33 — Logística reversa obrigatória" },
  { tipo: "Resíduos Químicos / Perigosos", icone: AlertTriangle, exemplos: "Tintas, solventes, baterias automotivas, lâmpadas fluorescentes", procedimento: "Armazenar separadamente e solicitar coleta especial credenciada", regulamentacao: "Resolução CONAMA 401/2008" },
  { tipo: "Resíduos de Construção (RCC)", icone: HardHat, exemplos: "Entulho, concreto, gesso, telhas, pisos cerâmicos", procedimento: "Caçamba ou contenedor dedicado (10m³ a 36m³)", regulamentacao: "Resolução CONAMA 307/2002" },
  { tipo: "Óleos de Cozinha Usados", icone: Beaker, exemplos: "Óleo vegetal usado de frituras", procedimento: "Coletar em garrafas PET e entregar no Ecoponto", regulamentacao: "PNRS Art. 33 — Acordo setorial" },
  { tipo: "Pneus Inservíveis", icone: Recycle, exemplos: "Pneus de automóveis e motocicletas", procedimento: "Entregar em pontos Reciclanip ou ecopontos parceiros", regulamentacao: "Resolução CONAMA 416/2009" },
];

const SERVICOS_COMPLEMENTARES = [
  { nome: "Coleta Seletiva Programada", descricao: "Definição de frequência e dias fixos de coleta por fração de material, otimizando rotas e custos.", referencia: "Modelo ARP-GAN — Bruxelles-Propreté Pro" },
  { nome: "Locação de Compactadores", descricao: "Contenedores de alta capacidade (10m³ a 36m³) com compactação integrada para grandes geradores.", referencia: "ARP-GAN — Contrats PRO" },
  { nome: "Coleta Eventual / Eventos", descricao: "Serviço temporário de gestão de resíduos para feiras, festivais, mercados e eventos públicos.", referencia: "ARP-GAN — Nettoyage événementiel" },
  { nome: "Consultoria em Gestão de Resíduos", descricao: "Elaboração de Planos de Gerenciamento (PGRS) com minimização na fonte e conformidade regulatória.", referencia: "ARP-GAN — Suivi et conseil" },
  { nome: "Sacolas Comerciais Certificadas", descricao: "Venda de sacolas identificadas por cor e volume (30L, 50L, 80L) para estabelecimentos credenciados.", referencia: "ARP-GAN — Sacs commerciaux" },
];

const RESIDUOS_PROIBIDOS = [
  "Resíduos hospitalares/infectantes (Grupo A)", "Substâncias radioativas",
  "Explosivos, munições e fogos de artifício", "Peças automotivas com fluidos (motor, câmbio)",
  "Amianto e materiais friáveis", "Medicamentos controlados (devolver na farmácia)",
  "Animais mortos", "Resíduos industriais Classe I (alta periculosidade)",
];

const PontoColetaServicos = () => {
  const { data: contenedores = [], isLoading: loadingCont } = useQuery({
    queryKey: ["contenedores-servicos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contenedores").select("*").eq("ativo", true).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: localizacoes = [], isLoading: loadingLoc } = useQuery({
    queryKey: ["localizacoes-servicos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contenedor_localizacoes").select("*, contenedores(nome, cor)").eq("status_operacional", "Ativo").order("cidade");
      if (error) throw error;
      return data;
    },
  });

  const locByCity = localizacoes.reduce((acc: Record<string, any[]>, l: any) => {
    const key = `${l.cidade}/${l.uf}`;
    (acc[key] = acc[key] || []).push(l);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-l-4 border-l-[hsl(var(--primary))]">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--primary)/0.1)]">
              <Info className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Catálogo de Serviços — Modelo ARP-GAN / SINARV</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Referência baseada no modelo europeu da <strong>Bruxelles-Propreté Pro (ARP-GAN)</strong>, adaptado às diretrizes
                da <strong>PNRS (Lei 12.305/2010)</strong> e do <strong>PLANARES</strong>. Dados carregados dinamicamente do banco de dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contenedores" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="contenedores" className="text-xs gap-1.5"><Box className="h-3.5 w-3.5" /> Contenedores</TabsTrigger>
          <TabsTrigger value="localizacoes" className="text-xs gap-1.5"><MapPin className="h-3.5 w-3.5" /> Ecopontos Ativos</TabsTrigger>
          <TabsTrigger value="especifica" className="text-xs gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Coleta Específica</TabsTrigger>
          <TabsTrigger value="servicos" className="text-xs gap-1.5"><Truck className="h-3.5 w-3.5" /> Serviços</TabsTrigger>
          <TabsTrigger value="proibidos" className="text-xs gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Itens Proibidos</TabsTrigger>
        </TabsList>

        {/* ── Contenedores (dinâmico) ── */}
        <TabsContent value="contenedores" className="space-y-4 mt-4">
          {loadingCont ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contenedores.map((c: any) => {
                const IconComp = ICON_MAP[c.icone] || Recycle;
                return (
                  <Card key={c.id} className="shadow-sm overflow-hidden">
                    <div className={`h-2 ${COR_CLASS[c.cor] || "bg-muted"}`} />
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <IconComp className="h-4 w-4 text-foreground/60" />
                        {c.nome}
                      </CardTitle>
                      <CardDescription className="text-xs">{c.material}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">{c.descricao}</p>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Volumes Disponíveis</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {(c.volumes || []).map((v: string) => <Badge key={v} variant="outline" className="text-[10px] px-2">{v}</Badge>)}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Boas Práticas de Triagem</p>
                        <ul className="space-y-1">
                          {(c.boas_praticas || []).map((bp: string) => (
                            <li key={bp} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                              <span className="text-[hsl(var(--success))] mt-0.5">✓</span> {bp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Escala de Capacidade — Contenedores Especiais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { tipo: "Contenedor Padrão", faixa: "120L — 1.100L", uso: "Estabelecimentos de pequeno a médio porte", pct: 25 },
                  { tipo: "Contenedor Grande", faixa: "3m³ — 10m³", uso: "Centros comerciais, condomínios, hospitais", pct: 50 },
                  { tipo: "Compactador", faixa: "10m³ — 20m³", uso: "Indústrias, galpões logísticos", pct: 75 },
                  { tipo: "Roll-on/Roll-off", faixa: "20m³ — 36m³", uso: "Obras de construção, grandes geradores", pct: 100 },
                ].map((item) => (
                  <div key={item.tipo} className="flex items-center gap-4">
                    <div className="w-32 shrink-0">
                      <p className="text-xs font-semibold text-foreground">{item.tipo}</p>
                      <p className="text-[10px] text-muted-foreground">{item.faixa}</p>
                    </div>
                    <div className="flex-1"><Progress value={item.pct} className="h-2" /></div>
                    <p className="text-[10px] text-muted-foreground w-44 text-right shrink-0">{item.uso}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Ecopontos Ativos (dinâmico + mapa) ── */}
        <TabsContent value="localizacoes" className="space-y-4 mt-4">
          {loadingLoc ? (
            <Skeleton className="h-64 rounded-lg" />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="shadow-sm"><CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{localizacoes.length}</p>
                  <p className="text-[10px] text-muted-foreground">Ecopontos Ativos</p>
                </CardContent></Card>
                <Card className="shadow-sm"><CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{Object.keys(locByCity).length}</p>
                  <p className="text-[10px] text-muted-foreground">Cidades Atendidas</p>
                </CardContent></Card>
                <Card className="shadow-sm"><CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{[...new Set(localizacoes.map((l: any) => l.uf))].length}</p>
                  <p className="text-[10px] text-muted-foreground">Estados</p>
                </CardContent></Card>
                <Card className="shadow-sm"><CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {localizacoes.reduce((sum: number, l: any) => sum + (l.capacidade_litros || 0), 0).toLocaleString("pt-BR")}L
                  </p>
                  <p className="text-[10px] text-muted-foreground">Capacidade Total</p>
                </CardContent></Card>
              </div>

              {/* Mapa Interativo */}
              {(() => {
                const mapPoints = localizacoes.filter((l: any) => l.latitude && l.longitude);
                if (mapPoints.length === 0) return null;
                return (
                  <Card className="shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-xs flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Mapa de Ecopontos Ativos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <EcopontosMap points={mapPoints} />
                    </CardContent>
                  </Card>
                );
              })()}

              {Object.entries(locByCity).sort().map(([city, locs]) => (
                <Card key={city} className="shadow-sm">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> {city}
                      <Badge variant="outline" className="text-[9px] ml-1">{(locs as any[]).length} pontos</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] w-8">Tipo</TableHead>
                          <TableHead className="text-[10px]">Local</TableHead>
                          <TableHead className="text-[10px] hidden md:table-cell">Endereço</TableHead>
                          <TableHead className="text-[10px]">Capacidade</TableHead>
                          <TableHead className="text-[10px]">Nível</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(locs as any[]).map((l) => (
                          <TableRow key={l.id}>
                            <TableCell><div className={`w-3 h-3 rounded-full ${COR_CLASS[l.contenedores?.cor] || "bg-muted"}`} /></TableCell>
                            <TableCell className="text-[11px] font-medium">{l.nome_local}</TableCell>
                            <TableCell className="text-[11px] text-muted-foreground hidden md:table-cell">{l.endereco}</TableCell>
                            <TableCell className="text-[11px]">{l.capacidade_litros}L</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${l.nivel_preenchimento >= 80 ? "bg-red-500" : l.nivel_preenchimento >= 50 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${l.nivel_preenchimento}%` }} />
                                </div>
                                <span className="text-[9px] text-muted-foreground">{l.nivel_preenchimento}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* ── Coleta Específica ── */}
        <TabsContent value="especifica" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COLETA_ESPECIFICA.map((ce) => (
              <Card key={ce.tipo} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ce.icone className="h-4 w-4 text-[hsl(var(--warning))]" />
                    {ce.tipo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">Exemplos</p><p className="text-xs text-foreground">{ce.exemplos}</p></div>
                  <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">Procedimento</p><p className="text-xs text-foreground">{ce.procedimento}</p></div>
                  <Badge variant="outline" className="text-[9px] mt-1">{ce.regulamentacao}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Serviços ── */}
        <TabsContent value="servicos" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Serviços Disponíveis para Pontos de Coleta Credenciados</CardTitle>
              <CardDescription className="text-xs">Baseados no catálogo da ARP-GAN (Bruxelles-Propreté Pro), adaptados ao contexto brasileiro.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs font-semibold">Serviço</TableHead>
                  <TableHead className="text-xs font-semibold">Descrição</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">Referência</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {SERVICOS_COMPLEMENTARES.map((s) => (
                    <TableRow key={s.nome}>
                      <TableCell className="text-xs font-medium align-top">{s.nome}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.descricao}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground hidden md:table-cell">{s.referencia}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
                Fluxo Operacional — Da Coleta à Cooperativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                {[
                  { etapa: "1. Recepção", desc: "Cidadão entrega material no Ponto de Coleta", icone: "📥" },
                  { etapa: "2. Pesagem", desc: "Aferição do peso em balança calibrada", icone: "⚖️" },
                  { etapa: "3. Triagem", desc: "Classificação por tipo de material e contenedor", icone: "🔍" },
                  { etapa: "4. Armazenamento", desc: "Contenedor apropriado por cor/fração", icone: "📦" },
                  { etapa: "5. Despacho", desc: "Envio consolidado para cooperativa credenciada", icone: "🚛" },
                ].map((e, i) => (
                  <div key={e.etapa} className="flex-1 relative">
                    <div className="bg-muted/30 rounded-lg border border-border p-3 text-center h-full flex flex-col justify-center">
                      <span className="text-2xl mb-1">{e.icone}</span>
                      <p className="text-[10px] font-bold text-foreground">{e.etapa}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{e.desc}</p>
                    </div>
                    {i < 4 && <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-muted-foreground/40 text-lg">→</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Itens Proibidos ── */}
        <TabsContent value="proibidos" className="space-y-4 mt-4">
          <Card className="shadow-sm border-l-4 border-l-[hsl(var(--destructive))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--destructive))]">
                <AlertTriangle className="h-4 w-4" /> Resíduos NÃO Aceitos em Pontos de Coleta
              </CardTitle>
              <CardDescription className="text-xs">
                Os materiais abaixo requerem destinação especializada. Descarte irregular sujeito a multas (Lei 12.305/2010).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RESIDUOS_PROIBIDOS.map((r) => (
                  <div key={r} className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(var(--destructive)/0.05)] border border-[hsl(var(--destructive)/0.15)]">
                    <span className="text-[hsl(var(--destructive))] text-sm shrink-0">✕</span>
                    <span className="text-xs text-foreground">{r}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Penalidades por Descarte Irregular</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs font-semibold">Infração</TableHead>
                  <TableHead className="text-xs font-semibold">Base Legal</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Multa</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {[
                    { infracao: "Resíduo perigoso em contenedor comum", base: "PNRS Art. 51", multa: "R$ 5.000 — R$ 50.000.000" },
                    { infracao: "Resíduo hospitalar sem tratamento", base: "RDC ANVISA 222/2018", multa: "R$ 2.000 — R$ 1.500.000" },
                    { infracao: "Uso de sacolas comerciais não certificadas", base: "Decreto Municipal", multa: "R$ 500 — R$ 5.000" },
                    { infracao: "Descarte de eletrônicos em vias públicas", base: "PNRS Art. 33 §6º", multa: "R$ 500 — R$ 500.000" },
                  ].map((s) => (
                    <TableRow key={s.infracao}>
                      <TableCell className="text-xs">{s.infracao}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.base}</TableCell>
                      <TableCell className="text-xs text-right font-medium">{s.multa}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PontoColetaServicos;
