import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useIndustrias } from "@/hooks/use-schema-data";
import { useApiCredentials, useApiLogs, useLotesRecebidos, useAprovarLote } from "@/hooks/use-industria-data";
import { toast } from "sonner";
import { Filter, Key, Activity, Upload, CheckCircle, XCircle, Clock, Copy, Eye, EyeOff } from "lucide-react";

const statusIcon: Record<string, any> = {
  Pendente: <Clock className="h-3.5 w-3.5 text-warning" />,
  Aprovado: <CheckCircle className="h-3.5 w-3.5 text-success" />,
  Rejeitado: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  Consolidado: <CheckCircle className="h-3.5 w-3.5 text-primary" />,
};

const IndustriaIntegracao = () => {
  const [selectedInd, setSelectedInd] = useState<string>("");
  const { data: industrias, isLoading: loadInd } = useIndustrias();
  const { data: credentials } = useApiCredentials(selectedInd || undefined);
  const { data: logs } = useApiLogs(selectedInd || undefined);
  const { data: lotes, isLoading: loadLotes } = useLotesRecebidos(selectedInd || undefined);
  const aprovarMut = useAprovarLote();

  const handleAprovar = async (loteId: string, status: "Aprovado" | "Rejeitado") => {
    try {
      await aprovarMut.mutateAsync({ loteId, status });
      toast.success(`Lote ${status.toLowerCase()} com sucesso`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loadInd) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedInd} onValueChange={setSelectedInd}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Selecione a indústria" />
          </SelectTrigger>
          <SelectContent>
            {industrias?.map((i: any) => (
              <SelectItem key={i.id} value={i.id}>{i.razao_social || i.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedInd && (
        <Tabs defaultValue="staging">
          <TabsList>
            <TabsTrigger value="staging">Lotes Recebidos</TabsTrigger>
            <TabsTrigger value="api-keys">Chaves de API</TabsTrigger>
            <TabsTrigger value="logs">Logs de Sincronização</TabsTrigger>
          </TabsList>

          {/* Staging Area */}
          <TabsContent value="staging" className="mt-4">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Staging Area — Notas Fiscais de Compra</CardTitle>
                    <CardDescription>Lotes importados via API, upload ou manual. Valide o token e aprove.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV/Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadLotes ? <Skeleton className="h-40 rounded" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NF</TableHead>
                        <TableHead>Cooperativa</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Peso (kg)</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotes?.map((l: any) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-xs">{l.numero_nota_fiscal}</TableCell>
                          <TableCell className="text-sm">{l.cooperativa_nome || l.cooperativa_cnpj}</TableCell>
                          <TableCell>{l.tipo_material}</TableCell>
                          <TableCell className="font-mono">{Number(l.peso_kg).toLocaleString("pt-BR")}</TableCell>
                          <TableCell>
                            {l.token_rastreabilidade ? (
                              <div className="flex items-center gap-1">
                                <Badge variant={l.token_validado ? "default" : "secondary"} className="font-mono text-xs">
                                  {l.token_rastreabilidade.substring(0, 8)}…
                                </Badge>
                                {l.token_validado && <CheckCircle className="h-3 w-3 text-success" />}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{l.origem_importacao}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {statusIcon[l.status]}
                              <span className="text-xs">{l.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {l.status === "Pendente" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-success"
                                  disabled={aprovarMut.isPending}
                                  onClick={() => handleAprovar(l.id, "Aprovado")}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-destructive"
                                  disabled={aprovarMut.isPending}
                                  onClick={() => handleAprovar(l.id, "Rejeitado")}
                                >
                                  <XCircle className="h-3 w-3 mr-1" /> Rejeitar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!lotes || lotes.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            Nenhum lote encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api-keys" className="mt-4">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Chaves de API — Integração B2B</CardTitle>
                      <CardDescription>
                        Gerencie tokens de acesso para conectar ERPs (SAP, Oracle, TOTVS) ao SINARV
                      </CardDescription>
                    </div>
                  </div>
                  <Button size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    Gerar Nova Chave
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Prefixo</TableHead>
                      <TableHead>Escopos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiração</TableHead>
                      <TableHead>Último Uso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credentials?.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.nome}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.api_key_prefix}…</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {c.scopes?.map((s: string) => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={c.status === "Ativa" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.data_expiracao ? new Date(c.data_expiracao).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.ultimo_uso ? new Date(c.ultimo_uso).toLocaleDateString("pt-BR") : "Nunca"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!credentials || credentials.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhuma chave de API configurada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Endpoint docs */}
            <Card className="shadow-card mt-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Documentação do Endpoint B2B</CardTitle>
                <CardDescription>Use este endpoint para importar lotes diretamente do seu ERP</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span>
                      <Badge className="mr-2 text-xs">POST</Badge>
                      /api/v1/b2b/industria/importar-lotes
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText("POST /api/v1/b2b/industria/importar-lotes");
                        toast.success("Copiado!");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Request Body (JSON):</p>
                  <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">{`{
  "industria_cnpj": "78.901.234/0001-07",
  "lotes": [
    {
      "cooperativa_cnpj": "12.345.678/0001-90",
      "tipo_material": "Alumínio",
      "peso_kg": 8500,
      "numero_nota_fiscal": "NF-2026-001201",
      "chave_nfe": "352601...",
      "token_rastreabilidade": "uuid-do-despacho"
    }
  ]
}`}</pre>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Headers:</p>
                  <pre className="text-xs font-mono text-foreground">{`Authorization: Bearer sk_prod_XXXX...
Content-Type: application/json`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs */}
          <TabsContent value="logs" className="mt-4">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Logs de Sincronização</CardTitle>
                    <CardDescription>Histórico de chamadas à API B2B</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resumo</TableHead>
                      <TableHead>Resposta</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs">{l.endpoint}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{l.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={l.status_code === 200 ? "default" : "destructive"}
                            className="text-xs font-mono"
                          >
                            {l.status_code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{l.request_summary}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {l.response_summary?.substring(0, 40)}…
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(l.created_at).toLocaleString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!logs || logs.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum log encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default IndustriaIntegracao;
