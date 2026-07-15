/*******************************************************************************
 * 1. CONFIGURAÇÕES, BANCO DE DADOS LOCAL (LOCALSTORAGE) E ESTADO GLOBAL
 *******************************************************************************/
// Inicialização de Dados Padrão (Fallback rico se o app for aberto pela primeira vez)
const defaultNews = [
    {
        id: 1,
        titulo: "Início das Inscrições para o Clube de Ciências ESED 2026",
        categoria: "Eventos",
        imagem: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",
        conteudo: "Estão abertas as inscrições para o Clube de Ciências da Escola Secundária Emília Dausse. Este ano teremos foco em projetos de robótica e programação de baixo custo. As vagas são limitadas aos alunos da 10ª, 11ª e 12ª classes. Dirige-te à sala dos professores para garantir o teu lugar.",
        autor: "Direção ESED",
        data: "14/07/2026",
        expiracao: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 dias de vida
    },
    {
        id: 2,
        titulo: "Calendário Oficial do Torneio Inter-Turmas de Futebol",
        categoria: "Desporto",
        imagem: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600",
        conteudo: "A nossa escola vai ferver! Na próxima segunda-feira inicia o campeonato inter-turmas de futebol. Os jogos acontecerão no campo principal durante os intervalos maiores e no período da tarde. Confere a tabela de confrontos e vem apoiar a tua turma!",
        autor: "Educação Física",
        data: "12/07/2026",
        expiracao: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const defaultBooks = [
    { id: 1, titulo: "Manual de Matemática - 12ª Classe", autor: "Ministério da Educação", categoria: "manuais", classe: "12ª Classe", tamanho: "3.2 MB", capa: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=300", sinopse: "Manual completo de preparação com limites, derivadas, integrais e trigonometria avançada.", resumo: "Foco principal: Estudo de funções e cálculo diferencial simples." },
    { id: 2, titulo: "Física Geral Moçambique - 11ª Classe", autor: "Plural Editores", categoria: "manuais", classe: "11ª Classe", tamanho: "4.1 MB", capa: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300", sinopse: "O livro abrange cinemática, dinâmica de partículas, termodinâmica e ótica geométrica.", resumo: "Foco principal: Leis de Newton e conservação de energia mecânica." },
    { id: 3, titulo: "Exame Resolvido Português 2025", autor: "ESED Imprensa", categoria: "exames", classe: "Geral", tamanho: "1.2 MB", capa: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300", sinopse: "Resoluções comentadas passo a passo do exame nacional de admissão de Língua Portuguesa.", resumo: "Análise sintática e interpretação de textos literários nacionais." },
    { id: 4, titulo: "Ualalapi", autor: "Ungulani Ba Ka Khosa", categoria: "literatura", classe: "Recomendado", tamanho: "1.8 MB", capa: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300", sinopse: "Clássico da literatura moçambicana focado na queda do Império de Gaza liderado por Ngungunhane.", resumo: "Análise histórica e crítica da colonização de forma poética." }
];

const defaultTraffic = [
    { nome: "Amina José", classe: "12ª A1", nivel: "Estudante", ip: "197.243.12.85", dispositivo: "Android (Chrome)" },
    { nome: "Carlos Manuel", classe: "11ª B1", nivel: "Estudante", ip: "197.243.14.22", dispositivo: "iPhone (Safari)" },
    { nome: "Vicente Olden", classe: "12ª A1", nivel: "Chefe de Turma", ip: "102.85.201.3", dispositivo: "Windows (Edge)" }
];

// Inicializar armazenamento local persistente
if (!localStorage.getItem("esed_news")) localStorage.setItem("esed_news", JSON.stringify(defaultNews));
if (!localStorage.getItem("esed_books")) localStorage.setItem("esed_books", JSON.stringify(defaultBooks));
if (!localStorage.getItem("esed_book_suggestions")) localStorage.setItem("esed_book_suggestions", JSON.stringify([]));
if (!localStorage.getItem("sugestoes_locais")) localStorage.setItem("sugestoes_locais", JSON.stringify([]));
if (!localStorage.getItem("votos_agenda")) localStorage.setItem("votos_agenda", "24");
if (!localStorage.getItem("votos_quiz")) localStorage.setItem("votos_quiz", "42");

let currentUser = JSON.parse(localStorage.getItem("esed_user")) || null;
let currentTab = 'inicio';
let academicChartInstance = null;
let appChartInstance = null;
let activeCategory = 'todos';

// Inicialização de Estado ao carregar o site
window.onload = function() {
    checkConnectionStatus();
    renderNews();
    renderLibrary();
    fetchVotesStatus();
    updateUserUI();
    applyStoredSettings();
    updateScheduleTable(); // Garante que a tabela inicia preenchida
    
    window.addEventListener('online', toggleOnlineStatus);
    window.addEventListener('offline', toggleOnlineStatus);

    // Sugestão de Fecho Inteligente de Modais (Clicando fora)
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Fechar com a tecla ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
        }
    });
};

/*******************************************************************************
 * 2. NAVEGAÇÃO E TRANSICÃO DE ABAS
 *******************************************************************************/
function enterApp() {
    const welcome = document.getElementById("welcomeScreen");
    const appInterface = document.getElementById("appInterface");
    if (welcome && appInterface) {
        welcome.style.opacity = "0";
        setTimeout(() => {
            welcome.style.display = "none";
            appInterface.style.display = "block";
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
    if (modal) {
        modal.style.display = 'flex'; // Alinhado com o Flexbox do CSS para centralizar
    } else {
        console.error(`Erro: Modal com ID "${id}" não foi encontrado no HTML.`);
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function switchTab(tabId) {
    currentTab = tabId;
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.classList.add('active');
    
    const menu = document.getElementById("sidebarMenu");
    if (menu) menu.classList.remove("active");
    
    if (tabId === 'desempenho') {
        setTimeout(() => { initCharts(); }, 150);
    }
}

/*******************************************************************************
 * 3. ALERTA CUSTOMIZADO (RELAXADO E BONITO) - Opcional se usar modal customizado
 *******************************************************************************/
function customAlert(titulo, mensagem, tipo = 'info') {
    alert(`${titulo.toUpperCase()}\n\n${mensagem}`);
}

/*******************************************************************************
 * 4. AUTENTICAÇÃO E CONTROLE DE NÍVEIS DE ACESSO (RBAC)
 *******************************************************************************/
function handleAuth(event) {
    event.preventDefault();
    const nomeCompleto = document.getElementById("authNomeCompleto").value;
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const chave = document.getElementById("authChave").value.trim();
    const primeiroNome = nomeCompleto.split(' ')[0];

    // Controle de Chaves Especiais
    let role = "aluno";
    if (chave === "CHEF_TURMA_2026") {
        role = "adm_student";
    } else if (chave === "DIRECAO_ESED_2026") {
        role = "direcao";
    } else if (chave === "DEV_MAX_2026" && email === "oldenleicy@gmail.com") {
        role = "dev_maximo";
    } else if (chave && chave !== "") {
        customAlert("Chave Inválida", "A chave inserida não corresponde a nenhum perfil especial. Serás registado como Aluno.", "erro");
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
    customAlert("Perfil Ativado!", `Boas-vindas ao ESED Connect, ${primeiroNome}!`, "sucesso");
}

function updateUserUI() {
    const area = document.getElementById("navUserArea");
    const labelMenu = document.getElementById("sidebarUserName");
    const badge = document.getElementById("userRoleBadge");
    const uploadBtn = document.getElementById("adminUploadBookBtn");
    
    // Garantir que os elementos existem antes de alterar o display
    const menuChef = document.getElementById("menu-chef-comunidades");
    const menuDevSug = document.getElementById("menu-dev-sugestoes");
    const menuDevSup = document.getElementById("menu-dev-supremo");

    if (menuChef) menuChef.style.display = "none";
    if (menuDevSug) menuDevSug.style.display = "none";
    if (menuDevSup) menuDevSup.style.display = "none";
    if (uploadBtn) uploadBtn.style.display = "none";

    if (currentUser) {
        if (area) area.innerHTML = `<span class="user-badge" style="color: white; font-weight:700; font-size: 0.85rem; margin-right: 10px;">👤 ${currentUser.usuario}</span> <button onclick="logout()" class="btn-primary-nav" style="background:#ef4444;">Sair</button>`;
        if (labelMenu) labelMenu.innerText = `Olá, ${currentUser.usuario}!`;
        if (badge) {
            badge.innerText = currentUser.role.toUpperCase().replace("_", " ");
            badge.className = "user-role-badge " + currentUser.role;
        }

        const r = currentUser.role;
        // Permissões Administrativas Escolares
        if ((r === "adm_student" || r === "dev_maximo") && menuChef) {
            menuChef.style.display = "block";
        }
        if ((r === "direcao" || r === "dev_maximo") && uploadBtn) {
            uploadBtn.style.display = "block";
        }
        // Permissões Secretas de Dev Supremo
        if (r === "dev_maximo") {
            if (menuDevSug) menuDevSug.style.display = "block";
            if (menuDevSup) menuDevSup.style.display = "block";
            updateDevMetrics();
            renderDevTraffic();
        }
    } else {
        if (area) area.innerHTML = `<button class="btn-primary-nav" onclick="showModal('authModal')">Criar Perfil</button>`;
        if (labelMenu) labelMenu.innerText = "Olá, Visitante!";
        if (badge) {
            badge.innerText = "Visitante";
            badge.className = "user-role-badge";
        }
    }
}

function logout() {
    localStorage.removeItem("esed_user");
    location.reload();
}

/*******************************************************************************
 * 5. FEED E CARROSSEL DE NOTÍCIAS DINÂMICO COM VALIDADE
 *******************************************************************************/
function renderNews() {
    const list = JSON.parse(localStorage.getItem("esed_news")) || [];
    const grid = document.getElementById("newsGrid");
    const carousel = document.getElementById("newsCarousel");
    const emptyState = document.getElementById("emptyNewsState");

    if (!grid || !carousel) return;

    // Limpar notícias fora do prazo (vencidas)
    const activeNews = list.filter(item => {
        return new Date(item.expiracao).getTime() > Date.now();
    });

    if (activeNews.length !== list.length) {
        localStorage.setItem("esed_news", JSON.stringify(activeNews));
    }

    if (activeNews.length === 0) {
        grid.innerHTML = "";
        carousel.innerHTML = "";
        if (emptyState) emptyState.style.display = "block";
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    // 1. Renderizar Carrossel
    carousel.innerHTML = activeNews.map(item => `
        <div class="carousel-card" style="background-image: url('${item.imagem}')" onclick="openNewsReader(${item.id})">
            <div class="carousel-card-overlay">
                <span class="user-role-badge">${item.categoria}</span>
                <h4>${item.titulo}</h4>
            </div>
        </div>
    `).join('');

    // 2. Renderizar Grid Geral
    grid.innerHTML = activeNews.map(item => `
        <div class="news-card" onclick="openNewsReader(${item.id})">
            <img src="${item.imagem}" alt="Capa da Notícia">
            <div class="news-card-placeholder" style="display: none;"><i class="fas fa-bullhorn"></i></div>
            <div class="news-body">
                <span class="news-date">📅 ${item.data} • por ${item.autor}</span>
                <h4>${item.titulo}</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${item.conteudo.substring(0, 80)}...</p>
            </div>
        </div>
    `).join('');
}

function openNewsReader(id) {
    const list = JSON.parse(localStorage.getItem("esed_news")) || [];
    const news = list.find(item => item.id === id);
    if (!news) return;

    const header = document.getElementById("readerHeader");
    const body = document.getElementById("readerBody");

    if (header && body) {
        header.innerHTML = `
            <div class="reader-image" style="background-image: url('${news.imagem}'); height: 200px; background-size: cover; background-position: center; border-radius: 12px; margin-bottom: 16px;"></div>
            <span class="user-role-badge">${news.categoria}</span>
            <h2 style="margin: 12px 0 6px 0;">${news.titulo}</h2>
            <small style="color: var(--text-muted); display: block; margin-bottom: 16px;">Publicado em ${news.data} • Autor: ${news.autor}</small>
        `;
        body.innerHTML = `<p style="line-height: 1.6; font-size: 1rem;">${news.conteudo.replace(/\n/g, "<br><br>")}</p>`;
        showModal("newsReaderModal");
    }
}

function publishNews(event) {
    event.preventDefault();
    const title = document.getElementById("newsTitle").value;
    const category = document.getElementById("newsCategory").value;
    const cover = document.getElementById("newsCoverImage").value || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600";
    const content = document.getElementById("newsContent").value;
    const validityDays = parseInt(document.getElementById("newsValidity").value);

    const list = JSON.parse(localStorage.getItem("esed_news")) || [];
    const newId = list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 1;

    const expiracaoDate = new Date();
    expiracaoDate.setDate(expiracaoDate.getDate() + validityDays);

    const newArticle = {
        id: newId,
        titulo: title,
        categoria: category,
        imagem: cover,
        conteudo: content,
        autor: currentUser ? currentUser.usuario : "Direção ESED",
        data: new Date().toLocaleDateString('pt-PT'),
        expiracao: expiracaoDate.toISOString()
    };

    list.unshift(newArticle);
    localStorage.setItem("esed_news", JSON.stringify(list));
    
    // Resetar Formulário
    event.target.reset();
    
    closeModal("newsEditorModal");
    renderNews();
    customAlert("Sucesso!", "A tua notícia foi publicada no placard escolar e expirará em " + validityDays + " dias.", "sucesso");
}

/*******************************************************************************
 * 6. SISTEMA DE HORÁRIOS COM TABELA DE SIMULAÇÃO DINÂMICA
 *******************************************************************************/
function updateScheduleTable() {
    const select = document.getElementById("scheduleClassSelect");
    if (!select) return;
    const selectedClass = select.value;
    const tbody = document.getElementById("scheduleTableBody");
    if (!tbody) return;

    const dataSchedules = {
        "12a1": [
            { hora: "07:00 - 07:45", s: "Matemática", t: "Física", q: "Matemática", q_sub: "Biologia", s_sub: "Português" },
            { hora: "07:50 - 08:35", s: "Matemática", t: "Física", q: "Filosofia", q_sub: "Biologia", s_sub: "Português" },
            { hora: "08:45 - 09:30", s: "Português", t: "Química", q: "Filosofia", q_sub: "Matemática", s_sub: "Inglês" }
        ],
        "12b1": [
            { hora: "13:00 - 13:45", s: "História", t: "Geografia", q: "Português", q_sub: "Inglês", s_sub: "Geografia" },
            { hora: "13:50 - 14:35", s: "História", t: "Português", q: "Filosofia", q_sub: "Inglês", s_sub: "História" },
            { hora: "14:45 - 15:30", s: "Geografia", t: "Português", q: "Filosofia", q_sub: "História", s_sub: "Educação Física" }
        ],
        "11a1": [
            { hora: "07:00 - 07:45", s: "Química", t: "Biologia", q: "Português", q_sub: "Física", s_sub: "Matemática" },
            { hora: "07:50 - 08:35", s: "Química", t: "Biologia", q: "Inglês", q_sub: "Física", s_sub: "Matemática" },
            { hora: "08:45 - 09:30", s: "Matemática", t: "Português", q: "Inglês", q_sub: "Química", s_sub: "Filosofia" }
        ]
    };

    const schedule = dataSchedules[selectedClass] || [];
    tbody.innerHTML = schedule.map(row => `
        <tr>
            <td><strong>${row.hora}</strong></td>
            <td>${row.s}</td>
            <td>${row.t}</td>
            <td>${row.q}</td>
            <td>${row.q_sub}</td>
            <td>${row.s_sub}</td>
        </tr>
    `).join('');
}

/*******************************************************************************
 * 7. BIBLIOTECA PREMIUM E PESQUISA
 *******************************************************************************/
function renderLibrary() {
    const list = JSON.parse(localStorage.getItem("esed_books")) || [];
    const featuredRow = document.getElementById("featuredBooks");
    const booksGrid = document.getElementById("booksGrid");

    if (!booksGrid) return;

    const filtered = list.filter(b => {
        return activeCategory === 'todos' || b.categoria === activeCategory;
    });

    if (featuredRow) {
        const featured = list.slice(0, 3);
        featuredRow.innerHTML = featured.map(b => `
            <div class="book-3d-card" onclick="openBookDetails(${b.id})">
                <div class="book-3d-cover" style="background-image: url('${b.capa || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300'}')"></div>
                <div class="book-3d-title">${b.titulo}</div>
            </div>
        `).join('');
    }

    if (filtered.length === 0) {
        booksGrid.innerHTML = "<p>Nenhum livro encontrado nesta categoria.</p>";
        return;
    }

    // AQUI O CÓDIGO CORRIGIDO E DEVIDAMENTE FECHADO!
    booksGrid.innerHTML = filtered.map(b => `
        <div class="book-normal-card" onclick="openBookDetails(${b.id})">
            <div class="book-mini-cover" style="background-image: url('${b.capa || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300'}')"></div>
            <div class="book-info-col">
                <h4>${b.titulo}</h4>
                <small>${b.autor} • <strong>${b.tamanho}</strong></small>
            </div>
        </div>
    `).join('');
}

function filterCategory(category) {
    activeCategory = category;
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.classList.remove('active');
        if (pill.innerText.toLowerCase().includes(category) || (category === 'todos' && pill.innerText.toLowerCase() === 'todos')) {
            pill.classList.add('active');
        }
    });
    renderLibrary();
}

function filterLibrary() {
    const searchVal = document.getElementById("librarySearch").value.toLowerCase();
    const list = JSON.parse(localStorage.getItem("esed_books")) || [];
    const booksGrid = document.getElementById("booksGrid");
    
    if (!booksGrid) return;

    const filtered = list.filter(b => {
        return (activeCategory === 'todos' || b.categoria === activeCategory) &&
               (b.titulo.toLowerCase().includes(searchVal) || b.autor.toLowerCase().includes(searchVal));
    });

    booksGrid.innerHTML = filtered.map(b => `
        <div class="book-normal-card" onclick="openBookDetails(${b.id})">
            <div class="book-mini-cover" style="background-image: url('${b.capa || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300'}')"></div>
            <div class="book-info-col">
                <h4>${b.titulo}</h4>
                <small>${b.autor} • <strong>${b.tamanho}</strong></small>
            </div>
        </div>
    `).join('');
}

function openBookDetails(id) {
    const list = JSON.parse(localStorage.getItem("esed_books")) || [];
    const book = list.find(b => b.id === id);
    if (!book) return;

    const container = document.getElementById("bookDetailsContainer");
    if (container) {
        container.innerHTML = `
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="width: 100px; height: 140px; background-image: url('${book.capa}'); background-size: cover; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);"></div>
                <div>
                    <h3>${book.titulo}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">${book.autor}</p>
                    <span class="user-role-badge" style="margin-top: 8px;">${book.classe}</span>
                    <p style="margin-top: 8px; font-weight: bold; font-size: 0.85rem;">Tamanho: ${book.tamanho}</p>
                </div>
            </div>
            <p style="font-size: 0.9rem; line-height: 1.5; margin-bottom: 16px;"><strong>Sinopse:</strong> ${book.sinopse}</p>
            <div style="background: var(--bg-light); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                <h5 style="margin-bottom: 6px;"><i class="fas fa-bolt text-gold"></i> Estudo Rápido (Poupa Dados):</h5>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${book.resumo}</p>
            </div>
            <button class="btn-primary full-width" onclick="simulateDownload('${book.titulo}')"><i class="fas fa-download"></i> Baixar PDF Completo</button>
        `;
        showModal("bookDetailsModal");
    }
}

function simulateDownload(title) {
    const container = document.getElementById("downloadProgressBarContainer");
    const bar = document.getElementById("downloadProgressBar");
    if (!container || !bar) return;

    container.style.display = "block";
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        bar.style.width = progress + "%";
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                container.style.display = "none";
                bar.style.width = "0%";
                customAlert("Download Concluído", `O livro "${title}" foi salvo na memória do teu dispositivo local com sucesso!`, "sucesso");
            }, 500);
        }
    }, 150);
}

function uploadBook(event) {
    event.preventDefault();
    const title = document.getElementById("bookTitle").value;
    const author = document.getElementById("bookAuthor").value;
    const category = document.getElementById("bookCategory").value;
    const bClass = document.getElementById("bookClass").value || "Geral";
    const size = document.getElementById("bookSize").value;
    const cover = document.getElementById("bookCover").value || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300";
    const sinopse = document.getElementById("bookSinopse").value;
    const quickRead = document.getElementById("bookQuickRead").value;

    const list = JSON.parse(localStorage.getItem("esed_books")) || [];
    const newId = list.length > 0 ? Math.max(...list.map(b => b.id)) + 1 : 1;

    const newBook = {
        id: newId,
        titulo: title,
        autor: author,
        categoria: category,
        classe: bClass,
        tamanho: size,
        capa: cover,
        sinopse: sinopse,
        resumo: quickRead
    };

    list.push(newBook);
    localStorage.setItem("esed_books", JSON.stringify(list));
    event.target.reset();
    closeModal("bookUploadModal");
    renderLibrary();
    customAlert("Cadastrado!", `O livro "${title}" foi adicionado com sucesso ao acervo.`, "sucesso");
}

/*******************************************************************************
 * 8. SONDAGENS E VOTOS
 *******************************************************************************/
function fetchVotesStatus() {
    const agendaVal = localStorage.getItem("votos_agenda") || "24";
    const quizVal = localStorage.getItem("votos_quiz") || "42";
    
    const countAgenda = document.getElementById("votos-agenda");
    const countQuiz = document.getElementById("votos-quiz");

    if (countAgenda) countAgenda.innerText = agendaVal + " votos";
    if (countQuiz) countQuiz.innerText = quizVal + " votos";
}

function registerVote(type) {
    if (type === 'agenda') {
        let val = parseInt(localStorage.getItem("votos_agenda")) || 24;
        val++;
        localStorage.setItem("votos_agenda", val.toString());
    } else if (type === 'quiz') {
        let val = parseInt(localStorage.getItem("votos_quiz")) || 42;
        val++;
        localStorage.setItem("votos_quiz", val.toString());
    }
    fetchVotesStatus();
    customAlert("Voto Registado!", "O teu voto foi contabilizado com sucesso. Obrigado por participares!", "sucesso");
}

/*******************************************************************************
 * 9. CONFIGURAÇÃO DE GRÁFICOS (CHART.JS)
 *******************************************************************************/
function initCharts() {
    const ctxAcademic = document.getElementById('academicChart');
    const ctxPerf = document.getElementById('appPerformanceChart');

    if (!ctxAcademic || !ctxPerf) return;

    // Destruir instâncias existentes para evitar sobreposição
    if (academicChartInstance) academicChartInstance.destroy();
    if (appChartInstance) appChartInstance.destroy();

    academicChartInstance = new Chart(ctxAcademic, {
        type: 'line',
        data: {
            labels: ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Exames'],
            datasets: [{
                label: 'Média de Notas (ESED)',
                data: [13.4, 14.8, 15.6, 16.2],
                borderColor: '#1e3a8a',
                backgroundColor: 'rgba(30, 58, 138, 0.1)',
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    appChartInstance = new Chart(ctxPerf, {
        type: 'bar',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
            datasets: [{
                label: 'Pesquisas de Livros',
                data: [120, 190, 300, 250, 150],
                backgroundColor: '#3b82f6'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

/*******************************************************************************
 * 10. DETEÇÃO DE CONEXÃO E DEFINIÇÕES DO APP (DARK MODE, POUPANÇA DE DADOS)
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
            notice.style.display = "block";
        }
    }
}

function toggleDarkMode() {
    const checkbox = document.getElementById("settingDarkMode");
    if (checkbox.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem("esed_theme", "dark");
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem("esed_theme", "light");
    }
}

function toggleDataSaver() {
    const checkbox = document.getElementById("settingDataSaver");
    if (checkbox.checked) {
        document.documentElement.setAttribute('data-datasaver', 'active');
        localStorage.setItem("esed_datasaver", "active");
    } else {
        document.documentElement.removeAttribute('data-datasaver');
        localStorage.setItem("esed_datasaver", "inactive");
    }
}

function applyStoredSettings() {
    const theme = localStorage.getItem("esed_theme");
    const datasaver = localStorage.getItem("esed_datasaver");

    const darkCheckbox = document.getElementById("settingDarkMode");
    const dataCheckbox = document.getElementById("settingDataSaver");

    if (theme === "dark") {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (darkCheckbox) darkCheckbox.checked = true;
    }
    if (datasaver === "active") {
        document.documentElement.setAttribute('data-datasaver', 'active');
        if (dataCheckbox) dataCheckbox.checked = true;
    }
}

function clearLocalCache() {
    if (confirm("Tens a certeza que queres redefinir a aplicação? Todos os dados locais e contas guardadas serão excluídos.")) {
        localStorage.clear();
        location.reload();
    }
}

/*******************************************************************************
 * 11. ÁREA DEV: MÉTRICAS E MONITORIZAÇÃO DE SESSÃO
 *******************************************************************************/
function updateDevMetrics() {
    const countUsers = document.getElementById("devUserCount");
    if (countUsers) {
        const list = JSON.parse(localStorage.getItem("esed_books")) || [];
        countUsers.innerText = `4 Utilizadores Ativos / ${list.length} Livros`;
    }
}

function renderDevTraffic() {
    const tbody = document.getElementById("devUserTrafficBody");
    if (tbody) {
        tbody.innerHTML = defaultTraffic.map(t => `
            <tr>
                <td><strong>${t.nome}</strong></td>
                <td>${t.classe}</td>
                <td>${t.nivel}</td>
                <td><code style="background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:4px;">${t.ip}</code></td>
                <td>${t.dispositivo}</td>
            </tr>
        `).join('');
    }
}

function toggleMaintenanceMode() {
    customAlert("Consola Dev", "Modo Manutenção ativado para simulação. Apenas desenvolvedores supremos conseguem aceder agora.", "info");
}
