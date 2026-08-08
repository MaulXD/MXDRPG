/**
 * Texto da Política de Privacidade, em JSX.
 *
 * POR QUE NÃO LÊ MAIS O MARKDOWN. A página antes fazia
 * `fs.readFileSync("docs/PRIVACIDADE-LGPD.md")` dentro de um `try/catch {}`
 * silencioso, com um fallback literal. Mas `docs/` está no `.dockerignore`, então
 * **na imagem de produção o arquivo nunca existe** — o `catch` engolia a falha e
 * o que ia ao ar era o texto de fallback:
 *
 *   "Política em atualização. Edite docs/PRIVACIDADE-LGPD.md com e-mail do
 *    titular antes do lançamento."
 *
 * Ou seja: a plataforma publicava um recado interno de desenvolvedor no lugar da
 * política de privacidade. Isso é exposição legal (LGPD), não um bug de estilo.
 *
 * Além disso o markdown era jogado num `<article>` com `white-space: pre-wrap`
 * **sem parser nenhum** — então mesmo em desenvolvimento saíam `#`, `**` e a
 * tabela de pipes crus na tela.
 *
 * `docs/PRIVACIDADE-LGPD.md` CONTINUA sendo o texto autoral de referência. Para
 * as duas versões não divergirem em silêncio, `scripts/verify-legal-pages.mjs`
 * confere que toda seção numerada do markdown tem cabeçalho correspondente aqui
 * e que o e-mail do titular é o mesmo nos dois lados.
 */

/** Batida com `docs/PRIVACIDADE-LGPD.md` — a asserção confere os dois lados. */
export const PRIVACIDADE_CONTATO = "ti@thep.com.br";
export const PRIVACIDADE_ATUALIZACAO = "junho de 2026";

const DADOS_COLETADOS: Array<[string, string, string]> = [
  ["Endereço de e-mail", "Autenticação e recuperação de conta", "Execução de contrato (art. 7º, V)"],
  ["Nome de exibição", "Identificação na mesa virtual e no chat", "Execução de contrato (art. 7º, V)"],
  ["Senha (armazenada como hash bcrypt)", "Autenticação segura", "Execução de contrato (art. 7º, V)"],
  ["Fichas de personagem e inventário", "Funcionamento do jogo", "Execução de contrato (art. 7º, V)"],
  ["Retrato / imagem de token (upload voluntário)", "Avatar na mesa virtual", "Consentimento (art. 7º, I)"],
  ["Logs de acesso (IP, timestamp)", "Segurança e prevenção de abusos", "Legítimo interesse (art. 7º, IX)"],
];

const DIREITOS: Array<[string, string]> = [
  ["Confirmar", "a existência de tratamento dos seus dados;"],
  ["Acessar", "os dados que mantemos sobre você;"],
  ["Corrigir", "dados incompletos, inexatos ou desatualizados;"],
  ["Eliminar", "dados desnecessários ou tratados em desconformidade;"],
  ["Portabilidade", "dos seus dados (export em formato JSON);"],
  ["Revogar", "o consentimento a qualquer momento;"],
  ["Opor-se", "ao tratamento realizado com base em legítimo interesse."],
];

export function PrivacidadeConteudo() {
  return (
    <div className="legal-doc">
      <p className="legal-doc__updated">
        <strong>Última atualização:</strong> {PRIVACIDADE_ATUALIZACAO}
      </p>

      <h2>1. Controlador</h2>
      <p>
        MXDRPG é uma plataforma de mesa virtual (VTT) gratuita para RPG de mesa, desenvolvida e operada de forma
        independente.
      </p>
      <p>
        <strong>Contato para assuntos de privacidade:</strong>{" "}
        <a href={`mailto:${PRIVACIDADE_CONTATO}`}>{PRIVACIDADE_CONTATO}</a>
      </p>

      <h2>2. Dados Coletados</h2>
      <p>Coletamos apenas os dados estritamente necessários para o funcionamento da plataforma:</p>
      <div className="legal-doc__table-wrap">
        <table className="legal-doc__table">
          <thead>
            <tr>
              <th scope="col">Dado</th>
              <th scope="col">Finalidade</th>
              <th scope="col">Base Legal (LGPD)</th>
            </tr>
          </thead>
          <tbody>
            {DADOS_COLETADOS.map(([dado, finalidade, base]) => (
              <tr key={dado}>
                <td>{dado}</td>
                <td>{finalidade}</td>
                <td>{base}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Não coletamos dados sensíveis conforme o art. 11 da LGPD. Não utilizamos publicidade comportamental.
      </p>

      <h2>3. Autenticação Social (OAuth)</h2>
      <p>
        Ao entrar com Google ou Discord, recebemos apenas o identificador e o e-mail conforme as permissões concedidas
        pelo provedor. Não publicamos sua atividade fora da plataforma MXDRPG.
      </p>

      <h2>4. Cookies</h2>
      <p>
        Utilizamos exclusivamente cookies de sessão essenciais (<code>vinite_session</code>) para mantê-lo autenticado.
        Não utilizamos cookies de rastreamento ou publicidade de terceiros.
      </p>

      <h2>5. Armazenamento e Segurança</h2>
      <ul>
        <li>Comunicação criptografada via HTTPS em produção.</li>
        <li>Senhas armazenadas com hash bcrypt — nunca em texto claro.</li>
        <li>Credenciais de ambiente mantidas em variáveis de servidor, sem exposição ao cliente.</li>
        <li>Hospedagem em infraestrutura com controles de acesso restrito.</li>
      </ul>

      <h2>6. Compartilhamento de Dados</h2>
      <p>
        Seus dados <strong>não são vendidos nem compartilhados</strong> com terceiros para fins comerciais.
      </p>
      <p>Compartilhamento ocorre somente com:</p>
      <ul>
        <li>Prestadores de infraestrutura essencial (hospedagem, banco de dados), sob obrigação de confidencialidade;</li>
        <li>Autoridades competentes, quando exigido por lei ou ordem judicial.</li>
      </ul>

      <h2>7. Retenção</h2>
      <ul>
        <li>
          <strong>Dados de conta e fichas:</strong> mantidos enquanto a conta estiver ativa.
        </li>
        <li>
          <strong>Logs de acesso:</strong> retidos por até 6 meses.
        </li>
        <li>Contas sem acesso por período prolongado poderão ser anonimizadas mediante aviso prévio por e-mail.</li>
      </ul>

      <h2>8. Menores de Idade</h2>
      <p>
        A plataforma não é direcionada a menores de 13 anos. Caso identificarmos dados de menores coletados sem
        autorização do responsável, os excluiremos imediatamente.
      </p>

      <h2>9. Direitos do Titular (LGPD, art. 18)</h2>
      <p>Você tem direito a:</p>
      <ul>
        {DIREITOS.map(([verbo, resto]) => (
          <li key={verbo}>
            <strong>{verbo}</strong> {resto}
          </li>
        ))}
      </ul>
      <p>
        Para exercer qualquer direito, entre em contato:{" "}
        <strong>
          <a href={`mailto:${PRIVACIDADE_CONTATO}`}>{PRIVACIDADE_CONTATO}</a>
        </strong>
        <br />
        Prazo de resposta: até 15 dias úteis.
      </p>

      <h2>10. Alterações nesta Política</h2>
      <p>
        Notificaremos alterações relevantes por e-mail ou aviso na plataforma. A data de “última atualização” no topo
        sempre refletirá a versão vigente.
      </p>

      <h2>11. Contato e Autoridade Reguladora</h2>
      <ul>
        <li>
          <strong>Controlador:</strong> <a href={`mailto:${PRIVACIDADE_CONTATO}`}>{PRIVACIDADE_CONTATO}</a>
        </li>
        <li>
          <strong>ANPD (Autoridade Nacional de Proteção de Dados):</strong>{" "}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer noopener">
            www.gov.br/anpd
          </a>
        </li>
      </ul>
    </div>
  );
}
