# Privacidade e LGPD — Eldarin RPG (VTT)

> Rascunho para conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018). Revisar com assessoria jurídica antes do lançamento público.

## 1. Controlador

| Campo | Valor |
|-------|--------|
| **Serviço** | Eldarin RPG — mesa virtual no browser |
| **Responsável** | [Preencher razão social / titular] |
| **Contato DPO / privacidade** | [E-mail] |

## 2. Dados coletados

| Dado | Finalidade | Base legal (LGPD) |
|------|------------|-------------------|
| E-mail | Conta, recuperação de senha, comunicação essencial | Execução de contrato / consentimento |
| Apelido (nickname) | Login alternativo, exibição na mesa | Execução de contrato |
| Senha (hash bcrypt) | Autenticação | Execução de contrato |
| Nome de exibição | Chat e ficha | Execução de contrato |
| Ficha de personagem (JSON) | Jogo | Execução de contrato |
| Retrato / recorte de token | Avatar na mesa | Consentimento (upload voluntário) |
| Logs de sessão / IP (servidor) | Segurança, diagnóstico | Legítimo interesse |
| Analytics (se ativado) | Melhoria do produto | Consentimento (banner) |

**Não coletamos intencionalmente** dados de crianças sem consentimento do responsável. O serviço é voltado a mesas de RPG; menores só com autorização documentada do responsável.

## 3. OAuth (Google, Discord)

Ao entrar com provedor social, recebemos identificador e e-mail conforme permissões do provedor. Não publicamos atividade fora do Eldarin RPG.

## 4. Armazenamento

- **Hospedagem:** Contabo (Alemanha) + Neon Postgres (ver políticas dos provedores).
- **Banco:** Neon Postgres (região configurada no projeto — preferir região próxima ao público BR se disponível).
- **Retenção:** contas inativas [definir prazo, ex. 24 meses] podem ser anonimizadas após aviso por e-mail.

## 5. Direitos do titular

O usuário pode solicitar:

- Acesso aos dados da conta
- Correção (ficha, apelido, e-mail)
- Exclusão da conta e fichas
- Portabilidade (export JSON da ficha)
- Revogação de consentimento (analytics)

**Canal:** [e-mail de privacidade] — prazo de resposta sugerido: 15 dias úteis.

## 6. Compartilhamento

Dados **não são vendidos**. Compartilhamento apenas com:

- Provedores de infraestrutura (Contabo, Neon) sob contrato de processamento
- Obrigação legal

## 7. Segurança

- Sessão httpOnly, HTTPS em produção
- Senhas com hash (bcrypt)
- `SESSION_SECRET` e `DATABASE_URL` apenas em variáveis de ambiente
- Sala `demo` pública — não usar dados sensíveis reais

## 8. Cookies

| Cookie | Tipo | Função |
|--------|------|--------|
| `vinite_session` | Essencial | Sessão logada |
| Analytics (opcional) | Não essencial | Métricas de uso |

Banner de consentimento recomendado antes de ativar analytics.

## 9. Mesa e visitantes

- **Visitante (só visualizar):** pode entrar na sala sem conta, sem persistir ficha própria.
- **Mestre / jogador:** conta obrigatória para editar ficha e controlar token (salvo delegação).

## 10. Alterações

Versão e data desta política na página `/privacidade`. Mudanças relevantes notificadas por e-mail ou aviso no login.

## 11. Pendências antes do go-live público

- [ ] Preencher titular e e-mail de contato
- [ ] Página `/privacidade` e `/termos` no site
- [ ] Checkbox de aceite no registro
- [ ] Região Neon + DPA Contabo/Neon arquivados
- [ ] Fluxo de exclusão de conta implementado na API

---

*Rascunho v0.1 — alinhado ao PRD Eldarin RPG v2.0.*
