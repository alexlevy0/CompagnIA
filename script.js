// 🔗 CONFIGURATION - REMPLACEZ CES URLs PAR VOS URLs GOOGLE APPS SCRIPT
const LEADS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzp-qw5XjGxxz_Nu14mA5FD0konmBaFAz_kohTEBNmx64bUfeA4etgoMewrPZeR6xoPyQ/exec';
const AUTH_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzH5U72QLrbjp5cLbt-t2_ipW8UgIs5YTtnxlbS9DYsfm5xjJUKF6eyJ06PY9cqbv3B/exec'; // À créer selon les instructions

// Variables globales
let currentUser = null;

// 🔐 Fonctions d'authentification
function hashPassword(password) {
    // Simple hash pour le MVP (à améliorer en production)
    return btoa(password + 'salt_mycompanion_2025');
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 📱 Gestion des pages
function showPage(pageName) {
    // Cacher toutes les pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Afficher la page demandée
    const page = document.getElementById(pageName + '-page');
    if (page) {
        page.classList.add('active');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function scrollToSection(sectionId) {
    showPage('landing');
    setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// 👤 Gestion utilisateur connecté
function updateUserInterface() {
    const navAuth = document.getElementById('nav-auth');
    const userMenu = document.getElementById('user-menu');
    
    if (currentUser) {
        // Utilisateur connecté
        navAuth.style.display = 'none';
        userMenu.style.display = 'block';
        
        // Mettre à jour les infos utilisateur
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
        
        // Rediriger vers le dashboard si on est sur login/register
        const currentPage = document.querySelector('.page.active').id;
        if (currentPage === 'login-page' || currentPage === 'register-page') {
            showPage('dashboard');
        }
    } else {
        // Utilisateur non connecté
        navAuth.style.display = 'flex';
        userMenu.style.display = 'none';
        
        // Rediriger vers landing si on est sur dashboard
        const currentPage = document.querySelector('.page.active').id;
        if (currentPage === 'dashboard-page') {
            showPage('landing');
        }
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('dropdown-menu');
    dropdown.classList.toggle('show');
}

// Fermer le menu utilisateur si on clique ailleurs
document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu.contains(event.target)) {
        document.getElementById('dropdown-menu').classList.remove('show');
    }
});

// 🔐 Authentification
async function register(userData) {
    try {
        const response = await fetch(AUTH_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'register',
                ...userData,
                password: hashPassword(userData.password),
                userId: generateUserId(),
                timestamp: new Date().toISOString()
            })
        });
        
        return { success: true };
    } catch (error) {
        console.error('Erreur inscription:', error);
        return { success: false, error: 'Erreur de connexion' };
    }
}

async function login(email, password) {
    try {
        // Pour le MVP, on simule le login car on ne peut pas récupérer les données avec no-cors
        // En production, vous devriez utiliser CORS ou un autre système
        
        // Simulation d'un utilisateur pour la démo
        if (email === 'demo@mycompanion.fr' && password === 'demo123') {
            return {
                success: true,
                user: {
                    id: 'demo_user',
                    name: 'Démo Utilisateur',
                    email: email,
                    phone: '01 23 45 67 89'
                }
            };
        }
        
        // Sinon, tentative réelle (nécessitera CORS côté Google Apps Script)
        const response = await fetch(AUTH_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: hashPassword(password)
            })
        });
        
        // Avec no-cors, on assume que ça a marché
        return { success: true, user: { id: generateUserId(), name: 'Utilisateur', email: email } };
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        return { success: false, error: 'Email ou mot de passe incorrect' };
    }
}

function logout() {
    currentUser = null;
    // Supprimer de localStorage si utilisé
    localStorage.removeItem('mycompanion_user');
    updateUserInterface();
    showPage('landing');
    showMessage('login-message', 'success', 'Vous avez été déconnecté avec succès');
}

// 📝 Gestion des formulaires
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('register-btn');
    const formData = new FormData(this);
    
    // Vérifier que les mots de passe correspondent
    if (formData.get('password') !== formData.get('confirmPassword')) {
        showMessage('register-message', 'error', 'Les mots de passe ne correspondent pas');
        return;
    }
    
    // Vérifier la longueur du mot de passe
    if (formData.get('password').length < 6) {
        showMessage('register-message', 'error', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Création en cours...';
    
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
    };
    
    const result = await register(userData);
    
    if (result.success) {
        showMessage('register-message', 'success', '🎉 Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        
        // Auto-login après inscription
        setTimeout(async () => {
            const loginResult = await login(userData.email, userData.password);
            if (loginResult.success) {
                currentUser = loginResult.user;
                saveUserSession(currentUser);
                updateUserInterface();
            } else {
                showPage('login');
            }
        }, 1500);
    } else {
        showMessage('register-message', 'error', result.error || 'Erreur lors de la création du compte');
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Créer mon compte';
});

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('login-btn');
    const formData = new FormData(this);
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion...';
    
    const result = await login(formData.get('email'), formData.get('password'));
    
    if (result.success) {
        currentUser = result.user;
        saveUserSession(currentUser);
        updateUserInterface();
        showMessage('login-message', 'success', 'Connexion réussie ! Redirection...');
    } else {
        showMessage('login-message', 'error', result.error || 'Email ou mot de passe incorrect');
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Se connecter';
});

// 📋 Gestion modals
function openLeadModal() {
    document.getElementById('emailModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeLeadModal() {
    document.getElementById('emailModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openContactModal() {
    if (!currentUser) {
        showPage('login');
        return;
    }
    document.getElementById('contactModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Fermer les modals en cliquant à l'extérieur
window.onclick = function(event) {
    const emailModal = document.getElementById('emailModal');
    const contactModal = document.getElementById('contactModal');
    
    if (event.target === emailModal) {
        closeLeadModal();
    }
    if (event.target === contactModal) {
        closeContactModal();
    }
}

// Formulaire de collecte d'emails
document.getElementById('emailForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';
    
    const formData = new FormData(this);
    const data = {
        action: 'add_lead',
        email: formData.get('email'),
        name: formData.get('name'),
        phone: formData.get('phone'),
        situation: formData.get('situation'),
        timestamp: new Date().toISOString(),
        source: 'Landing Page MyCompanion'
    };
    
    try {
        const response = await fetch(LEADS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        showLeadMessage('success', '🎉 Merci ! Vous serez alerté dès que MyCompanion sera disponible.');
        this.reset();
        
        setTimeout(() => {
            closeLeadModal();
            hideLeadMessage();
        }, 2000);
        
    } catch (error) {
        console.error('Erreur:', error);
        showLeadMessage('error', '❌ Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '📧 M\'alerter au lancement';
    }
});

// Formulaire d'ajout de contact
document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showPage('login');
        return;
    }
    
    const submitBtn = document.getElementById('contact-btn');
    const formData = new FormData(this);
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ajout en cours...';
    
    try {
        const contactData = {
            action: 'add_contact',
            userId: currentUser.id,
            contactName: formData.get('contactName'),
            contactPhone: formData.get('contactPhone'),
            relation: formData.get('relation'),
            preferredTime: formData.get('preferredTime'),
            notes: formData.get('notes'),
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch(AUTH_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData)
        });
        
        showContactMessage('success', '✅ Proche ajouté avec succès ! Nous vous contacterons sous 24h pour configurer le premier appel.');
        this.reset();
        
        setTimeout(() => {
            closeContactModal();
            hideContactMessage();
        }, 2000);
        
    } catch (error) {
        console.error('Erreur:', error);
        showContactMessage('error', '❌ Erreur lors de l\'ajout. Veuillez réessayer.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '➕ Ajouter ce proche';
    }
});

// 💬 Fonctions utilitaires
function showMessage(elementId, type, message) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

function showLeadMessage(type, message) {
    const messageDiv = document.getElementById('formMessage');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
}

function hideLeadMessage() {
    document.getElementById('formMessage').style.display = 'none';
}

function showContactMessage(type, message) {
    const messageDiv = document.getElementById('contactMessage');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
}

function hideContactMessage() {
    document.getElementById('contactMessage').style.display = 'none';
}

function saveUserSession(user) {
    localStorage.setItem('mycompanion_user', JSON.stringify(user));
}

// Animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const answer = faqItem.querySelector('.faq-answer');
        const isActive = button.classList.contains('active');

        // Close all other FAQ items
        document.querySelectorAll('.faq-question').forEach(otherButton => {
            otherButton.classList.remove('active');
            otherButton.parentElement.querySelector('.faq-answer').classList.remove('active');
        });

        // Toggle current item
        if (!isActive) {
            button.classList.add('active');
            answer.classList.add('active');
        }
    });
});

// Stats counter animation
function animateStats() {
    const stats = document.querySelectorAll('.stat .number');
    stats.forEach(stat => {
        const target = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = stat.textContent.replace(/[0-9]+/, target);
                clearInterval(timer);
            } else {
                stat.textContent = stat.textContent.replace(/[0-9]+/, Math.floor(current));
            }
        }, 16);
    });
}

// Trigger stats animation when hero is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            setTimeout(animateStats, 500);
            heroObserver.unobserve(entry.target);
        }
    });
});

heroObserver.observe(document.querySelector('.hero'));

// 🎯 Effets modernes de scroll
function initModernEffects() {
    const header = document.querySelector('.header');
    let scrolled = false;

    // Header glassmorphism au scroll
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        if (scrollY > 50 && !scrolled) {
            header.classList.add('scrolled');
            scrolled = true;
        } else if (scrollY <= 50 && scrolled) {
            header.classList.remove('scrolled');
            scrolled = false;
        }
    });

    // Parallax effect pour les éléments
    const parallaxElements = document.querySelectorAll('.hero::before, .solution::before, .final-cta::before');
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        parallaxElements.forEach(element => {
            element.style.transform = `translateY(${rate}px)`;
        });
    });

    // Animation des compteurs
    function animateCounters() {
        const counters = document.querySelectorAll('.stat .number');
        counters.forEach(counter => {
            const target = parseInt(counter.textContent.replace(/[^0-9]/g, ''));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = counter.textContent.replace(/[0-9]+/, target);
                    clearInterval(timer);
                } else {
                    counter.textContent = counter.textContent.replace(/[0-9]+/, Math.floor(current));
                }
            }, 16);
        });
    }

    // Observer pour animations au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                
                // Animation spéciale pour les stats
                if (entry.target.classList.contains('hero-stats')) {
                    setTimeout(animateCounters, 500);
                }
            }
        });
    }, observerOptions);

    // Observer tous les éléments avec animation
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Observer spécial pour les stats
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observer.observe(heroStats);
    }

    // Effet de typing pour le titre principal
    function typeWriter(element, text, speed = 100) {
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    // Micro-interactions pour les boutons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .cta-header');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });

        // Effet de ripple au clic
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Smooth scroll pour les liens de navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Effet de particules scintillantes sur le hero
    function createSparkleParticles() {
        const particlesContainer = document.getElementById('hero-particles');
        if (!particlesContainer) return;
        
        const particleCount = 40;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 4}s;
                animation-duration: ${3 + Math.random() * 3}s;
            `;
            particlesContainer.appendChild(particle);
        }
    }

    // Animation interactive des orbes au mouvement de la souris
    function initMouseInteraction() {
        const hero = document.querySelector('.hero');
        const orbs = document.querySelectorAll('.floating-orb');
        let mouseX = 0;
        let mouseY = 0;
        let isMouseInside = false;
        
        // Animation continue avec requestAnimationFrame pour plus de fluidité
        function animateOrbs() {
            if (isMouseInside) {
                orbs.forEach((orb, index) => {
                    const speed = (index + 1) * 0.015;
                    const xOffset = (mouseX - 50) * speed;
                    const yOffset = (mouseY - 50) * speed;
                    
                    // Interpolation douce vers la nouvelle position
                    const currentTransform = orb.style.transform || 'translate(0px, 0px)';
                    const newTransform = `translate(${xOffset}px, ${yOffset}px)`;
                    orb.style.transform = newTransform;
                });
            }
            requestAnimationFrame(animateOrbs);
        }
        
        hero.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            
            mouseX = (clientX / innerWidth) * 100;
            mouseY = (clientY / innerHeight) * 100;
            isMouseInside = true;
        });
        
        hero.addEventListener('mouseenter', () => {
            isMouseInside = true;
        });
        
        hero.addEventListener('mouseleave', () => {
            isMouseInside = false;
            // Retour progressif à la position initiale
            orbs.forEach(orb => {
                orb.style.transform = 'translate(0px, 0px)';
            });
        });
        
        // Démarrer l'animation
        animateOrbs();
    }

    // Effet de morphing des couleurs progressif
    function initColorMorphing() {
        const orbs = document.querySelectorAll('.floating-orb');
        
        // Palette de couleurs harmonieuses
        const colorPalettes = [
            ['#ff6b6b', '#ee5a24'], // Rouge-orange
            ['#4ecdc4', '#44a08d'], // Turquoise
            ['#a8edea', '#fed6e3'], // Pastel
            ['#ff9a9e', '#fecfef'], // Rose
            ['#667eea', '#764ba2'], // Violet
            ['#ffecd2', '#fcb69f'], // Pêche
            ['#fa709a', '#fee140'], // Rose-jaune
            ['#30cfd0', '#91a7ff'], // Bleu
            ['#a8edea', '#fed6e3'], // Turquoise-rose
            ['#ff758c', '#ff7eb3']  // Rose vif
        ];
        
        orbs.forEach((orb, index) => {
            let currentPaletteIndex = index % colorPalettes.length;
            
            // Fonction pour changer progressivement les couleurs
            function morphColor() {
                const palette = colorPalettes[currentPaletteIndex];
                orb.style.background = `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
                
                // Passer à la palette suivante
                currentPaletteIndex = (currentPaletteIndex + 1) % colorPalettes.length;
                
                // Programmer le prochain changement avec un délai aléatoire
                const nextChangeDelay = 3000 + Math.random() * 4000; // Entre 3 et 7 secondes
                setTimeout(morphColor, nextChangeDelay);
            }
            
            // Démarrer avec un délai initial différent pour chaque orbe
            setTimeout(morphColor, index * 1000);
        });
    }

    // Effet de focus pour les inputs
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = '';
        });
    });

    // Animation des cartes au survol
    const cards = document.querySelectorAll('.feature-card, .pricing-card, .testimonial, .problem-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.zIndex = '10';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.zIndex = '';
        });
    });

    // Créer les particules et initialiser les animations après un délai
    setTimeout(() => {
        createSparkleParticles();
        initMouseInteraction();
        initColorMorphing();
    }, 1000);

    // Ajouter les styles CSS pour l'animation ripple
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 🚀 Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si un utilisateur est déjà connecté (localStorage)
    const savedUser = localStorage.getItem('mycompanion_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUserInterface();
        } catch (error) {
            localStorage.removeItem('mycompanion_user');
        }
    }
    
    // Initialiser les effets modernes
    initModernEffects();
    
    // Afficher un message pour la démo
    setTimeout(() => {
        if (!currentUser) {
            console.log('💡 Pour tester: email "demo@mycompanion.fr" et mot de passe "demo123"');
        }
    }, 2000);

    // Add floating animation to solution visual
    setTimeout(() => {
        const solutionVisual = document.querySelector('.solution-visual');
        if (solutionVisual) {
            solutionVisual.classList.add('floating');
        }
    }, 1000);
});

function debugContactForm() {
    console.log("AUTH_SCRIPT_URL:", AUTH_SCRIPT_URL);
    console.log("currentUser:", currentUser);
    
    // Tester avec des données factices
    const testData = {
        action: 'add_contact',
        userId: 'debug_user',
        contactName: 'Test Debug',
        contactPhone: '01 11 11 11 11',
        relation: 'Test',
        preferredTime: '10:00',
        notes: 'Debug test',
        timestamp: new Date().toISOString()
    };
    
    fetch(AUTH_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
    }).then(() => {
        console.log("Requête envoyée");
    }).catch(err => {
        console.error("Erreur:", err);
    });
} 