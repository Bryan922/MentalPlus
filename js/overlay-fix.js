// Script de correction automatique des overlays blancs
// À inclure avant employee.js

(function() {
    'use strict';
    
    console.log('🔧 Overlay Fix Script - Initialisation');
    
    // Fonction pour forcer la visibilité des éléments critiques
    function forceVisibility() {
        const criticalSelectors = [
            '.sidebar',
            '.main-content',
            '.content-section.active',
            '.dashboard-container',
            '.nav-link',
            '.mobile-menu-toggle',
            '.mobile-overlay',
            '#mobileMenuToggle',
            '#mobileOverlay',
            '#sidebar'
        ];
        
        criticalSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el) {
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                    el.style.pointerEvents = 'auto';
                    // S'assurer que les liens de navigation sont cliquables
                    if (el.classList.contains('nav-link') || el.hasAttribute('data-section')) {
                        el.style.cursor = 'pointer';
                        el.style.zIndex = '1000';
                    }
                    console.log(`✓ Visibilité forcée pour: ${selector}`);
                }
            });
        });
    }
    
    // Fonction pour détecter et masquer les overlays suspects
    function detectAndHideOverlays() {
        const allElements = document.querySelectorAll('*');
        let overlaysFound = 0;
        
        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex) || 0;
            const position = style.position;
            const background = style.backgroundColor;
            const width = parseFloat(style.width);
            const height = parseFloat(style.height);
            
            // Exclure les éléments de navigation et critiques
            const isNavigationElement = (
                el.classList.contains('nav-link') ||
                el.classList.contains('sidebar') ||
                el.classList.contains('main-content') ||
                el.classList.contains('mobile-menu-toggle') ||
                el.classList.contains('mobile-overlay') ||
                el.closest('.sidebar') ||
                el.closest('.nav-link') ||
                el.tagName === 'A' ||
                el.hasAttribute('data-section') ||
                el.id === 'mobileMenuToggle' ||
                el.id === 'mobileOverlay' ||
                el.id === 'sidebar'
            );
            
            // Détecter les overlays suspects
            const isSuspicious = (
                (position === 'fixed' || position === 'absolute') &&
                zIndex > 50 &&
                width > window.innerWidth * 0.8 &&
                height > window.innerHeight * 0.8 &&
                (background.includes('255, 255, 255') || background === 'white' || background === '#ffffff')
            );
            
            if (isSuspicious && !el.classList.contains('modal') && !el.id.includes('modal') && !isNavigationElement) {
                console.warn('🚨 Overlay suspect détecté:', {
                    element: el,
                    zIndex: zIndex,
                    position: position,
                    background: background,
                    width: width,
                    height: height
                });
                
                // Masquer l'overlay suspect
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
                overlaysFound++;
                
                console.log(`🔧 Overlay suspect masqué: ${el.tagName}${el.className ? '.' + el.className : ''}${el.id ? '#' + el.id : ''}`);
            }
        });
        
        if (overlaysFound > 0) {
            console.log(`🎯 ${overlaysFound} overlay(s) suspect(s) masqué(s)`);
        } else {
            console.log('✅ Aucun overlay suspect détecté');
        }
    }
    
    // Fonction pour forcer la fermeture des modales
    function forceCloseModals() {
        const modalSelectors = [
            '#disclaimerModal',
            '.modal',
            '[id*="modal"]',
            '[class*="modal"]'
        ];
        
        modalSelectors.forEach(selector => {
            const modals = document.querySelectorAll(selector);
            modals.forEach(modal => {
                if (modal && !modal.classList.contains('keep-open')) {
                    modal.style.display = 'none';
                    modal.style.visibility = 'hidden';
                    modal.style.opacity = '0';
                    modal.classList.remove('show', 'active');
                    console.log(`🔒 Modal fermé: ${selector}`);
                }
            });
        });
    }
    
    // Fonction principale de diagnostic et correction
    function runOverlayFix() {
        console.log('🔍 Début du diagnostic overlay...');
        
        // 1. Forcer la fermeture des modales
        forceCloseModals();
        
        // 2. Détecter et masquer les overlays suspects
        detectAndHideOverlays();
        
        // 3. Forcer la visibilité des éléments critiques
        forceVisibility();
        
        console.log('✅ Diagnostic overlay terminé');
    }
    
    // Exécuter immédiatement si le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runOverlayFix);
    } else {
        runOverlayFix();
    }
    
    // Exécuter aussi après le chargement complet
    window.addEventListener('load', function() {
        setTimeout(runOverlayFix, 100);
    });
    
    // Observer les changements dans le DOM
    const observer = new MutationObserver(function(mutations) {
        let shouldCheck = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        const style = window.getComputedStyle(node);
                        if (style.position === 'fixed' || style.position === 'absolute') {
                            shouldCheck = true;
                        }
                    }
                });
            }
        });
        
        if (shouldCheck) {
            setTimeout(detectAndHideOverlays, 50);
        }
    });
    
    // Commencer l'observation
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Exposer la fonction pour les tests manuels
    window.fixOverlays = runOverlayFix;
    
    console.log('🛡️ Overlay Fix Script - Prêt');
})();