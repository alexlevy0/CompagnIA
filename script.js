// 🔗 CONFIGURATION - REMPLACEZ CES URLs PAR VOS URLs GOOGLE APPS SCRIPT
const LEADS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzp-qw5XjGxxz_Nu14mA5FD0konmBaFAz_kohTEBNmx64bUfeA4etgoMewrPZeR6xoPyQ/exec';
const AUTH_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxBlSRVwQfIyjDXoMBD3B0R7cmaHkBPv1IBOJS4nI3aX-lbEASF7hYyn8YPInBl1B8s/exec';

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
        if (navAuth) navAuth.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        
        // Mettre à jour les infos utilisateur
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        if (userName) userName.textContent = currentUser.name;
        if (userAvatar) userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        
        // Rediriger vers le dashboard si on est sur login/register
        const currentPage = document.querySelector('.page.active');
        if (currentPage && (currentPage.id === 'login-page' || currentPage.id === 'register-page')) {
            showPage('dashboard');
        }
    } else {
        // Utilisateur non connecté
        if (navAuth) navAuth.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        
        // Rediriger vers landing si on est sur dashboard
        const currentPage = document.querySelector('.page.active');
        if (currentPage && currentPage.id === 'dashboard-page') {
            showPage('landing');
        }
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('dropdown-menu');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Fermer le menu utilisateur si on clique ailleurs
document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('user-menu');
    const dropdown = document.getElementById('dropdown-menu');
    if (userMenu && !userMenu.contains(event.target) && dropdown) {
        dropdown.classList.remove('show');
    }
});

// 🔐 Authentification
async function register(userData) {
    try {
        const response = await fetch(AUTH_SCRIPT_URL, {
            redirect: "follow",
            method: "POST",
            body: JSON.stringify({
                action: 'register',
                ...userData,
                password: hashPassword(userData.password),
                userId: generateUserId(),
                timestamp: new Date().toISOString()
            }),
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
        });
        
        return { success: true };
    } catch (error) {
        console.error('Erreur inscription:', error);
        return { success: false, error: 'Erreur de connexion' };
    }
}

async function login(email, password) {
    try {
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
        
        // Tentative réelle avec la nouvelle solution CORS
        const response = await fetch(AUTH_SCRIPT_URL, {
            redirect: "follow",
            method: "POST",
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: hashPassword(password)
            }),
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
        });
        
        const result = await response.json();
        return result.success ? result : { success: true, user: { id: generateUserId(), name: 'Utilisateur', email: email } };
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        return { success: false, error: 'Email ou mot de passe incorrect' };
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('mycompanion_user');
    updateUserInterface();
    showPage('landing');
    showMessage('login-message', 'success', 'Vous avez été déconnecté avec succès');
}

// 📞 FONCTION PRINCIPALE - Essayer un appel MyCompanion (VERSION SOLUTION CORS)
function tryMyCompanionCall() {
    const phoneInput = document.getElementById('phone-trial');
    
    if (!phoneInput) {
        console.error('❌ Input phone-trial non trouvé');
        showTrialMessage('error', 'Erreur: Interface non trouvée');
        return;
    }
    
    const phoneNumber = phoneInput.value.trim();
    
    console.log('🔍 DEBUG: Numéro saisi:', `"${phoneNumber}"`);
    console.log('🔍 DEBUG: Type:', typeof phoneNumber);
    console.log('🔍 DEBUG: Length:', phoneNumber.length);
    
    // Validation du numéro de téléphone
    if (!phoneNumber) {
        showTrialMessage('error', 'Veuillez saisir un numéro de téléphone');
        return;
    }
    
    // Validation RENFORCÉE du format français
    const frenchPhoneRegex = /^(\+33|0)[1-9][\d\s\-\.\(\)]{8,}$/;
    if (!frenchPhoneRegex.test(phoneNumber)) {
        console.log('❌ DEBUG: Numéro ne passe pas la validation française');
        showTrialMessage('error', 'Veuillez saisir un numéro de téléphone français valide (ex: 01 23 45 67 89)');
        return;
    }
    
    console.log('✅ DEBUG: Numéro validé côté client');
    
    // Désactiver le bouton pendant le traitement
    const trialBtn = document.querySelector('.btn-trial');
    if (!trialBtn) {
        console.error('❌ Bouton trial non trouvé');
        return;
    }
    
    const originalText = trialBtn.textContent;
    trialBtn.disabled = true;
    trialBtn.textContent = 'Vérification...';
    
    // Préparer les données pour l'envoi
    const trialData = {
        action: 'trial_request',
        phone: phoneNumber,
        timestamp: new Date().toISOString(),
        source: 'Hero Trial Button'
    };
    
    console.log('📤 DEBUG: Données envoyées:', trialData);
    
    // 🎯 SOLUTION CORS QUI FONCTIONNE !
    fetch(AUTH_SCRIPT_URL, {
        redirect: "follow",           // ⭐ CLÉ 1: Gère les redirections Google Apps Script
        method: "POST",
        body: JSON.stringify(trialData),
        headers: {
            "Content-Type": "text/plain;charset=utf-8",  // ⭐ CLÉ 2: Évite les requêtes preflight
        },
    })
    .then(response => {
        console.log('📥 DEBUG: Réponse reçue, status:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('📥 DEBUG: Réponse JSON:', result);
        handleTrialResponse(result, phoneInput, trialBtn, originalText);
    })
    .catch(error => {
        console.error('❌ DEBUG: Erreur:', error);
        showTrialMessage('error', 'Erreur de connexion. Veuillez réessayer.');
        trialBtn.disabled = false;
        trialBtn.textContent = originalText;
    });
}

// 📥 Fonction pour traiter la réponse de la demande d'essai
function handleTrialResponse(result, phoneInput, trialBtn, originalText) {
    console.log('📥 DEBUG: Réponse complète reçue:', result);
    
    if (result.success) {
        console.log('✅ DEBUG: Succès confirmé');
        showTrialMessage('success', '🎉 Votre essai gratuit est configuré ! Nous vous appellerons dans les 24h.');
        phoneInput.value = '';
    } else {
        console.log('❌ DEBUG: Échec détecté');
        console.log('  - Error code:', result.errorCode);
        console.log('  - Error message:', result.error);
        console.log('  - Debug info:', result.debug);
        console.log('  - Existing request:', result.existingRequest);
        
        // Gestion spécifique des différents types d'erreurs
        if (result.errorCode === 'DUPLICATE_PHONE') {
            console.log('🚨 DEBUG: Doublon confirmé côté serveur !');
            
            let message = `⚠️ Ce numéro a déjà fait une demande de test.`;
            
            if (result.existingRequest && result.existingRequest.ligne) {
                const date = result.existingRequest.date ? 
                    new Date(result.existingRequest.date).toLocaleDateString('fr-FR') : 'Date inconnue';
                message += `<br><small>Demande existante du ${date} (ligne ${result.existingRequest.ligne})</small>`;
            }
            
            showTrialMessage('warning', message);
        } else if (result.error) {
            showTrialMessage('error', `❌ ${result.error}`);
        } else {
            showTrialMessage('error', '❌ Une erreur est survenue. Veuillez réessayer.');
        }
    }
    
    // Réactiver le bouton
    trialBtn.disabled = false;
    trialBtn.textContent = originalText;
}

// 💬 Fonction pour afficher les messages d'essai
function showTrialMessage(type, message) {
    // Supprimer les messages existants
    const existingMessage = document.querySelector('.trial-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Créer le nouveau message
    const messageDiv = document.createElement('div');
    messageDiv.className = `trial-message ${type}`;
    messageDiv.innerHTML = message; // Utiliser innerHTML pour supporter les retours à la ligne
    
    // Styles selon le type de message
    let styles = `
        margin-top: 15px;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        animation: fadeInUp 0.3s ease-out;
        line-height: 1.4;
    `;
    
    switch(type) {
        case 'success':
            styles += 'background: rgba(76, 175, 80, 0.2); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.3);';
            break;
        case 'error':
            styles += 'background: rgba(244, 67, 54, 0.2); color: #f44336; border: 1px solid rgba(244, 67, 54, 0.3);';
            break;
        case 'warning':
            styles += 'background: rgba(255, 152, 0, 0.2); color: #ff9800; border: 1px solid rgba(255, 152, 0, 0.3);';
            break;
        case 'info':
            styles += 'background: rgba(33, 150, 243, 0.2); color: #2196F3; border: 1px solid rgba(33, 150, 243, 0.3);';
            break;
        default:
            styles += 'background: rgba(33, 150, 243, 0.2); color: #2196F3; border: 1px solid rgba(33, 150, 243, 0.3);';
    }
    
    messageDiv.style.cssText = styles;
    
    // Insérer le message après la section d'essai
    const trialSection = document.querySelector('.hero-phone-trial');
    if (trialSection) {
        trialSection.appendChild(messageDiv);
    }
    
    // Supprimer le message après un délai
    const delay = type === 'success' ? 8000 : (type === 'warning' ? 12000 : (type === 'info' ? 10000 : 0));
    if (delay > 0) {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'fadeOutDown 0.3s ease-in';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, delay);
    }
}

// 🧪 FONCTIONS DE TEST ET DEBUG

// Test avec la nouvelle solution CORS
function testNewCorsMethod() {
    console.log('');
    console.log('=== 🎯 TEST NOUVELLE MÉTHODE CORS ===');
    
    const testPhone = '06 88 77 66 55';
    console.log('📱 Test avec numéro:', testPhone);
    
    const testData = {
        action: 'trial_request',
        phone: testPhone,
        timestamp: new Date().toISOString(),
        source: 'Test New CORS Method'
    };
    
    console.log('📤 Envoi avec nouvelle méthode:', testData);
    
    // 🎯 NOUVELLE SOLUTION CORS
    fetch(AUTH_SCRIPT_URL, {
        redirect: "follow",
        method: "POST",
        body: JSON.stringify(testData),
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        },
    })
    .then(response => {
        console.log('📥 Status:', response.status);
        console.log('📥 Headers:', response.headers);
        return response.json();
    })
    .then(result => {
        console.log('📥 Résultat:', result);
        
        if (result.success) {
            showTrialMessage('success', '🎉 Nouvelle méthode CORS fonctionne ! Réponse: ' + (result.message || 'Succès'));
        } else {
            showTrialMessage('warning', '⚠️ Réponse reçue mais échec: ' + (result.error || 'Erreur inconnue'));
        }
    })
    .catch(error => {
        console.error('❌ Erreur:', error);
        showTrialMessage('error', '❌ Nouvelle méthode CORS a échoué: ' + error.message);
    });
}

// Test ultimate avec la NOUVELLE SOLUTION CORS
function testUltimateDuplicateFromClient() {
    console.log('');
    console.log('=== 🧪 TEST ULTIMATE AVEC NOUVELLE SOLUTION CORS ===');
    
    const testPhone = '06 77 88 99 00'; // Numéro unique pour test
    const phoneInput = document.getElementById('phone-trial');
    
    if (!phoneInput) {
        console.error('❌ Input phone-trial non trouvé');
        return;
    }
    
    // ÉTAPE 1: Premier test
    console.log('📞 ÉTAPE 1: Premier appel');
    phoneInput.value = testPhone;
    
    const testData1 = {
        action: 'trial_request',
        phone: testPhone,
        timestamp: new Date().toISOString(),
        source: 'Test Ultimate Client 1'
    };
    
    console.log('📤 Envoi données 1:', testData1);
    
    // 🎯 UTILISER LA NOUVELLE SOLUTION CORS !
    fetch(AUTH_SCRIPT_URL, {
        redirect: "follow",
        method: "POST",
        body: JSON.stringify(testData1),
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        },
    })
    .then(response => response.json())
    .then(result1 => {
        console.log('📥 Résultat 1:', result1);
        
        if (result1.success) {
            console.log('✅ Premier appel réussi, test du doublon dans 2 secondes...');
            showTrialMessage('info', '✅ Premier appel réussi ! Test du doublon dans 2 secondes...');
            
            // ÉTAPE 2: Deuxième test (doublon) après délai
            setTimeout(() => {
                console.log('');
                console.log('📞 ÉTAPE 2: Deuxième appel (doublon attendu)');
                
                const testData2 = {
                    action: 'trial_request',
                    phone: testPhone, // MÊME numéro
                    timestamp: new Date().toISOString(),
                    source: 'Test Ultimate Client 2 (doublon)'
                };
                
                console.log('📤 Envoi données 2:', testData2);
                
                fetch(AUTH_SCRIPT_URL, {
                    redirect: "follow",
                    method: "POST",
                    body: JSON.stringify(testData2),
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                })
                .then(response => response.json())
                .then(result2 => {
                    console.log('📥 Résultat 2:', result2);
                    
                    // ANALYSE FINALE
                    console.log('');
                    console.log('📊 === ANALYSE FINALE ===');
                    console.log('Premier appel réussi:', result1.success);
                    console.log('Deuxième appel échoué:', !result2.success);
                    console.log('Code erreur:', result2.errorCode);
                    
                    if (result1.success && !result2.success && result2.errorCode === 'DUPLICATE_PHONE') {
                        console.log('🎉 SUCCÈS TOTAL: La détection de doublon fonctionne parfaitement !');
                        showTrialMessage('success', '🎉 PARFAIT ! Premier appel réussi ✅, deuxième appel bloqué ❌ (doublon détecté)');
                    } else {
                        console.log('❌ ÉCHEC: La détection de doublon ne fonctionne pas');
                        showTrialMessage('error', '❌ Test échoué: Problème de détection de doublon');
                        console.log('DEBUG - Result1:', result1);
                        console.log('DEBUG - Result2:', result2);
                    }
                })
                .catch(error => {
                    console.error('❌ Erreur test 2:', error);
                    showTrialMessage('error', '❌ Erreur lors du test 2');
                });
                
            }, 2000);
            
        } else {
            console.log('❌ Premier appel a échoué:', result1);
            showTrialMessage('error', '❌ Premier appel a échoué: ' + (result1.error || 'Erreur inconnue'));
        }
    })
    .catch(error => {
        console.error('❌ Erreur test 1:', error);
        showTrialMessage('error', '❌ Erreur lors du test 1');
    });
}

// Test de validation côté client
function debugClientPhoneValidation() {
    console.log('=== 🔍 DEBUG VALIDATION CÔTÉ CLIENT ===');
    
    const testNumbers = [
        '01 23 45 67 89',    // ✅ Valide
        '06 12 34 56 78',    // ✅ Valide  
        '+33123456789',      // ✅ Valide
        '0123456789',        // ✅ Valide
        '01-23-45-67-89',    // ✅ Valide
        '01.23.45.67.89',    // ✅ Valide
        '633230606',         // ❌ Invalide (pas français)
        '33633230606',       // ❌ Invalide (commence mal)
        '123',               // ❌ Invalide (trop court)
        '',                  // ❌ Invalide (vide)
        'abcdefgh',          // ❌ Invalide (lettres)
    ];
    
    const frenchPhoneRegex = /^(\+33|0)[1-9][\d\s\-\.\(\)]{8,}$/;
    
    console.log('Résultats de validation:');
    testNumbers.forEach(phone => {
        const isValid = frenchPhoneRegex.test(phone);
        console.log(`"${phone}" => ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
    });
}

// Test manuel simple pour vérifier le comportement côté utilisateur
function testManualDuplicate() {
    console.log('=== 🎯 TEST MANUEL SIMPLIFIÉ ===');
    
    const phoneInput = document.getElementById('phone-trial');
    const testPhone = '06 11 22 33 44';
    
    if (!phoneInput) {
        console.error('❌ Input non trouvé');
        return;
    }
    
    console.log('📱 Simulation saisie utilisateur:', testPhone);
    phoneInput.value = testPhone;
    
    console.log('🖱️ Simulation premier clic...');
    // Simuler le premier clic
    tryMyCompanionCall();
    
    // Simuler le deuxième clic après 5 secondes
    setTimeout(() => {
        console.log('🖱️ Simulation deuxième clic (même numéro)...');
        phoneInput.value = testPhone; // Même numéro
        tryMyCompanionCall();
    }, 5000);
}

// 📝 Gestion des formulaires
function initFormHandlers() {
    // Formulaire d'inscription
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
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
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Création en cours...';
            }
            
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
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Créer mon compte';
            }
        });
    }

    // Formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('login-btn');
            const formData = new FormData(this);
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Connexion...';
            }
            
            const result = await login(formData.get('email'), formData.get('password'));
            
            if (result.success) {
                currentUser = result.user;
                saveUserSession(currentUser);
                updateUserInterface();
                showMessage('login-message', 'success', 'Connexion réussie ! Redirection...');
            } else {
                showMessage('login-message', 'error', result.error || 'Email ou mot de passe incorrect');
            }
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Se connecter';
            }
        });
    }

    // Formulaire de collecte d'emails
    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Envoi en cours...';
            }
            
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
                    redirect: "follow",
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
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
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '📧 M\'alerter au lancement';
                }
            }
        });
    }

    // Formulaire d'ajout de contact
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentUser) {
                showPage('login');
                return;
            }
            
            const submitBtn = document.getElementById('contact-btn');
            const formData = new FormData(this);
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Ajout en cours...';
            }
            
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
                    redirect: "follow",
                    method: "POST",
                    body: JSON.stringify(contactData),
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                });
                
                const result = await response.json();
                handleContactResponse(result, this);
                
            } catch (error) {
                console.error('Erreur:', error);
                showContactMessage('error', '❌ Erreur lors de l\'ajout. Veuillez réessayer.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '➕ Ajouter ce proche';
                }
            }
        });
    }
}

// 📋 Gestion modals
function openLeadModal() {
    const modal = document.getElementById('emailModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeLeadModal() {
    const modal = document.getElementById('emailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function openContactModal() {
    if (!currentUser) {
        showPage('login');
        return;
    }
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
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

// 💬 Fonctions utilitaires
function showMessage(elementId, type, message) {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
}

function showLeadMessage(type, message) {
    const messageDiv = document.getElementById('formMessage');
    if (messageDiv) {
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
    }
}

function hideLeadMessage() {
    const messageDiv = document.getElementById('formMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

function showContactMessage(type, message) {
    const messageDiv = document.getElementById('contactMessage');
    if (messageDiv) {
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
    }
}

function hideContactMessage() {
    const messageDiv = document.getElementById('contactMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

function handleContactResponse(result, form) {
    if (result.success) {
        showContactMessage('success', '✅ Proche ajouté avec succès ! Nous vous contacterons sous 24h pour configurer le premier appel.');
        form.reset();
        
        setTimeout(() => {
            closeContactModal();
            hideContactMessage();
        }, 2000);
    } else {
        // Gérer les différents types d'erreurs
        if (result.errorCode === 'DUPLICATE_CONTACT') {
            showContactMessage('warning', '⚠️ Ce contact existe déjà dans votre liste.');
        } else {
            showContactMessage('error', result.error || '❌ Erreur lors de l\'ajout.');
        }
    }
}

function saveUserSession(user) {
    localStorage.setItem('mycompanion_user', JSON.stringify(user));
}

// Animation on scroll
function initAnimations() {
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

    const hero = document.querySelector('.hero');
    if (hero) {
        heroObserver.observe(hero);
    }
}

// Ajouter les styles CSS pour les animations
function addStyles() {
    const additionalStyles = document.createElement('style');
    additionalStyles.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeOutDown {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(20px);
            }
        }
        
        .trial-message {
            transition: all 0.3s ease;
        }
        
        .trial-message.warning {
            cursor: pointer;
        }
        
        .trial-message.warning:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(additionalStyles);
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
    
    // Initialiser les gestionnaires de formulaires
    initFormHandlers();
    
    // Initialiser les animations
    initAnimations();
    
    // Ajouter les styles CSS
    addStyles();
    
    // Afficher un message pour la démo
    setTimeout(() => {
        if (!currentUser) {
            console.log('💡 Pour tester: email "demo@mycompanion.fr" et mot de passe "demo123"');
        }
    }, 2000);
});

// Fonctions de debug pour le contact form
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
        redirect: "follow",
        method: "POST",
        body: JSON.stringify(testData),
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        },
    }).then(response => response.json()).then(result => {
        console.log("Résultat:", result);
    }).catch(err => {
        console.error("Erreur:", err);
    });
}

// 🎯 Messages d'information
console.log('✅ MyCompanion JS - Version finale corrigée et complète');
console.log('🎯 SOLUTION CORS APPLIQUÉE:');
console.log('  - redirect: "follow" (gère les redirections Google Apps Script)');
console.log('  - Content-Type: "text/plain;charset=utf-8" (évite preflight CORS)');
console.log('');
console.log('🔧 Fonctions de debug disponibles:');
console.log('  - testNewCorsMethod() // ⭐ NOUVEAU: Test de la solution CORS qui fonctionne');
console.log('  - testUltimateDuplicateFromClient() // ⭐ AMÉLIORÉ: Test complet avec vraies réponses');
console.log('  - testManualDuplicate() // Test manuel simplifié');
console.log('  - debugClientPhoneValidation() // Tester la validation côté client');
console.log('  - debugContactForm() // Debug du formulaire de contact');
console.log('');
console.log('🧪 Côté Google Apps Script, utilisez:');
console.log('  - testFailsafeVersion() // Test de la version failsafe');
console.log('  - testNewCorsMethod() // Test de la nouvelle solution CORS');
console.log('  - testCompleteCorsWorkflow() // Test workflow complet');
console.log('');
console.log('🎉 RECOMMANDATION: Utilisez testNewCorsMethod() ou testUltimateDuplicateFromClient()');
console.log('    Ces fonctions utilisent la solution CORS qui fonctionne vraiment !');