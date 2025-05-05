class TaxCalculator {
  constructor() {
    this.taxBrackets = {
      '2023': {
        single: [
          { min: 0, max: 10275, rate: 0.10 },
          { min: 10275, max: 41775, rate: 0.12 },
          { min: 41775, max: 89075, rate: 0.22 },
          { min: 89075, max: 170050, rate: 0.24 },
          { min: 170050, max: 215950, rate: 0.32 },
          { min: 215950, max: 539900, rate: 0.35 },
          { min: 539900, max: Infinity, rate: 0.37 }
        ],
        married: [
          { min: 0, max: 20550, rate: 0.10 },
          { min: 20550, max: 83550, rate: 0.12 },
          { min: 83550, max: 178150, rate: 0.22 },
          { min: 178150, max: 340100, rate: 0.24 },
          { min: 340100, max: 431900, rate: 0.32 },
          { min: 431900, max: 647850, rate: 0.35 },
          { min: 647850, max: Infinity, rate: 0.37 }
        ]
      }
    };
    
    this.initElements();
    this.initEvents();
    this.calculate();
  }

  initElements() {
    this.elements = {
      calculateBtn: document.getElementById('calculate-tax'),
      filingStatus: document.getElementById('filing-status'),
      income: document.getElementById('taxable-income'),
      deductions: document.getElementById('deductions'),
      credits: document.getElementById('tax-credits'),
      state: document.getElementById('state'),
      stateRate: document.getElementById('state-rate'),
      resultsContainer: document.getElementById('tax-results'),
      chartCtx: document.getElementById('tax-chart')?.getContext('2d'),
      bracketBody: document.querySelector('#tax-brackets tbody')
    };
  }

  initEvents() {
    if (this.elements.calculateBtn) {
      this.elements.calculateBtn.addEventListener('click', () => this.calculate());
    }
    
    const inputs = [
      this.elements.filingStatus,
      this.elements.income,
      this.elements.deductions,
      this.elements.credits,
      this.elements.state,
      this.elements.stateRate
    ];
    
    inputs.forEach(input => {
      if (input) input.addEventListener('input', () => this.calculate());
    });
  }

  calculate() {
    const filingStatus = this.elements.filingStatus ? this.elements.filingStatus.value : 'single';
    const grossIncome = this.getInputValue('taxable-income');
    const deductions = this.getInputValue('deductions');
    const credits = this.getInputValue('tax-credits');
    const state = this.elements.state ? this.elements.state.value : 'none';
    const stateRate = state === 'custom' ? this.getInputValue('state-rate') / 100 : 0;
    
    // Calculate taxable income
    const taxableIncome = Math.max(0, grossIncome - deductions);
    
    // Calculate federal tax
    const federalTax = this.calculateFederalTax(taxableIncome, filingStatus);
    
    // Calculate state tax
    let stateTax = 0;
    if (state === 'custom') {
      stateTax = taxableIncome * stateRate;
    } else if (state !== 'none') {
      // In a real app, you'd have state tax tables here
      stateTax = taxableIncome * 0.05; // Default 5% for demo
    }
    
    // Calculate effective tax rates
    const totalTax = federalTax + stateTax - credits;
    const federalRate = grossIncome > 0 ? (federalTax / grossIncome) * 100 : 0;
    const stateRateValue = grossIncome > 0 ? (stateTax / grossIncome) * 100 : 0;
    const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
    
    // Update results
    this.updateResults({
      grossIncome,
      taxableIncome,
      federalTax,
      stateTax,
      credits,
      totalTax,
      federalRate,
      stateRate: stateRateValue,
      effectiveRate,
      takeHomePay: grossIncome - totalTax
    });
    
    this.generateChart(federalTax, stateTax, credits);
    this.generateBracketTable(taxableIncome, filingStatus);
  }

  calculateFederalTax(income, filingStatus) {
    const year = '2023';
    const brackets = this.taxBrackets[year][filingStatus] || this.taxBrackets[year].single;
    let tax = 0;
    let remainingIncome = income;
    
    for (let i = 0; i < brackets.length && remainingIncome > 0; i++) {
      const bracket = brackets[i];
      const taxableAmount = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableAmount * bracket.rate;
      remainingIncome -= taxableAmount;
    }
    
    return tax;
  }

  updateResults(results) {
    const resultsHTML = `
      <div class="result-item">
        <span class="result-label">Taxable Income:</span>
        <span class="result-value">${this.formatCurrency(results.taxableIncome)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Federal Tax:</span>
        <span class="result-value">${this.formatCurrency(results.federalTax)} (${results.federalRate.toFixed(2)}%)</span>
      </div>
      <div class="result-item">
        <span class="result-label">State Tax:</span>
        <span class="result-value">${this.formatCurrency(results.stateTax)} (${results.stateRate.toFixed(2)}%)</span>
      </div>
      <div class="result-item">
        <span class="result-label">Tax Credits:</span>
        <span class="result-value">-${this.formatCurrency(results.credits)}</span>
      </div>
      <div class="result-item highlight">
        <span class="result-label">Total Tax:</span>
        <span class="result-value">${this.formatCurrency(results.totalTax)} (${results.effectiveRate.toFixed(2)}%)</span>
      </div>
      <div class="result-item success">
        <span class="result-label">Take Home Pay:</span>
        <span class="result-value">${this.formatCurrency(results.takeHomePay)}</span>
      </div>
    `;
    
    if (this.elements.resultsContainer) {
      this.elements.resultsContainer.innerHTML = resultsHTML;
    }
  }

  generateChart(federalTax, stateTax, credits) {
    if (!this.elements.chartCtx) return;

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.elements.chartCtx, {
      type: 'doughnut',
      data: {
        labels: ['Federal Tax', 'State Tax', 'Tax Credits'],
        datasets: [{
          data: [federalTax, stateTax, credits],
          backgroundColor: [
            '#3498db',
            '#e74c3c',
            '#2ecc71'
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
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
                return `${label}: ${this.formatCurrency(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  generateBracketTable(income, filingStatus) {
    if (!this.elements.bracketBody) return;

    const year = '2023';
    const brackets = this.taxBrackets[year][filingStatus] || this.taxBrackets[year].single;
    let html = '';
    let cumulativeTax = 0;
    
    brackets.forEach(bracket => {
      const bracketMax = bracket.max === Infinity ? '∞' : this.formatCurrency(bracket.max);
      let bracketIncome = 0;
      let bracketTax = 0;
      
      if (income > bracket.min) {
        bracketIncome = Math.min(income, bracket.max) - bracket.min;
        bracketTax = bracketIncome * bracket.rate;
        cumulativeTax += bracketTax;
      }
      
      const isCurrentBracket = income > bracket.min && income <= (bracket.max === Infinity ? income + 1 : bracket.max);
      
      html += `
        <tr ${isCurrentBracket ? 'class="current-bracket"' : ''}>
          <td>${this.formatCurrency(bracket.min)} - ${bracketMax}</td>
          <td>${(bracket.rate * 100).toFixed(2)}%</td>
          <td>${this.formatCurrency(bracketIncome)}</td>
          <td>${this.formatCurrency(bracketTax)}</td>
          <td>${this.formatCurrency(cumulativeTax)}</td>
        </tr>
      `;
    });
    
    this.elements.bracketBody.innerHTML = html;
  }

  getInputValue(id) {
    const element = document.getElementById(id);
    return element ? parseFloat(element.value) || 0 : 0;
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tax-calculator')) {
    new TaxCalculator();
  }
});