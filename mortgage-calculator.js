class MortgageCalculator {
  constructor() {
    this.initElements();
    this.initEvents();
    this.calculate();
  }

  initElements() {
    this.elements = {
      calculateBtn: document.getElementById('calculate-mortgage'),
      loanAmount: document.getElementById('loan-amount'),
      downPayment: document.getElementById('down-payment'),
      interestRate: document.getElementById('interest-rate'),
      loanTerm: document.getElementById('loan-term'),
      propertyTax: document.getElementById('property-tax'),
      homeInsurance: document.getElementById('home-insurance'),
      pmi: document.getElementById('pmi'),
      monthlyPayment: document.getElementById('monthly-payment'),
      principalInterest: document.getElementById('principal-interest'),
      taxesInsurance: document.getElementById('taxes-insurance'),
      totalInterest: document.getElementById('total-interest'),
      totalCost: document.getElementById('total-cost'),
      amortizationTable: document.querySelector('#amortization-table tbody'),
      chartCtx: document.getElementById('mortgage-chart')?.getContext('2d')
    };
  }

  initEvents() {
    if (this.elements.calculateBtn) {
      this.elements.calculateBtn.addEventListener('click', () => this.calculate());
    }
    
    // Add input event listeners for real-time calculation
    const inputs = [
      this.elements.loanAmount,
      this.elements.downPayment,
      this.elements.interestRate,
      this.elements.loanTerm,
      this.elements.propertyTax,
      this.elements.homeInsurance,
      this.elements.pmi
    ];
    
    inputs.forEach(input => {
      if (input) input.addEventListener('input', () => this.calculate());
    });
  }

  calculate() {
    const principal = this.getInputValue('loan-amount') - this.getInputValue('down-payment');
    const monthlyRate = this.getInputValue('interest-rate') / 100 / 12;
    const loanTerm = this.getInputValue('loan-term') * 12;
    const monthlyTax = this.getInputValue('property-tax') / 12;
    const monthlyInsurance = this.getInputValue('home-insurance') / 12;
    const pmiRate = this.getInputValue('pmi') / 100 / 12;

    // Calculate PMI (if down payment is less than 20%)
    let pmi = 0;
    if (this.getInputValue('down-payment') < this.getInputValue('loan-amount') * 0.2) {
      pmi = principal * pmiRate;
    }

    // Calculate monthly payment
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / 
                          (Math.pow(1 + monthlyRate, loanTerm) - 1);
    const totalMonthlyPayment = monthlyPayment + monthlyTax + monthlyInsurance + pmi;
    const totalInterest = (monthlyPayment * loanTerm) - principal;
    const totalCost = totalMonthlyPayment * loanTerm;

    // Update UI
    this.updateResults({
      monthlyPayment: totalMonthlyPayment,
      principalInterest: monthlyPayment,
      taxesInsurance: monthlyTax + monthlyInsurance + pmi,
      totalInterest,
      totalCost
    });

    this.generateAmortizationSchedule(principal, monthlyRate, loanTerm, monthlyPayment);
    this.generateChart(principal, totalInterest, monthlyTax * loanTerm, monthlyInsurance * loanTerm, pmi * loanTerm);
  }

  getInputValue(id) {
    const element = document.getElementById(id);
    return element ? parseFloat(element.value) || 0 : 0;
  }

  updateResults(results) {
    this.setResult('monthly-payment', results.monthlyPayment);
    this.setResult('principal-interest', results.principalInterest);
    this.setResult('taxes-insurance', results.taxesInsurance);
    this.setResult('total-interest', results.totalInterest);
    this.setResult('total-cost', results.totalCost);
  }

  setResult(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = this.formatCurrency(value);
  }

  generateAmortizationSchedule(principal, monthlyRate, term, monthlyPayment) {
    if (!this.elements.amortizationTable) return;

    let balance = principal;
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    let html = '';

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

      html += `
        <tr>
          <td>${year}</td>
          <td>${this.formatCurrency(yearlyPrincipal)}</td>
          <td>${this.formatCurrency(yearlyInterest)}</td>
          <td>${this.formatCurrency(balance)}</td>
        </tr>
      `;
    }

    this.elements.amortizationTable.innerHTML = html;
  }

  generateChart(principal, interest, tax, insurance, pmi) {
    if (!this.elements.chartCtx) return;

    // Destroy previous chart if exists
    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.elements.chartCtx, {
      type: 'doughnut',
      data: {
        labels: ['Principal', 'Interest', 'Tax', 'Insurance', 'PMI'],
        datasets: [{
          data: [principal, interest, tax, insurance, pmi],
          backgroundColor: [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw || 0;
                const percentage = context.dataset.data.reduce((a, b) => a + b, 0) > 0 ? 
                  Math.round((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100) : 0;
                return `${label}: ${this.formatCurrency(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('mortgage-calculator')) {
    new MortgageCalculator();
  }
});
