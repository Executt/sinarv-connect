import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CheckCircle2, MapPin } from "lucide-react";

const MATERIAIS = ["Plástico", "Vidro", "Metal", "Papelão", "Eletrônicos", "PET", "Alumínio", "Orgânico"];

const PontoColetaCredenciamento = () => {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [cnpj, setCnpj] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [natureza, setNatureza] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [materiaisAceitos, setMateriaisAceitos] = useState<string[]>([]);

  const toggleMaterial = (m: string) => {
    setMateriaisAceitos(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const validateCnpj = (v: string) => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cnpj || !nomeFantasia || !natureza || !endereco || !cidade || !estado) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!validateCnpj(cnpj)) {
      toast.error("CNPJ inválido. Use o formato: 00.000.000/0000-00");
      return;
    }

    if (materiaisAceitos.length === 0) {
      toast.error("Selecione ao menos um tipo de material aceito.");
      return;
    }

    setSubmitting(true);

    // 1. Create entidade
    const { data: entidade, error: e1 } = await (supabase as any)
      .from("v_entidade_credenciada")
      .insert({
        cnpj: cnpj.trim(),
        natureza_juridica: natureza,
        nome_fantasia: nomeFantasia.trim(),
        razao_social: razaoSocial.trim() || null,
        email_contato: email.trim() || null,
        telefone: telefone.trim() || null,
      })
      .select("id")
      .single();

    if (e1) {
      setSubmitting(false);
      toast.error("Erro no cadastro: " + e1.message);
      return;
    }

    // 2. Create estação
    const { error: e2 } = await (supabase as any)
      .from("v_estacao_coleta")
      .insert({
        entidade_id: entidade.id,
        endereco: endereco.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().substring(0, 2).toUpperCase(),
        cep: cep.trim() || null,
        capacidade_toneladas: capacidade ? parseFloat(capacidade) : null,
        status_operacional: "Ativo",
      });

    setSubmitting(false);

    if (e2) {
      toast.error("Entidade criada, mas erro na estação: " + e2.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["v_entidade_credenciada"] });
    queryClient.invalidateQueries({ queryKey: ["v_estacao_coleta"] });
    toast.success("Ponto de coleta credenciado com sucesso!");
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="shadow-sm border-t-4 border-t-[hsl(var(--success))]">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-[hsl(var(--success))]" />
            <h2 className="text-xl font-bold text-foreground">Credenciamento Concluído!</h2>
            <p className="text-sm text-muted-foreground">O ponto de coleta <strong>{nomeFantasia}</strong> foi cadastrado e está ativo.</p>
            <Button onClick={() => { setSuccess(false); setCnpj(""); setNomeFantasia(""); setRazaoSocial(""); setNatureza(""); setEmail(""); setTelefone(""); setEndereco(""); setCidade(""); setEstado(""); setCep(""); setCapacidade(""); setMateriaisAceitos([]); }}>
              Cadastrar Outro Ponto
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[hsl(var(--primary))]" />
            Cadastro e Credenciamento
          </CardTitle>
          <CardDescription>Preencha os dados do estabelecimento para credenciamento como ponto de coleta do SINARV.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados da Entidade */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Dados da Entidade</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ *</Label>
                  <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(e.target.value)} maxLength={18} />
                </div>
                <div className="space-y-2">
                  <Label>Natureza Jurídica *</Label>
                  <Select value={natureza} onValueChange={setNatureza}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Privada">Privada (Comércio/Empresa)</SelectItem>
                      <SelectItem value="Órgão Público">Órgão Público</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Fantasia *</Label>
                  <Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} maxLength={200} placeholder="Nome do estabelecimento" />
                </div>
                <div className="space-y-2">
                  <Label>Razão Social</Label>
                  <Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} maxLength={200} placeholder="(Opcional)" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail de Contato</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={255} placeholder="contato@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={telefone} onChange={e => setTelefone(e.target.value)} maxLength={20} placeholder="(00) 0000-0000" />
                </div>
              </div>
            </div>

            {/* Dados Logísticos */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Dados Logísticos
              </h3>
              <div className="space-y-2">
                <Label>Endereço Completo *</Label>
                <Input value={endereco} onChange={e => setEndereco(e.target.value)} maxLength={300} placeholder="Rua, número, bairro" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cidade *</Label>
                  <Input value={cidade} onChange={e => setCidade(e.target.value)} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>UF *</Label>
                  <Input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} placeholder="SP" />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={cep} onChange={e => setCep(e.target.value)} maxLength={9} placeholder="00000-000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Capacidade Máxima de Armazenamento (toneladas)</Label>
                <Input type="number" step="0.1" min="0" value={capacidade} onChange={e => setCapacidade(e.target.value)} placeholder="Ex: 50" />
              </div>
            </div>

            {/* Materiais Aceitos */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Tipos de Materiais Aceitos *</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MATERIAIS.map(m => (
                  <label key={m} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                    materiaisAceitos.includes(m) ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : "border-border hover:border-muted-foreground/30"
                  }`}>
                    <Checkbox checked={materiaisAceitos.includes(m)} onCheckedChange={() => toggleMaterial(m)} />
                    {m}
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Cadastrando..." : "Credenciar Ponto de Coleta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PontoColetaCredenciamento;
