import { getLoyaltyClient, registerLoyaltyClient } from './store';
import { initNav } from './nav';

// --- Tab Switching ---
const tabCheck = document.getElementById('tab-check');
const tabRegister = document.getElementById('tab-register');
const formCheck = document.getElementById('form-check');
const formRegister = document.getElementById('form-register');

const switchTab = (tab: 'check' | 'register') => {
    if (tab === 'check') {
        tabCheck?.classList.add('active');
        tabRegister?.classList.remove('active');
        formCheck?.classList.add('active');
        formRegister?.classList.remove('active');
    } else {
        tabRegister?.classList.add('active');
        tabCheck?.classList.remove('active');
        formRegister?.classList.add('active');
        formCheck?.classList.remove('active');
    }
};

tabCheck?.addEventListener('click', () => switchTab('check'));
tabRegister?.addEventListener('click', () => switchTab('register'));

// --- Register Logic ---
const btnRegister = document.getElementById('btn-register') as HTMLButtonElement;
const regStatus = document.getElementById('reg-status')!;
const regSuccess = document.getElementById('reg-success')!;

const generateUniqueCode = async (): Promise<string> => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    let code = '';
    let isUnique = false;

    while (!isUnique) {
        let randomPart = '';
        for (let i = 0; i < 4; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        code = `STR-${randomPart}`;
        
        // Verify uniqueness in DB
        const res = await fetch(`/api/loyalty?action=check-code&code=${code}`);
        const data = await res.json();
        if (!data.exists) isUnique = true;
    }
    return code;
};

btnRegister?.addEventListener('click', async () => {
    const name = (document.getElementById('reg-name') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('reg-phone') as HTMLInputElement).value.trim();

    if (!name || !phone) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    btnRegister.disabled = true;
    btnRegister.innerText = 'CRIANDO CONTA...';
    regStatus.style.display = 'block';
    regStatus.innerText = '⏳ Gerando seu código exclusivo...';
    regStatus.style.color = 'var(--primary)';

    try {
        const code = await generateUniqueCode();
        const client = await registerLoyaltyClient(name, phone, code);
        
        // Hide form and show success
        const forms = document.querySelectorAll('.loyalty-form input, .loyalty-form button, .loyalty-form p');
        forms.forEach(f => (f as HTMLElement).style.display = 'none');
        (document.querySelector('.loyalty-form label') as HTMLElement).style.display = 'none';
        
        regSuccess.style.display = 'block';
        document.getElementById('success-code')!.innerText = client.loyalty_code;
        regStatus.style.display = 'none';

    } catch (err: any) {
        regStatus.innerText = '❌ Erro: ' + (err.message || 'Falha ao cadastrar');
        regStatus.style.color = '#e74c3c';
        btnRegister.disabled = false;
        btnRegister.innerText = 'CRIAR MINHA CONTA';
    }
});

// --- Check Points Logic ---
const btnCheck = document.getElementById('btn-check-points') as HTMLButtonElement;
const checkStatus = document.getElementById('check-status')!;
const pointsResult = document.getElementById('points-result')!;

btnCheck?.addEventListener('click', async () => {
    const identifier = (document.getElementById('check-id') as HTMLInputElement).value.trim();

    if (!identifier) {
        alert('Digite seu código ou telefone.');
        return;
    }

    btnCheck.disabled = true;
    btnCheck.innerText = 'BUSCANDO...';
    checkStatus.style.display = 'block';
    checkStatus.innerText = '🔍 Localizando sua conta...';
    checkStatus.style.color = 'var(--primary)';
    pointsResult.classList.remove('active');

    try {
        const client = await getLoyaltyClient(identifier);
        
        // Display results
        document.getElementById('res-balance')!.innerText = String(client.points_balance);
        document.getElementById('res-name')!.innerText = `Olá, ${client.name.split(' ')[0]}!`;
        document.getElementById('res-code')!.innerText = `Código: ${client.loyalty_code}`;
        
        // Next Reward logic (Example)
        const nextTarget = 500;
        const diff = nextTarget - client.points_balance;
        const nextMsg = document.getElementById('next-reward-msg')!;
        if (diff > 0) {
            nextMsg.innerHTML = `Faltam <b>${diff} pontos</b> para você ganhar um cupom de R$ 50 OFF!`;
        } else {
            nextMsg.innerHTML = `🎉 Você já pode resgatar seu prêmio de R$ 50 OFF! Fale conosco no balcão.`;
        }

        // History
        const historyContainer = document.getElementById('history-container')!;
        if (client.stradabike_loyalty_history && client.stradabike_loyalty_history.length > 0) {
            historyContainer.innerHTML = client.stradabike_loyalty_history.slice(0, 5).map(h => `
                <div class="history-item">
                    <div class="desc">
                        <div>${h.description}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date(h.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="pts ${h.points < 0 ? 'minus' : ''}">${h.points > 0 ? '+' : ''}${h.points}</div>
                </div>
            `).join('');
        } else {
            historyContainer.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted);">Nenhuma movimentação recente.</p>';
        }

        pointsResult.classList.add('active');
        checkStatus.style.display = 'none';
        btnCheck.disabled = false;
        btnCheck.innerText = 'CONSULTAR SALDO';

    } catch (err: any) {
        checkStatus.innerText = '❌ ' + (err.message || 'Conta não encontrada');
        checkStatus.style.color = '#e74c3c';
        btnCheck.disabled = false;
        btnCheck.innerText = 'CONSULTAR SALDO';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNav();
});
