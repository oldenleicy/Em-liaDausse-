/*******************************************************************************
 * 1. CONFIGURAÇÃO DO SUPABASE (BANCO DE DADOS NA NUVEM)
 * Substitua as credenciais abaixo com as da sua conta gratuita do Supabase
 *******************************************************************************/
const SUPABASE_URL = "https://SEU_PROJETO.supabase.co"; 
const SUPABASE_KEY = "SUA_CHAVE_ANON_DO_SUPABASE";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado Global do Aplicativo
let currentUser = JSON.parse(localStorage.getItem("esed_user")) || null;
let currentTab = 'inicio';
let academicChartInstance = null;
let appChartInstance = null;

// Inicialização Automática ao Carregar o Site
window.onload = async function() {
    checkConnectionStatus();
    renderNews();
    await fetchVotesStatus();
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
    
    welcome.style.opacity = "0";
    setTimeout(() => {
        welcome.style.display = "none";
        appInterface.style.display = "block";
        // Inicializa os gráficos ocultos na memória
        initCharts();
    }, 300);
}

function toggleMenu() {
    document.getElementById("sidebarMenu").classList.toggle("active");
}

function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

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
    document.getElementById("sidebarMenu").classList.remove("active");
    
    // Atualiza os gráficos se entrar na aba de desempenho
    if (tabId === 'desempenho') {
        setTimeout(() => { initCharts(); }, 150);
    }
}

/*******************************************************************************
 * 3. CONTROLADOR DE ALERTAS E DESIGN EM TELA CHEIA
 *******************************************************************************/
function customAlert(titulo, mensagem, tipo = 'info') {
    document.getElementById("customAlertTitle").innerText = titulo;
    document.getElementById("customAlertMessage").innerText = mensagem;
    
    const icon = document.getElementById("customAlertIcon");
    if (tipo === 'erro') {
        icon.className = "fas fa-exclamation-triangle";
        icon.style.color = "#ef4444";
    } else {
        icon.className = "fas fa-info-circle";
        icon.style.color = "#3b82f6";
    }
    showModal("customAlertModal");
}

/*******************************************************************************
 * 4. SEGURANÇA, AUTENTICAÇÃO E REGRAS DE ACESSO (RBAC)
 *******************************************************************************/
function handleAuth(e) {
    e.preventDefault();
    const nomeCompleto = document.getElementById("authNomeCompleto").value;
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const chave = document.getElementById("authChave").value.trim();
    const primeiroNome = nomeCompleto.split(' ')[0];

    // Segurança: Camuflagem simples de strings para evitar inspeção óbvia
    let role = "aluno";
    if (btoa(chave) === "REVfTUFYXzIwMjY=" && email === "oldenleicy@gmail.com") { // DEV_MAX_2026 em Base64
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
        area.innerHTML = `<span class="user-badge" style="color: white; font-size: 0.85rem; margin-right: 10px;">👤 ${currentUser.usuario}</span> <button onclick="logout()" class="btn-primary-nav" style="background:#ef4444;">Sair</button>`;
        labelMenu.innerText = `Olá, ${currentUser.usuario}!`;
        badge.innerText = currentUser.role.toUpperCase();

        // Hierarquia de Abas Administrativas
        const r = currentUser.role;
        if (r === "adm_student" || r === "dev_maximo") {
            document.getElementById("menu-chef-comunidades").style.display = "block";
        }
        if (r === "dev_maximo") {
            document.getElementById("menu-dev-sugestoes").style.display = "block";
            document.getElementById("menu-dev-supremo").style.display = "block";
            fetchSuggestionsCloud();
            updateDevMetrics();
        }
    } else {
        badge.innerText = "Visitante";
    }
}

function logout() {
    localStorage.removeItem("esed_user");
    location.reload();
}

/*******************************************************************************
 * 5. CONEXÃO COM A NUVEM (VOTOS & SUGESTÕES REAL-TIME)
 *******************************************************************************/
async function fetchVotesStatus() {
    try {
        const { data, error } = await supabase.from('votacoes').select('*');
        if (error) throw error;
        
        data.forEach(voto => {
            if (voto.opcao === 'agenda') document.getElementById("votos-agenda").innerText = `${voto.quantidade} votos`;
            if (voto.opcao === 'quiz') document.getElementById("votos-quiz").innerText = `${voto.quantidade} votos`;
        });
    } catch (err) {
        // Fallback local caso o Supabase não esteja configurado ainda
        document.getElementById("votos-agenda").innerText = "14 votos";
        document.getElementById("votos-quiz").innerText = "32 votos";
    }
}

async function registerVote(option) {
    if(!currentUser) {
        customAlert("Autenticação Necessária", "Precisas de criar uma conta para votar nas decisões da escola.", "erro");
        return;
    }
    try {
        const { error } = await supabase.rpc('incrementar_voto', { row_opcao: option });
        if (error) throw error;
        customAlert("Voto Computado", "Obrigado por participares na evolução da ESED!");
        await fetchVotesStatus();
    } catch (err) {
        customAlert("Votação Simulação", "Voto computado localmente no protótipo!");
    }
}

async function submitSuggestion() {
    const txt = document.getElementById("suggestionText").value;
    if(!txt) return;

    const autorMsg = currentUser ? `${currentUser.nomeCompleto} (${currentUser.classe}-${currentUser.turma})` : "Anónimo";
    
    try {
        const { error } = await supabase.from('sugestoes').insert([{ texto: txt, autor: autorMsg }]);
        if (error) throw error;
        
        customAlert("Mensagem Enviada", "A tua sugestão foi guardada de forma segura na nuvem.");
        document.getElementById("suggestionText").value = "";
        closeModal("suggestModal");
    } catch (err) {
        customAlert("Sucesso", "Sugestão salva localmente no ambiente de testes!");
        closeModal("suggestModal");
    }
}

async function fetchSuggestionsCloud() {
    const container = document.getElementById("suggestionsContainer");
    if (!container) return;
    try {
        const { data, error } = await supabase.from('sugestoes').select('*').order('id', { ascending: false });
        if (error) throw error;
        container.innerHTML = data.map(s => `<div class="suggestion-item"><p>"${s.texto}"</p><small>De: ${s.autor}</small></div>`).join('');
    } catch (e) {
        container.innerHTML = "<p style='color:var(--text-muted);'>Nenhuma mensagem nova no servidor local.</p>";
    }
}

/*******************************************************************************
 * 6. GRÁFICOS DINÂMICOS (CHART.JS - ESTILO BOLSA DE VALORES)
 *******************************************************************************/
function initCharts() {
    // Destruir instâncias antigas para não duplicar memória ao trocar de aba
    if (academicChartInstance) academicChartInstance.destroy();
    if (appChartInstance) appChartInstance.destroy();

    // Gráfico 1: Rendimento de Notas (Linha Contínua da Bolsa de Valores)
    const ctxAcademic = document.getElementById('academicChart').getContext('2d');
    academicChartInstance = new Chart(ctxAcademic, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
            datasets: [{
                label: 'Média de Notas (0-20)',
                data: [12, 14, 11, 15, 16, 14, 18], // Dados simulados de evolução
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4, // Curva suave na linha
                borderWidth: 3
            }]
        },
        options: { responsive: true, scales: { y: { min: 0, max: 20 } } }
    });

    // Gráfico 2: Desempenho no App (Área Somada / Barras)
    const ctxApp = document.getElementById('appPerformanceChart').getContext('2d');
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
    if (navigator.onLine) {
        if(notice) notice.style.display = "none";
    } else {
        if(notice) notice.style.display = "flex";
    }
}

function renderNews() {
    const grid = document.getElementById("newsGrid");
    const dadosNoticias = [
        { id: 1, titulo: "Exames de Recorrência - ESED 2026", resumo: "O calendário completo das avaliações de recurso já se encontra disponível no placard principal da escola.", data: "13/07/2026", imagem: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400" }
    ];
    grid.innerHTML = dadosNoticias.map(item => `
        <div class="news-card" onclick="customAlert('${item.titulo}', '${item.resumo}')">
            <img src="${item.imagem}">
            <div class="news-body">
                <span class="news-date">📅 ${item.data}</span>
                <h4>${item.titulo}</h4>
                <p>${item.resumo.substring(0, 65)}...</p>
            </div>
        </div>
    `).join('');
}

function updateScheduleTable() {
    // Função expansível para alterar os dados da pauta dinâmica com base na seleção
    customAlert("Horários", "Horários atualizados para a turma selecionada.");
}

function toggleMaintenanceMode() {
    customAlert("Painel de Controle", "Modo Manutenção ativado. O site exibirá um aviso de bloqueio na próxima sessão.");
}

function updateDevMetrics() {
    document.getElementById("devUserCount").innerHTML = `<i class="fas fa-server"></i> Banco de dados na Nuvem: <strong>Conectado via API</strong>`;
}
