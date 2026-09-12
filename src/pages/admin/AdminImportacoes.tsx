import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { parseCsv, baixarCsvModelo, type CsvRow } from "@/lib/csv";
import { Upload, Download, Loader2, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";

type Tipo = "mtr" | "licencas" | "munic";

const MODELOS: Record<Tipo, { label: string; descricao: string; colunas: string[]; exemplo: string[] }> = {
  licencas: {
    label: "Licenças ambientais",
    descricao: "Vincula licenças a operadores já cadastrados pelo CNPJ. Atualiza a licença quando o número já existe.",
    colunas: ["cnpj_operador", "tipo", "numero", "orgao_emissor", "emissao", "validade", "observacoes"],
    exemplo: ["12345678000199", "Licença de Operação", "LO-2025-0001", "IBAMA", "2025-01-10", "2027-01-09", ""],
  },
  mtr: {
    label: "Manifestos MTR",
    descricao: "Gerador, transportador e destinador são resolvidos pelo CNPJ. Manifesto existente é atualizado pelo código.",
    colunas: ["codigo", "cnpj_gerador", "cnpj_transportador", "cnpj_destinador", "classe_residuo", "onu_number", "quantidade_kg", "data_prevista", "data_coleta"],
    exemplo: ["MTR-2025-000001", "12345678000199", "98765432000155", "11222333000144", "A1 - Infectante", "3291", "450", "2025-03-01", ""],
  },
  munic: {
    label: "Indicadores PNRS / MUNIC",
    descricao: "Percentuais por região e ano de referência. Exclusivo para perfis de governo.",
    colunas: ["ano_referencia", "regiao", "pct_lixao", "pct_aterro_controlado", "pct_aterro_sanitario", "pct_lixao_acima_50k", "pct_coleta_seletiva", "pct_instrumento_legal", "pct_catadores_informais", "pct_entidades_catadores", "fonte"],
    exemplo: ["2023", "Nordeste", "51.2", "27.4", "21.4", "18.9", "32.1", "44.0", "12.5", "7.8", "IBGE MUNIC 2023"],
  },
};

const AdminImportacoes = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<Tipo>("licencas");
  const [arquivoNome, setArquivoNome] = useState("");
  const [linhas, setLinhas] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fonte, setFonte] = useState("");
  const [escopoUf, setEscopoUf] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ total: number; importadas: number; erros: { linha: number; mensagem: string }[] } | null>(null);

  const modelo = MODELOS[tipo];

  const { data: historico = [], isLoading } = useQuery({
    queryKey: ["importacoes-oficiais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("importacoes_oficiais")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const colunasFaltando = headers.length
    ? modelo.colunas.filter((c) => !["observacoes", "onu_number", "fonte", "cnpj_transportador", "cnpj_destinador", "data_prevista", "data_coleta", "pct_aterro_controlado", "pct_aterro_sanitario", "pct_lixao_acima_50k", "pct_coleta_seletiva", "pct_instrumento_legal", "pct_catadores_informais", "pct_entidades_catadores"].includes(c) && !headers.includes(c))
    : [];

  const lerArquivo = async (file: File | null) => {
    setResultado(null);
    if (!file) { setLinhas([]); setHeaders([]); setArquivoNome(""); return; }
    const texto = await file.text();
    const { headers: h, rows } = parseCsv(texto);
    setHeaders(h);
    setLinhas(rows);
    setArquivoNome(file.name);
  };

  const enviar = async () => {
    if (linhas.length === 0) {
      toast({ title: "Selecione um arquivo CSV", variant: "destructive" });
      return;
    }
    if (colunasFaltando.length > 0) {
      toast({ title: "Colunas obrigatórias ausentes", description: colunasFaltando.join(", "), variant: "destructive" });
      return;
    }
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke("importar-dados-oficiais", {
        body: {
          tipo,
          arquivo_nome: arquivoNome || undefined,
          fonte: fonte || undefined,
          escopo_uf: escopoUf || undefined,
          periodo_inicio: periodoInicio || undefined,
          periodo_fim: periodoFim || undefined,
          observacoes: observacoes || undefined,
          linhas,
        },
      });
      if (error) throw error;
      setResultado({ total: data.total, importadas: data.importadas, erros: data.erros ?? [] });
      toast({
        title: data.erros?.length ? "Importação parcial" : "Importação concluída",
        description: `${data.importadas} de ${data.total} linhas gravadas.`,
        variant: data.importadas === 0 ? "destructive" : "default",
      });
      qc.invalidateQueries({ queryKey: ["importacoes-oficiais"] });
    } catch (err: any) {
      toast({ title: "Falha na importação", description: err?.message ?? "Erro desconhecido", variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Importação de dados oficiais"
        description="Carregue planilhas de MTR, licenças ambientais e indicadores PNRS com validação linha a linha e carimbo de responsabilidade."
        icon={<FileSpreadsheet className="h-4 w-4" />}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Nova importação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de dado</Label>
              <Select value={tipo} onValueChange={(v) => { setTipo(v as Tipo); setResultado(null); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(MODELOS) as Tipo[]).map((t) => (
                    <SelectItem key={t} value={t}>{MODELOS[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Origem / fonte</Label>
              <Input className="h-8 text-xs" placeholder="Ex.: SINIR, SEMA-PA, IBGE" value={fonte} onChange={(e) => setFonte(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">UF / abrangência</Label>
              <Input className="h-8 text-xs" placeholder="Ex.: PA ou Nacional" value={escopoUf} onChange={(e) => setEscopoUf(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Período — início</Label>
              <Input type="date" className="h-8 text-xs" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Período — fim</Label>
              <Input type="date" className="h-8 text-xs" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Arquivo CSV</Label>
              <Input type="file" accept=".csv,text/csv" className="h-8 text-xs" onChange={(e) => lerArquivo(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">{modelo.descricao}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button" size="sm" variant="outline" className="h-8 gap-2 text-xs"
              onClick={() => baixarCsvModelo(`modelo-${tipo}.csv`, modelo.colunas, modelo.exemplo)}
            >
              <Download className="h-3.5 w-3.5" /> Baixar planilha modelo
            </Button>
            {linhas.length > 0 && <Badge variant="outline" className="text-[10px]">{linhas.length} linhas lidas</Badge>}
            {colunasFaltando.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">Faltam colunas: {colunasFaltando.join(", ")}</Badge>
            )}
          </div>

          {linhas.length > 0 && (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>{headers.map((h) => <TableHead key={h} className="text-[11px] whitespace-nowrap">{h}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.slice(0, 5).map((l, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => <TableCell key={h} className="text-[11px] whitespace-nowrap">{l[h]}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Observações</Label>
            <Textarea rows={2} maxLength={2000} className="text-xs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Contexto da carga, ofício de origem, responsável pelo dado…" />
          </div>

          <Button size="sm" className="h-8 gap-2 text-xs" onClick={enviar} disabled={enviando || linhas.length === 0}>
            {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Validar e importar
          </Button>

          {resultado && (
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                {resultado.erros.length === 0
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                <span>{resultado.importadas} de {resultado.total} linhas gravadas · {resultado.erros.length} com erro</span>
              </div>
              {resultado.erros.length > 0 && (
                <ul className="max-h-48 overflow-y-auto space-y-1">
                  {resultado.erros.map((e, i) => (
                    <li key={i} className="text-[11px] text-destructive">Linha {e.linha}: {e.mensagem}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Histórico de importações</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Data</TableHead>
              <TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-xs">Arquivo</TableHead>
              <TableHead className="text-xs">Fonte</TableHead>
              <TableHead className="text-xs">Linhas</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Responsável</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">Carregando…</TableCell></TableRow>}
              {!isLoading && historico.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">Nenhuma importação registrada</TableCell></TableRow>
              )}
              {historico.map((h: any) => (
                <TableRow key={h.id}>
                  <TableCell className="text-[11px] tabular-nums">{new Date(h.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-xs">{MODELOS[h.tipo as Tipo]?.label ?? h.tipo}</TableCell>
                  <TableCell className="text-xs">{h.arquivo_nome || "—"}</TableCell>
                  <TableCell className="text-xs">{h.fonte || "—"}</TableCell>
                  <TableCell className="text-[11px] tabular-nums">{h.linhas_ok}/{h.total_linhas}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{h.status}</Badge>
                  </TableCell>
                  <TableCell className="text-[11px]">{h.importado_por_email || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminImportacoes;
