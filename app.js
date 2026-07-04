/*******************************************************************************
 * 1. BASE DE DADOS SIMULADA (JSON LOCAL) & ESTADO GLOBAL
 *******************************************************************************/
const noticias = [
    { id: 1, titulo: "Exames de Recorrencia da 12ª Classe", resumo: "O calendário detalhado com salas e júris já está disponível no painel informativo principal.", data: "04/07/2026", imagem: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400" }
];

// Carregar dados salvos no navegador do utilizador
let currentUser = JSON.parse(localStorage.getItem("ed_user")) || null;
let votos = JSON.parse(localStorage.getItem("ed_votos")) || { agenda: 14, quiz: 32 };
let listaSugestoes = JSON.parse(localStorage.getItem("ed_sugestoes")) || [
    { texto: "Colocar os horários dos autocarros da escola no site.", autor: "Anónimo" }
];

window.onload = function() {
    renderNews();
    renderVotes();
    updateUserUI();
};

/*******************************************************************************
 * 2. CONTROLOS DO MENU HAMBÚRGUER & INTERFACE (UI)
 *******************************************************************************/
function toggleMenu() {
    document.getElementById("sidebarMenu").classList.toggle("active");
}

function showModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function renderNews() {
    const grid = document.getElementById("newsGrid");
    grid.innerHTML = noticias.map(item => `
        <div class="news-card" onclick="alert('${item.titulo}\\n\\n${item.resumo}')">
            <img src="${item.imagem}">
            <div class="news-body">
                <span class="news-date">📅 ${item.data}</span>
                <h4>${item.titulo}</h4>
                <p>${item.resumo.substring(0, 60)}...</p>
            </div>
        </div>
    `).join('');
}

/*******************************************************************************
 * 3. MOTOR DE AUTENTICAÇÃO, REGRAS DE CHAVES E PERMISSÕES
 *******************************************************************************/
function handleAuth(e) {
    e.preventDefault();
    const nomeCompleto = document.getElementById("authNomeCompleto").value;
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const chave = document.getElementById("authChave").value.trim();
    
    // Extração automática do primeiro nome do aluno para virar Usuário
    const primeiroNome = nomeCompleto.split(' ')[0];

    // Processamento do Cargo com base na Chave de Segurança
    let role = "aluno";
    
    if (chave === "DEV_MAX_2026" && email === "oldenleicy@gmail.com") {
        role = "dev_maximo"; // Tem todos os privilégios acumulados
    } else if (chave === "DEV_ASSIST_2026") {
        role = "dev2";
    } else if (chave === "DIRECAO_ED_2026") {
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

    localStorage.setItem("ed_user", JSON.stringify(currentUser));
    closeModal("authModal");
    updateUserUI();
    location.reload();
}

function updateUserUI() {
    const area = document.getElementById("navUserArea");
    const labelMenu = document.getElementById("sidebarUserName");
    
    if (currentUser) {
        // Exibição na Navbar: Usuário + Formato Padrão Escolar solicitado
        area.innerHTML = `<span class="user-badge">👤 ${currentUser.usuario} [${currentUser.classe}-${currentUser.turma}]</span> <button onclick="logout()" class="btn-logout">Sair</button>`;
        labelMenu.innerText = `Olá, ${currentUser.usuario}!`;

        // Ativação Oculta de Abas Administrativas por Hierarquia de Código (RBAC)
        const r = currentUser.role;
        
        if (r === "adm_student" || r === "dev_maximo") {
            document.getElementById("menu-chef-comunidades").style.display = "block";
        }
        if (r === "dev_maximo") {
            document.getElementById("menu-dev-sugestoes").style.display = "block";
            document.getElementById("menu-dev-supremo").style.display = "block";
            renderSuggestionsList();
        }
    }
}

function applyKeyUpgrade() {
    const novaChave = document.getElementById("upgradeChaveInput").value.trim();
    if (!currentUser) {
        alert("Inicie sessão primeiro para aplicar um upgrade de cargo!");
        return;
    }

    // Aplicação das regras de chaves retroativas diretamente na conta ativa
    if (novaChave === "DEV_MAX_2026" && currentUser.email === "oldenleicy@gmail.com") {
        currentUser.role = "dev_maximo";
    } else if (novaChave === "CHEF_TURMA_2026") {
        currentUser.role = "adm_student";
    } else if (novaChave === "DIRECAO_ED_2026") {
        currentUser.role = "direcao";
    } else {
        alert("Chave inválida ou não autorizada para este e-mail.");
        return;
    }

    localStorage.setItem("ed_user", JSON.stringify(currentUser));
    alert(`Sucesso! O seu cargo foi atualizado para: ${currentUser.role.toUpperCase()}`);
    location.reload();
}

function logout() {
    localStorage.removeItem("ed_user");
    location.reload();
}

/*******************************************************************************
 * 4. GESTÃO DOS FORMULÁRIOS DE SUGESTÕES E VOTAÇÃO
 *******************************************************************************/
function submitSuggestion() {
    const txt = document.getElementById("suggestionText").value;
    if(txt) {
        const autorMsg = currentUser ? `${currentUser.nomeCompleto} (${currentUser.classe}-${currentUser.turma})` : "Anónimo";
        listaSugestoes.push({ texto: txt, autor: autorMsg });
        localStorage.setItem("ed_sugestoes", JSON.stringify(listaSugestoes));
        alert("Sugestão guardada! O programador poderá ler esta mensagem no painel.");
        closeModal("suggestModal");
    }
}

function renderSuggestionsList() {
    const container = document.getElementById("suggestionsContainer");
    if(container) {
        container.innerHTML = listaSugestoes.map(s => `
            <div class="suggestion-item">
                <p>"${s.texto}"</p>
                <small style="color:#64748b;">Enviado por: ${s.autor}</small>
            </div>
        `).join('');
    }
}

function registerVote(option) {
    votos[option]++;
    localStorage.setItem("ed_votos", JSON.stringify(votos));
    renderVotes();
}

function renderVotes() {
    document.getElementById("votos-agenda").innerText = `${votos.agenda} votos`;
    document.getElementById("votos-quiz").innerText = `${votos.quiz} votos`;
}
