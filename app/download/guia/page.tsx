import Link from "next/link";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata(
  "Guia do Mestre — Hospedagem local",
  "Passo a passo completo para o mestre configurar a mesa MXDRPG no próprio PC."
);

export default function GuiaPage() {
  return (
    <div className="page-wrap" style={{ maxWidth: 700, margin: "0 auto", paddingTop: "2rem", paddingBottom: "5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/download" className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>
          ← Voltar para Downloads
        </Link>
      </div>
      <p className="eyebrow">Para o Mestre</p>
      <h1 className="display-lg" style={{ marginBottom: "0.5rem" }}>Guia de configuração</h1>
      <p className="lead" style={{ marginBottom: "2.5rem" }}>
        Siga os passos abaixo. Clique em cada um para marcá-lo como concluído.
      </p>
      <GuiaInterativo />
    </div>
  );
}

function GuiaInterativo() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: GUIA_HTML }}
    />
  );
}

const GUIA_HTML = `
<style>
.gi-steps{display:flex;flex-direction:column;gap:10px;margin-bottom:3rem}
.gi-step{background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);cursor:pointer;transition:border-color .2s,background .2s;user-select:none}
.gi-step:hover{border-color:var(--accent-dim)}
.gi-step.done{border-color:#4a9e6c;background:rgba(74,158,108,.07)}
.gi-step.done .gi-num{background:#4a9e6c;color:#fff}
.gi-step.done .gi-title{color:var(--text-muted);text-decoration:line-through;text-decoration-color:#4a9e6c}
.gi-step.done .gi-body{display:none}
.gi-head{display:flex;align-items:flex-start;gap:14px;padding:16px 18px}
.gi-num{width:26px;height:26px;border-radius:50%;background:var(--accent-dim);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:background .2s}
.gi-meta{flex:1;min-width:0}
.gi-title{font-size:15px;font-weight:600;color:var(--text-strong);margin-bottom:3px;transition:color .2s}
.gi-desc{font-size:13px;color:var(--text-muted)}
.gi-body{padding:0 18px 18px 58px;font-size:14px;color:var(--text)}
.gi-body p{margin-bottom:12px;line-height:1.6}
.gi-body p:last-child{margin-bottom:0}
.gi-body a{color:var(--accent);text-underline-offset:3px}
.gi-code{background:#0e0d0b;border:1px solid var(--glass-border);border-radius:6px;overflow-x:auto;margin:10px 0}
.gi-code-h{display:flex;align-items:center;justify-content:space-between;padding:7px 12px;border-bottom:1px solid var(--glass-border)}
.gi-lang{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);font-family:ui-monospace,monospace}
.gi-copy{font-size:11px;color:var(--text-dim);background:none;border:1px solid var(--glass-border);border-radius:4px;padding:2px 8px;cursor:pointer;transition:color .15s,border-color .15s}
.gi-copy:hover{color:var(--accent);border-color:var(--accent-dim)}
.gi-copy.ok{color:#4a9e6c;border-color:#4a9e6c}
.gi-code pre{font-family:ui-monospace,'Cascadia Code',monospace;font-size:12.5px;line-height:1.6;padding:12px;color:#c8c0b0;overflow-x:auto;margin:0}
.gi-callout{border-radius:6px;padding:10px 13px;font-size:13px;margin:10px 0;display:flex;gap:9px;align-items:flex-start;line-height:1.5}
.gi-callout.tip{background:rgba(74,158,108,.08);border-left:3px solid #4a9e6c;color:#6dbf8e}
.gi-callout.info{background:rgba(74,122,181,.08);border-left:3px solid #4a7ab5;color:#8ab4d4}
.gi-callout.warn{background:rgba(192,122,40,.08);border-left:3px solid #c07a28;color:#c9924a}
.gi-progress{position:sticky;top:56px;z-index:10;background:var(--glass);border-bottom:1px solid var(--glass-border);padding:8px 0 10px;margin-bottom:1.5rem;display:flex;align-items:center;gap:14px;backdrop-filter:blur(8px)}
.gi-progress-label{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);white-space:nowrap;flex-shrink:0}
.gi-progress-track{flex:1;height:4px;background:var(--glass-border);border-radius:2px;overflow:hidden}
.gi-progress-fill{height:100%;background:var(--accent);border-radius:2px;transition:width .4s ease;width:0%}
.gi-progress-count{font-size:12px;color:var(--text-dim);white-space:nowrap;flex-shrink:0;font-variant-numeric:tabular-nums}
.gi-done-banner{display:none;background:rgba(74,158,108,.07);border:1px solid #4a9e6c;border-radius:var(--radius);padding:18px 22px;text-align:center;margin-bottom:2rem}
.gi-done-banner h2{color:#4a9e6c;font-size:17px;margin-bottom:5px}
.gi-done-banner p{color:#6dbf8e;font-size:13px}
.gi-trouble-list{display:flex;flex-direction:column;gap:7px;margin-top:1.5rem}
.gi-trouble{border:1px solid var(--glass-border);border-radius:var(--radius);overflow:hidden}
.gi-trouble-q{padding:11px 15px;font-size:13px;font-weight:500;color:var(--text-strong);cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:var(--glass);transition:background .15s}
.gi-trouble-q:hover{background:var(--surface-raised)}
.gi-trouble-q .chv{color:var(--text-dim);font-size:11px;transition:transform .2s}
.gi-trouble.open .chv{transform:rotate(90deg)}
.gi-trouble-a{padding:11px 15px;font-size:13px;color:var(--text-muted);background:var(--surface-inset);border-top:1px solid var(--glass-border);display:none;line-height:1.6}
.gi-trouble.open .gi-trouble-a{display:block}
.gi-trouble-a code{font-family:ui-monospace,monospace;font-size:11px;background:#0e0d0b;padding:1px 5px;border-radius:3px;color:var(--accent)}
.gi-section-label{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin:2rem 0 1rem;padding-bottom:7px;border-bottom:1px solid var(--glass-border)}
</style>

<div class="gi-progress" id="gi-progress">
  <span class="gi-progress-label">Progresso</span>
  <div class="gi-progress-track"><div class="gi-progress-fill" id="gi-fill"></div></div>
  <span class="gi-progress-count" id="gi-count">0 / 7</span>
</div>

<div id="gi-done-banner" class="gi-done-banner">
  <h2>Mesa pronta!</h2>
  <p>Todos os passos concluídos. Boa sessão, mestre.</p>
</div>

<p class="gi-section-label">Configuração</p>
<div class="gi-steps" id="gi-steps">

<div class="gi-step" id="gs1" onclick="giToggle(1)">
<div class="gi-head"><div class="gi-num">1</div><div class="gi-meta"><div class="gi-title">Instalar Docker Desktop</div><div class="gi-desc">Programa que roda o servidor em container</div></div></div>
<div class="gi-body">
<p>Docker Desktop é o único programa que precisa instalar. Ele roda banco de dados, aplicação e túnel ngrok — tudo isolado.</p>
<p><a href="https://www.docker.com/products/docker-desktop/" target="_blank">→ Baixar Docker Desktop</a> (Windows 10/11 · macOS 12+ · Ubuntu 22+)</p>
<p>Após instalar, abra e aguarde o ícone da baleia na barra de tarefas. Ele precisa estar rodando para os próximos passos.</p>
<div class="gi-callout tip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>No Windows: se aparecer mensagem sobre WSL 2, aceite. É necessário.</span></div>
</div>
</div>

<div class="gi-step" id="gs2" onclick="giToggle(2)">
<div class="gi-head"><div class="gi-num">2</div><div class="gi-meta"><div class="gi-title">Criar conta no ngrok</div><div class="gi-desc">Gera o link público para os jogadores</div></div></div>
<div class="gi-body">
<p>O ngrok cria um túnel seguro. Os jogadores vão receber um link <code style="font-family:ui-monospace;font-size:12px;background:#0e0d0b;padding:1px 5px;border-radius:3px;color:var(--accent)">https://abc123.ngrok-free.app</code> que abre direto no browser.</p>
<p><a href="https://ngrok.com/signup" target="_blank">→ Criar conta gratuita em ngrok.com</a></p>
<p>Após criar a conta, acesse <strong>Dashboard → Your Authtoken</strong> e copie o token. Vai precisar no próximo passo.</p>
</div>
</div>

<div class="gi-step" id="gs3" onclick="giToggle(3)">
<div class="gi-head"><div class="gi-num">3</div><div class="gi-meta"><div class="gi-title">Baixar o Assistente do Mestre</div><div class="gi-desc">Executável que configura e sobe tudo</div></div></div>
<div class="gi-body">
<p>Baixe o arquivo para o seu sistema na <a href="/download">página de downloads</a> e coloque numa pasta de fácil acesso (ex: Área de Trabalho).</p>
<div class="gi-callout info"><span>ℹ</span><span>No Mac e Linux: abra o terminal na pasta e rode <code>chmod +x mxdrpg-mestre-*</code> antes de executar.</span></div>
</div>
</div>

<div class="gi-step" id="gs4" onclick="giToggle(4)">
<div class="gi-head"><div class="gi-num">4</div><div class="gi-meta"><div class="gi-title">Abrir o Assistente</div><div class="gi-desc">Clique duas vezes no arquivo baixado</div></div></div>
<div class="gi-body">
<p>O assistente vai verificar o Docker, baixar o MXDRPG automaticamente e pedir seu token ngrok (apenas na primeira vez).</p>
<div class="gi-callout warn"><span>⚠</span><span>Mantenha o programa aberto durante toda a sessão. Fechar encerra o servidor.</span></div>
</div>
</div>

<div class="gi-step" id="gs5" onclick="giToggle(5)">
<div class="gi-head"><div class="gi-num">5</div><div class="gi-meta"><div class="gi-title">Aguardar o link dos jogadores</div><div class="gi-desc">Aparece automaticamente na tela</div></div></div>
<div class="gi-body">
<p>Na primeira vez demora ~5 minutos (build completo). Nas próximas sessões: ~30 segundos.</p>
<p>O assistente exibe o link quando o servidor estiver pronto. Exemplo:</p>
<div class="gi-code"><div class="gi-code-h"><span class="gi-lang">Terminal</span></div><pre style="color:#7dbfdf">https://abc123def.ngrok-free.app</pre></div>
</div>
</div>

<div class="gi-step" id="gs6" onclick="giToggle(6)">
<div class="gi-head"><div class="gi-num">6</div><div class="gi-meta"><div class="gi-title">Criar sua conta de mestre</div><div class="gi-desc">Primeiro acesso ao sistema local</div></div></div>
<div class="gi-body">
<p>O browser abre automaticamente em <code style="font-family:ui-monospace;font-size:12px;background:#0e0d0b;padding:1px 5px;border-radius:3px;color:#9ecfb0">localhost:3000</code>. Crie uma conta com e-mail e senha — não precisa ser e-mail real.</p>
<p>Depois, crie uma aventura e gere o convite para os jogadores com o link ngrok.</p>
</div>
</div>

<div class="gi-step" id="gs7" onclick="giToggle(7)">
<div class="gi-head"><div class="gi-num">7</div><div class="gi-meta"><div class="gi-title">Compartilhar com os jogadores</div><div class="gi-desc">Mande o link ngrok no grupo</div></div></div>
<div class="gi-body">
<p>Cada jogador abre o link no browser, cria uma conta e acessa a aventura normalmente.</p>
<div class="gi-callout info"><span>ℹ</span><span>Na primeira visita, o ngrok mostra uma tela de aviso. O jogador clica em "Visit Site" uma vez e não vê mais.</span></div>
<p>Para encerrar a sessão: feche o assistente ou pressione <strong>Ctrl+C</strong>. Os dados ficam salvos automaticamente.</p>
</div>
</div>

</div>

<p class="gi-section-label">Problemas comuns</p>
<div class="gi-trouble-list">
<div class="gi-trouble" onclick="this.classList.toggle('open')"><div class="gi-trouble-q"><span>Docker não inicia — erro sobre WSL 2</span><span class="chv">▶</span></div><div class="gi-trouble-a">Abra o PowerShell como administrador e rode: <code>wsl --install</code>. Reinicie o PC e abra o Docker Desktop novamente.</div></div>
<div class="gi-trouble" onclick="this.classList.toggle('open')"><div class="gi-trouble-q"><span>Porta 3000 já está em uso</span><span class="chv">▶</span></div><div class="gi-trouble-a">Feche o assistente, aguarde 10 segundos e abra novamente. Ou rode no terminal: <code>docker compose -f ~/MXDRPG/docker-compose.local.yml down</code></div></div>
<div class="gi-trouble" onclick="this.classList.toggle('open')"><div class="gi-trouble-q"><span>Jogadores veem tela de aviso do ngrok</span><span class="chv">▶</span></div><div class="gi-trouble-a">Normal — o ngrok gratuito mostra isso na primeira visita. Os jogadores clicam em "Visit Site" e não veem mais naquela aba.</div></div>
<div class="gi-trouble" onclick="this.classList.toggle('open')"><div class="gi-trouble-q"><span>A mesa sumiu depois de reiniciar</span><span class="chv">▶</span></div><div class="gi-trouble-a">Os dados ficam no volume Docker <code>mxdrpg_local_db</code>. Certifique-se de não ter rodado <code>docker compose down -v</code> — o <code>-v</code> apaga os volumes. Sem o <code>-v</code>, dados são preservados.</div></div>
</div>

<script>
var GI_TOTAL=7;
function giToggle(n){document.getElementById('gs'+n).classList.toggle('done');giUpdate()}
function giUpdate(){var d=document.querySelectorAll('.gi-step.done').length;document.getElementById('gi-fill').style.width=(d/GI_TOTAL*100)+'%';document.getElementById('gi-count').textContent=d+' / '+GI_TOTAL;document.getElementById('gi-done-banner').style.display=d===GI_TOTAL?'block':'none'}
function giCopy(btn,e){e&&e.stopPropagation();var pre=btn.closest('.gi-code').querySelector('pre');navigator.clipboard.writeText(pre.innerText.trim()).then(function(){btn.textContent='copiado';btn.classList.add('ok');setTimeout(function(){btn.textContent='copiar';btn.classList.remove('ok')},2000)})}
giUpdate();
</script>
`;
