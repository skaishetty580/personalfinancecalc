// Initialize the current year in footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Tab functionality for calculators
function setupCalculatorTabs() {
    const calculatorSections = document.querySelectorAll('.calculator-section');
    
    calculatorSections.forEach(section => {
        const navItem = document.querySelector(`a[href="#${section.id}"]`);
        if (navItem) {
            navItem.addEventListener('click', () => {
                calculatorSections.forEach(s => s.classList.remove('active'));
                section.classList.add('active');
            });
        }
    });
}

// Initialize calculator tabs
setupCalculatorTabs();
// Loading indicator
document.addEventListener('DOMContentLoaded', function() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);
    
    // Hide after everything loads
    window.addEventListener('load', function() {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.remove();
        }, 300);
    });
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Add active class to section
                document.querySelectorAll('.calculator-section').forEach(section => {
                    section.classList.remove('active');
                });
                targetElement.classList.add('active');
            }
        });
    });
    
    // State rate toggle
    const stateSelect = document.getElementById('state');
    if (stateSelect) {
        stateSelect.addEventListener('change', function() {
            const stateRateRow = document.getElementById('state-rate-row');
            if (this.value === 'custom') {
                stateRateRow.style.display = 'block';
            } else {
                stateRateRow.style.display = 'none';
            }
        });
    }
});
