// src/cafe.ts
import './style.css'
import { initNav } from './nav'

const setupCafeScroll = () => {
    // Reveal animations already handled by handleReveal in main site logic
    // but we can add page-specific parallax or effects here if needed
};

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    setupCafeScroll();
    
    // Header Sticky Effect (shared logic usually in main.ts, but let's ensure it works)
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }
    });

    // Mobile Menu
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    mobileMenu?.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navLinks?.classList.toggle('active');
    });
});
