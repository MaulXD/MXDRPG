import { PortalShell } from "@/components/portal/PortalShell";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Layout de `/personagem/**`.
 *
 * POR QUE NÃO REDIRECIONA MAIS AQUI. A versão anterior fazia:
 *
 *     const path = h.get("x-pathname") ?? h.get("x-invoke-path") ?? "/personagem";
 *     redirect(signInPath(path.startsWith("/personagem") ? path : "/personagem"));
 *
 * Nenhum dos dois cabeçalhos existe: o `middleware.ts` não os define e o Next não
 * os injeta. O `?? "/personagem"` era, na prática, o único ramo alcançável — e
 * **`/personagem` não tem `page.tsx`**. Resultado: quem abrisse um link de ficha
 * com a sessão vencida ia para o login e, depois de autenticar, caía num 404.
 *
 * Pior: as páginas-filhas já fazem o redirect CERTO, com o caminho exato de volta
 * (`/personagem/[id]`, `/personagem/[id]/editar?requestId=…`, `/personagem/novo`).
 * O layout roda antes e anulava todas elas.
 *
 * Então o gate saiu daqui. Sem sessão, o layout devolve `children` cru: a página
 * filha assume e manda o usuário para o login com o destino correto. Nada é
 * renderizado nesse caminho, porque o `redirect()` dela aborta antes.
 *
 * ISSO SÓ É SEGURO ENQUANTO TODA PÁGINA FILHA TIVER SUA PRÓPRIA GUARDA.
 * `scripts/verify-rotas.mjs` exige exatamente isso — uma página nova sob
 * `/personagem` sem guarda quebra o teste.
 */
export default async function PersonagemLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return <>{children}</>;
  return <PortalShell user={session.user}>{children}</PortalShell>;
}
