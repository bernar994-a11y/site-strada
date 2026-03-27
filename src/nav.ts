// src/nav.ts

export const initNav = () => {
    const navLinks = document.querySelector('.nav-links') as HTMLElement;
    const links = document.querySelectorAll('.nav-links a');
    
    if (!navLinks) return;

    // 1. Create Indicator
    let indicator = document.querySelector('.nav-indicator') as HTMLElement;
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'nav-indicator';
        navLinks.appendChild(indicator);
    }

    const moveIndicator = (target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        const parentRect = navLinks.getBoundingClientRect();
        
        indicator.style.width = `${rect.width}px`;
        indicator.style.height = `${rect.height}px`;
        indicator.style.left = `${rect.left - parentRect.left}px`;
        indicator.style.top = `${rect.top - parentRect.top}px`;
        indicator.style.opacity = '1';
    };

    // Set initial position
    const activeLink = document.querySelector('.nav-links a.active') as HTMLElement;
    if (activeLink) {
        // Wait a bit for layout to settle
        setTimeout(() => moveIndicator(activeLink), 100);
    } else {
        indicator.style.opacity = '0';
    }

    // Hover effect
    links.forEach(link => {
        link.addEventListener('mouseenter', (e) => {
            moveIndicator(e.target as HTMLElement);
        });
    });

    navLinks.addEventListener('mouseleave', () => {
        const currentActive = document.querySelector('.nav-links a.active') as HTMLElement;
        if (currentActive) {
            moveIndicator(currentActive);
        } else {
            indicator.style.opacity = '0';
        }
    });

    // 2. Page Transitions
    const handlePageExit = (e: Event) => {
        const link = (e.currentTarget as HTMLAnchorElement);
        const href = link.getAttribute('href');

        // Only animate if it's a page link (not a hash or external)
        if (href && !href.startsWith('#') && !href.includes('http') && href !== window.location.pathname.split('/').pop()) {
            e.preventDefault();
            document.body.classList.add('page-exit');
            
            setTimeout(() => {
                window.location.href = href;
            }, 400); // Match CSS transition time
        }
    };

    links.forEach(link => {
        link.addEventListener('click', handlePageExit);
    });

    // Initial entry
    document.body.classList.add('page-enter');
    setTimeout(() => {
        document.body.classList.remove('page-enter');
    }, 500);

    // Update on resize
    window.addEventListener('resize', () => {
        const currentActive = document.querySelector('.nav-links a.active') as HTMLElement;
        if (currentActive) moveIndicator(currentActive);
    });
};
