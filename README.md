# NG Studio — Gestão da NG PrintSign

MVP funcional baseado no dashboard escuro, azul e amarelo aprovado para a NG PrintSign. **Projeto inicial sem dependências de terceiros** para facilitar testes, revisão de interface e publicação. A arquitetura pode ser migrada depois para Next.js sem descartar regras de negócio e esquema de dados.

## O que já funciona

- Dashboard com contadores e gráficos calculados a partir das OS reais.
- Ordens de serviço: criar, editar, pesquisar e filtrar por etapa.
- Quadro de produção Kanban com arrastar e soltar.
- Clientes: cadastro e histórico resumido dos pedidos.
- Financeiro: pagamentos parciais, total pago e saldo restante calculado automaticamente; pagamentos separados do status da produção.
- Histórico de serviços entregues e alterações nas OS.
- Prints de tela: cole usando `Cmd+V` (Mac) ou `Ctrl+V` (Windows) ou envie PNG/JPG/WEBP, organize, gire, adicione legenda, defina tamanho e escolha quais aparecem na nota.
- Prévia de nota profissional NG PrintSign, com opção do próprio navegador **Imprimir → Salvar como PDF**. As imagens permanecem proporcionais.
- Modo demonstrativo com dados fictícios persistidos no `localStorage` **apenas neste navegador**.
- Acesso compartilhado por login único, dados em nuvem e anexos privados quando Supabase estiver configurado.

## 1. Rodar agora no computador

Requisito: Node.js 20 ou superior.

```bash
npm run dev
```

Acesse **http://localhost:3000**. Sem configuração de nuvem, abrirá em **MODO DEMONSTRAÇÃO**. Nada será compartilhado entre outros computadores. Não coloque dados reais de clientes nesse modo.

Testes das regras de negócio:

```bash
npm test
```

## 2. Criar banco e login da empresa (necessário para uso real)

1. Crie um projeto em https://supabase.com.
2. No **SQL Editor**, execute o arquivo [`supabase/schema.sql`](supabase/schema.sql) completo (executar apenas uma vez em banco novo).
3. Em **Authentication → Providers**, mantenha login por e-mail/senha. Desabilite *Sign ups* públicos nas configurações de Authentication para que ninguém crie contas.
4. Em **Authentication → Users**, crie manualmente **um usuário para a gráfica** (e-mail e senha fortes). Confirme o e-mail pelo painel ou siga a confirmação oferecida pelo Supabase.
5. Em **Project Settings / Connect / API Keys**, copie a URL do projeto e a **anon / publishable key**. **Nunca** use `service_role` / `secret` em código cliente.
6. Edite `config.js`:

```js
window.NG_CONFIG = {
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseAnonKey: 'SUA_CHAVE_ANON_PUBLICA'
};
```

7. Reinicie a página. Agora deve aparecer o **login da empresa**. Os serviços reais serão salvos no banco com políticas RLS, e os arquivos irão para o bucket privado `ng-anexos`.
8. **Teste** criando uma OS, anexando uma imagem, registrando pagamento e abrindo o PDF. Abra em outro computador para confirmar sincronização (atualiza ao recarregar e aproximadamente a cada 30 segundos quando não há formulário aberto).

**Atenção:** o usuário único é intencional; todos compartilham permissões e não existe auditoria confiável por funcionário. O campo *Atendente* é manual. A senha da empresa não deve estar no repositório.

## 3. Publicar com GitHub + Vercel

1. Crie um repositório **privado** chamado `NGStudio` em https://github.com/new (não marque template nem README).
2. No Terminal, dentro desta pasta, execute:

```bash
git init
git add .
git commit -m "NG Studio: MVP dashboard, OS, Kanban e PDF"
git branch -M main
git remote add origin https://github.com/felipemrvip/NGStudio.git
git push -u origin main
```

3. Em https://vercel.com/new, escolha **Import Git Repository** e selecione `NGStudio`.
4. Em Framework Preset, escolha **Other**; não há comando de build nem diretório de saída especial — o `index.html` está na raiz.
5. Clique em Deploy; a Vercel mostrará o endereço real gerado.
6. Para funcionamento real, faça o passo 2 e publique o `config.js` com apenas a chave anon/publishable, jamais uma chave privilegiada.

**Observação:** o deploy não configura sozinho Supabase nem cria usuários. A primeira publicação pode ser só para demonstrar o design, mas o modo demonstração não é adequado para produção.

## 4. Uso do PDF

Abra uma OS já salva → **Visualizar PDF** → **Imprimir / Salvar PDF**. Escolha *Salvar como PDF* no diálogo de impressão de Chrome/Edge/Safari, com gráficos de fundo habilitados para preservar as cores azul e amarela.

Quando há várias imagens, o modelo adapta grade e permite páginas adicionais. A versão atual não mantém cópias imutáveis dos PDFs emitidos nem implementa assinatura eletrônica. Essas funções podem entrar na próxima fase.

## 5. Estrutura do projeto

```text
ng-studio/
├── index.html                 # Entrada do aplicativo
├── config.js                  # Chave pública e URL do Supabase
├── assets/
│   ├── app.js                 # UI e interações
│   ├── demo.js                # Exemplos fictícios para avaliação
│   ├── logic.mjs              # Cálculos e status
│   ├── print.js               # Layout de impressão/PDF
│   ├── supabase.js            # REST, Auth e Storage privado
│   ├── styles.css             # Design premium aprovado
│   └── favicon.svg
├── supabase/schema.sql        # Tabelas, políticas RLS e storage
├── tests/logic.test.mjs       # Testes automatizados
├── docs/referencia-dashboard.jpg
├── dev-server.mjs             # Servidor local sem dependências
└── package.json
```

## Próxima fase recomendada

- Auditoria avançada e relatórios: a numeração em modo nuvem já é atômica no banco; no modo demonstração usa sequência local.
- Registro de itens com quantidades e preços separados na OS, não apenas total e descrição.
- Cópia imutável de cada PDF enviado ao cliente.
- Exclusão/limpeza de imagens antigas no storage privado.
- Revisão de políticas, backup recorrente e testes completos antes de usar como sistema oficial.
- Migração opcional da UI para Next.js/React, se a complexidade crescer.

## Estado dos testes da entrega

- 11 testes automatizados de regras financeiras, IDs e geração do HTML imprimível passaram.
- Sintaxe dos módulos JavaScript validada.
- Servidor local respondeu HTTP 200 para `index.html`.
- **Ainda falta validação visual manual em navegador**, pois o Chromium deste ambiente tem política administrativa que bloqueia a abertura de páginas locais. Portanto, não considere a UI testada de ponta a ponta até executar os passos de verificação após baixar o pacote.
- A conexão real ao Supabase e o deploy na Vercel **ainda não foram realizados**, porque exigem o projeto/credenciais da empresa e um repositório no GitHub.