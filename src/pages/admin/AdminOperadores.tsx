import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, FileText } from "lucide-react";

type Operador = {
  id: string; razao_social: string; cnpj: string; tipo: string; natureza: string;
  contato_email: string | null; contato_telefone: string | null; homologado: boolean; bloqueado: boolean;
  motivo_bloqueio: string | null;
};
type Licenca = { id: string; operador_id: string; tipo: string; numero: string; orgao_emissor: string; emissao: string; validade: string };

const digits = (v: string) => v.replace(/\D/g, "");
const fmtCnpj = (v: string) => {
  const d = digits(v).slice(0, 14);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*/, "$1.$2.$3/$4-$5");
};
function cnpjValido(c: string) {
  const d = digits(c);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => {
    const w = n === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const s = w.reduce((a, x, i) => a + Number(d[i]) * x, 0);
    const r = s % 11; return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

const vazio: Omit<Operador, "id" | "bloqueado" | "motivo_bloqueio"> = {
  razao_social: "", cnpj: "", tipo: "transportador", natureza: "privado", contato_email: "", contato_telefone: "", homologado: false,
};
const licVazia = { tipo: "LO", numero: "", orgao_emissor: "", emissao: "", validade: "" };

export default function AdminOperadores() {
  const [ops, setOps] = useState<Operador[]>([]);
  const [lics, setLics] = useState<Licenca[]>([]);
  const [busca, setBusca] = useState("");
  const [edit, setEdit] = useState<(typeof vazio & { id?: string }) | null>(null);
  const [licOp, setLicOp] = useState<Operador | null>(null);
  const [lic, setLic] = useState(licVazia);

  const carregar = async () => {
    const [a, b] = await Promise.all([
      supabase.from("operadores_logisticos").select("*").order("razao_social"),
      supabase.from("licencas_ambientais").select("id,operador_id,tipo,numero,orgao_emissor,emissao,validade").order("validade"),
    ]);
    if (a.error) toast.error(a.error.message);
    setOps((a.data ?? []) as Operador[]);
    setLics((b.data ?? []) as Licenca[]);
  };
  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    if (!edit) return;
    if (!edit.razao_social.trim()) return toast.error("Informe a razão social");
    if (!cnpjValido(edit.cnpj)) return toast.error("CNPJ inválido");
    const payload = { ...edit, cnpj: digits(edit.cnpj), contato_email: edit.contato_email || null, contato_telefone: edit.contato_telefone || null };
    const { id, ...rest } = payload;
    const res = id
      ? await supabase.from("operadores_logisticos").update(rest).eq("id", id)
      : await supabase.from("operadores_logisticos").insert(rest);
    if (res.error) return toast.error(res.error.message.includes("duplicate") ? "CNPJ já cadastrado" : res.error.message);
    toast.success("Operador salvo"); setEdit(null); carregar();
  };

  const salvarLic = async () => {
    if (!licOp) return;
    if (!lic.numero || !lic.orgao_emissor || !lic.emissao || !lic.validade) return toast.error("Preencha todos os campos");
    if (lic.emissao > lic.validade) return toast.error("Emissão posterior à validade");
    const { error } = await supabase.from("licencas_ambientais").insert({ ...lic, operador_id: licOp.id });
    if (error) return toast.error(error.message);
    toast.success("Licença vinculada"); setLic(licVazia); carregar();
  };

  const hoje = new Date().toISOString().slice(0, 10);
  const filtrados = ops.filter((o) => `${o.razao_social} ${o.cnpj}`.toLowerCase().includes(busca.toLowerCase()) || digits(o.cnpj).includes(digits(busca) || "§"));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Operadores logísticos</h1>
          <p className="text-sm text-muted-foreground">Cadastre transportadores e destinadores pelo CNPJ e vincule suas licenças ambientais.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Buscar por nome ou CNPJ" value={busca} onChange={(e) => setBusca(e.target.value)} className="w-64" />
          <Button onClick={() => setEdit({ ...vazio })}><Plus className="mr-1 h-4 w-4" />Novo operador</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Razão social</TableHead><TableHead>CNPJ</TableHead><TableHead>Tipo</TableHead>
            <TableHead>Licenças</TableHead><TableHead>Situação</TableHead><TableHead className="text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtrados.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum operador cadastrado.</TableCell></TableRow>}
            {filtrados.map((o) => {
              const ls = lics.filter((l) => l.operador_id === o.id);
              const vig = ls.filter((l) => l.validade >= hoje).length;
              return (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.razao_social}</TableCell>
                  <TableCell className="font-mono text-xs">{fmtCnpj(o.cnpj)}</TableCell>
                  <TableCell className="capitalize">{o.tipo}</TableCell>
                  <TableCell>{vig} vigente(s) / {ls.length}</TableCell>
                  <TableCell>{o.bloqueado ? <Badge variant="destructive" title={o.motivo_bloqueio ?? ""}>Bloqueado</Badge> : <Badge variant="secondary">Ativo</Badge>}</TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button size="sm" variant="outline" onClick={() => { setLicOp(o); setLic(licVazia); }}><FileText className="mr-1 h-4 w-4" />Licenças</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEdit({ ...o, cnpj: fmtCnpj(o.cnpj), contato_email: o.contato_email ?? "", contato_telefone: o.contato_telefone ?? "" })}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Editar operador" : "Novo operador"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid gap-3">
              <div><Label>Razão social *</Label><Input value={edit.razao_social} onChange={(e) => setEdit({ ...edit, razao_social: e.target.value })} /></div>
              <div><Label>CNPJ *</Label><Input value={edit.cnpj} onChange={(e) => setEdit({ ...edit, cnpj: fmtCnpj(e.target.value) })} placeholder="00.000.000/0000-00" />
                {edit.cnpj && !cnpjValido(edit.cnpj) && <p className="mt-1 text-xs text-destructive">CNPJ inválido</p>}</div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label><Select value={edit.tipo} onValueChange={(v) => setEdit({ ...edit, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="transportador">Transportador</SelectItem><SelectItem value="destinador">Destinador</SelectItem><SelectItem value="ambos">Ambos</SelectItem></SelectContent></Select></div>
                <div><Label>Natureza</Label><Select value={edit.natureza} onValueChange={(v) => setEdit({ ...edit, natureza: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="privado">Privado</SelectItem><SelectItem value="publico">Público</SelectItem><SelectItem value="misto">Misto</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>E-mail</Label><Input type="email" value={edit.contato_email ?? ""} onChange={(e) => setEdit({ ...edit, contato_email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={edit.contato_telefone ?? ""} onChange={(e) => setEdit({ ...edit, contato_telefone: e.target.value })} /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button><Button onClick={salvar}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!licOp} onOpenChange={(v) => !v && setLicOp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Licenças de {licOp?.razao_social}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Número</TableHead><TableHead>Órgão</TableHead><TableHead>Validade</TableHead></TableRow></TableHeader>
            <TableBody>
              {lics.filter((l) => l.operador_id === licOp?.id).map((l) => (
                <TableRow key={l.id}><TableCell>{l.tipo}</TableCell><TableCell>{l.numero}</TableCell><TableCell>{l.orgao_emissor}</TableCell>
                  <TableCell>{l.validade} {l.validade < hoje && <Badge variant="destructive" className="ml-1">Vencida</Badge>}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="grid grid-cols-5 gap-2 border-t pt-3">
            <Input placeholder="Tipo (LO)" value={lic.tipo} onChange={(e) => setLic({ ...lic, tipo: e.target.value })} />
            <Input placeholder="Número" value={lic.numero} onChange={(e) => setLic({ ...lic, numero: e.target.value })} />
            <Input placeholder="Órgão emissor" value={lic.orgao_emissor} onChange={(e) => setLic({ ...lic, orgao_emissor: e.target.value })} />
            <Input type="date" value={lic.emissao} onChange={(e) => setLic({ ...lic, emissao: e.target.value })} />
            <Input type="date" value={lic.validade} onChange={(e) => setLic({ ...lic, validade: e.target.value })} />
          </div>
          <DialogFooter><Button onClick={salvarLic}><Plus className="mr-1 h-4 w-4" />Vincular licença</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
