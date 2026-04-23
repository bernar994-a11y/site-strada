/**
 * Feedback System for STRADA Bike Shop
 */

import { smoothCloseModal } from './main';

export const initFeedback = () => {
    const feedbackModal = document.getElementById('feedback-modal');
    const openFeedbackBtns = document.querySelectorAll('.open-feedback');
    const closeFeedbackBtns = document.querySelectorAll('.close-feedback');
    const feedbackForm = document.getElementById('feedback-form') as HTMLFormElement;
    const starRating = document.querySelector('.star-rating');
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
            for (let i = 0; i <= index; i++) {
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

            if (!response.ok) throw new Error('Falha ao enviar feedback');

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
            if (statusEl) {
                statusEl.className = 'status-error';
                statusEl.innerText = '❌ Erro ao enviar. Tente novamente mais tarde.';
            }
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
};
