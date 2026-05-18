// ── Translations ─────────────────────────────────────────────────────────────
const TRANSLATIONS = {
    en: {
        // Page titles
        page_title_index:    "BiblioFetch | Reference Extraction & Validation",
        page_title_tutorial: "How to Create a Free Gemini API Key | BiblioFetch",

        // index.html — static
        subtitle:     "Intelligent extraction and enrichment of bibliographic data.",
        label_paste:  "Paste your raw bibliographic references below:",
        textarea_placeholder: "Ex: Arthurs, J., Drakopoulou, S., & Gandini, A. (2018). Researching YouTube. Convergence...",
        api_key_label:  '<i class="ph ph-key"></i> API Key Configuration (Gemini):',
        radio_server:   "Use server key (Free & Default)",
        radio_custom:   "Use my own key (Free on Google AI Studio)",
        api_key_placeholder: "Paste your Google AI Studio API Key here...",
        api_key_help:   "Your key is saved locally and securely in your browser. It is never stored on our servers.",
        tutorial_link:  '<i class="ph ph-book-open"></i> How to create my free API Key? (Step-by-step Tutorial)',
        model_label:    '<i class="ph ph-cpu"></i> Choose the AI model:',
        btn_process:    "Process References",
        step1_title:    "1. AI Extraction",
        step1_desc:     "The model is analysing and structuring the text (may take a few seconds).",
        step2_title:    '2. Searching <a href="https://openalex.org/" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;text-decoration-color:var(--primary-color);">OpenAlex</a> and <a href="https://www.semanticscholar.org/" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;text-decoration-color:var(--primary-color);">Semantic Scholar</a>',
        step2_desc:     "Verifying unique identifiers and retrieving files from global research repositories.",
        step3_title:    "3. Link Access Test",
        step3_desc:     "Testing PDF accessibility and categorising results.",
        results_title:  '<i class="ph ph-chart-bar"></i> Final Audit Panel',
        results_tip:    '💡 Tip: Press <strong>Ctrl + Click</strong> (or use the middle mouse button) on the buttons to open tabs in the background without leaving this page.',
        card_success:   "Available for Download",
        card_paywall:   "Possible paywall",
        card_nodoi:     "No DOI Identified",

        // index.html — JS dynamic
        alert_empty:      "Please paste your references into the text field.",
        alert_line_limit: (n) => `Your text has ${n} lines. The maximum allowed is 200 lines.\n\nTip: paste only the references section of your document.`,
        alert_no_key:     'Please enter your Gemini API key or select "Use server key".',
        alert_error:      (msg) => `An error occurred: ${msg}`,
        btn_processing:   "Processing...",
        btn_process_restore: "Process References",
        no_pdfs:          "No accessible PDFs found.",
        no_blocks:        "No blocks recorded.",
        all_had_doi:      "All references had a DOI.",
        open_pdf:         "Open PDF",
        try_manually:     "Try manually",
        search_google:    "Search on Google",
        source:           "Source",
        not_provided:     "Not provided",

        // tutorial.html — static
        back_link:          "Back to BiblioFetch",
        badge_free:         '<i class="ph ph-sparkle"></i> 100% Free &amp; Secure',
        tutorial_h1:        "Getting your Gemini API Key",
        tutorial_subtitle:  "Follow the step-by-step tutorial below to create your personal API key in under 2 minutes.",
        step_by_step:       '<i class="ph ph-steps" style="color:var(--primary-color);"></i> Step by Step',
        step1_tut_title:    "Go to Google AI Studio",
        step1_tut_desc:     "Google AI Studio is the official platform for developers to access Gemini family models. Sign in with your regular Google account (Gmail).",
        step1_tut_btn:      'Open Google AI Studio <i class="ph ph-arrow-square-out"></i>',
        step2_tut_title:    'Click "Get API Key"',
        step2_tut_desc:     'In the top or left-side menu of the Google AI Studio platform, click the blue button or link labelled <strong>"Get API key"</strong>.',
        step3_tut_title:    "Create and copy your API key",
        step3_tut_desc:     'Click <strong>"Create API key"</strong>, choose whether to create it in a new or existing project, and a key (a long code starting with <code>AIzaSy...</code>) will be generated.',
        step3_tut_warning:  '<strong>⚠️ Note:</strong> Check the dashboard to confirm your account is on the <strong>Free tier</strong>.',
        step3_tut_copy:     'Click <strong>Copy</strong> to copy it.',
        step4_tut_title:    "Paste it into BiblioFetch",
        step4_tut_desc:     'Return to the BiblioFetch page, select <strong>"Use my own key"</strong>, paste the copied code into the text field, and click <strong>Process References</strong>.',
        faq_title:  '<i class="ph ph-chats" style="color:var(--gold-color);"></i> Frequently Asked Questions (FAQ)',
        faq1_q:     '<i class="ph ph-question-circle"></i> Is the Gemini API key really free?',
        faq1_a:     "Yes! Google offers an extremely generous Free Tier for Google AI Studio. You do not need to add a credit card and can make up to 15 requests per minute for free — more than enough for BiblioFetch usage.",
        faq2_q:     '<i class="ph ph-shield-check"></i> Is it safe to enter my API key here?',
        faq2_a:     "Completely. Your key is stored <strong>100% securely and privately in your own browser\'s local storage (localStorage)</strong>. It is never saved on our server and is transmitted directly and in encrypted form only when you request a reference extraction.",
        faq3_q:     '<i class="ph ph-arrows-left-right"></i> What is the difference between the server key and my own key?',
        faq3_a:     "The server key is shared among all BiblioFetch users. Because Google enforces global request limits, it may occasionally hit the quota cap and become slow or temporarily blocked. Using your own key gives you an exclusive quota and full speed without interruptions.",
        footer:     'BiblioFetch &copy; 2026. Built with academic rigour and privacy. &nbsp;|&nbsp; <a href="https://github.com/meneguinha/BiblioFetch" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;"><i class="ph ph-github-logo"></i> meneguinha/BiblioFetch</a>',
    },

    pt: {
        // Page titles
        page_title_index:    "BiblioFetch | Extração e Validação de Referências",
        page_title_tutorial: "Como Criar uma API Key Gratuita do Gemini | BiblioFetch",

        // index.html — static
        subtitle:     "Extração e enriquecimento inteligente de dados bibliográficos.",
        label_paste:  "Cole suas referências bibliográficas brutas abaixo:",
        textarea_placeholder: "Ex: Arthurs, J., Drakopoulou, S., & Gandini, A. (2018). Researching YouTube. Convergence...",
        api_key_label:  '<i class="ph ph-key"></i> Configuração da API Key (Gemini):',
        radio_server:   "Usar chave do servidor (Grátis e Padrão)",
        radio_custom:   "Usar minha própria chave (Grátis no Google AI Studio)",
        api_key_placeholder: "Cole sua API Key do Google AI Studio aqui...",
        api_key_help:   "Sua chave é salva de forma local e segura no seu navegador. Ela nunca é armazenada em nossos servidores.",
        tutorial_link:  '<i class="ph ph-book-open"></i> Como criar minha API Key gratuita? (Tutorial passo a passo)',
        model_label:    '<i class="ph ph-cpu"></i> Escolha o modelo de IA:',
        btn_process:    "Processar Referências",
        step1_title:    "1. Extração com IA",
        step1_desc:     "O modelo está analisando e estruturando o texto (pode levar alguns segundos).",
        step2_title:    '2. Buscando no <a href="https://openalex.org/" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;text-decoration-color:var(--primary-color);">OpenAlex</a> e <a href="https://www.semanticscholar.org/" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;text-decoration-color:var(--primary-color);">Semantic Scholar</a>',
        step2_desc:     "Verificando identificadores únicos e recuperando arquivos de repositórios de pesquisa globais.",
        step3_title:    "3. Teste de Acesso aos Links",
        step3_desc:     "Testando acessibilidade dos PDFs e categorizando os resultados.",
        results_title:  '<i class="ph ph-chart-bar"></i> Painel de Auditoria Final',
        results_tip:    '💡 Dica: Pressione <strong>Ctrl + Click</strong> (ou use o botão do meio do mouse) nos botões para abrir abas em segundo plano sem sair desta página.',
        card_success:   "Disponível para Download",
        card_paywall:   "Possível paywall",
        card_nodoi:     "Sem DOI Identificado",

        // index.html — JS dynamic
        alert_empty:      "Por favor, cole suas referências no campo de texto.",
        alert_line_limit: (n) => `Seu texto tem ${n} linhas. O máximo permitido é 200 linhas.\n\nDica: cole apenas a seção de referências do seu documento.`,
        alert_no_key:     'Por favor, insira sua API Key do Gemini ou selecione "Usar chave do servidor".',
        alert_error:      (msg) => `Ocorreu um erro: ${msg}`,
        btn_processing:   "Processando...",
        btn_process_restore: "Processar Referências",
        no_pdfs:          "Nenhum PDF acessível encontrado.",
        no_blocks:        "Nenhum bloqueio registrado.",
        all_had_doi:      "Todas as referências tinham DOI.",
        open_pdf:         "Abrir PDF",
        try_manually:     "Tentar manualmente",
        search_google:    "Buscar no Google",
        source:           "Fonte",
        not_provided:     "Não informada",

        // tutorial.html — static
        back_link:          "Voltar ao BiblioFetch",
        badge_free:         '<i class="ph ph-sparkle"></i> 100% Grátis &amp; Seguro',
        tutorial_h1:        "Obtendo sua API Key do Gemini",
        tutorial_subtitle:  "Siga o tutorial passo a passo abaixo para criar sua chave pessoal em menos de 2 minutos.",
        step_by_step:       '<i class="ph ph-steps" style="color:var(--primary-color);"></i> Passo a Passo',
        step1_tut_title:    "Acesse o Google AI Studio",
        step1_tut_desc:     "O Google AI Studio é a plataforma oficial para desenvolvedores acessarem os modelos da família Gemini. Faça login com sua conta Google comum (Gmail).",
        step1_tut_btn:      'Abrir o Google AI Studio <i class="ph ph-arrow-square-out"></i>',
        step2_tut_title:    'Clique em "Get API Key"',
        step2_tut_desc:     'No menu superior ou lateral da plataforma Google AI Studio, clique no botão ou link azul chamado <strong>"Get API key"</strong>.',
        step3_tut_title:    "Crie e copie sua API Key",
        step3_tut_desc:     'Clique em <strong>"Create API key"</strong>, escolha se quer criar em um projeto novo ou existente, e uma chave (um código longo começando com <code>AIzaSy...</code>) será gerada.',
        step3_tut_warning:  '<strong>⚠️ Atenção:</strong> Verifique no painel se sua conta está no <strong>Free tier</strong>.',
        step3_tut_copy:     'Clique em <strong>Copiar</strong> para copiá-la.',
        step4_tut_title:    "Cole no BiblioFetch",
        step4_tut_desc:     'Volte à página do BiblioFetch, selecione <strong>"Usar minha própria chave"</strong>, cole o código copiado no campo de texto e clique em <strong>Processar Referências</strong>.',
        faq_title:  '<i class="ph ph-chats" style="color:var(--gold-color);"></i> Perguntas Frequentes (FAQ)',
        faq1_q:     '<i class="ph ph-question-circle"></i> A API Key do Gemini é realmente gratuita?',
        faq1_a:     "Sim! O Google oferece um Free Tier extremamente generoso para o Google AI Studio. Você não precisa adicionar cartão de crédito e pode fazer até 15 requisições por minuto gratuitamente — mais do que suficiente para o uso do BiblioFetch.",
        faq2_q:     '<i class="ph ph-shield-check"></i> É seguro inserir minha API Key aqui?',
        faq2_a:     "Completamente. Sua chave é armazenada <strong>100% de forma segura e privada no armazenamento local do seu próprio navegador (localStorage)</strong>. Ela nunca é salva em nosso servidor e é transmitida de forma criptografada apenas quando você solicita uma extração de referências.",
        faq3_q:     '<i class="ph ph-arrows-left-right"></i> Qual é a diferença entre a chave do servidor e a minha própria chave?',
        faq3_a:     "A chave do servidor é compartilhada entre todos os usuários do BiblioFetch. Como o Google impõe limites globais de requisições, ela pode eventualmente atingir o limite da cota e ficar lenta ou temporariamente bloqueada. Usar sua própria chave dá a você uma cota exclusiva e velocidade total sem interrupções.",
        footer:     'BiblioFetch &copy; 2026. Construído com rigor acadêmico e privacidade. &nbsp;|&nbsp; <a href="https://github.com/meneguinha/BiblioFetch" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;"><i class="ph ph-github-logo"></i> meneguinha/BiblioFetch</a>',
    }
};

// ── Public helpers ────────────────────────────────────────────────────────────

/** Returns the active language ('en' or 'pt'). */
function getLang() {
    return localStorage.getItem('bibliofetch_lang') || 'en';
}

/** Translates a key, optionally calling it as a function with extra args. */
function t(key, ...args) {
    const lang = getLang();
    const val = (TRANSLATIONS[lang] || TRANSLATIONS['en'])[key]
             ?? TRANSLATIONS['en'][key]
             ?? key;
    return typeof val === 'function' ? val(...args) : val;
}

/** Applies all data-i18n* attributes to the DOM and updates document.title. */
function applyLanguage(lang) {
    // Update active buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update <html lang="">
    document.documentElement.lang = lang;

    // Resolve page title key
    const isIndex = document.querySelector('#btnProcess') !== null;
    const titleKey = isIndex ? 'page_title_index' : 'page_title_tutorial';
    document.title = t(titleKey);

    // Plain text
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });

    // HTML content (icons, links, strong tags)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
}

/** Initialises the toggle, reads saved preference and applies it. */
function initLangToggle() {
    const saved = getLang();
    applyLanguage(saved);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            localStorage.setItem('bibliofetch_lang', lang);
            applyLanguage(lang);
        });
    });
}

document.addEventListener('DOMContentLoaded', initLangToggle);
