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