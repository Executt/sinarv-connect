import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ScatterChart, Scatter,
} from "recharts";
import L from "leaflet";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Trash2, Recycle, TrendingDown, DollarSign, MapPin, MapPinOff, RefreshCw, PlusCircle, Loader2, AlertTriangle, CheckCircle2, ShieldCheck, Search, Radio, FileDown, Link2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SolicitarImportacaoDialog } from "@/components/lixoes/SolicitarImportacaoDialog";
import { LixoesErrorBoundary } from "@/components/lixoes/LixoesErrorBoundary";
import ConformidadePNRS, { useLixoesPnrs } from "@/components/lixoes/ConformidadePNRS";
import RoteiroEncerramento from "@/components/lixoes/RoteiroEncerramento";
import DiagnosticoMunic from "@/components/lixoes/DiagnosticoMunic";
import AlertasPrazos from "@/components/lixoes/AlertasPrazos";
import MapaRegional from "@/components/lixoes/MapaRegional";
import CentroAlertas from "@/components/lixoes/CentroAlertas";
import DetalheMunicipio from "@/components/lixoes/DetalheMunicipio";
import { capturarElemento, gerarRelatorioPDF } from "@/lib/lixoes-report";
import { downloadCSV } from "@/lib/residuos-criticos";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";


const FIORI_BLUE = "#0A6ED1";
const FIORI_GREEN = "#107E3E";
const FIORI_ORANGE = "#E9730C";
const FIORI_RED = "#BB0000";
const FIORI_GRAY = "#6B7280";

const STATUS_COLOR: Record<string, string> = {
  ativo: FIORI_RED,
  em_encerramento: FIORI_ORANGE,
  encerrado: FIORI_BLUE,
  recuperado: FIORI_GREEN,
};

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  em_encerramento: "Em encerramento",
  encerrado: "Encerrado",
  recuperado: "Recuperado",
};

const TIPO_LABEL: Record<string, string> = {
  lixao: "Lixão",
  aterro_controlado: "Aterro Controlado",
  aterro_sanitario: "Aterro Sanitário",
  transbordo: "Transbordo",
};

const fmtNum = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

type Lixao = {
  id: string;
  nome: string;
  uf: string;
  municipio: string;
  latitude: number;
  longitude: number;
  tipo: string;
  status: string;
  area_ha: number | null;
  volume_estocado_m3_inicial: number | null;
  data_encerramento_real: string | null;
};

type Hist = {
  lixao_id: string;
  mes_referencia: string;
  volume_estocado_m3: number;
  volume_removido_m3: number;
  volume_recuperado_m3: number;
};

type Correlacao = {
  uf: string;
  lixoes_ativos: number;
  lixoes_em_encerramento: number;
  lixoes_encerrados: number;
  lixoes_recuperados: number;
  volume_inicial_m3_total: number;
  volume_estocado_m3_total: number;
  volume_removido_m3_total: number;
  volume_recuperado_m3_total: number;
  taxa_reducao_pct: number;
  volume_reciclado_ton_uf: number;
  taxa_desvio_aterro_uf: number;
  correlacao_reciclagem_pct: number;
  economia_estimada_rs: number;
};

type LixoesMapProps = {
  lixoes: Lixao[];
  onSelectLixao: (id: string) => void;
  onReload?: () => void;
};

const hasValidCoords = (l: Lixao) => {
  const lat = Number(l.latitude);
  const lng = Number(l.longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

const LixoesLeafletMap = ({ lixoes, onSelectLixao }: LixoesMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerGroupRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const brazilBounds = L.latLngBounds([-33.75, -73.99], [5.27, -34.79]);
    const map = L.map(containerRef.current, {
      center: [-14.235, -51.9253],
      zoom: 4,
      minZoom: 4,
      maxZoom: 10,
      scrollWheelZoom: true,
      maxBounds: brazilBounds,
      maxBoundsViscosity: 1.0,
    });
    map.fitBounds(brazilBounds);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      bounds: brazilBounds,
      noWrap: true,
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

    lixoes.forEach((lixao) => {
      const latitude = Number(lixao.latitude);
      const longitude = Number(lixao.longitude);
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) return;

      const areaHa = Number(lixao.area_ha);
      const radiusBase = Number.isFinite(areaHa) && areaHa > 0 ? areaHa : 30;

      bounds.push([latitude, longitude]);

      const marker = L.circleMarker([latitude, longitude], {
        radius: Math.max(6, Math.min(20, Math.sqrt(radiusBase) * 1.2)),
        color: STATUS_COLOR[lixao.status] ?? FIORI_GRAY,
        fillColor: STATUS_COLOR[lixao.status] ?? FIORI_GRAY,
        fillOpacity: 0.55,
        weight: 2,
      });

      marker.on("click", () => onSelectLixao(lixao.id));

      const popup = document.createElement("div");
      popup.className = "space-y-1";

      const title = document.createElement("div");
      title.className = "font-semibold";
      title.textContent = lixao.nome;
      popup.appendChild(title);

      const location = document.createElement("div");
      location.className = "text-xs";
      location.textContent = `${lixao.municipio} — ${lixao.uf}`;
      popup.appendChild(location);

      const metadata = document.createElement("div");
      metadata.className = "text-xs flex flex-wrap gap-1";
      const tipo = document.createElement("span");
      tipo.className = "inline-flex items-center rounded-md border px-2 py-0.5";
      tipo.textContent = TIPO_LABEL[lixao.tipo] ?? lixao.tipo;
      const status = document.createElement("span");
      status.className = "inline-flex items-center rounded-md px-2 py-0.5 text-white";
      status.style.backgroundColor = STATUS_COLOR[lixao.status] ?? FIORI_GRAY;
      status.textContent = STATUS_LABEL[lixao.status] ?? lixao.status;
      metadata.append(tipo, status);
      popup.appendChild(metadata);

      if (lixao.area_ha) {
        const area = document.createElement("div");
        area.className = "text-xs";
        area.textContent = `Área: ${lixao.area_ha} ha`;
        popup.appendChild(area);
      }

      if (lixao.volume_estocado_m3_inicial) {
        const volume = document.createElement("div");
        volume.className = "text-xs";
        volume.textContent = `Volume inicial: ${fmtNum(Number(lixao.volume_estocado_m3_inicial))} m³`;
        popup.appendChild(volume);
      }

      if (lixao.data_encerramento_real) {
        const encerramento = document.createElement("div");
        encerramento.className = "text-xs text-muted-foreground";
        encerramento.textContent = `Encerrado em ${new Date(lixao.data_encerramento_real).toLocaleDateString("pt-BR")}`;
        popup.appendChild(encerramento);
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "mt-2 text-xs font-medium text-primary hover:underline";
      button.textContent = "Ver detalhes →";
      button.addEventListener("click", () => onSelectLixao(lixao.id));
      popup.appendChild(button);

      marker.bindPopup(popup);
      marker.addTo(layerGroup);
    });

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [28, 28], maxZoom: 5 });
    }

    setTimeout(() => map.invalidateSize(), 0);
  }, [lixoes, onSelectLixao]);

  return <div ref={containerRef} className="h-full w-full" aria-label="Mapa nacional de lixões e aterros" />;
};

const DashboardLixoesInner = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtroUF, setFiltroUF] = useState<string>(searchParams.get("uf") ?? "todas");
  const [filtroStatus, setFiltroStatus] = useState<string>(searchParams.get("status") ?? "todos");
  const [busca, setBusca] = useState(searchParams.get("q") ?? "");
  const [aba, setAba] = useState(searchParams.get("tab") ?? "mapa");
  const [pagina, setPagina] = useState(1);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [selectedLixaoId, setSelectedLixaoId] = useState<string | null>(null);
  const [municipioDetalheId, setMunicipioDetalheId] = useState<string | null>(searchParams.get("municipio"));
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const porPagina = 10;

  useEffect(() => {
    const p = new URLSearchParams();
    if (filtroUF !== "todas") p.set("uf", filtroUF);
    if (filtroStatus !== "todos") p.set("status", filtroStatus);
    if (busca.trim()) p.set("q", busca.trim());
    if (aba !== "mapa") p.set("tab", aba);
    if (municipioDetalheId) p.set("municipio", municipioDetalheId);
    setSearchParams(p, { replace: true });
  }, [filtroUF, filtroStatus, busca, aba, municipioDetalheId, setSearchParams]);

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copiado", description: "A visualização atual (filtros, aba e município) foi copiada." });
    } catch {
      toast({ title: "Não foi possível copiar", description: window.location.href, variant: "destructive" });
    }
  };

  const { data: pnrsRelatorio = [] } = useLixoesPnrs();
  const { data: etapasRelatorio = [] } = useQuery({
    queryKey: ["lixoes-etapas-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixao_encerramento_etapas")
        .select("id,lixao_id,ordem,etapa,situacao,responsavel,data_prevista,data_conclusao")
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string; lixao_id: string; ordem: number; etapa: string; situacao: string;
        responsavel: string | null; data_prevista: string | null; data_conclusao: string | null;
      }[];
    },
  });


  const { roles, isSuperAdmin } = useAuth();
  const activeRole = isSuperAdmin ? "super_admin" : roles.includes("gov") ? "gov" : (roles[0] ?? "desconhecida");

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.info("[DashboardLixoes] Role ativa:", activeRole, "| Roles do usuário:", roles);
  }, [activeRole, roles]);

  const lixoesQuery = useQuery({
    queryKey: ["lixoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixoes" as any)
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as Lixao[];
    },
  });
  const lixoes = lixoesQuery.data ?? [];

  const historicoQuery = useQuery({
    queryKey: ["lixao_volume_historico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lixao_volume_historico" as any)
        .select("*")
        .order("mes_referencia", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Hist[];
    },
  });
  const historico = historicoQuery.data ?? [];

  const correlacaoQuery = useQuery({
    queryKey: ["vw_lixoes_correlacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_lixoes_correlacao" as any)
        .select("*")
        .order("volume_estocado_m3_total", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Correlacao[];
    },
  });
  const correlacao = correlacaoQuery.data ?? [];

  const isLoading = lixoesQuery.isLoading || historicoQuery.isLoading || correlacaoQuery.isLoading;
  const loadError = lixoesQuery.error || historicoQuery.error || correlacaoQuery.error;

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.info("[DashboardLixoes] Status API:", {
      lixoes: lixoesQuery.status,
      historico: historicoQuery.status,
      correlacao: correlacaoQuery.status,
      count: lixoes.length,
    });
  }, [lixoesQuery.status, historicoQuery.status, correlacaoQuery.status, lixoes.length]);

  const reloadAll = () => {
    lixoesQuery.refetch();
    historicoQuery.refetch();
    correlacaoQuery.refetch();
  };

  // Realtime: atualiza a lista quando houver mudanças nos dados de lixões
  useEffect(() => {
    const channel = supabase
      .channel("lixoes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "lixoes" }, () => {
        setUltimaAtualizacao(new Date());
        lixoesQuery.refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "lixao_volume_historico" }, () => {
        setUltimaAtualizacao(new Date());
        historicoQuery.refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "lixao_encerramento_etapas" }, () => {
        setUltimaAtualizacao(new Date());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ufs = useMemo(
    () => Array.from(new Set(lixoes.map((l) => l.uf))).sort(),
    [lixoes]
  );

  const lixoesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return lixoes.filter(
      (l) =>
        (filtroUF === "todas" || l.uf === filtroUF) &&
        (filtroStatus === "todos" || l.status === filtroStatus) &&
        (termo === "" ||
          l.municipio?.toLowerCase().includes(termo) ||
          l.uf?.toLowerCase().includes(termo) ||
          l.nome?.toLowerCase().includes(termo))
    );
  }, [lixoes, filtroUF, filtroStatus, busca]);

  useEffect(() => {
    setPagina(1);
  }, [filtroUF, filtroStatus, busca]);

  const totalPaginas = Math.max(1, Math.ceil(lixoesFiltrados.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const lixoesPaginados = useMemo(
    () => lixoesFiltrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina),
    [lixoesFiltrados, paginaAtual]
  );

  // KPIs nacionais
  const kpis = useMemo(() => {
    const totalLixoes = lixoes.length;
    const ativos = lixoes.filter((l) => l.status === "ativo" || l.status === "em_encerramento").length;
    const totalRemovido = correlacao.reduce((s, c) => s + Number(c.volume_removido_m3_total || 0), 0);
    const totalEconomia = correlacao.reduce((s, c) => s + Number(c.economia_estimada_rs || 0), 0);
    const reducaoMedia =
      correlacao.length > 0
        ? correlacao.reduce((s, c) => s + Number(c.taxa_reducao_pct || 0), 0) / correlacao.length
        : 0;
    return { totalLixoes, ativos, totalRemovido, totalEconomia, reducaoMedia };
  }, [lixoes, correlacao]);

  // Série temporal nacional
  const serieTemporal = useMemo(() => {
    const map = new Map<string, { mes: string; estocado: number; removido: number; recuperado: number }>();
    historico.forEach((h) => {
      const key = h.mes_referencia?.substring(0, 7);
      if (!key) return;
      const cur = map.get(key) ?? { mes: key, estocado: 0, removido: 0, recuperado: 0 };
      cur.estocado += Number(h.volume_estocado_m3);
      cur.removido += Number(h.volume_removido_m3);
      cur.recuperado += Number(h.volume_recuperado_m3);
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [historico]);

  // Dispersão: remoção vs reciclagem por UF
  const scatterData = useMemo(
    () =>
      correlacao.map((c) => ({
        uf: c.uf,
        x: Number(c.volume_removido_m3_total) / 1000, // mil m³
        y: Number(c.volume_reciclado_ton_uf) / 1000, // mil ton
      })),
    [correlacao]
  );

  // --- Detail panel data for selected landfill ---
  const selectedLixao = useMemo(
    () => lixoes.find((l) => l.id === selectedLixaoId) ?? null,
    [lixoes, selectedLixaoId]
  );

  const selectedHistorico = useMemo(() => {
    if (!selectedLixaoId) return [];
    return historico
      .filter((h) => h.lixao_id === selectedLixaoId && h.mes_referencia)
      .map((h) => ({
        mes: h.mes_referencia.substring(0, 7),
        estocado: Number(h.volume_estocado_m3),
        removido: Number(h.volume_removido_m3),
        recuperado: Number(h.volume_recuperado_m3),
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [historico, selectedLixaoId]);

  const selectedKpis = useMemo(() => {
    if (!selectedLixao || selectedHistorico.length === 0) {
      return { atual: 0, inicial: 0, reducao: 0, removidoAcum: 0, recuperadoAcum: 0, taxaRecup: 0 };
    }
    const inicial =
      Number(selectedLixao.volume_estocado_m3_inicial) ||
      selectedHistorico[0].estocado;
    const atual = selectedHistorico[selectedHistorico.length - 1].estocado;
    const reducao = inicial > 0 ? ((inicial - atual) / inicial) * 100 : 0;
    const removidoAcum = selectedHistorico.reduce((s, h) => s + h.removido, 0);
    const recuperadoAcum = selectedHistorico.reduce((s, h) => s + h.recuperado, 0);
    const taxaRecup = removidoAcum > 0 ? (recuperadoAcum / removidoAcum) * 100 : 0;
    return { atual, inicial, reducao, removidoAcum, recuperadoAcum, taxaRecup };
  }, [selectedLixao, selectedHistorico]);

  const selectedUFCorrelacao = useMemo(
    () => (selectedLixao ? correlacao.find((c) => c.uf === selectedLixao.uf) ?? null : null),
    [correlacao, selectedLixao]
  );

  return (
    <div className="space-y-6" data-testid="dashboard-lixoes-root" data-role={activeRole}>
      {/* Indicador de role + status API */}
      <div
        className="flex flex-wrap items-center gap-2 text-xs"
        data-testid="lixoes-status-bar"
        data-loading={isLoading ? "true" : "false"}
        data-error={loadError ? "true" : "false"}
      >
        <Badge variant="outline" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          Perfil: <span className="font-semibold ml-1">{activeRole}</span>
        </Badge>
        {isLoading ? (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Carregando dados…
          </Badge>
        ) : loadError ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Erro ao carregar dados
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" style={{ color: FIORI_GREEN }} />
            Dados carregados ({lixoes.length} lixões)
          </Badge>
        )}
        <Badge variant="outline" className="gap-1">
          <Radio className="h-3 w-3" style={{ color: FIORI_GREEN }} />
          {ultimaAtualizacao
            ? `Atualizado em tempo real às ${ultimaAtualizacao.toLocaleTimeString("pt-BR")}`
            : "Realtime ativo"}
        </Badge>
        <Button variant="ghost" size="sm" onClick={reloadAll} className="h-7 gap-1 px-2">
          <RefreshCw className="h-3 w-3" />
          Atualizar
        </Button>
      </div>

      {loadError && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Falha ao carregar dados da API</p>
              <p className="text-xs text-muted-foreground">
                {(loadError as Error)?.message ?? "Erro desconhecido ao consultar o banco."}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={reloadAll} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio — nenhum lixão cadastrado */}
      {lixoes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <MapPinOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Nenhum lixão cadastrado</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Os dados de lixões e aterros ainda não foram importados para o painel.
                Verifique a conexão com o banco de dados ou solicite a carga inicial dos dados.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar página
              </Button>
              <SolicitarImportacaoDialog />

            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lixões cadastrados</p>
                <p className="text-2xl font-bold">{kpis.totalLixoes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.ativos} ativos / em encerramento
                </p>
              </div>
              <Trash2 className="h-8 w-8" style={{ color: FIORI_RED }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volume removido (m³/mês)</p>
                <p className="text-2xl font-bold">{fmtNum(kpis.totalRemovido)}</p>
              </div>
              <Recycle className="h-8 w-8" style={{ color: FIORI_BLUE }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Redução média</p>
                <p className="text-2xl font-bold">{kpis.reducaoMedia.toFixed(1)}%</p>
              </div>
              <TrendingDown className="h-8 w-8" style={{ color: FIORI_GREEN }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Economia estimada</p>
                <p className="text-2xl font-bold">{fmtBRL(kpis.totalEconomia)}</p>
                <p className="text-xs text-muted-foreground mt-1">Custo de aterro evitado</p>
              </div>
              <DollarSign className="h-8 w-8" style={{ color: FIORI_ORANGE }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <div className="min-w-[180px]">
            <label className="text-sm text-muted-foreground">UF</label>
            <Select value={filtroUF} onValueChange={setFiltroUF}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {ufs.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px]">
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[260px] flex-1">
            <label className="text-sm text-muted-foreground">Buscar município / UF / área</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Ex.: Manaus, AM, Lixão da Estrutural"
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={copiarLink}>
              <Link2 className="h-4 w-4" /> Copiar link da visualização
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroUF("todas");
                setFiltroStatus("todos");
                setBusca("");
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={aba} onValueChange={setAba} className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="regional">Mapa regional</TabsTrigger>
          <TabsTrigger value="alertas">Alertas de prazo</TabsTrigger>
          <TabsTrigger value="centro-alertas">Centro de alertas</TabsTrigger>
          <TabsTrigger value="temporal">Série temporal</TabsTrigger>
          <TabsTrigger value="correlacao">Correlação UF</TabsTrigger>
          <TabsTrigger value="tabela">Tabela</TabsTrigger>
          <TabsTrigger value="pnrs">Conformidade PNRS</TabsTrigger>
          <TabsTrigger value="roteiro">Roteiro de encerramento</TabsTrigger>
          <TabsTrigger value="munic">Diagnóstico MUNIC</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* MAPA REGIONAL (coroplético) */}
        <TabsContent value="regional">
          <MapaRegional
            indicadores={correlacao}
            municipios={lixoesFiltrados
              .filter(hasValidCoords)
              .map((l) => ({
                id: l.id,
                nome: l.nome,
                municipio: l.municipio,
                uf: l.uf,
                latitude: Number(l.latitude),
                longitude: Number(l.longitude),
                status: l.status,
              }))}
            onSelectUF={(uf) => setFiltroUF(uf)}
            onSelectMunicipio={setMunicipioDetalheId}
          />
        </TabsContent>

        {/* ALERTAS DE PRAZO */}
        <TabsContent value="alertas">
          <AlertasPrazos lixoes={lixoes} onSelectLixao={setSelectedLixaoId} />
        </TabsContent>

        {/* CENTRO DE ALERTAS */}
        <TabsContent value="centro-alertas">
          <CentroAlertas lixoes={lixoes} onSelectLixao={setMunicipioDetalheId} />
        </TabsContent>

        {/* RELATÓRIOS */}
        <TabsContent value="relatorios">
          <Card>
            <CardHeader>
              <CardTitle>Relatório consolidado em PDF</CardTitle>
              <p className="text-xs text-muted-foreground">
                Gera um PDF com o mapa regional exibido, os filtros ativos, os números principais e a
                relação das áreas monitoradas conforme a seleção atual.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">UF: {filtroUF === "todas" ? "Todas" : filtroUF}</Badge>
                <Badge variant="outline">
                  Situação: {filtroStatus === "todos" ? "Todas" : STATUS_LABEL[filtroStatus] ?? filtroStatus}
                </Badge>
                <Badge variant="outline">Busca: {busca.trim() || "—"}</Badge>
                <Badge variant="outline">{lixoesFiltrados.length} área(s)</Badge>
              </div>
              <Button
                className="gap-2"
                disabled={gerandoPDF}
                onClick={async () => {
                  setGerandoPDF(true);
                  try {
                    const mapaDataUrl = await capturarElemento(
                      document.getElementById("mapa-regional-lixoes")
                    );
                    gerarRelatorioPDF({
                      titulo: "Relatório do Módulo Lixões",
                      subtitulo: filtroUF === "todas" ? "Panorama nacional" : `Recorte ${filtroUF}`,
                      usuario: user?.email ?? "usuário autenticado",
                      fonteDados: "SINARV · base MUNIC/IBGE 2023 e registros do módulo Lixões",
                      filtros: {
                        UF: filtroUF === "todas" ? "Todas" : filtroUF,
                        Situação:
                          filtroStatus === "todos" ? "Todas" : STATUS_LABEL[filtroStatus] ?? filtroStatus,
                        Busca: busca.trim() || "Nenhuma",
                        "Áreas no recorte": String(lixoesFiltrados.length),
                      },
                      numeros: [
                        { rotulo: "Áreas monitoradas", valor: String(kpis.totalLixoes) },
                        { rotulo: "Ativas / em encerramento", valor: String(kpis.ativos) },
                        {
                          rotulo: "Volume removido",
                          valor: `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(kpis.totalRemovido)} m³`,
                        },
                        { rotulo: "Redução média", valor: `${kpis.reducaoMedia.toFixed(1)}%` },
                      ],
                      mapaDataUrl,
                      tabelas: [
                        {
                          titulo: "Áreas monitoradas (filtro atual)",
                          linhas: lixoesFiltrados.map((l) => ({
                            Area: l.nome,
                            Municipio: l.municipio,
                            UF: l.uf,
                            Situacao: STATUS_LABEL[l.status] ?? l.status,
                          })),
                        },
                        {
                          titulo: "Indicadores por UF",
                          linhas: correlacao.map((c) => ({
                            UF: c.uf,
                            Lixoes_ativos: c.lixoes_ativos,
                            Volume_removido_m3: Number(c.volume_removido_m3_total).toFixed(0),
                            Taxa_reducao_pct: Number(c.taxa_reducao_pct).toFixed(1),
                            Reciclado_ton: Number(c.volume_reciclado_ton_uf).toFixed(0),
                          })),
                        },
                      ],
                    });
                  } finally {
                    setGerandoPDF(false);
                  }
                }}
              >
                <FileDown className="h-4 w-4" />
                {gerandoPDF ? "Gerando…" : "Gerar PDF com mapa e filtros"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Dica: abra a aba “Mapa regional” e escolha a perspectiva desejada antes de gerar — a
                imagem capturada reflete exatamente o que estiver renderizado.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Exportação em CSV</CardTitle>
              <p className="text-xs text-muted-foreground">
                Baixe os mesmos dados exibidos nesta aba em planilha, respeitando o filtro de UF ativo.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" disabled={correlacao.length === 0}
                onClick={() =>
                  downloadCSV(
                    `lixoes-indicadores-uf-${new Date().toISOString().slice(0, 10)}.csv`,
                    correlacao.map((c) => ({
                      UF: c.uf,
                      Lixoes_ativos: c.lixoes_ativos,
                      Volume_removido_m3: Number(c.volume_removido_m3_total).toFixed(0),
                      Taxa_reducao_pct: Number(c.taxa_reducao_pct).toFixed(1),
                      Reciclado_ton: Number(c.volume_reciclado_ton_uf).toFixed(0),
                    })),
                  )
                }>
                <Download className="h-4 w-4" /> Indicadores do mapa (por UF)
              </Button>
              <Button variant="outline" className="gap-2" disabled={pnrsRelatorio.length === 0}
                onClick={() =>
                  downloadCSV(
                    `lixoes-conformidade-pnrs-${new Date().toISOString().slice(0, 10)}.csv`,
                    pnrsRelatorio
                      .filter((p) => filtroUF === "todas" || p.uf === filtroUF)
                      .map((p) => ({
                        Area: p.nome,
                        Municipio: p.municipio,
                        UF: p.uf,
                        Populacao: p.populacao_municipio ?? "",
                        Prazo_legal_PNRS: p.prazo_legal_pnrs ?? "",
                        Situacao_PNRS: p.situacao_pnrs,
                      })),
                  )
                }>
                <Download className="h-4 w-4" /> Conformidade PNRS
              </Button>
              <Button variant="outline" className="gap-2" disabled={etapasRelatorio.length === 0}
                onClick={() => {
                  const nomes = new Map(lixoes.map((l) => [l.id, `${l.nome} — ${l.municipio}/${l.uf}`]));
                  const ufs = new Map(lixoes.map((l) => [l.id, l.uf]));
                  downloadCSV(
                    `lixoes-roteiro-encerramento-${new Date().toISOString().slice(0, 10)}.csv`,
                    etapasRelatorio
                      .filter((e) => filtroUF === "todas" || ufs.get(e.lixao_id) === filtroUF)
                      .map((e) => ({
                        Area: nomes.get(e.lixao_id) ?? "—",
                        Ordem: e.ordem,
                        Etapa: e.etapa,
                        Situacao: e.situacao,
                        Responsavel: e.responsavel ?? "",
                        Data_prevista: e.data_prevista ?? "",
                        Data_conclusao: e.data_conclusao ?? "",
                      })),
                  );
                }}>
                <Download className="h-4 w-4" /> Status do Roteiro de Encerramento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>




        {/* MAPA */}
        <TabsContent value="mapa">
          <Card>
            <CardHeader>
              <CardTitle>Mapa nacional de lixões e aterros</CardTitle>
              <div className="flex flex-wrap gap-3 pt-2 text-xs">
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ background: STATUS_COLOR[k] }}
                    />
                    {v}
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const validos = lixoesFiltrados.filter(hasValidCoords);
                if (validos.length === 0) {
                  return (
                    <div
                      data-testid="lixoes-map-fallback"
                      style={{ height: 560 }}
                      className="rounded-md border border-dashed flex flex-col items-center justify-center text-center gap-3 p-6"
                    >
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                        <MapPinOff className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Sem coordenadas válidas para exibir no mapa</p>
                        <p className="text-xs text-muted-foreground max-w-md">
                          {lixoes.length === 0
                            ? "Nenhum lixão foi retornado pela API."
                            : "Os registros existentes não possuem latitude/longitude válidas ou não passaram nos filtros."}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button size="sm" variant="outline" onClick={reloadAll} className="gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Recarregar dados
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setFiltroUF("todas");
                            setFiltroStatus("todos");
                          }}
                        >
                          Limpar filtros
                        </Button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div style={{ height: 560, width: "100%" }} className="rounded-md overflow-hidden border">
                    <LixoesLeafletMap lixoes={validos} onSelectLixao={setSelectedLixaoId} />
                  </div>
                );
              })()}
            </CardContent>

          </Card>
        </TabsContent>

        {/* SÉRIE TEMPORAL */}
        <TabsContent value="temporal">
          <Card>
            <CardHeader>
              <CardTitle>Volume estocado × removido × recuperado (m³/mês)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={serieTemporal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                  <Tooltip formatter={(v: number) => `${fmtNum(v)} m³`} />
                  <Legend />
                  <Line type="monotone" dataKey="estocado" stroke={FIORI_RED} name="Estocado" strokeWidth={2} />
                  <Line type="monotone" dataKey="removido" stroke={FIORI_BLUE} name="Removido" strokeWidth={2} />
                  <Line type="monotone" dataKey="recuperado" stroke={FIORI_GREEN} name="Recuperado para reciclagem" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CORRELAÇÃO */}
        <TabsContent value="correlacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Remoção de lixões × Reciclagem por UF</CardTitle>
              <p className="text-xs text-muted-foreground">
                Cada ponto representa um estado. Quanto mais à direita, maior o volume removido dos lixões; quanto mais alto, maior o volume reciclado.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={360}>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Removido"
                    unit=" mil m³"
                    label={{ value: "Volume removido (mil m³)", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Reciclado"
                    unit=" mil ton"
                    label={{ value: "Reciclado (mil ton)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(v: number, n: string) =>
                      n === "Reciclado" ? `${v.toFixed(1)} mil ton` : `${v.toFixed(1)} mil m³`
                    }
                    labelFormatter={(_, p) => p?.[0]?.payload?.uf ?? ""}
                  />
                  <Scatter data={scatterData} fill={FIORI_BLUE} />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxa de redução do estoque por UF (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={correlacao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="uf" />
                  <YAxis unit="%" />
                  <Tooltip formatter={(v: number) => `${Number(v).toFixed(2)}%`} />
                  <Bar dataKey="taxa_reducao_pct" fill={FIORI_GREEN} name="Redução de volume" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TABELA */}
        <TabsContent value="tabela" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Áreas monitoradas</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {lixoesFiltrados.length} resultado(s) para os filtros e a busca atuais.
                </p>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área</TableHead>
                    <TableHead>Município / UF</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Área (ha)</TableHead>
                    <TableHead className="text-right">Volume inicial (m³)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lixoesPaginados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        Nenhuma área encontrada para os filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lixoesPaginados.map((l) => (
                      <TableRow key={l.id} className="cursor-pointer" onClick={() => setSelectedLixaoId(l.id)}>
                        <TableCell className="font-medium">{l.nome}</TableCell>
                        <TableCell>{l.municipio} / {l.uf}</TableCell>
                        <TableCell>{TIPO_LABEL[l.tipo] ?? l.tipo}</TableCell>
                        <TableCell>
                          <Badge style={{ background: STATUS_COLOR[l.status], color: "#fff" }}>
                            {STATUS_LABEL[l.status] ?? l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{l.area_ha ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          {l.volume_estocado_m3_inicial ? fmtNum(Number(l.volume_estocado_m3_inicial)) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Página {paginaAtual} de {totalPaginas}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={paginaAtual <= 1}
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={paginaAtual >= totalPaginas}
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Correlação detalhada por UF</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UF</TableHead>
                    <TableHead className="text-right">Ativos</TableHead>
                    <TableHead className="text-right">Em encerr.</TableHead>
                    <TableHead className="text-right">Encerrados</TableHead>
                    <TableHead className="text-right">Estocado (m³)</TableHead>
                    <TableHead className="text-right">Removido (m³)</TableHead>
                    <TableHead className="text-right">Redução</TableHead>
                    <TableHead className="text-right">Reciclado (ton)</TableHead>
                    <TableHead className="text-right">Correl. reciclagem</TableHead>
                    <TableHead className="text-right">Economia (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {correlacao.map((c) => (
                    <TableRow key={c.uf}>
                      <TableCell className="font-medium">{c.uf}</TableCell>
                      <TableCell className="text-right">{c.lixoes_ativos}</TableCell>
                      <TableCell className="text-right">{c.lixoes_em_encerramento}</TableCell>
                      <TableCell className="text-right">{c.lixoes_encerrados}</TableCell>
                      <TableCell className="text-right">{fmtNum(Number(c.volume_estocado_m3_total))}</TableCell>
                      <TableCell className="text-right">{fmtNum(Number(c.volume_removido_m3_total))}</TableCell>
                      <TableCell className="text-right" style={{ color: FIORI_GREEN }}>
                        {Number(c.taxa_reducao_pct).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">{fmtNum(Number(c.volume_reciclado_ton_uf))}</TableCell>
                      <TableCell className="text-right">{Number(c.correlacao_reciclagem_pct).toFixed(1)}%</TableCell>
                      <TableCell className="text-right" style={{ color: FIORI_ORANGE }}>
                        {fmtBRL(Number(c.economia_estimada_rs))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* CONFORMIDADE PNRS */}
        <TabsContent value="pnrs">
          <ConformidadePNRS onSelectLixao={setSelectedLixaoId} />
        </TabsContent>

        {/* ROTEIRO DE ENCERRAMENTO */}
        <TabsContent value="roteiro">
          <RoteiroEncerramento lixoes={lixoesFiltrados} />
        </TabsContent>

        {/* DIAGNÓSTICO MUNIC */}
        <TabsContent value="munic">
          <DiagnosticoMunic />
        </TabsContent>
      </Tabs>

      {/* === Painel de detalhes do município selecionado no mapa regional === */}
      <DetalheMunicipio lixaoId={municipioDetalheId} onClose={() => setMunicipioDetalheId(null)} />



      {/* === Painel de detalhes do lixão === */}
      <Sheet open={!!selectedLixao} onOpenChange={(o) => !o && setSelectedLixaoId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {selectedLixao && (
            <>
              <SheetHeader className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-0.5" style={{ color: STATUS_COLOR[selectedLixao.status] }} />
                  <div className="flex-1">
                    <SheetTitle>{selectedLixao.nome}</SheetTitle>
                    <SheetDescription>
                      {selectedLixao.municipio} — {selectedLixao.uf}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{TIPO_LABEL[selectedLixao.tipo]}</Badge>
                  <Badge style={{ background: STATUS_COLOR[selectedLixao.status], color: "#fff" }}>
                    {STATUS_LABEL[selectedLixao.status]}
                  </Badge>
                  {selectedLixao.area_ha && (
                    <Badge variant="secondary">{selectedLixao.area_ha} ha</Badge>
                  )}
                </div>
              </SheetHeader>

              {/* KPIs do lixão */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Volume inicial</p>
                    <p className="text-lg font-bold">{fmtNum(selectedKpis.inicial)} m³</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Volume atual</p>
                    <p className="text-lg font-bold">{fmtNum(selectedKpis.atual)} m³</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Taxa de redução</p>
                    <p className="text-lg font-bold" style={{ color: FIORI_GREEN }}>
                      {selectedKpis.reducao.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Recuperação p/ reciclagem</p>
                    <p className="text-lg font-bold" style={{ color: FIORI_BLUE }}>
                      {selectedKpis.taxaRecup.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {fmtNum(selectedKpis.recuperadoAcum)} m³ de {fmtNum(selectedKpis.removidoAcum)} m³ removidos
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Histórico de volume */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Histórico mensal de volume (m³)</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedHistorico.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-8 text-center">
                      Sem histórico registrado para este lixão.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={selectedHistorico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" fontSize={11} />
                        <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => `${fmtNum(v)} m³`} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="estocado" stroke={FIORI_RED} name="Estocado" strokeWidth={2} />
                        <Line type="monotone" dataKey="removido" stroke={FIORI_BLUE} name="Removido" strokeWidth={2} />
                        <Line type="monotone" dataKey="recuperado" stroke={FIORI_GREEN} name="Recuperado" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Volume coletado por mês */}
              {selectedHistorico.length > 0 && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Volume coletado mensalmente (m³)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={selectedHistorico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" fontSize={11} />
                        <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => `${fmtNum(v)} m³`} />
                        <Bar dataKey="removido" fill={FIORI_BLUE} name="Removido" />
                        <Bar dataKey="recuperado" fill={FIORI_GREEN} name="Recuperado" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Correlação com reciclagem do estado */}
              {selectedUFCorrelacao && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Recycle className="h-4 w-4" style={{ color: FIORI_GREEN }} />
                      Correlação com reciclagem — {selectedLixao.uf}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reciclado no estado</span>
                      <span className="font-medium">
                        {fmtNum(Number(selectedUFCorrelacao.volume_reciclado_ton_uf))} ton
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de desvio de aterro (UF)</span>
                      <span className="font-medium" style={{ color: FIORI_BLUE }}>
                        {Number(selectedUFCorrelacao.taxa_desvio_aterro_uf).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Correlação remoção × reciclagem</span>
                      <span className="font-medium" style={{ color: FIORI_GREEN }}>
                        {Number(selectedUFCorrelacao.correlacao_reciclagem_pct).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        Economia estimada (UF)
                      </span>
                      <span className="font-bold" style={{ color: FIORI_ORANGE }}>
                        {fmtBRL(Number(selectedUFCorrelacao.economia_estimada_rs))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedLixao.data_encerramento_real && (
                <p className="text-xs text-muted-foreground mt-4">
                  Encerrado em {new Date(selectedLixao.data_encerramento_real).toLocaleDateString("pt-BR")}
                </p>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const DashboardLixoes = () => (
  <LixoesErrorBoundary>
    <DashboardLixoesInner />
  </LixoesErrorBoundary>
);

export default DashboardLixoes;
