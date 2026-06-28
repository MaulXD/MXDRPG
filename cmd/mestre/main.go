package main

import (
	"bufio"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"
)

const (
	repoURL     = "https://github.com/MaulXD/MXDRPG.git"
	composeFile = "docker-compose.local.yml"
)

// ── Ponto de entrada ──────────────────────────────────────────────────────────

func main() {
	enableColors()

	fmt.Println()
	fmt.Println("  ╔══════════════════════════════════════════════════════╗")
	fmt.Println("  ║            MXDRPG — Assistente do Mestre            ║")
	fmt.Println("  ╚══════════════════════════════════════════════════════╝")
	fmt.Println()

	home, err := os.UserHomeDir()
	if err != nil {
		fatal("Não foi possível determinar o diretório home: " + err.Error())
	}
	dir := filepath.Join(home, "MXDRPG")

	// ── 1. Docker ─────────────────────────────────────────────────────────────
	printStep(1, 5, "Verificando Docker Desktop")
	if err := runSilent("docker", "info"); err != nil {
		fmt.Println()
		printError("Docker Desktop não está rodando.")
		fmt.Println()
		fmt.Println("  O que fazer:")
		fmt.Println("    1. Procure o ícone da baleia na barra de tarefas")
		fmt.Println("    2. Clique nele e aguarde o status ficar \"Running\"")
		fmt.Println("    3. Abra este programa novamente")
		fmt.Println()
		fmt.Println("  Não tem Docker? Baixe em:")
		fmt.Println("  https://www.docker.com/products/docker-desktop/")
		waitEnter()
		os.Exit(1)
	}
	printOK()

	// ── 2. Repo ───────────────────────────────────────────────────────────────
	printStep(2, 5, "Atualizando MXDRPG")
	if err := cloneOrUpdate(dir); err != nil {
		fmt.Println()
		printError(err.Error())
		waitEnter()
		os.Exit(1)
	}
	printOK()

	// ── 3. Configuração ───────────────────────────────────────────────────────
	printStep(3, 5, "Configurando")
	envFile := filepath.Join(dir, ".env.local")
	if err := ensureEnvFile(envFile); err != nil {
		fmt.Println()
		printError(err.Error())
		waitEnter()
		os.Exit(1)
	}
	printOK()

	// ── 4. Servidores ─────────────────────────────────────────────────────────
	printStep(4, 5, "Iniciando servidores")

	firstRunFile := filepath.Join(dir, ".first_run_done")
	isFirst := !fileExists(firstRunFile)
	if isFirst {
		fmt.Printf("\n  \033[2mPrimeira execução — build inicial (~5 minutos). Aguarde...\033[0m\n")
	}

	args := []string{"compose", "-f", filepath.Join(dir, composeFile), "up"}
	if isFirst {
		args = append(args, "--build")
	}

	srv := exec.Command("docker", args...)
	srv.Dir = dir
	if err := srv.Start(); err != nil {
		fmt.Println()
		printError("Falha ao iniciar: " + err.Error())
		waitEnter()
		os.Exit(1)
	}

	if isFirst {
		os.WriteFile(firstRunFile, []byte("done"), 0644)
	}
	printOK()

	// Encerramento limpo com Ctrl+C
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		fmt.Println("\n\n  Encerrando servidores...")
		exec.Command("docker", "compose", "-f", filepath.Join(dir, composeFile), "down").Run()
		srv.Process.Kill()
		fmt.Println("  Dados salvos. Até a próxima sessão!")
		os.Exit(0)
	}()

	// ── 5. Link ngrok ─────────────────────────────────────────────────────────
	printStep(5, 5, "Aguardando link dos jogadores")

	ngrokURL, err := waitForNgrok(180)
	if err != nil {
		fmt.Println()
		fmt.Println("  \033[33m[AVISO]\033[0m Timeout aguardando o ngrok.")
		fmt.Println("  Abra http://localhost:4040 para ver o link manualmente.")
		fmt.Println()
		fmt.Println("  Pressione Ctrl+C para encerrar quando terminar a sessão.")
		srv.Wait()
		return
	}
	printOK()

	// Banner final — interior 54 chars: │  conteúdo(52 max)  │
	url := ngrokURL
	if len(url) > 50 {
		url = url[:47] + "..."
	}
	fmt.Println()
	fmt.Println("  ┌──────────────────────────────────────────────────────┐")
	fmt.Println("  │                    MESA PRONTA!                      │")
	fmt.Println("  ├──────────────────────────────────────────────────────┤")
	fmt.Println("  │                                                      │")
	fmt.Println("  │  Link dos jogadores (mande no grupo):                │")
	fmt.Printf("  │  \033[36m%-52s\033[0m│\n", url)
	fmt.Println("  │                                                      │")
	fmt.Printf("  │  %-52s│\n", "Seu acesso: http://localhost:3000")
	fmt.Println("  │                                                      │")
	fmt.Println("  └──────────────────────────────────────────────────────┘")
	fmt.Println()
	fmt.Println("  Pressione \033[1mCtrl+C\033[0m para encerrar a sessão.")
	fmt.Println("  Dados salvos automaticamente a cada 60 segundos.")
	fmt.Println()

	openBrowser("http://localhost:3000")

	srv.Wait()
}

// ── Repo ──────────────────────────────────────────────────────────────────────

func cloneOrUpdate(dir string) error {
	gitDir := filepath.Join(dir, ".git")
	if fileExists(gitDir) {
		out, err := exec.Command("git", "-C", dir, "pull", "--ff-only").CombinedOutput()
		if err != nil {
			return fmt.Errorf("git pull falhou: %s", strings.TrimSpace(string(out)))
		}
		return nil
	}
	out, err := exec.Command("git", "clone", "--depth", "1", repoURL, dir).CombinedOutput()
	if err != nil {
		return fmt.Errorf("git clone falhou: %s", strings.TrimSpace(string(out)))
	}
	return nil
}

// ── .env.local ────────────────────────────────────────────────────────────────

func ensureEnvFile(path string) error {
	if fileExists(path) {
		content, _ := os.ReadFile(path)
		if strings.Contains(string(content), "NGROK_AUTHTOKEN=") &&
			!strings.Contains(string(content), "NGROK_AUTHTOKEN=\n") &&
			!strings.Contains(string(content), "NGROK_AUTHTOKEN=cole_") {
			return nil // já configurado
		}
	}

	fmt.Println()
	fmt.Println()
	fmt.Println("  Configuração inicial — só precisa fazer isso uma vez.")
	fmt.Println()
	fmt.Println("  Para que os jogadores acessem de fora, precisamos de um")
	fmt.Println("  token gratuito do ngrok. Siga os passos:")
	fmt.Println()
	fmt.Println("    1. Abra: https://ngrok.com/signup")
	fmt.Println("    2. Crie a conta (sem cartão de crédito)")
	fmt.Println("    3. Vá em: Dashboard > Your Authtoken")
	fmt.Println("    4. Copie o token")
	fmt.Println()
	fmt.Print("  Cole o token aqui: ")

	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	token := strings.TrimSpace(scanner.Text())
	if token == "" {
		return fmt.Errorf("token ngrok é obrigatório")
	}

	secret, err := generateSecret()
	if err != nil {
		return fmt.Errorf("falha ao gerar chave de segurança: %s", err)
	}

	env := fmt.Sprintf(
		"NGROK_AUTHTOKEN=%s\nSESSION_SECRET=%s\nDB_PASSWORD=mxdrpg_local\nDB_ROOT_PASSWORD=mxdrpg_root\nAUTH_URL=http://localhost:3000\nGOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET=\nDISCORD_CLIENT_ID=\nDISCORD_CLIENT_SECRET=\n",
		token, secret,
	)
	return os.WriteFile(path, []byte(env), 0600)
}

// ── ngrok ─────────────────────────────────────────────────────────────────────

type ngrokResp struct {
	Tunnels []struct {
		Proto     string `json:"proto"`
		PublicURL string `json:"public_url"`
	} `json:"tunnels"`
}

func waitForNgrok(maxSeconds int) (string, error) {
	deadline := time.Now().Add(time.Duration(maxSeconds) * time.Second)
	attempt := 0
	for time.Now().Before(deadline) {
		time.Sleep(4 * time.Second)
		attempt++
		if url := queryNgrok(); url != "" {
			return url, nil
		}
		fmt.Printf("\r  Aguardando... (%ds)   ", attempt*4)
	}
	fmt.Println()
	return "", fmt.Errorf("timeout")
}

func queryNgrok() string {
	resp, err := http.Get("http://localhost:4040/api/tunnels")
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	var r ngrokResp
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return ""
	}
	for _, t := range r.Tunnels {
		if t.Proto == "https" {
			return t.PublicURL
		}
	}
	return ""
}

// ── Utilitários ───────────────────────────────────────────────────────────────

func runSilent(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	return cmd.Run()
}

func generateSecret() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	cmd.Start()
}

func waitEnter() {
	fmt.Print("\n  Pressione Enter para sair...")
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}

func printStep(n, total int, msg string) {
	fmt.Printf("  [%d/%d] %s", n, total, msg)
}

func printOK() {
	fmt.Printf(" \033[32m✓\033[0m\n")
}

func printError(msg string) {
	fmt.Printf("  \033[31m[ERRO]\033[0m %s\n", msg)
}

func fatal(msg string) {
	printError(msg)
	waitEnter()
	os.Exit(1)
}
