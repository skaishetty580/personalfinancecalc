document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-mortgage');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateMortgage);
        
        // Calculate on page load
        calculateMortgage();
    }
});

function calculateMortgage() {
    // Get input values
    const loanAmount = parseFloat(document.getElementById('loan-amount').value) || 0;
    const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100 / 12;
    const loanTerm = parseInt(document.getElementById('loan-term').value) * 12;
    const propertyTax = parseFloat(document.getElementById('property-tax').value) / 12;
    const homeInsurance = parseFloat(document.getElementById('home-insurance').value) / 12;
    const pmiRate = parseFloat(document.getElementById('pmi').value) / 100 / 12;
    
    // Calculate principal
    const principal = loanAmount - downPayment;
    
    // Calculate PMI (if down payment is less than 20%)
    let pmi = 0;
    if (downPayment < loanAmount * 0.2) {
        pmi = principal * pmiRate;
    }
    
    // Calculate monthly payment (principal + interest)
    const monthlyPayment = principal * (interestRate * Math.pow(1 + interestRate, loanTerm)) / 
                          (Math.pow(1 + interestRate, loanTerm) - 1);
    
    // Calculate total monthly payment
    const totalMonthlyPayment = monthlyPayment + propertyTax + homeInsurance + pmi;
    
    // Calculate total interest paid
    const totalInterest = (monthlyPayment * loanTerm) - principal;
    
    // Calculate total cost of loan
    const totalCost = totalMonthlyPayment * loanTerm;
    
    // Update results
    document.getElementById('monthly-payment').textContent = formatCurrency(totalMonthlyPayment);
    document.getElementById('principal-interest').textContent = formatCurrency(monthlyPayment);
    document.getElementById('taxes-insurance').textContent = formatCurrency(propertyTax + homeInsurance + pmi);
    document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
    document.getElementById('total-cost').textContent = formatCurrency(totalCost);
    
    // Generate amortization schedule
    generateAmortizationSchedule(principal, interestRate, loanTerm, monthlyPayment);
    
    // Generate chart
    generateMortgageChart(principal, totalInterest, propertyTax * loanTerm, homeInsurance * loanTerm, pmi * loanTerm);
}

function generateAmortizationSchedule(principal, monthlyRate, term, monthlyPayment) {
    const tableBody = document.querySelector('#amortization-table tbody');
    tableBody.innerHTML = '';
    
    let balance = principal;
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    
    for (let year = 1; year <= term / 12; year++) {
        yearlyPrincipal = 0;
        yearlyInterest = 0;
        
        for (let month = 1; month <= 12; month++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            
            yearlyPrincipal += principalPayment;
            yearlyInterest += interestPayment;
            balance -= principalPayment;
            
            if (balance < 0) balance = 0;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${year}</td>
            <td>${formatCurrency(yearlyPrincipal)}</td>
            <td>${formatCurrency(yearlyInterest)}</td>
            <td>${formatCurrency(balance)}</td>
        `;
        tableBody.appendChild(row);
    }
}

function generateMortgageChart(principal, totalInterest, totalTax, totalInsurance, totalPmi) {
    const ctx = document.getElementById('mortgage-chart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (window.mortgageChart) {
        window.mortgageChart.destroy();
    }
    
    window.mortgageChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest', 'Property Tax', 'Home Insurance', 'PMI'],
            datasets: [{
                data: [principal, totalInterest, totalTax, totalInsurance, totalPmi],
                backgroundColor: [
                    '#3498db',
                    '#e74c3c',
                    '#2ecc71',
                    '#f39c12',
                    '#9b59b6'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.raw);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function formatCurrency(value) {
    return '$' + value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}