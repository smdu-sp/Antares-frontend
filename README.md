<p align="center">
  <a href="https://www.prefeitura.sp.gov.br/cidade/secretarias/licenciamento/" target="blank"><img src="https://www.prefeitura.sp.gov.br/cidade/secretarias/upload/chamadas/URBANISMO_E_LICENCIAMENTO_HORIZONTAL_FUNDO_CLARO_1665756993.png" width="200" alt="SMUL Logo" /></a>
</p>

# Antares Frontend

Sistema de gerenciamento de processos e andamentos - SMUL/ATIC

## 📋 Sobre o Projeto

Sistema web para controle e acompanhamento de processos administrativos, permitindo:

- **Gestão de Processos**: Criação, edição e acompanhamento de processos
- **Controle de Andamentos**: Registro e histórico de movimentações
- **Edição em Lote**: Operações múltiplas em andamentos (concluir, prorrogar, excluir)
- **Resposta Final**: Conclusão de processos com registro de resposta
- **Autenticação LDAP**: Login integrado com Active Directory
- **Dashboard**: Visualização de indicadores e gráficos
- **Gerenciamento**: Usuários, unidades e logs do sistema

## 🚀 Tecnologias

- **[Next.js 15](https://nextjs.org/)** - Framework React com App Router e Turbopack
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Shadcn/ui](https://ui.shadcn.com/)** - Componentes acessíveis e customizáveis
- **[TailwindCSS](https://tailwindcss.com/)** - Estilização utilitária
- **[Auth.js](https://authjs.dev/)** - Autenticação com NextAuth
- **[TanStack Query](https://tanstack.com/query)** - Gerenciamento de estado assíncrono
- **[React Hook Form](https://react-hook-form.com/)** + **[Zod](https://zod.dev/)** - Formulários e validação
- **[Recharts](https://recharts.org/)** - Gráficos e visualizações

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

### Build de Produção

```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
app/
├── (rotas-auth)/          # Rotas protegidas (requer autenticação)
│   ├── processos/         # Gestão de processos e andamentos
│   ├── usuarios/          # Gerenciamento de usuários
│   ├── unidades/          # Cadastro de unidades
│   └── logs/              # Logs do sistema
├── (rotas-livres)/        # Rotas públicas
│   └── login/             # Página de autenticação
└── api/                   # API routes do Next.js

components/
├── ui/                    # Componentes Shadcn/ui
├── sidebar/               # Componentes da sidebar
└── charts/                # Componentes de gráficos

services/
├── processos/             # Serviços de processos
├── andamentos/            # Serviços de andamentos
├── usuarios/              # Serviços de usuários
└── unidades/              # Serviços de unidades

lib/
├── auth/                  # Configuração de autenticação
└── utils.ts               # Utilitários gerais

types/                     # Definições de tipos TypeScript
```

## 🔐 Autenticação

O sistema usa autenticação via LDAP. Para login:

- Usuário: Seu login de rede (ex: `joao.silva`)
- Senha: Sua senha do Active Directory

**Nota**: Não inclua `@rede.sp` no login, o sistema adiciona automaticamente.

## 🎨 Componentes Principais

### Edição em Lote de Andamentos

Permite operações simultâneas em múltiplos andamentos:

- Marcar como concluído
- Prorrogar prazo (com seleção de data)
- Excluir (com confirmação)

### Resposta Final

Ao criar uma resposta final:

- Andamentos em andamento são automaticamente concluídos
- Processo é marcado como finalizado
- Histórico completo é mantido

## 🐛 Troubleshooting

### Problemas Comuns

**Backend não conecta:**

- Verifique se `NEXT_PUBLIC_API_URL` está correto no `.env.local`
- Confirme se o backend está rodando

**Erro de autenticação:**

- Verifique conectividade com servidor LDAP
- Confirme que o usuário existe na tabela `usuarios` do banco de dados

## 📝 Scripts Disponíveis

```bash
npm run dev        # Desenvolvimento com hot-reload (porta 3001)
npm run build      # Build de produção
npm start          # Inicia servidor de produção
npm run lint       # Executa ESLint
```

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
2. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
3. Push para a branch (`git push origin feature/MinhaFeature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade da Prefeitura Municipal de São Paulo - SMUL/ATIC.

## 📞 Suporte

Para dúvidas ou problemas, contate a equipe ATIC da SMUL.
