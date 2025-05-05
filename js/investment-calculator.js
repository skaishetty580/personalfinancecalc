class InvestmentCalculator {
  constructor() {
    this.initElements();
    this.initEvents();
    this.calculate();
  }

  initElements() {
    this.elements = {
      calculateBtn: document.getElementById('calculate-investment'),
      initialInvestment: document.getElementById('initial-investment'),
      monthlyContribution: document.getElementById('investment-monthly-contribution'),
      yearsToGrow: document.getElementById('years-to-grow'),
      annualReturn: document.getElementById('investment-annual-return'),
      compoundFrequency: document.getElementById('compound-frequency'),
      inflationRate: document.getElementById('investment-inflation-rate'),
      resultsContainer: document.getElementById('investment-results'),
      chartCtx: document.getElementById('investment-chart')?.getContext('2d'),
      tableBody: document.querySelector('#investment-table tbody')
    };
  }

  initEvents() {
    if (this.elements.calculateBtn) {
      this.elements.calculateBtn.addEventListener('click', () => this.calculate());
    }
    
    const inputs = [
      this.elements.initialInvestment,
      this.elements.monthlyContribution,
      this.elements.yearsToGrow,
      this.elements.annualReturn,
      this.elements.compoundFrequency,
      this.elements.inflationRate
    ];
    
    inputs.forEach(input => {
      if (input) input.addEventListener('input', () => this.calculate());
    });
  }

  calculate() {
    const initialInvestment = this.getInputValue('initial-investment');
    const monthlyContribution = this.getInputValue('investment-monthly-contribution');
    const yearsToGrow = this.getInputValue('years-to-grow');
    const annualReturn = this.getInputValue('investment-annual-return') / 100;
    const compoundFrequency = this.getInputValue('compound-frequency');
    const inflationRate = this.getInputValue('investment-inflation-rate') / 100;

    // Calculate real return rate (adjusted for inflation)
    const realReturnRate = (1 + annualReturn) / (1 + inflationRate) - 1;

    // Calculate compound periods
    const periodsPerYear = this.getPeriodsPerYear(compoundFrequency);
    const totalPeriods = yearsToGrow * periodsPerYear;
    const periodicRate = realReturnRate / periodsPerYear;
    const periodicContribution = monthlyContribution * (12 / periodsPerYear);

    // Calculate future value
    let balance = initialInvestment;
    let totalContributions = initialInvestment;
    const yearlyData = [];
    const monthlyData = [];

    for (let year = 1; year <= yearsToGrow; year++) {
      let yearlyContribution = 0;
      let yearlyInterest = 0;

      for (let period = 1; period <= periodsPerYear; period++) {
        const interest = balance * periodicRate;
        balance += interest + periodicContribution;
        totalContributions += periodicContribution;
        yearlyContribution += periodicContribution;
        yearlyInterest += interest;

        // Store monthly data for detailed chart
        if (periodsPerYear === 12) {
          monthlyData.push({
            year: year + (period / periodsPerYear) - (1 / periodsPerYear),
            balance
          });
        }
      }

      yearlyData.push({
        year,
        balance,
        contribution: yearlyContribution,
        interest: yearlyInterest
      });
    }

    const totalInterest = balance - totalContributions;

    // Update results
    this.updateResults({
      finalBalance: balance,
      totalContributions,
      totalInterest,
      inflationAdjustedBalance: balance / Math.pow(1 + inflationRate, yearsToGrow)
    });

    this.generateChart(yearlyData, monthlyData);
    this.generateTable(yearlyData);
  }

  getPeriodsPerYear(frequency) {
    switch (frequency) {
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'annually': return 1;
      default: return 12;
    }
  }

  updateResults(results) {
    const resultsHTML = `
      <div class="result-item">
        <span class="result-label">Future Value:</span>
        <span class="result-value">${this.formatCurrency(results.finalBalance)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Total Contributions:</span>
        <span class="result-value">${this.formatCurrency(results.totalContributions)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Total Interest Earned:</span>
        <span class="result-value">${this.formatCurrency(results.totalInterest)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Inflation-Adjusted Value:</span>
        <span class="result-value">${this.formatCurrency(results.inflationAdjustedBalance)}</span>
      </div>
    `;

    if (this.elements.resultsContainer) {
      this.elements.resultsContainer.innerHTML = resultsHTML;
    }
  }

  generateChart(yearlyData, monthlyData) {
    if (!this.elements.chartCtx) return;

    if (this.chart) this.chart.destroy();

    const useMonthlyData = monthlyData.length > 0 && yearlyData.length > 10;
    const chartData = useMonthlyData ? monthlyData : yearlyData;

    this.chart = new Chart(this.elements.chartCtx, {
      type: 'line',
      data: {
        labels: chartData.map(item => item.year),
        datasets: [{
          label: 'Investment Growth',
          data: chartData.map(item => item.balance),
          borderColor: '#27ae60',
          backgroundColor: 'rgba(39, 174, 96, 0.1)',
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
                return `Year ${context.label}: ${this.formatCurrency(context.raw)}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Years'
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

  generateTable(data) {
    if (!this.elements.tableBody) return;

    let html = '';
    data.forEach(item => {
      html += `
        <tr>
          <td>${item.year}</td>
          <td>${this.formatCurrency(item.balance)}</td>
          <td>${this.formatCurrency(item.contribution)}</td>
          <td>${this.formatCurrency(item.interest)}</td>
        </tr>
      `;
    });

    this.elements.tableBody.innerHTML = html;
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
  if (document.getElementById('investment-calculator')) {
    new InvestmentCalculator();
  }
});