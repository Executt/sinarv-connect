# Padronização Visual — SINARV

> Design system *CRM Desktop* com suporte a tema escuro (Evening Horizon). Todas as cores em HSL via tokens semânticos.

## 1. Princípios

1. **Densidade alta** — interfaces de gestão exigem máxima informação por viewport.
2. **Hierarquia clara** — títulos `text-base` (h2/h3), corpo `text-xs`/`text-sm`, metadados `text-[10px]`.
3. **Consistência tokenizada** — nenhum componente usa cor literal (`text-white`, `bg-blue-500`); todas as cores referenciam variáveis CSS via Tailwind.
4. **Acessibilidade AA** — contraste mínimo 4.5:1 em texto, foco visível com `ring-2 ring-ring`.

## 2. Paleta de Tokens (HSL)

Definidos em `src/index.css` (`:root` para claro e `.dark` para Evening Horizon).

| Token | Claro | Escuro | Uso |
|-------|-------|--------|-----|
| `--background` | `0 0% 100%` | `222 32% 8%` | fundo de página |
| `--foreground` | `222 47% 11%` | `210 40% 96%` | texto padrão |
| `--card` | `0 0% 100%` | `222 28% 11%` | superfícies elevadas |
| `--popover` | `0 0% 100%` | `222 28% 11%` | menus, dropdowns |
| `--primary` | `221 83% 53%` | `217 91% 60%` | ações principais |
| `--secondary` | `210 40% 96%` | `217 30% 17%` | superfícies sutis |
| `--muted` | `210 40% 96%` | `217 30% 17%` | placeholders, helpers |
| `--accent` | `217 91% 60%` | `217 91% 60%` | destaques |
| `--destructive` | `0 84% 60%` | `0 70% 55%` | erros, exclusão |
| `--border` | `214 32% 91%` | `217 30% 20%` | divisores |
| `--ring` | `221 83% 53%` | `217 91% 60%` | foco |

### Tokens da TopNav

| Token | Função |
|-------|--------|
| `--topnav-background` | fundo da barra superior |
| `--topnav-foreground` | itens inativos |
| `--topnav-hover` | hover de item |
| `--topnav-active` | item ativo |
| `--topnav-active-foreground` | texto do ativo |

## 3. Tipografia

- **Família:** `Inter` (peso 400/500/600/700)
- **Monoespaçada:** `JetBrains Mono` para códigos, IDs, payloads JSON
- **Escala compacta:**
  - `text-[10px]` — meta/badge
  - `text-xs` (12px) — corpo padrão em interfaces densas
  - `text-sm` (14px) — destaque
  - `text-base` (16px) — títulos de página/cartão

## 4. Espaçamento

- Grid base: **4px** (Tailwind padrão)
- Padding interno de cartões: `p-3` (12px) ou `p-4` (16px)
- Gap entre seções: `space-y-3` ou `space-y-4`
- Headers admin: `pb-3 border-b border-border`

## 5. Border-radius

- `--radius`: `0.375rem` (6px) — botões, inputs, cards
- `rounded-md` para a maioria dos elementos
- `rounded-full` apenas para avatares e badges circulares

## 6. Sombras

```css
--shadow-fiori-1: 0 1px 2px 0 hsl(0 0% 0% / 0.05);
--shadow-fiori-2: 0 4px 6px -1px hsl(0 0% 0% / 0.10);
--shadow-fiori-3: 0 10px 15px -3px hsl(0 0% 0% / 0.10);
```

## 7. Ícones

- **Biblioteca:** `lucide-react`
- **Tamanho padrão:** `h-3.5 w-3.5` (14px) em ações compactas; `h-4 w-4` (16px) em cabeçalhos
- **Stroke:** `1.75` (mais fino que o default 2)
- **Cor:** herda de `text-foreground` ou `text-primary`

## 8. Componentes-chave

### `AdminPageHeader`
Cabeçalho padronizado para todas as páginas administrativas — título + descrição + ícone + ações.

### `GlobalHeader` (TopNavBar)
Barra superior fixa, altura `h-14`, contém logo, navegação contextual e mega-menu administrativo.

### `AdminMegaMenu`
Painel suspenso 720px com 4 grupos × 4-5 itens. Cada item tem ícone, label, descrição e badge opcional `novo`.

## 9. Estados

| Estado | Visual |
|--------|--------|
| Hover | `hover:bg-secondary` |
| Ativo | `bg-primary text-primary-foreground` |
| Foco | `focus-visible:ring-2 focus-visible:ring-ring` |
| Disabled | `opacity-50 cursor-not-allowed` |
| Loading | skeleton com `bg-muted animate-pulse` |
| Vazio | borda dashed + ícone outline + mensagem |

## 10. Tema Escuro (Evening Horizon)

Toggle disponível no `GlobalHeader`. Persistido em `localStorage` via `use-theme.ts`. Aplica classe `.dark` em `<html>`.

A paleta escura é inspirada no SAP Fiori Evening Horizon — contraste alto, azuis profundos, superfícies com saturação reduzida.
