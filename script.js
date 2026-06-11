// Simple and clean interactions inspired by Hackathon.dev

document.addEventListener('DOMContentLoaded', function() {
    // ==================== GESTION DU CACHE ====================
    function getUserFromCache() {
        const userData = localStorage.getItem('dodje_user');
        return userData ? JSON.parse(userData) : null;
    }
    
    function saveUserToCache(userData) {
        localStorage.setItem('dodje_user', JSON.stringify(userData));
    }
    
    function clearUserCache() {
        localStorage.removeItem('dodje_user');
    }
    
    // Note: Le dashboard a été retiré car l'application est maintenant disponible
    console.log('Chargement de la landing page Dodje');
    
    // ==================== NAVIGATION DYNAMIQUE ====================
    const navbarMinimal = document.getElementById('navbar-minimal');
    const navbarScroll = document.getElementById('navbar-scroll');
    let navScrollTop = 0;
    const scrollThreshold = 100; // Pixels de scroll avant de changer le header
    
    // Fonction pour gérer l'affichage des headers selon le scroll
    function handleScrollNavigation() {
        if (!navbarMinimal || !navbarScroll) return;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > scrollThreshold) {
            // Masquer le header minimal et afficher le header complet
            if (!navbarMinimal.classList.contains('hidden')) {
                navbarMinimal.classList.add('hidden');
            }
            if (!navbarScroll.classList.contains('visible')) {
                navbarScroll.classList.add('visible');
            }
        } else {
            // Afficher le header minimal et masquer le header complet
            if (navbarMinimal.classList.contains('hidden')) {
                navbarMinimal.classList.remove('hidden');
            }
            if (navbarScroll.classList.contains('visible')) {
                navbarScroll.classList.remove('visible');
            }
        }
        
        navScrollTop = scrollTop;
    }
    
    // Event listener pour le scroll
    window.addEventListener('scroll', handleScrollNavigation, { passive: true });
    
    // Initialiser l'état au chargement
    handleScrollNavigation();
    
    // ==================== MENU MOBILE ====================
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    
    // Fonction pour ouvrir le menu mobile
    function openMobileMenu() {
        if (!mobileMenu || !mobileMenuOverlay) return;
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        if (mobileMenuToggle) mobileMenuToggle.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    }

    // Fonction pour fermer le menu mobile
    function closeMobileMenu() {
        if (!mobileMenu || !mobileMenuOverlay) return;
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        if (mobileMenuToggle) mobileMenuToggle.classList.remove('is-active');
        document.body.style.overflow = 'auto';
    }

    // Toggle (open OR close depending on current state) — the burger button
    // now also acts as the close button so the 3 bars morph into an X.
    function toggleMobileMenu() {
        if (!mobileMenu) return;
        if (mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    // Event listeners pour le menu mobile
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
    }
    
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Fermer le menu mobile quand on clique sur un lien
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links .nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Fermer le menu mobile sur escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // ==================== EXISTING FUNCTIONALITY ====================
    // Gestion de la vidéo d'arrière-plan
    const backgroundVideo = document.getElementById('background-video');
    if (backgroundVideo) {
        const shouldDisableBackgroundVideo = window.matchMedia('(max-width: 767px)').matches;

        if (shouldDisableBackgroundVideo) {
            backgroundVideo.querySelectorAll('source').forEach(source => source.remove());
            backgroundVideo.removeAttribute('src');
            backgroundVideo.load();
        } else {
            // S'assurer que la vidéo démarre bien
            backgroundVideo.play().catch(e => {
                console.log('Autoplay bloqué:', e);
            });

            // Redémarrer la vidéo quand elle se termine (double sécurité pour la boucle)
            backgroundVideo.addEventListener('ended', function() {
                this.currentTime = 0;
                this.play();
            });
        }
    }

    // Navbar scroll effect
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScrollTop = scrollTop;
        }, { passive: true });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    const allCtaButtons = document.querySelectorAll('.cta-button');

    // CTA button hover effects (pour les boutons qui ne sont pas "C'est parti")
    allCtaButtons.forEach(button => {
        if (!button.textContent.includes('C\'est parti')) {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px) scale(1.02)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        }
    });



    // About video - contrôles natifs uniquement
    const aboutVideo = document.querySelector('.about-video');
    if (aboutVideo) {
        // Configuration pour mobile - s'assurer que la vidéo utilise les contrôles natifs
        aboutVideo.setAttribute('playsinline', '');
        aboutVideo.setAttribute('webkit-playsinline', '');
        
        // Error handling simple
        aboutVideo.addEventListener('error', function() {
            console.error('Error loading about video');
        });
        
        // Log basique quand la vidéo est prête
        aboutVideo.addEventListener('loadedmetadata', function() {
            console.log('About video loaded successfully');
        });
    }

    // Keyboard navigation improvements
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });

    // Performance optimization: debounce scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Apply debouncing to scroll events
    const debouncedScrollHandler = debounce(function() {
        // Additional scroll effects can be added here
    }, 16); // ~60fps

    window.addEventListener('scroll', debouncedScrollHandler, { passive: true });

    console.log('🌱 Dodje Landing Page with Firebase loaded successfully');
}); 