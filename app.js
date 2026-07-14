/*******************************************************************************
 * 1. CONFIGURAÇÕES E ESTADO GLOBAL (100% LOCAL)
 *******************************************************************************/
// Simulador de Banco de Dados Local usando o armazenamento do navegador (localStorage)
if (!localStorage.getItem("votos_agenda")) localStorage.setItem("votos_agenda", "14");
if (!localStorage.getItem("votos_quiz")) localStorage.setItem("votos_quiz", "32");
if (!localStorage.getItem("sugestoes_locais")) localStorage.setItem("sugestoes_locais", JSON.stringify([]));

let currentUser = JSON.parse(localStorage.getItem("esed_user")) || null;
let currentTab = 'inicio';
let academicChartInstance = null;
let appChartInstance = null;

// Inicialização Automática ao Carregar o Site
window.onload = function() {
    checkConnectionStatus();
    renderNews();
    fetchVotesStatus();
    updateUserUI();
    
    // Monitorar conexão de internet em tempo real (Modo Offline)
    window.addEventListener('online', toggleOnlineStatus);
    window.addEventListener('offline', toggleOnlineStatus);
};

/*******************************************************************************
 * 2. FLUXO DE ENTRADA (TELA DE BOAS-VINDAS) & NAVEGAÇÃO
 *******************************************************************************/
function enterApp() {
    const welcome = document.getElementById("welcomeScreen");
    const appInterface = document.getElementById("appInterface");
    
    if (welcome && appInterface) {
        welcome.style.opacity = "0";
        setTimeout(() => {
            welcome.style.display = "none";
            appInterface.style.display = "block";
            // Inicializa os gráficos
            initCharts();
        }, 300);
    }
}

function toggleMenu() {
    const menu = document.getElementById("sidebarMenu");
    if (menu) menu.classList.toggle("active");
}

function showModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex'; 
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none'; 
}

// Sistema de Troca de Abas (Tabs) Sem Recarregar a Página
function switchTab(tabId) {
    currentTab = tabId;
    
    // Remove classe ativa de todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Ativa a aba selecionada
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.classList.add('active');
    
    // Fecha o menu lateral caso esteja no telemóvel
    const menu = document.getElementById("sidebarMenu");
    if (menu) menu.classList.remove("active");
    
    // Atualiza os gráficos se entrar na aba de desempenho
    if (tabId === 'desempenho') {
        setTimeout(() => { initCharts(); }, 150);
    }
}

/*******************************************************************************
 * 3. CONTROLADOR DE ALERTAS PERSONALIZADO
 *******************************************************************************/
function customAlert(titulo, mensagem, tipo = 'info') {
    const alertTitle = document.getElementById("customAlertTitle");
    const alertMessage = document.getElementById("customAlertMessage");
    const icon = document.getElementById("customAlertIcon");
    
    if (alertTitle && alertMessage && icon) {
        alertTitle.innerText = titulo;
        alertMessage.innerText = mensagem;
        
        if (tipo === 'erro') {
            icon.className = "fas fa-exclamation-triangle";
            icon.style.color = "#ef4444";
        } else {
            icon.className = "fas fa-info-circle";
            icon.style.color = "#3b82f6";
        }
        showModal("customAlertModal");
    }
}

/*******************************************************************************
 * 4. AUTENTICAÇÃO E REGRAS DE ACESSO (RBAC)
 *******************************************************************************/
function handleAuth(event) {
    event.preventDefault();
    const nomeCompleto = document.getElementById("authNomeCompleto").value;
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const chave = document.getElementById("authChave").value.trim();
    const primeiroNome = nomeCompleto.split(' ')[0];

    // Segurança camuflada
    let role = "aluno";
    if (btoa(chave) === "REVfTUFYXzIwMjY=" && email === "oldenleicy@gmail.com") { // DEV_MAX_2026
        role = "dev_maximo";
    } else if (chave === "DIRECAO_ESED_2026") {
        role = "direcao";
    } else if (chave === "CHEF_TURMA_2026") {
        role = "adm_student";
    }

    currentUser = {
        nomeCompleto: nomeCompleto,
        usuario: primeiroNome,
        email: email,
        classe: document.getElementById("authClasse").value,
        turma: document.getElementById("authTurma").value,
        sala: document.getElementById("authSala").value,
        idade: document.getElementById("authIdade").value,
        role: role
    };

    localStorage.setItem("esed_user", JSON.stringify(currentUser));
    closeModal("authModal");
    updateUserUI();
    customAlert("Bem-vindo!", `Perfil digital de ${primeiroNome} ativado com sucesso.`);
}

function updateUserUI() {
    const area = document.getElementById("navUserArea");
    const labelMenu = document.getElementById("sidebarUserName");
    const badge = document.getElementById("userRoleBadge");
    
    if (currentUser) {
        if (area) area.innerHTML = `<span class="user-badge" style="color: white; font-size: 0.85rem; margin-right: 10px;">👤 ${currentUser.usuario}</span> <button onclick="logout()" class="btn-primary-nav" style="background:#ef4444;">Sair</button>`;
        if (labelMenu) labelMenu.innerText = `Olá, ${currentUser.usuario}!`;
        if (badge) badge.innerText = currentUser.role.toUpperCase();

        // Mostrar abas administrativas se aplicável
        const r = currentUser.role;
        const menuChef = document.getElementById("menu-chef-comunidades");
        const menuSugestoes = document.getElementById("menu-dev-sugestoes");
        const menuDev = document.getElementById("menu-dev-supremo");
        
        if (menuChef && (r === "adm_student" || r === "dev_maximo")) {
            menuChef.style.display = "block";
        }
        if (r === "dev_maximo") {
            if (menuSugestoes) menuSugestoes.style.display = "block";
            if (menuDev) menuDev.style.display = "block";
            fetchSuggestionsCloud();
            updateDevMetrics();
        }
    } else {
        if (badge) badge.innerText = "Visitante";
    }
}

function logout() {
    localStorage.removeItem("esed_user");
    location.reload();
}

/*******************************************************************************
 * 5. CONEXÃO LOCAL SIMULADA (VOTOS E SUGESTÕES)
 *******************************************************************************/
function fetchVotesStatus() {
    const vAgenda = localStorage.getItem("votos_agenda");
    const vQuiz = localStorage.getItem("votos_quiz");
    
    const labelAgenda = document.getElementById("votos-agenda");
    const labelQuiz = document.getElementById("votos-quiz");
    
    if (labelAgenda) labelAgenda.innerText = `${vAgenda} votos`;
    if (labelQuiz) labelQuiz.innerText = `${vQuiz} votos`;
}

function registerVote(option) {
    if (!currentUser) {
        customAlert("Autenticação Necessária", "Precisas de criar uma conta para votar nas decisões da escola.", "erro");
        return;
    }
    
    if (option === 'agenda') {
        let atual = parseInt(localStorage.getItem("votos_agenda")) || 0;
        localStorage.setItem("votos_agenda", (atual + 1).toString());
    } else if (option === 'quiz') {
        let atual = parseInt(localStorage.getItem("votos_quiz")) || 0;
        localStorage.setItem("votos_quiz", (atual + 1).toString());
    }
    
    customAlert("Voto Computado", "Obrigado por participares! Voto guardado localmente nesta demonstração.");
    fetchVotesStatus();
}

function submitSuggestion() {
    const txtArea = document.getElementById("suggestionText");
    if (!txtArea || !txtArea.value) return;

    const txt = txtArea.value;
    const autorMsg = currentUser ? `${currentUser.nomeCompleto} (${currentUser.classe}-${currentUser.turma})` : "Anónimo";
    
    let sugestoes = JSON.parse(localStorage.getItem("sugestoes_locais")) || [];
    sugestoes.push({ texto: txt, autor: autorMsg });
    localStorage.setItem("sugestoes_locais", JSON.stringify(sugestoes));
    
    customAlert("Sucesso", "A tua sugestão foi guardada localmente neste dispositivo.");
    txtArea.value = "";
    closeModal("suggestModal");
}

function fetchSuggestionsCloud() {
    const container = document.getElementById("suggestionsContainer");
    if (!container) return;
    
    let sugestoes = JSON.parse(localStorage.getItem("sugestoes_locais")) || [];
    if (sugestoes.length === 0) {
        container.innerHTML = "<p style='color:var(--text-muted);'>Nenhuma sugestão enviada localmente ainda.</p>";
    } else {
        container.innerHTML = sugestoes.map(s => `
            <div class="suggestion-item" style="border-bottom: 1px solid #e2e8f0; padding: 10px 0;">
                <p style="font-style: italic;">"${s.texto}"</p>
                <small style="color:var(--text-muted);">Autor: ${s.autor}</small>
            </div>
        `).join('');
    }
}

/*******************************************************************************
 * 6. GRÁFICOS DINÂMICOS (CHART.JS)
 *******************************************************************************/
function initCharts() {
    const chartAc = document.getElementById('academicChart');
    const chartApp = document.getElementById('appPerformanceChart');
    
    if (!chartAc || !chartApp) return;

    if (academicChartInstance) academicChartInstance.destroy();
    if (appChartInstance) appChartInstance.destroy();

    const ctxAcademic = chartAc.getContext('2d');
    academicChartInstance = new Chart(ctxAcademic, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
            datasets: [{
                label: 'Média de Notas (0-20)',
                data: [12, 14, 11, 15, 16, 14, 18],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: { responsive: true, scales: { y: { min: 0, max: 20 } } }
    });

    const ctxApp = chartApp.getContext('2d');
    appChartInstance = new Chart(ctxApp, {
        type: 'bar',
        data: {
            labels: ['Quizes Ativos', 'Resumos Lidos', 'Fórum Atividade', 'Pontos Medalhas'],
            datasets: [{
                label: 'Nível de Engajamento',
                data: [85, 40, 65, 90],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
                borderRadius: 6
            }]
        },
        options: { responsive: true }
    });
}

/*******************************************************************************
 * 7. INTELIGÊNCIA COMPLEMENTAR (MODO OFFLINE & OUTROS)
 *******************************************************************************/
function checkConnectionStatus() {
    toggleOnlineStatus();
}

function toggleOnlineStatus() {
    const notice = document.getElementById("offlineNotice");
    if (notice) {
        if (navigator.onLine) {
            notice.style.display = "none";
        } else {
            notice.style.display = "flex";
        }
    }
}

function renderNews() {
    const grid = document.getElementById("newsGrid");
    if (!grid) return;
    
    const dadosNoticias = [
        { id: 1, titulo: "Exames de Recorrência - ESED 2026", resumo: "O calendário completo das avaliações de recurso já se encontra disponível no placard principal da escola.", data: "13/07/2026", imagem: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400" }
    ];
    
    grid.innerHTML = dadosNoticias.map(item => `
        <div class="news-card" onclick="customAlert('${item.titulo}', '${item.resumo}')" style="cursor:pointer;">
            <img src="${item.imagem}" style="width:100%; height:160px; object-fit:cover;">
            <div class="news-body" style="padding:16px;">
                <span class="news-date" style="font-size:0.75rem; color:var(--text-muted);">📅 ${item.data}</span>
                <h4 style="margin: 6px 0; color:var(--blue-primary);">${item.titulo}</h4>
                <p style="font-size:0.9rem;">${item.resumo.substring(0, 65)}...</p>
            </div>
        </div>
    `).join('');
}

function updateScheduleTable() {
    customAlert("Horários", "Horários atualizados para a turma selecionada.");
}

function toggleMaintenanceMode() {
    customAlert("Painel de Controle", "Modo Manutenção ativado temporariamente no protótipo.");
}

function updateDevMetrics() {
    const devUserCountLabel = document.getElementById("devUserCount");
    if (devUserCountLabel) {
        devUserCountLabel.innerHTML = `<i class="fas fa-server"></i> Banco de dados: <strong style="color:#f59e0b;">Demonstração Local Segura Ativa</strong>`;
    }
}
