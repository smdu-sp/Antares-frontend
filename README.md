<p align="center">
  <a href="https://www.prefeitura.sp.gov.br/cidade/secretarias/licenciamento/" target="blank"><img src="https://www.prefeitura.sp.gov.br/cidade/secretarias/upload/chamadas/URBANISMO_E_LICENCIAMENTO_HORIZONTAL_FUNDO_CLARO_1665756993.png" width="200" alt="SMUL Logo" /></a>
</p>

# Antares Frontend

Sistema de gerenciamento de processos e andamentos - SMUL/ATIC

## 📋 Sobre o Projeto

Sistema web para controle e acompanhamento de processos administrativos com funcionalidades avançadas:

### Processos e Andamentos
- ✅ **Gestão Completa**: Criação, edição e acompanhamento de processos e andamentos
- ✅ **Grid Interativa**: Visualização em tabela com AG-Grid (expandir/colapsar detalhes)
- ✅ **Seleção Múltipla**: Checkboxes para operações em lote
- ✅ **Edição em Lote**: Concluir, prorrogar ou excluir múltiplos andamentos simultaneamente
- ✅ **Resposta Final**: Conclusão automática de andamentos ao finalizar processo

### Exportação
- 📄 **Exportação Individual**: Excel ou PDF com opções de incluir/excluir andamentos
- 📦 **Exportação em Lote**: Processos selecionados ou filtros aplicados
- 🔍 **Filtros Inteligentes**: Exporta respeitando buscas e filtros ativos

### Dashboard e Relatórios
- 📊 **Métricas em Tempo Real**: Total, em andamento, vencendo hoje, atrasados e concluídos
- 📈 **Gráficos Interativos**: Visualização de dados de processos e andamentos
- 🎯 **Cards de Resumo**: Com toggle para ocultar/mostrar (padrão oculto)

### Personalização
- 🎨 **Tema Claro/Escuro**: Alternância entre temas
- 📐 **Preferências Persistentes**: Ordem, largura e visibilidade de colunas salvas no banco de dados
- 👤 **Perfil de Usuário**: Configurações individuais por usuário

### Segurança e Controle
- 🔐 **Autenticação LDAP**: Login integrado com Active Directory
- 📝 **Sistema de Logs**: Auditoria completa de ações
- 👥 **Gerenciamento de Usuários**: Controle de permissões e unidades

## 🚀 Tecnologias

### Core
- **[Next.js 15](https://nextjs.org/)** - Framework React com App Router e Server Components
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática e segurança de código
- **[React 19](https://react.dev/)** - Biblioteca UI com hooks modernos

### UI/UX
- **[Shadcn/ui](https://ui.shadcn.com/)** - Componentes acessíveis e customizáveis
- **[TailwindCSS](https://tailwindcss.com/)** - Estilização utilitária responsiva
- **[AG-Grid Community](https://www.ag-grid.com/)** - Grid avançada com edição inline e expansão
- **[Recharts](https://recharts.org/)** - Gráficos e visualizações de dados
- **[Lucide React](https://lucide.dev/)** - Ícones modernos

### Estado e Dados
- **[TanStack Query](https://tanstack.com/query)** - Cache e sincronização de dados
- **[React Hook Form](https://react-hook-form.com/)** - Gerenciamento de formulários
- **[Zod](https://zod.dev/)** - Validação de schemas

### Autenticação
- **[Auth.js v5](https://authjs.dev/)** - Autenticação com LDAP e sessões seguras

## 📦 Pré-requisitos

- Node.js 18+ ou Bun
- Backend da aplicação rodando (consulte repositório do backend)

## 🔧 Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/smdu-sp/Antares-frontend.git
cd Antares-frontend
```

2. **Instale as dependências**

```bash
npm install
# ou
bun install
```

3. **Configure as variáveis de ambiente**

```bash
copy example.env .env.local
```

Edite o arquivo `.env.local`:

```properties
# Nome do projeto
NEXT_PUBLIC_PROJECT_NAME="Sistema Antares"

# URL do backend (ajuste conforme necessário)
NEXT_PUBLIC_API_URL=http://localhost:3000/

# Segredo de autenticação (gere um novo)
AUTH_SECRET=seu_secret_aqui

# URL do frontend
AUTH_URL=http://localhost:3001
```

4. **Gere um AUTH_SECRET**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o código gerado para o campo `AUTH_SECRET` no arquivo `.env.local`

## 🎯 Executando a Aplicação

### Modo Desenvolvimento

```bash
npm run dev
# ou
bun dev
```

Acesse [http://localhost:3001](http://localhost:3001)

### Build de Produção    # Rotas protegidas (requer autenticação)
│   ├── page.tsx               # Dashboard com métricas e grid de processos
│   ├── processos/             # Gestão de processos e andamentos
│   ├── interessados/          # Cadastro de interessados
│   ├── usuarios/              # Gerenciamento de usuários
│   ├── unidades/              # Cadastro de unidades
│   ├── perfil/                # Perfil e configurações do usuário
│   └── logs/                  # Logs e auditoria do sistema
├── (rotas-livres)/            # Rotas públicas
│   └── login/                 # Página de autenticação LDAP
└── api/auth/                  # Endpoints de autenticação

components/
├── ui/                        # Primitivos Shadcn/ui
├── sidebar/                   # Navegação e menu lateral
├── charts/                    # Componentes de gráficos (Recharts)
├── processos-spreadsheet.tsx  # Grid principal AG-Grid
├── export-*.tsx               # Botões de exportação (individual/lote)
├── avatar-uploader.tsx        # Upload de avatar de usuário
└── filtros.tsx                # Componente de busca e filtros

services/
├── processos/
│   ├── query-functions/       # Funções de busca e contagem
│   └── server-functions/      # Funções de criação/edição
├── andamentos/                # CRUD de andamentos
├── export/                    # ⭐ Exportação Excel/PDF
├── preferencias/              # ⭐ Persistência de preferências do usuário
├── usuarios/                  # Gerenciamento de usuários
├── unidades/                  # CRUD de unidades
├── interessados/              # CRUD de interessados
└── logs/                      # Sistema de logs

hooks/
├── use-mobile.ts              # Detecção de dispositivos móveis
└── use-selected-processos.ts  # ⭐ Gerenciamento de seleção múltipla

lib/
├── auth/                      # Configuração NextAuth + LDAP
│   ├── auth.ts                # Autenticação principal
│   └── auth.config.ts         # Configuração de providers
└── utils.ts                   # Utilitários (cn, formatadores)

types/
├── processo.ts                # Tipos de processos e andamentos
├── usuario.ts                 # Tipos de usuários
├── unidade.ts                 # Tipos de unidades
├── inFuncionalidades Principais

### Grid de Processos (AG-Grid)
- **Edição Inline**: Clique duplo para editar células diretamente
- **Expansão de Detalhes**: Botão para expandir/colapsar andamentos
- **Ordenação e Filtros**: Clique nos cabeçalhos para ordenar
- **Redimensionamento**: Arraste bordas das colunas para ajustar largura
- **Reordenação**: Arraste cabeçalhos para reorganizar colunas
- **Persistência**: Ordem e tamanho salvos automaticamente no banco

### Seleção e Operações em Lote
- **Checkbox Individual**: Selecionar processos específicos
- **Selecionar Todos**: Checkbox no cabeçalho da coluna
- **Exportar Selecionados**: 6 opções de exportação
  - Processo + Andamentos (Excel/PDF)
  - Apenas Processo (Excel/PDF)
  - Apenas Andamentos (Excel/PDF)
- **Toggle Incluir Andamentos**: Controle fino sobre o conteúdo exportado

### Edição em Lote de Andamentos
Operações simultâneas em múltiplos andamentos na tela de detalhes do processo:
- ✅ Marcar como concluído
- ⏰ Prorrogar prazo (com seleção de data)
- Verifique se `NEXT_PUBLIC_API_URL` está correto no `.env.local`
- Remova barra final da URL (ex: `http://localhost:8080` sem `/` no final)
- Confirme se o backend está rodando na porta correta

**Preferências não salvam:**
- Verifique se o usuário está autenticado corretamente
- Confirme que a tabela `preferencias_usuario` existe no banco
- Verifique logs do backend para erros na API `/preferencias`

**Exportação não funciona:**
- Confirme que os endpoints `/export/processos/*` e `/export/andamentos/*` estão ativos no backend
- Verifique se o navegador não está bloqueando downloads
- Para exportações grandes, aguarde o processamento (pode demorar alguns segundos)

## 📝 Scripts Disponíveis

```bash
npm run dev        # Desenvolvimento com hot-reload (porta 3001)
npm run build      # Build de produção com otimizações
npm start          # Servidor de produção
npm run lint       # Executa ESLint
npm run lint:fix   # Corrige problemas automaticamente
```

## 🔄 Fluxo de Deploy

1. Execute `npm run build` para verificar se compila sem erros
2. Corrija quaisquer erros de TypeScript ou ESLint
3. Teste localmente com `npm start`
4. Faça commit e push para o repositório
5. Configure variáveis de ambiente no servidor de produção
6. Execute build e start no servidor

## 🌐 Endpoints Backend Necessários

O frontend espera que os seguintes endpoints estejam disponíveis:

### Processos
- `GET /processos` - Listar com paginação e filtros
- `GET /processos/:id` - Buscar por ID
- `POST /processos` - Criar novo
- `PUT /processos/:id` - Atualizar
- `DELETE /processos/:id` - Soft delete
- `GET /processos/contar/total` - Contar todos
- `GET /processos/contar/em-andamento` - Contar em andamento
- `GET /processos/contar/vencendo-hoje` - Contar vencendo hoje
- `GET /processos/contar/atrasados` - Contar atrasados
- `GET /processos/contar/concluidos` - Contar concluídos

### Andamentos
- `GET /andamentos` - Listar todos
- `GET /andamentos/processo/:id` - Buscar por processo
- `POST /andamentos` - Criar novo
- `PUT /andamentos/:id` - Atualizar
- `DELETE /andamentos/:id` - Excluir
- `PATCH /andamentos/lote/concluir` - Concluir em lote
- `PATCH /andamentos/lote/prorrogar` - Prorrogar em lote
- `DELETE /andamentos/lote` - Excluir em lote

### Exportação
- `POST /export/processos/excel` - Exportar processos Excel
- `POST /export/processos/pdf` - Exportar processos PDF
- `POST /export/andamentos/excel` - Exportar andamentos Excel
- `POST /export/andamentos/pdf` - Exportar andamentos PDF

### Preferências
- `GET /preferencias/:chave` - Buscar preferência
- `POST /preferencias` - Salvar preferência
- `GET /preferencias` - Listar todas
- `DELETE /preferencias/:id` - Excluir preferência

### Outros
- `GET /usuarios` - Gerenciamento de usuários
- `GET /unidades` - Gerenciamento de unidades
- `GET /interessados` - Gerenciamento de interessados
- `GET /logs` - Sistema de logs

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
2. Faça suas alterações e teste localmente
3. Execute `npm run lint` e `npm run build` para validar
4. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
5. Push para a branch (`git push origin feature/MinhaFeature`)
6. Abra um Pull Request com descrição detalhada

**Convenções:**
- Use TypeScript para novos arquivos
- Siga os padrões de código existentes
- Adicione comentários em código complexo
- Teste todas as funcionalidades antes do PR

## 📄 Licença

Este projeto é propriedade da **Prefeitura Municipal de São Paulo - SMUL (Secretaria Municipal de Urbanismo e Licenciamento)**.

Desenvolvido por: **ATIC - Assessoria Técnica de Informação e Comunicação**

## 📞 Suporte

Para dúvidas, problemas ou sugestões:
- Contate a equipe ATIC da SMUL
- Abra uma issue no repositório do GitHub

---

**Última atualização:** Fevereiro/2026  
**Versão:** 1.0.0
