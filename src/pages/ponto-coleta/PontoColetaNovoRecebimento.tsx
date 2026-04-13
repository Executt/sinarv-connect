import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

const materiais = ["PET", "Vidro", "Alumínio", "Papelão", "Metal", "Plástico", "Orgânico", "Eletrônico", "Outros"];

const PontoColetaNovoRecebimento = () => {
  const [material, setMaterial] = useState("");
  const [peso, setPeso] = useState("");
  const [origem, setOrigem] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!material || !peso || !origem) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    toast.success(`Recebimento de ${peso} kg de ${material} registado com sucesso!`);
    setMaterial("");
    setPeso("");
    setOrigem("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-primary" />
            Registar Novo Recebimento de Material
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material">Tipo de Material *</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materiais.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg) *</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 150.50"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem">Origem / Responsável *</Label>
              <Input
                id="origem"
                placeholder="Nome do cidadão, cooperativa ou identificação"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Input id="obs" placeholder="Observações adicionais (opcional)" />
            </div>

            <Button type="submit" className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Registar Recebimento
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PontoColetaNovoRecebimento;
