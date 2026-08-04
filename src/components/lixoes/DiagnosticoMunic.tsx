import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { downloadCSV, printPDF } from "@/lib/residuos-criticos";
import { BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Munic = {
  id: string;
  ano_referencia: number;
  regiao: string;
  pct_lixao: number;
  pct_aterro_controlado: number | null;
  pct_aterro_sanitario: number | null;
  pct_lixao_acima_50k: number | null;
  pct_coleta_seletiva: number | null;
  pct_instrumento_legal: number | null;
  pct_catadores_informais: number | null;
  pct_entidades_catadores: number | null;
  fonte: string;
};

const ORDEM = ["Brasil", "Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];

const DiagnosticoMunic = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ["munic-diagnostico"],
    queryFn: async () => {
      const { data, error } = await supabase.from("munic_diagnostico").select("*").eq("ano_referencia", 2023);
      if (error) throw error;
      return (data ?? []) as unknown as Munic[];
    },
  });

  const ordenado = [...data].sort((a, b) => ORDEM.indexOf(a.regiao) - ORDEM.indexOf(b.regiao));
  const brasil = ordenado.find((d) => d.regiao === "Brasil");
  const regioes = ordenado.filter((d) => d.regiao !== "Brasil");

  return (
    <div className="space-y-4">
      {brasil && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Municípios com lixão", v: brasil.pct_lixao, c: "text-red-600" },
            { l: "Aterro sanitário", v: brasil.pct_aterro_sanitario, c: "text-emerald-600" },
            { l: "Lixão em municípios > 50 mil hab.", v: brasil.pct_lixao_acima_50k, c: "text-amber-600" },
            { l: "Com coleta seletiva", v: brasil.pct_coleta_seletiva, c: "text-primary" },
          ].map((k) => (
            <Card key={k.l}>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">{k.l}</p>
                <p className={`text-2xl font-bold ${k.c}`}>
                  {k.v === null ? "—" : `${Number(k.v).toFixed(1).replace(".", ",")}%`}
                </p>
                <p className="text-[11px] text-muted-foreground">Brasil · MUNIC 2023</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Disposição inadequada por grande região (MUNIC 2023)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Percentual de municípios que ainda utilizam lixão, no total e entre os municípios acima de 50 mil
            habitantes — cujo prazo legal já se esgotou.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6">Carregando diagnóstico…</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={regioes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="regiao" />
                <YAxis unit="%" />
                <Tooltip formatter={(v: number) => `${Number(v).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="pct_lixao" name="Municípios com lixão" fill="#BB0000" />
                <Bar dataKey="pct_lixao_acima_50k" name="Lixão em municípios > 50 mil hab." fill="#E9730C" />
                <Bar dataKey="pct_entidades_catadores" name="Entidades de catadores na coleta seletiva" fill="#107E3E" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Indicadores detalhados</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Região</TableHead>
                <TableHead className="text-right">Lixão</TableHead>
                <TableHead className="text-right">Lixão &gt; 50k hab.</TableHead>
                <TableHead className="text-right">Coleta seletiva</TableHead>
                <TableHead className="text-right">Instrumento legal</TableHead>
                <TableHead className="text-right">Catadores informais</TableHead>
                <TableHead className="text-right">Entidades de catadores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenado.map((d) => (
                <TableRow key={d.id} className={d.regiao === "Brasil" ? "font-semibold bg-muted/40" : undefined}>
                  <TableCell>{d.regiao}</TableCell>
                  {[
                    d.pct_lixao,
                    d.pct_lixao_acima_50k,
                    d.pct_coleta_seletiva,
                    d.pct_instrumento_legal,
                    d.pct_catadores_informais,
                    d.pct_entidades_catadores,
                  ].map((v, i) => (
                    <TableCell key={i} className="text-right">
                      {v === null ? "—" : `${Number(v).toFixed(1).replace(".", ",")}%`}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-[11px] text-muted-foreground pt-3">
            Fonte: IBGE — Pesquisa de Informações Básicas Municipais (MUNIC) 2023, Suplemento de Saneamento Básico.
            Complementado por Observatório dos Lixões (CNM) e Mapa dos Lixões (ABRECON).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticoMunic;
