import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, Plus, Pencil, Trash2, Radio } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const PROTOCOLOS = ["mqtt", "http", "lorawan", "sigfox", "modbus", "zigbee"];
const CATEGORIAS = ["sensor_nivel", "balanca", "rfid", "camera", "atuador", "gateway"];
const STATUS = ["ativo", "inativo", "manutencao", "erro"];

const AdminInventarioIoT = () => {
  const qc = useQueryClient();

  // Modelos
  const [openMod, setOpenMod] = useState(false);
  const [editMod, setEditMod] = useState<any>(null);
  const [formMod, setFormMod] = useState({
    nome: "", fabricante: "", modelo: "", categoria: CATEGORIAS[0],
    protocolo: PROTOCOLOS[0], firmware_versao: "", ativo: true,
  });

  const { data: modelos = [] } = useQuery({
    queryKey: ["iot-modelos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("iot_dispositivos_modelos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const upsertMod = useMutation({
    mutationFn: async () => {
      if (!formMod.nome || !formMod.fabricante || !formMod.modelo) throw new Error("Preencha nome, fabricante e modelo");
      const row = { ...formMod, capacidades: [], config_padrao: {} };
      if (editMod) { const { error } = await supabase.from("iot_dispositivos_modelos").update(row).eq("id", editMod.id); if (error) throw error; }
      else { const { error } = await supabase.from("iot_dispositivos_modelos").insert(row); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["iot-modelos"] }); toast.success("Salvo"); setOpenMod(false); setEditMod(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMod = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("iot_dispositivos_modelos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["iot-modelos"] }); toast.success("Removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Instâncias
  const [openIns, setOpenIns] = useState(false);
  const [editIns, setEditIns] = useState<any>(null);
  const [formIns, setFormIns] = useState({
    modelo_id: "", serial_number: "", apelido: "", status: "inativo",
  });

  const { data: instancias = [] } = useQuery({
    queryKey: ["iot-instancias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("iot_dispositivos_instancias").select("*, modelo:iot_dispositivos_modelos(nome,fabricante)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsertIns = useMutation({
    mutationFn: async () => {
      if (!formIns.modelo_id || !formIns.serial_number) throw new Error("Modelo e número de série são obrigatórios");
      const row = { ...formIns, config: {} };
      if (editIns) { const { error } = await supabase.from("iot_dispositivos_instancias").update(row).eq("id", editIns.id); if (error) throw error; }
      else { const { error } = await supabase.from("iot_dispositivos_instancias").insert(row); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["iot-instancias"] }); toast.success("Salvo"); setOpenIns(false); setEditIns(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeIns = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("iot_dispositivos_instancias").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["iot-instancias"] }); toast.success("Removido"); },
  });

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Inventário IoT"
        description="Catálogo de modelos de dispositivos e instâncias físicas instaladas em ecopontos."
        icon={<Cpu className="h-4 w-4" />}
      />

      <Tabs defaultValue="modelos">
        <TabsList>
          <TabsTrigger value="modelos" className="text-xs">Modelos ({modelos.length})</TabsTrigger>
          <TabsTrigger value="instancias" className="text-xs">Instâncias ({instancias.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="modelos" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openMod} onOpenChange={setOpenMod}>
              <DialogTrigger asChild><Button size="sm" onClick={() => { setEditMod(null); setFormMod({ nome: "", fabricante: "", modelo: "", categoria: CATEGORIAS[0], protocolo: PROTOCOLOS[0], firmware_versao: "", ativo: true }); }}><Plus className="h-3.5 w-3.5 mr-1" />Novo modelo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editMod ? "Editar modelo" : "Novo modelo"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs">Nome</Label><Input value={formMod.nome} onChange={(e) => setFormMod({ ...formMod, nome: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Fabricante</Label><Input value={formMod.fabricante} onChange={(e) => setFormMod({ ...formMod, fabricante: e.target.value })} /></div>
                    <div><Label className="text-xs">Modelo</Label><Input value={formMod.modelo} onChange={(e) => setFormMod({ ...formMod, modelo: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Categoria</Label>
                      <Select value={formMod.categoria} onValueChange={(v) => setFormMod({ ...formMod, categoria: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Protocolo</Label>
                      <Select value={formMod.protocolo} onValueChange={(v) => setFormMod({ ...formMod, protocolo: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{PROTOCOLOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label className="text-xs">Firmware (versão)</Label><Input value={formMod.firmware_versao} onChange={(e) => setFormMod({ ...formMod, firmware_versao: e.target.value })} placeholder="ex: 1.2.3" /></div>
                  <div className="flex items-center gap-2"><Switch checked={formMod.ativo} onCheckedChange={(v) => setFormMod({ ...formMod, ativo: v })} /><Label className="text-xs">Ativo</Label></div>
                </div>
                <DialogFooter><Button variant="outline" size="sm" onClick={() => setOpenMod(false)}>Cancelar</Button><Button size="sm" onClick={() => upsertMod.mutate()}>Salvar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Nome</TableHead><TableHead className="text-xs">Fabricante / Modelo</TableHead>
                <TableHead className="text-xs">Categoria</TableHead><TableHead className="text-xs">Protocolo</TableHead>
                <TableHead className="text-xs">Firmware</TableHead><TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-20"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {modelos.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">Nenhum modelo cadastrado</TableCell></TableRow>}
                {modelos.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-medium">{r.nome}</TableCell>
                    <TableCell className="text-xs">{r.fabricante} / {r.modelo}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{r.categoria}</Badge></TableCell>
                    <TableCell><Badge className="text-[10px] bg-primary/10 text-primary">{r.protocolo}</Badge></TableCell>
                    <TableCell className="text-xs font-mono">{r.firmware_versao || "—"}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${r.ativo ? "bg-emerald-600" : "bg-muted text-muted-foreground"}`}>{r.ativo ? "ativo" : "inativo"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditMod(r); setFormMod({ nome: r.nome, fabricante: r.fabricante, modelo: r.modelo, categoria: r.categoria, protocolo: r.protocolo, firmware_versao: r.firmware_versao || "", ativo: r.ativo }); setOpenMod(true); }}><Pencil className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { if (confirm("Remover modelo?")) removeMod.mutate(r.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="instancias" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openIns} onOpenChange={setOpenIns}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={modelos.length === 0} onClick={() => { setEditIns(null); setFormIns({ modelo_id: modelos[0]?.id || "", serial_number: "", apelido: "", status: "inativo" }); }}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Nova instância
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editIns ? "Editar instância" : "Nova instância"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs">Modelo</Label>
                    <Select value={formIns.modelo_id} onValueChange={(v) => setFormIns({ ...formIns, modelo_id: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{modelos.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nome} ({m.fabricante})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Número de Série</Label><Input value={formIns.serial_number} onChange={(e) => setFormIns({ ...formIns, serial_number: e.target.value })} /></div>
                  <div><Label className="text-xs">Apelido</Label><Input value={formIns.apelido} onChange={(e) => setFormIns({ ...formIns, apelido: e.target.value })} placeholder="opcional" /></div>
                  <div><Label className="text-xs">Status</Label>
                    <Select value={formIns.status} onValueChange={(v) => setFormIns({ ...formIns, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button variant="outline" size="sm" onClick={() => setOpenIns(false)}>Cancelar</Button><Button size="sm" onClick={() => upsertIns.mutate()}>Salvar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Serial</TableHead><TableHead className="text-xs">Apelido</TableHead>
                <TableHead className="text-xs">Modelo</TableHead><TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Heartbeat</TableHead><TableHead className="text-xs w-20"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {instancias.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Nenhum dispositivo instalado</TableCell></TableRow>}
                {instancias.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-mono">{r.serial_number}</TableCell>
                    <TableCell className="text-xs">{r.apelido || "—"}</TableCell>
                    <TableCell className="text-xs">{r.modelo?.nome}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] gap-1 ${r.status === "ativo" ? "bg-emerald-600" : r.status === "erro" ? "bg-red-600" : "bg-muted text-muted-foreground"}`}>
                        <Radio className="h-2.5 w-2.5" />{r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground tabular-nums">
                      {r.ultimo_heartbeat ? new Date(r.ultimo_heartbeat).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditIns(r); setFormIns({ modelo_id: r.modelo_id, serial_number: r.serial_number, apelido: r.apelido || "", status: r.status }); setOpenIns(true); }}><Pencil className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { if (confirm("Remover?")) removeIns.mutate(r.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInventarioIoT;
