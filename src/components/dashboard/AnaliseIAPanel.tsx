import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type AnaliseContexto = {
  municipio: { ibge: string; nome: string; uf: string };
  periodo: { inicio: number; fim: number };
  metas: unknown[];
  balanco: unknown[];
  mtr: unknown;
  meta_desvio_2030: number;
};

type Props = {
  municipio: { ibge: string; nome: string; uf: string } | null;
  montarContexto: (inicio: number, fim: number) => AnaliseContexto | null;
  onResultado?: (texto: string, periodo: { inicio: number; fim: number }) => void;
};

/** Renderização simples de Markdown (títulos, listas, negrito). */
function Md({ texto }: { texto: string }) {
  return (
    <div className="space-y-1.5 text-sm text-foreground">
      {texto.split("\n").map((l, i) => {
        const html = l.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
        if (l.startsWith("## ")) return <h3 key={i} className="pt-3 font-semibold text-primary">{l.slice(3)}</h3>;
        if (!l.trim()) return null;
        return <p key={i} className={/^(\d+\.|[-*]) /.test(l.trim()) ? "pl-3" : ""} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}

const AnaliseIAPanel = ({ municipio, montarContexto, onResultado }: Props) => {
  const ano = new Date().getFullYear();
  const [inicio, setInicio] = useState(ano - 5);
  const [fim, setFim] = useState(ano);
  const [loading, setLoading] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const { toast } = useToast();

  const analisar = async () => {
    const ctx = montarContexto(inicio, fim);
    if (!ctx) return;
    setLoading(true); setErro(""); setTexto("");
    const { data, error } = await supabase.functions.invoke("analise-ia-pnrs", { body: ctx });
    setLoading(false);
    if (error || data?.error) {
      let msg = data?.error as string | undefined;
      try { msg ??= (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
      msg ??= "Não foi possível gerar a análise.";
      setErro(msg);
      toast({ title: "Análise com IA", description: msg, variant: "destructive" });
      return;
    }
    setTexto(data.analise);
    onResultado?.(data.analise, { inicio, fim });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Análise com IA — tendências, anomalias e prioridades de fiscalização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4 items-end">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Município</Label>
            <p className="text-sm font-medium h-10 flex items-center">{municipio ? `${municipio.nome} — ${municipio.uf}` : "Selecione um município acima"}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Período (ano inicial – final)</Label>
            <div className="flex gap-2">
              <Input type="number" value={inicio} onChange={(e) => setInicio(Number(e.target.value))} />
              <Input type="number" value={fim} onChange={(e) => setFim(Number(e.target.value))} />
            </div>
          </div>
          <Button onClick={analisar} disabled={loading || !municipio || inicio > fim}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analisando…</> : <><Sparkles className="h-4 w-4" /> Analisar</>}
          </Button>
        </div>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {texto && <Md texto={texto} />}
        {!texto && !erro && !loading && (
          <p className="text-xs text-muted-foreground">A IA cruza o histórico das metas PNRS, o balanço de massa e os manifestos (MTR) do período escolhido. A análise é apoio à decisão e deve ser conferida pelo analista.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AnaliseIAPanel;
