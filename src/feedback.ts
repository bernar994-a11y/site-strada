/**
 * Feedback System for STRADA Bike Shop
 */

export const initFeedback = () => {
    const feedbackModal = document.getElementById('feedback-modal');
    const openFeedbackBtns = document.querySelectorAll('.open-feedback');
    const closeFeedbackBtns = document.querySelectorAll('.close-feedback');
    const feedbackForm = document.getElementById('feedback-form') as HTMLFormElement;
    const stars = document.querySelectorAll('.star-rating label');
    const statusEl = document.getElementById('feedback-status');

    if (!feedbackModal) return;

    // Open Modal
    openFeedbackBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            feedbackModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (feedbackForm) feedbackForm.reset();
            resetStars();
        });
    });

    // Close Modal
    closeFeedbackBtns.forEach(btn => {
        btn.addEventListener('click', () => {
             // We use the helper from main.ts if exported, or just manually
             feedbackModal.classList.add('closing');
             feedbackModal.classList.remove('active');
             document.body.style.overflow = 'auto';
             setTimeout(() => feedbackModal.classList.remove('closing'), 350);
        });
    });

    // Close on overlay click
    window.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            feedbackModal.classList.add('closing');
            feedbackModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            setTimeout(() => feedbackModal.classList.remove('closing'), 350);
        }
    });

    // Star Rating Interaction (Visual only, the radio buttons handle the value)
    const resetStars = () => {
        stars.forEach(s => s.classList.remove('active'));
    };

    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            resetStars();
            // Since flex-direction is row-reverse and DOM order is 5-4-3-2-1:
            // index 0 -> Star 5 (all 5 lights up)
            // index 1 -> Star 4 (stars 4,3,2,1 light up)
            // ...
            // index 4 -> Star 1 (only star 1 lights up)
            // We light up stars from the clicked index to the end of the DOM list (index 4)
            for (let i = index; i < stars.length; i++) {
                stars[i].classList.add('active');
            }
        });
    });


    // Form Submission
    feedbackForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = feedbackForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalBtnText = submitBtn.innerText;
        
        const formData = new FormData(feedbackForm);
        const data = {
            name: formData.get('name') as string,
            rating: formData.get('rating') as string,
            type: formData.get('type') as string,
            comment: formData.get('comment') as string
        };

        if (!data.rating) {
            alert('Por favor, selecione uma nota.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = 'Enviando...';
        if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.className = 'status-info';
            statusEl.innerText = 'Enviando sua avaliação...';
        }
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                if (!response.ok) {
                    const error: any = new Error(result.error || 'Falha ao enviar feedback');
                    error.hint = result.hint;
                    throw error;
                }
            } else {
                if (!response.ok) {
                    const text = await response.text();
                    console.error('Server Error Text:', text);
                    throw new Error('O servidor retornou um erro não esperado (HTML). Verifique se você está usando "vercel dev" para testar APIs localmente.');
                }
            }


            if (statusEl) {
                statusEl.className = 'status-success';
                statusEl.innerText = '✅ Obrigado! Sua avaliação foi enviada com sucesso.';
            }
            
            feedbackForm.reset();
            resetStars();

            setTimeout(() => {
                feedbackModal.classList.remove('active');
                document.body.style.overflow = 'auto';
                if (statusEl) statusEl.style.display = 'none';
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }, 2500);

        } catch (err: any) {
            console.error('Feedback Error:', err);
            let msg = 'Erro ao enviar. Verifique se a tabela de feedbacks foi criada no Supabase.';
            
            if (err.message && err.message !== 'Falha ao enviar feedback') {
                msg = `❌ Erro: ${err.message}`;
            }

            // Exibir dica específica se retornar (ex: RLS)
            if (err.hint) {
                msg += `<br><small style="display:block;margin-top:5px;opacity:0.8;">💡 Dica: ${err.hint}</small>`;
            }

            if (statusEl) {
                statusEl.className = 'status-error';
                statusEl.innerHTML = msg; // Usar innerHTML para o <small>
            }
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
};

