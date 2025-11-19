# 🔍 Troubleshooting - Erro de Login LDAP

## ❌ Problemas Comuns e Soluções

### **1. Formato do Login Incorreto**

O sistema usa LDAP com domínio `@rede.sp`. Verifique como você está digitando o login:

#### ✅ **Correto:**

```
Login: seu.usuario
Senha: SuaSenha
```

#### ❌ **Incorreto:**

```
Login: seu.usuario@rede.sp  (não precisa do domínio)
Login: REDE\seu.usuario     (não use formato Windows)
```

O **backend adiciona automaticamente** o `@rede.sp` ao login.

---

### **2. Usuário não existe no Banco de Dados**

O LDAP pode autenticar, mas o usuário precisa **existir na tabela `usuarios`** do banco.

#### **Verificar no banco:**

```sql
SELECT login, nome, email, permissao, status
FROM usuarios
WHERE login = 'seu.usuario';
```

#### **Se o usuário não existir:**

- Ele precisa ser cadastrado primeiro no sistema
- Use o Swagger: `http://localhost:3000/api` → `POST /usuarios/criar`
- Ou peça a um administrador para criar

---

### **3. Usuário Desativado**

#### **Verificar status:**

```sql
SELECT login, status FROM usuarios WHERE login = 'seu.usuario';
```

Se `status = 0` (false), o usuário está desativado.

#### **Ativar usuário:**

```sql
UPDATE usuarios SET status = 1 WHERE login = 'seu.usuario';
```

---

### **4. Servidor LDAP Inacessível**

**Configuração atual no `.env` do backend:**

```properties
LDAP_SERVER=ldap://10.10.65.242
LDAP_DOMAIN=@rede.sp
```

#### **Testar conectividade:**

**Windows (PowerShell):**

```powershell
Test-NetConnection -ComputerName 10.10.65.242 -Port 389
```

**Deve retornar:** `TcpTestSucceeded : True`

#### **Se falhar:**

- Servidor LDAP está offline
- Firewall bloqueando porta 389
- VPN necessária para acessar rede interna

---

### **5. Credenciais LDAP Inválidas**

O backend usa credenciais de serviço para consultar o LDAP:

```properties
USER_LDAP=usr_smdu_freenas
PASS_LDAP=Prodam01
```

#### **Possíveis problemas:**

- Senha do usuário de serviço expirou
- Usuário de serviço foi desativado no AD
- Permissões insuficientes no LDAP

---

### **6. Erro de Timeout (10 segundos)**

Se demorar muito e dar timeout, pode ser:

- Backend processando lentamente
- LDAP respondendo devagar
- Banco de dados lento

#### **Verificar logs do backend:**

Procure por mensagens como:

```
[AuthService] Autenticando usuário: seu.usuario
[LdapService] Conectando ao LDAP...
[LdapService] Erro: timeout
```

---

### **7. Unidade não Configurada**

Usuários precisam estar vinculados a uma **unidade**.

#### **Verificar:**

```sql
SELECT u.login, u.nome, un.sigla as unidade
FROM usuarios u
LEFT JOIN unidades un ON u.unidade_id = un.id
WHERE u.login = 'seu.usuario';
```

Se `unidade` for NULL, precisa vincular:

```sql
UPDATE usuarios
SET unidade_id = (SELECT id FROM unidades LIMIT 1)
WHERE login = 'seu.usuario';
```

---

## 🔍 **Como Debugar Passo a Passo**

### **Passo 1: Verificar Console do Navegador**

1. Abra DevTools (F12)
2. Vá para aba **Console**
3. Tente fazer login
4. Procure por erros em vermelho

**Erros comuns:**

- `Failed to fetch` → Backend não está respondendo
- `401 Unauthorized` → Credenciais inválidas
- `500 Internal Server Error` → Erro no backend

---

### **Passo 2: Verificar Logs do Backend**

No terminal onde o backend está rodando, procure por:

```
[AuthController] POST /login
[AuthService] Autenticando usuário: seu.usuario
[LdapService] Tentando autenticar no LDAP...
```

**Erros possíveis:**

- `LDAP bind failed` → Servidor LDAP não autenticou
- `User not found in database` → Usuário não existe no banco
- `User is inactive` → Usuário desativado

---

### **Passo 3: Testar Login pelo Swagger**

1. Acesse: `http://localhost:3000/api`
2. Encontre `POST /login`
3. Clique em "Try it out"
4. Preencha:
   ```json
   {
     "login": "seu.usuario",
     "senha": "SuaSenha"
   }
   ```
5. Execute

**Respostas esperadas:**

✅ **200 OK:**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

❌ **401 Unauthorized:**

```json
{
  "statusCode": 401,
  "message": "Credenciais inválidas"
}
```

❌ **404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Usuário não encontrado"
}
```

---

### **Passo 4: Verificar Resposta da API**

No DevTools, aba **Network**:

1. Tente fazer login
2. Clique na requisição `login`
3. Veja a aba **Response**

**Se for HTML ao invés de JSON** → Backend não está respondendo corretamente

---

## 🆘 **Soluções Rápidas**

### **Solução 1: Criar Usuário de Teste Local**

Se LDAP não estiver funcionando, use autenticação local (se o backend suportar):

```sql
-- Criar usuário teste
INSERT INTO usuarios (id, nome, login, email, permissao, status, unidade_id, criadoEm, atualizadoEm)
VALUES (
    UUID(),
    'Teste Local',
    'teste.local',
    'teste@teste.com',
    'ADM',
    1,
    (SELECT id FROM unidades LIMIT 1),
    NOW(),
    NOW()
);
```

---

### **Solução 2: Verificar se Backend Aceita Login sem LDAP**

Verifique no código do backend se há fallback para autenticação local quando LDAP falha.

---

### **Solução 3: Testar com Outro Usuário**

Tente com um usuário que você **sabe** que funciona para isolar se o problema é:

- Específico do usuário
- Geral do sistema

---

## 📝 **Checklist Completo**

Marque o que você já verificou:

- [ ] Backend está rodando (`localhost:3000`)
- [ ] Frontend está rodando (`localhost:3001`)
- [ ] Formato do login está correto (sem `@rede.sp`)
- [ ] Usuário existe na tabela `usuarios`
- [ ] Usuário tem `status = 1` (ativo)
- [ ] Usuário tem `unidade_id` preenchido
- [ ] Servidor LDAP está acessível (porta 389)
- [ ] Console do navegador não mostra erros de rede
- [ ] Logs do backend não mostram erros
- [ ] Teste no Swagger funciona

---

## 💡 **Qual é o erro exato que você está vendo?**

Para te ajudar melhor, me informe:

1. **Mensagem de erro** (do navegador ou backend)
2. **Usuário que está tentando** (ex: `joao.silva`)
3. **Logs do backend** (última linha quando tenta login)
4. **Resposta do Swagger** (se testou por lá)

Com essas informações posso te dar uma solução mais específica! 🚀
