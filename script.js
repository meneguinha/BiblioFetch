// API configuration (change to Hugging Face URL in production)
const API_BASE_URL = 'https://fmenegottobr-bibliofetch.hf.space/api';
// To run locally: const API_BASE_URL = 'http://localhost:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    const btnProcess = document.getElementById('btnProcess');
    const userText = document.getElementById('userText');
    const modelSelection = document.getElementById('modelSelection');

    // API Key elements
    const radioKeys = document.getElementsByName('api_key_type');
    const radioProviders = document.getElementsByName('provider_type');
    const customApiKeyContainer = document.getElementById('customApiKeyContainer');
    const customApiKeyInput = document.getElementById('customApiKey');
    const togglePassword = document.getElementById('togglePassword');
    const apiKeyGroupLabel = document.getElementById('apiKeyGroupLabel');

    const progressSection = document.getElementById('progressSection');
    const resultsSection = document.getElementById('resultsSection');

    // Toggle display of the custom API key field
    radioKeys.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customApiKeyContainer.classList.remove('hidden');
            } else {
                customApiKeyContainer.classList.add('hidden');
            }
        });
    });

    // Toggle password visibility
    if (togglePassword && customApiKeyInput) {
        togglePassword.addEventListener('click', () => {
            const type = customApiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
            customApiKeyInput.setAttribute('type', type);
            togglePassword.classList.toggle('ph-eye-closed');
            togglePassword.classList.toggle('ph-eye');
        });
    }

    // Models
    const googleModels = `
        <option value="Gemini 2.5 Flash">Gemini 2.5 Flash</option>
        <option value="Gemini 2.5 Flash Lite">Gemini 2.5 Flash Lite</option>
        <option value="Gemini 3 Flash">Gemini 3 Flash</option>
        <option value="Gemini 3.1 Flash Lite">Gemini 3.1 Flash Lite</option>
        <option value="Gemma 4 26B" selected>Gemma 4 26B</option>
        <option value="Gemma 4 31B">Gemma 4 31B</option>
    `;
    const nvidiaModels = `
        <option value="meta/llama-3.1-70b-instruct" selected>Llama 3.1 70B Instruct</option>
        <option value="meta/llama-3.1-8b-instruct">Llama 3.1 8B Instruct</option>
        <option value="mistralai/mixtral-8x22b-instruct-v0.1">Mixtral 8x22B</option>
    `;

    function updateProviderUI() {
        const provider = Array.from(radioProviders).find(r => r.checked)?.value || 'google';
        if (provider === 'nvidia') {
            modelSelection.innerHTML = nvidiaModels;
            if (apiKeyGroupLabel) apiKeyGroupLabel.innerHTML = `<i class="ph ph-key"></i> <span data-i18n="api_key_label_nvidia">${t('api_key_label_nvidia')}</span>:`;
            
            const customRadioLabel = document.querySelector('[data-i18n="radio_custom"]') || document.querySelector('[data-i18n="radio_custom_google"]');
            if (customRadioLabel) {
                customRadioLabel.dataset.i18n = 'radio_custom_nvidia';
                customRadioLabel.textContent = t('radio_custom_nvidia');
            }
            
            customApiKeyInput.dataset.i18nPlaceholder = 'api_key_placeholder_nvidia';
            customApiKeyInput.placeholder = t('api_key_placeholder_nvidia');
            
            const tutorialLink = document.getElementById('tutorialLink');
            if (tutorialLink) tutorialLink.href = 'tutorial-nvidia.html';
        } else {
            modelSelection.innerHTML = googleModels;
            if (apiKeyGroupLabel) apiKeyGroupLabel.innerHTML = `<i class="ph ph-key"></i> <span data-i18n="api_key_label_google">${t('api_key_label_google')}</span>:`;
            
            const customRadioLabel = document.querySelector('[data-i18n="radio_custom"]') || document.querySelector('[data-i18n="radio_custom_nvidia"]');
            if (customRadioLabel) {
                customRadioLabel.dataset.i18n = 'radio_custom_google';
                customRadioLabel.textContent = t('radio_custom_google');
            }
            
            customApiKeyInput.dataset.i18nPlaceholder = 'api_key_placeholder_google';
            customApiKeyInput.placeholder = t('api_key_placeholder_google');
            
            const tutorialLink = document.getElementById('tutorialLink');
            if (tutorialLink) tutorialLink.href = 'tutorial-google.html';
        }
        
        // Load saved key from LocalStorage
        const savedApiKey = localStorage.getItem(`bibliofetch_api_key_${provider}`) || (provider === 'google' ? localStorage.getItem('bibliofetch_api_key') : null);
        if (savedApiKey) {
            customApiKeyInput.value = savedApiKey;
            const customRadio = Array.from(radioKeys).find(r => r.value === 'custom');
            if (customRadio) {
                customRadio.checked = true;
                customApiKeyContainer.classList.remove('hidden');
            }
        } else {
            customApiKeyInput.value = '';
            const defaultRadio = Array.from(radioKeys).find(r => r.value === 'default');
            if (defaultRadio) {
                defaultRadio.checked = true;
                customApiKeyContainer.classList.add('hidden');
            }
        }
    }

    radioProviders.forEach(radio => {
        radio.addEventListener('change', updateProviderUI);
    });

    // Save key locally as the user types
    if (customApiKeyInput) {
        customApiKeyInput.addEventListener('input', (e) => {
            const provider = Array.from(radioProviders).find(r => r.checked)?.value || 'google';
            localStorage.setItem(`bibliofetch_api_key_${provider}`, e.target.value.trim());
        });
    }

    // Initialize UI on load
    updateProviderUI();

    btnProcess.addEventListener('click', async () => {
        const text = userText.value.trim();
        if (!text) {
            alert(t('alert_empty'));
            return;
        }

        // Validate the 200-line limit
        const lineCount = text.split('\n').length;
        if (lineCount > 200) {
            alert(t('alert_line_limit', lineCount));
            return;
        }

        // Determine which API key to send
        let apiKeyToSend = null;
        const selectedProvider = Array.from(radioProviders).find(r => r.checked)?.value || 'google';
        const selectedRadio = Array.from(radioKeys).find(r => r.checked);
        if (selectedRadio && selectedRadio.value === 'custom') {
            const userKey = customApiKeyInput.value.trim();
            if (!userKey) {
                alert(selectedProvider === 'nvidia' ? t('alert_no_key_nvidia') : t('alert_no_key_google'));
                return;
            }
            apiKeyToSend = userKey;
        }

        // Reset interface
        resetUI();
        btnProcess.disabled = true;
        btnProcess.innerHTML = `<i class="ph ph-spinner"></i> ${t('btn_processing')}`;
        progressSection.classList.remove('hidden');

        let extractInterval;
        let enrichInterval;
        let validateInterval;

        try {
            // STEP 1: EXTRACTION (Gemini)
            updateProgressState('step-extract', 'active');

            const barExtract = document.getElementById('bar-extract');
            let extractProgress = 0;
            extractInterval = setInterval(() => {
                if (extractProgress < 95) {
                    if (extractProgress < 50) {
                        extractProgress += 1.0;
                    } else if (extractProgress < 75) {
                        extractProgress += 0.4;
                    } else if (extractProgress < 90) {
                        extractProgress += 0.12;
                    } else {
                        extractProgress += 0.02;
                    }
                    barExtract.style.width = `${Math.min(extractProgress, 95).toFixed(1)}%`;
                }
            }, 200);

            const resExtract = await fetch(`${API_BASE_URL}/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    model: modelSelection ? modelSelection.value : null,
                    api_key: apiKeyToSend,
                    provider: selectedProvider
                })
            });
            if (!resExtract.ok) throw new Error(`Extraction error: ${await resExtract.text()}`);
            const dataExtract = await resExtract.json();
            const references = dataExtract.references || [];

            clearInterval(extractInterval);
            barExtract.style.width = '100%';
            updateProgressState('step-extract', 'completed');

            // STEP 2: ENRICHMENT (OpenAlex - item by item for real progress bar)
            updateProgressState('step-enrich', 'active');
            const barEnrich = document.getElementById('bar-enrich');
            const enrichedReferences = [];
            const totalRefs = references.length;

            if (totalRefs === 0) {
                barEnrich.style.width = '100%';
                updateProgressState('step-enrich', 'completed');
            } else {
                let enrichProgress = 0;
                enrichInterval = setInterval(() => {
                    const targetPct = Math.round((enrichedReferences.length / totalRefs) * 100);
                    const nextTargetPct = Math.round(((enrichedReferences.length + 1) / totalRefs) * 100);
                    const limit = targetPct + (nextTargetPct - targetPct) * 0.9;
                    if (enrichProgress < limit) {
                        enrichProgress += 0.8;
                        barEnrich.style.width = `${Math.min(enrichProgress, limit).toFixed(1)}%`;
                    }
                }, 50);

                for (let i = 0; i < totalRefs; i++) {
                    const resEnrich = await fetch(`${API_BASE_URL}/enrich`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ references: [references[i]] })
                    });
                    if (!resEnrich.ok) {
                        clearInterval(enrichInterval);
                        throw new Error(`Enrichment error on item ${i + 1}`);
                    }
                    const dataEnrich = await resEnrich.json();
                    if (dataEnrich.references && dataEnrich.references.length > 0) {
                        enrichedReferences.push(dataEnrich.references[0]);
                    }

                    enrichProgress = Math.round(((i + 1) / totalRefs) * 100);
                    barEnrich.style.width = `${enrichProgress}%`;
                }
                clearInterval(enrichInterval);
                barEnrich.style.width = '100%';
                updateProgressState('step-enrich', 'completed');
            }

            // STEP 3: VALIDATION (PDF link testing - item by item for real progress bar)
            updateProgressState('step-validate', 'active');
            const barValidate = document.getElementById('bar-validate');
            const finalReport = {
                success: [],
                paywall_blocked: [],
                no_doi: []
            };
            const totalEnriched = enrichedReferences.length;

            if (totalEnriched === 0) {
                barValidate.style.width = '100%';
                updateProgressState('step-validate', 'completed');
            } else {
                let validateProgress = 0;
                let validatedCount = 0;
                validateInterval = setInterval(() => {
                    const targetPct = Math.round((validatedCount / totalEnriched) * 100);
                    const nextTargetPct = Math.round(((validatedCount + 1) / totalEnriched) * 100);
                    const limit = targetPct + (nextTargetPct - targetPct) * 0.9;
                    if (validateProgress < limit) {
                        validateProgress += 0.8;
                        barValidate.style.width = `${Math.min(validateProgress, limit).toFixed(1)}%`;
                    }
                }, 50);

                for (let i = 0; i < totalEnriched; i++) {
                    const resValidate = await fetch(`${API_BASE_URL}/validate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ references: [enrichedReferences[i]] })
                    });
                    if (!resValidate.ok) {
                        clearInterval(validateInterval);
                        throw new Error(`Validation error on item ${i + 1}`);
                    }
                    const dataValidate = await resValidate.json();

                    if (dataValidate.success) finalReport.success.push(...dataValidate.success);
                    if (dataValidate.paywall_blocked) finalReport.paywall_blocked.push(...dataValidate.paywall_blocked);
                    if (dataValidate.no_doi) finalReport.no_doi.push(...dataValidate.no_doi);

                    validatedCount++;
                    validateProgress = Math.round((validatedCount / totalEnriched) * 100);
                    barValidate.style.width = `${validateProgress}%`;
                }
                clearInterval(validateInterval);
                barValidate.style.width = '100%';
                updateProgressState('step-validate', 'completed');
            }

            // RENDER FINAL RESULTS
            renderResults(finalReport);

        } catch (error) {
            if (extractInterval) clearInterval(extractInterval);
            if (enrichInterval) clearInterval(enrichInterval);
            if (validateInterval) clearInterval(validateInterval);
            console.error(error);
            alert(t('alert_error', error.message));
        } finally {
            // Restore button
            btnProcess.disabled = false;
            btnProcess.innerHTML = `<span>${t('btn_process_restore')}</span> <i class="ph ph-arrow-right"></i>`;
        }
    });

    function updateProgressState(stepId, state) {
        const step = document.getElementById(stepId);
        const iconContainer = step.querySelector('.status-icon');

        if (state === 'active') {
            step.classList.add('active');
            step.classList.remove('completed');
            iconContainer.innerHTML = '<i class="ph ph-spinner"></i>';
        } else if (state === 'completed') {
            step.classList.remove('active');
            step.classList.add('completed');
            iconContainer.innerHTML = '<i class="ph ph-check-circle"></i>';
        } else {
            step.classList.remove('active', 'completed');
            iconContainer.innerHTML = '<i class="ph ph-circle"></i>';
        }
    }

    function resetUI() {
        resultsSection.classList.add('hidden');
        ['step-extract', 'step-enrich', 'step-validate'].forEach(id => updateProgressState(id, 'pending'));

        document.getElementById('bar-extract').style.width = '0%';
        document.getElementById('bar-enrich').style.width = '0%';
        document.getElementById('bar-validate').style.width = '0%';

        document.getElementById('listSuccess').innerHTML = '';
        document.getElementById('listPaywall').innerHTML = '';
        document.getElementById('listNoDoi').innerHTML = '';

        document.getElementById('countSuccess').textContent = '0';
        document.getElementById('countPaywall').textContent = '0';
        document.getElementById('countNoDoi').textContent = '0';
    }

    function renderResults(data) {
        resultsSection.classList.remove('hidden');

        // Render Success
        const successList = document.getElementById('listSuccess');
        document.getElementById('countSuccess').textContent = data.success.length;

        data.success.forEach(item => {
            successList.innerHTML += `
                <div class="list-item">
                    <div class="list-item-title">${item.title}</div>
                    <div class="list-item-meta">DOI: ${item.doi}</div>
                    <a href="${item.pdf_url}" target="_blank" class="action-link">
                        <i class="ph ph-download-simple"></i> ${t('open_pdf')}
                    </a>
                </div>
            `;
        });
        if (data.success.length === 0) successList.innerHTML = `<div class="list-item">${t('no_pdfs')}</div>`;

        // Render Paywall
        const paywallList = document.getElementById('listPaywall');
        document.getElementById('countPaywall').textContent = data.paywall_blocked.length;

        data.paywall_blocked.forEach(item => {
            paywallList.innerHTML += `
                <div class="list-item">
                    <div class="list-item-title">${item.title}</div>
                    ${item.doi ? `<a href="${item.doi}" target="_blank" class="action-link" style="margin-top: 8px;"><i class="ph ph-arrow-square-out"></i> ${t('try_manually')}</a>` : ''}
                </div>
            `;
        });
        if (data.paywall_blocked.length === 0) paywallList.innerHTML = `<div class="list-item">${t('no_blocks')}</div>`;

        // Render No DOI
        const noDoiList = document.getElementById('listNoDoi');
        document.getElementById('countNoDoi').textContent = data.no_doi.length;

        data.no_doi.forEach(item => {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(item.title)}`;
            noDoiList.innerHTML += `
                <div class="list-item">
                    <div class="list-item-title">${item.title}</div>
                    <div class="list-item-meta">${t('source')}: ${item.journal || t('not_provided')}</div>
                    <a href="${searchUrl}" target="_blank" class="action-link" style="margin-top: 8px;">
                        <i class="ph ph-google-logo"></i> ${t('search_google')}
                    </a>
                </div>
            `;
        });
        if (data.no_doi.length === 0) noDoiList.innerHTML = `<div class="list-item">${t('all_had_doi')}</div>`;
    }

    // Intercept card clicks to toggle states and handle link opens
    const handleCardClick = (e) => {
        const item = e.target.closest('.list-item');
        if (!item) return;

        const link = e.target.closest('a.action-link');

        // If a link was clicked, mark the item as read (green) and open the link
        if (link) {
            if (!item.classList.contains('state-green') && !item.classList.contains('state-red')) {
                item.classList.add('state-green');
            }

            if (e.type === 'click' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault();
                const url = link.href;
                const newWin = window.open(url, '_blank');
                if (newWin) {
                    window.focus();
                    setTimeout(() => window.focus(), 10);
                }
            }
            return; // Don't toggle state below if they specifically clicked a link
        }

        // Only toggle on regular left-click
        if (e.type === 'click' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            if (item.classList.contains('state-green')) {
                item.classList.remove('state-green');
                item.classList.add('state-red');
            } else if (item.classList.contains('state-red')) {
                item.classList.remove('state-red');
            } else {
                item.classList.add('state-green');
            }
        }
    };

    document.addEventListener('click', handleCardClick);
    document.addEventListener('auxclick', handleCardClick);
});
