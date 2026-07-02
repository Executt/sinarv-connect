import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, MapPin, List, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
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
  orange: "#f97316", gray: "#6b7280", red: "#ef4444",
};

const createColorIcon = (color: string) =>
  new L.DivIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

type LocalizacoesMapProps = {
  points: any[];
};

const LocalizacoesMap = ({ points }: LocalizacoesMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerGroupRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const first = points[0];
    const map = L.map(containerRef.current, {
      center: first ? [Number(first.latitude), Number(first.longitude)] : [-15.78, -47.93],
      zoom: 4,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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
      popup.className = "text-xs space-y-1 min-w-[180px]";

      const nome = document.createElement("p");
      nome.className = "font-bold";
      nome.textContent = point.nome_local;
      popup.appendChild(nome);

      const endereco = document.createElement("p");
      endereco.className = "text-gray-500";
      endereco.textContent = point.endereco;
      popup.appendChild(endereco);

      const cidade = document.createElement("p");
      cidade.textContent = `${point.cidade}/${point.uf}`;
      popup.appendChild(cidade);

      const resumo = document.createElement("div");
      resumo.className = "flex justify-between items-center pt-1";
      const capacidade = document.createElement("span");
      capacidade.className = "font-medium";
      capacidade.textContent = `${point.capacidade_litros}L`;
      const status = document.createElement("span");
      status.className = "px-1.5 py-0.5 rounded text-[10px] font-medium";
      status.textContent = point.status_operacional;
      resumo.append(capacidade, status);
      popup.appendChild(resumo);

      marker.bindPopup(popup);
      marker.addTo(layerGroup);
    });

    if (bounds.length > 0) map.fitBounds(L.latLngBounds(bounds), { padding: [28, 28], maxZoom: 6 });
    setTimeout(() => map.invalidateSize(), 0);
  }, [points]);

  return <div ref={containerRef} className="z-0 h-[500px] w-full" aria-label="Mapa de localizações" />;
};

const STATUS_ICON: Record<string, any> = { Ativo: CheckCircle, Inativo: XCircle, Manutenção: AlertTriangle };
const COR_MAP: Record<string, string> = { blue: "bg-blue-500", yellow: "bg-yellow-400", green: "bg-green-600", orange: "bg-orange-500", gray: "bg-gray-600" };

const AdminLocalizacoes = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filtroUF, setFiltroUF] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [form, setForm] = useState({ contenedor_id: "", nome_local: "", endereco: "", cidade: "", uf: "", latitude: "", longitude: "", capacidade_litros: "240", status_operacional: "Ativo" });

  const { data: contenedores = [] } = useQuery({
    queryKey: ["admin-cont-select"],
    queryFn: async () => { const { data } = await supabase.from("contenedores").select("id, nome, cor"); return data || []; },
  });

  const { data: localizacoes = [], isLoading } = useQuery({
    queryKey: ["admin-localizacoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contenedor_localizacoes").select("*, contenedores(nome, cor)").order("cidade");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        contenedor_id: form.contenedor_id, nome_local: form.nome_local, endereco: form.endereco,
        cidade: form.cidade, uf: form.uf.toUpperCase().slice(0, 2),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        capacidade_litros: parseInt(form.capacidade_litros) || 240,
        status_operacional: form.status_operacional,
      };
      if (editId) {
        const { error } = await supabase.from("contenedor_localizacoes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contenedor_localizacoes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-localizacoes"] });
      toast({ title: editId ? "Localização atualizada" : "Localização criada" });
      setOpen(false); resetForm();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ contenedor_id: "", nome_local: "", endereco: "", cidade: "", uf: "", latitude: "", longitude: "", capacidade_litros: "240", status_operacional: "Ativo" });
    setEditId(null);
  };

  const openEdit = (l: any) => {
    setEditId(l.id);
    setForm({
      contenedor_id: l.contenedor_id, nome_local: l.nome_local, endereco: l.endereco || "",
      cidade: l.cidade, uf: l.uf, latitude: l.latitude?.toString() || "",
      longitude: l.longitude?.toString() || "", capacidade_litros: l.capacidade_litros?.toString() || "240",
      status_operacional: l.status_operacional || "Ativo",
    });
    setOpen(true);
  };

  const ufs = [...new Set(localizacoes.map((l: any) => l.uf))].sort();
  const filtered = localizacoes.filter((l: any) => {
    const matchUF = filtroUF === "todas" || l.uf === filtroUF;
    const matchStatus = filtroStatus === "todos" || l.status_operacional === filtroStatus;
    return matchUF && matchStatus;
  });

  const mapPoints = filtered.filter((l: any) => l.latitude && l.longitude);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Select value={filtroUF} onValueChange={setFiltroUF}>
            <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas UFs</SelectItem>
              {ufs.map((u: string) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
              <SelectItem value="Manutenção">Manutenção</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px]">{filtered.length} pontos</Badge>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nova Localização</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Localização</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label className="text-xs">Contenedor</Label>
                <Select value={form.contenedor_id} onValueChange={(v) => setForm({ ...form, contenedor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{contenedores.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome do Local</Label><Input value={form.nome_local} onChange={(e) => setForm({ ...form, nome_local: e.target.value })} /></div>
                <div><Label className="text-xs">Status</Label>
                  <Select value={form.status_operacional} onValueChange={(v) => setForm({ ...form, status_operacional: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Endereço</Label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
                <div><Label className="text-xs">UF</Label><Input value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value })} maxLength={2} /></div>
                <div><Label className="text-xs">Capacidade (L)</Label><Input type="number" value={form.capacidade_litros} onChange={(e) => setForm({ ...form, capacidade_litros: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Latitude</Label><Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="-23.5505" /></div>
                <div><Label className="text-xs">Longitude</Label><Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-46.6333" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => upsert.mutate()} disabled={!form.contenedor_id || !form.nome_local || !form.cidade || !form.uf || upsert.isPending}>
                {upsert.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="mapa" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="mapa" className="text-xs gap-1.5"><MapPin className="h-3 w-3" /> Mapa</TabsTrigger>
          <TabsTrigger value="lista" className="text-xs gap-1.5"><List className="h-3 w-3" /> Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="mt-3">
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {mapPoints.length > 0 ? (
                <LocalizacoesMap points={mapPoints} />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum ponto com coordenadas para exibir no mapa.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista" className="mt-3">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs w-8">Tipo</TableHead>
                  <TableHead className="text-xs">Local</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Endereço</TableHead>
                  <TableHead className="text-xs">Cidade/UF</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Cap.</TableHead>
                  <TableHead className="text-xs">Nível</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-10"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((l: any) => {
                    const SIcon = STATUS_ICON[l.status_operacional] || CheckCircle;
                    const cor = (l as any).contenedores?.cor;
                    return (
                      <TableRow key={l.id}>
                        <TableCell><div className={`w-4 h-4 rounded-full ${COR_MAP[cor] || "bg-muted"}`} /></TableCell>
                        <TableCell className="text-xs font-medium">{l.nome_local}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{l.endereco}</TableCell>
                        <TableCell className="text-xs">{l.cidade}/{l.uf}</TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">{l.capacidade_litros}L</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${l.nivel_preenchimento >= 80 ? "bg-red-500" : l.nivel_preenchimento >= 50 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${l.nivel_preenchimento}%` }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground">{l.nivel_preenchimento}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={l.status_operacional === "Ativo" ? "default" : l.status_operacional === "Manutenção" ? "secondary" : "outline"} className="text-[10px] gap-1">
                            <SIcon className="h-2.5 w-2.5" />{l.status_operacional}
                          </Badge>
                        </TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(l)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLocalizacoes;
