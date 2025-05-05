class RetirementCalculator {
  constructor() {
    this.initElements();
    this.initEvents();
    this.calculate();
  }

  initElements() {
    this.elements = {
      calculateBtn: document.getElementById('calculate-retirement'),
      currentAge: document.getElementById('current-age'),
      retirementAge: document.getElementById('retirement-age'),
      currentSavings: document.getElementById('current-savings'),
      monthlyContribution: document.getElementById('monthly-contribution'),
      annualReturn: document.getElementById('annual-return'),
      inflationRate: document.getElementById('inflation-rate'),
      retirementIncome: document.getElementById('retirement-income'),
      retirementDuration: document.getElementById('retirement-duration'),
      resultsContainer: document.getElementById('retirement-results'),
      chartCtx: document.getElementById('retirement-chart')?.getContext('2d')
    };
  }

  initEvents() {
    if (this.elements.calculateBtn) {
      this.elements.calculateBtn.addEventListener('click', () => this.calculate());
    }
    
    const inputs = [
      this.elements.currentAge,
      this.elements.retirementAge,
      this.elements.currentSavings,
      this.elements.monthlyContribution,
      this.elements.annualReturn,
      this.elements.inflationRate,
      this.elements.retirementIncome,
      this.elements.retirementDuration
    ];
    
    inputs.forEach(input => {
      if (input) input.addEventListener('input', () => this.calculate());
    });
  }

  calculate() {
    const currentAge = this.getInputValue('current-age');
    const retirementAge = this.getInputValue('retirement-age');
    const currentSavings = this.getInputValue('current-savings');
    const monthlyContribution = this.getInputValue('monthly-contribution');
    const annualReturn = this.getInputValue('annual-return') / 100;
    const inflationRate = this.getInputValue('inflation-rate') / 100;
    const retirementIncome = this.getInputValue('retirement-income');
    const retirementDuration = this.getInputValue('retirement-duration');

    // Calculate real return rate (adjusted for inflation)
    const realReturnRate = (1 + annualReturn) / (1 + inflationRate) - 1;

    // Calculate savings at retirement
    const yearsToRetirement = retirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    let retirementSavings = currentSavings;

    for (let i = 0; i < monthsToRetirement; i++) {
      retirementSavings = retirementSavings * (1 + realReturnRate / 12) + monthlyContribution;
    }

    // Calculate retirement income sustainability
    const monthlyRetirementIncome = retirementIncome / 12;
    let retirementFunds = retirementSavings;
    let yearsFundsLast = 0;
    let monthlyWithdrawals = [];

    for (let year = 0; year < retirementDuration; year++) {
      for (let month = 0; month < 12; month++) {
        if (retirementFunds <= 0) break;
        
        // Adjust withdrawal for inflation
        const inflationAdjustedWithdrawal = monthlyRetirementIncome * Math.pow(1 + inflationRate, year);
        retirementFunds = retirementFunds * (1 + realReturnRate / 12) - inflationAdjustedWithdrawal;
        monthlyWithdrawals.push({
          age: retirementAge + year + (month / 12),
          balance: retirementFunds
        });
      }
      if (retirementFunds <= 0) break;
      yearsFundsLast++;
    }

    // Calculate shortfall or surplus
    const shortfall = yearsFundsLast < retirementDuration ? 
      (retirementDuration - yearsFundsLast) * retirementIncome : 0;

    // Update results
    this.updateResults({
      retirementSavings,
      monthlyRetirementIncome,
      yearsFundsLast,
      shortfall,
      canRetire: yearsFundsLast >= retirementDuration
    });

    this.generateChart(monthlyWithdrawals, retirementAge);
  }

  updateResults(results) {
    const resultsHTML = `
      <div class="result-item">
        <span class="result-label">Savings at Retirement:</span>
        <span class="result-value">${this.formatCurrency(results.retirementSavings)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Monthly Retirement Income:</span>
        <span class="result-value">${this.formatCurrency(results.monthlyRetirementIncome)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Funds Will Last:</span>
        <span class="result-value">${results.yearsFundsLast} years</span>
      </div>
      <div class="result-item ${results.canRetire ? 'success' : 'warning'}">
        <span class="result-label">${results.canRetire ? 'Surplus' : 'Shortfall'}:</span>
        <span class="result-value">${results.canRetire ? 
          'Your savings exceed your needs' : 
          `Additional ${this.formatCurrency(results.shortfall)} needed`}</span>
      </div>
    `;

    if (this.elements.resultsContainer) {
      this.elements.resultsContainer.innerHTML = resultsHTML;
    }
  }

  generateChart(data, retirementAge) {
    if (!this.elements.chartCtx || !data.length) return;

    if (this.chart) this.chart.destroy();

    const labels = data.map(item => Math.floor(item.age));
    const balances = data.map(item => Math.max(0, item.balance));

    this.chart = new Chart(this.elements.chartCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Retirement Balance',
          data: balances,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Age ${context.label}: ${this.formatCurrency(context.raw)}`;
              }
            }
          },
          annotation: {
            annotations: {
              line1: {
                type: 'line',
                yMin: 0,
                yMax: 0,
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2,
                label: {
                  content: 'Funds Depleted',
                  enabled: true,
                  position: 'right'
                }
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Age'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Account Balance'
            },
            beginAtZero: true
          }
        }
      }
    });
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
  if (document.getElementById('retirement-calculator')) {
    new RetirementCalculator();
  }
});