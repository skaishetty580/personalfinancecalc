class DebtPayoffCalculator {
  constructor() {
    this.debts = [];
    this.initElements();
    this.initEvents();
    this.addDebtRow(); // Start with one debt row
  }

  initElements() {
    this.elements = {
      addDebtBtn: document.getElementById('add-debt'),
      calculateBtn: document.getElementById('calculate-debt'),
      debtsContainer: document.getElementById('debts-container'),
      strategySelect: document.getElementById('payoff-strategy'),
      resultsContainer: document.getElementById('debt-results'),
      chartCtx: document.getElementById('debt-chart')?.getContext('2d'),
      scheduleBody: document.querySelector('#debt-schedule tbody')
    };
  }

  initEvents() {
    if (this.elements.addDebtBtn) {
      this.elements.addDebtBtn.addEventListener('click', () => this.addDebtRow());
    }
    
    if (this.elements.calculateBtn) {
      this.elements.calculateBtn.addEventListener('click', () => this.calculate());
    }
  }

  addDebtRow() {
    const debtId = Date.now();
    const debtRow = document.createElement('div');
    debtRow.className = 'debt-row';
    debtRow.dataset.id = debtId;
    debtRow.innerHTML = `
      <div class="input-row">
        <label>Debt Name</label>
        <input type="text" class="debt-name" placeholder="Credit Card, Loan, etc.">
      </div>
      <div class="input-row">
        <label>Balance ($)</label>
        <input type="number" class="debt-balance" min="0" step="1" value="1000">
      </div>
      <div class="input-row">
        <label>Interest Rate (%)</label>
        <input type="number" class="debt-rate" min="0" max="50" step="0.01" value="15.99">
      </div>
      <div class="input-row">
        <label>Minimum Payment ($)</label>
        <input type="number" class="debt-payment" min="0" step="1" value="25">
      </div>
      <button class="btn-remove-debt" data-id="${debtId}">×</button>
    `;
    
    if (this.elements.debtsContainer) {
      this.elements.debtsContainer.appendChild(debtRow);
      
      // Add event to remove button
      debtRow.querySelector('.btn-remove-debt').addEventListener('click', (e) => {
        this.removeDebtRow(e.target.dataset.id);
      });
    }
  }

  removeDebtRow(id) {
    const row = document.querySelector(`.debt-row[data-id="${id}"]`);
    if (row && this.elements.debtsContainer) {
      this.elements.debtsContainer.removeChild(row);
    }
  }

  calculate() {
    this.collectDebts();
    
    if (this.debts.length === 0) {
      this.showError('Please add at least one debt');
      return;
    }

    const strategy = this.elements.strategySelect ? this.elements.strategySelect.value : 'avalanche';
    const monthlyPayment = this.getInputValue('debt-monthly-payment');
    
    if (!monthlyPayment || monthlyPayment <= 0) {
      this.showError('Please enter a valid monthly payment amount');
      return;
    }

    // Sort debts based on payoff strategy
    this.sortDebts(strategy);

    // Calculate payoff plan
    const payoffPlan = this.calculatePayoffPlan(monthlyPayment);
    
    // Update results
    this.updateResults(payoffPlan);
    this.generateChart(payoffPlan);
    this.generateSchedule(payoffPlan);
  }

  collectDebts() {
    this.debts = [];
    const rows = document.querySelectorAll('.debt-row');
    
    rows.forEach(row => {
      const name = row.querySelector('.debt-name').value || 'Unnamed Debt';
      const balance = parseFloat(row.querySelector('.debt-balance').value) || 0;
      const rate = parseFloat(row.querySelector('.debt-rate').value) / 100 / 12 || 0;
      const minPayment = parseFloat(row.querySelector('.debt-payment').value) || 0;
      
      if (balance > 0) {
        this.debts.push({
          name,
          originalBalance: balance,
          balance,
          rate,
          minPayment,
          interestPaid: 0
        });
      }
    });
  }

  sortDebts(strategy) {
    if (strategy === 'avalanche') {
      // Highest interest rate first
      this.debts.sort((a, b) => b.rate - a.rate);
    } else {
      // Snowball - smallest balance first
      this.debts.sort((a, b) => a.balance - b.balance);
    }
  }

  calculatePayoffPlan(monthlyPayment) {
    const plan = {
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      monthlyBreakdown: [],
      debts: JSON.parse(JSON.stringify(this.debts)) // Deep clone
    };
    
    let remainingPayment = monthlyPayment;
    let allPaid = false;
    
    while (!allPaid && plan.months < 600) { // Limit to 50 years
      allPaid = true;
      let monthlyInterest = 0;
      const monthResult = {
        month: plan.months + 1,
        debts: [],
        payment: 0,
        interest: 0
      };
      
      // Reset remaining payment for new month
      remainingPayment = monthlyPayment;
      
      // Make minimum payments on all debts first
      for (const debt of plan.debts) {
        if (debt.balance > 0) {
          allPaid = false;
          
          // Calculate interest for the month
          const interest = debt.balance * debt.rate;
          monthlyInterest += interest;
          debt.interestPaid += interest;
          debt.balance += interest;
          
          // Make minimum payment or full payment if balance is less
          const payment = Math.min(debt.balance, debt.minPayment);
          debt.balance -= payment;
          monthResult.payment += payment;
          remainingPayment -= payment;
          
          monthResult.debts.push({
            name: debt.name,
            payment,
            balance: debt.balance
          });
        }
      }
      
      // Apply remaining payment to prioritized debts
      if (remainingPayment > 0) {
        for (const debt of plan.debts) {
          if (debt.balance > 0 && remainingPayment > 0) {
            const payment = Math.min(debt.balance, remainingPayment);
            debt.balance -= payment;
            monthResult.payment += payment;
            remainingPayment -= payment;
            
            // Update the debt in monthly breakdown
            const debtInBreakdown = monthResult.debts.find(d => d.name === debt.name);
            if (debtInBreakdown) {
              debtInBreakdown.payment += payment;
              debtInBreakdown.balance = debt.balance;
            }
          }
        }
      }
      
      monthResult.interest = monthlyInterest;
      plan.totalInterest += monthlyInterest;
      plan.totalPaid += monthResult.payment;
      plan.monthlyBreakdown.push(monthResult);
      plan.months++;
    }
    
    return plan;
  }

  updateResults(plan) {
    const years = Math.floor(plan.months / 12);
    const months = plan.months % 12;
    const totalPaid = plan.totalPaid;
    const totalPrincipal = this.debts.reduce((sum, debt) => sum + debt.originalBalance, 0);
    
    const resultsHTML = `
      <div class="result-item">
        <span class="result-label">Time to Payoff:</span>
        <span class="result-value">${years} years, ${months} months</span>
      </div>
      <div class="result-item">
        <span class="result-label">Total Principal:</span>
        <span class="result-value">${this.formatCurrency(totalPrincipal)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Total Interest:</span>
        <span class="result-value">${this.formatCurrency(plan.totalInterest)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Total Paid:</span>
        <span class="result-value">${this.formatCurrency(totalPaid)}</span>
      </div>
    `;
    
    if (this.elements.resultsContainer) {
      this.elements.resultsContainer.innerHTML = resultsHTML;
    }
  }

  generateChart(plan) {
    if (!this.elements.chartCtx) return;

    if (this.chart) this.chart.destroy();

    // Prepare data for chart
    const labels = [];
    const principalData = [];
    const interestData = [];
    
    for (let i = 0; i < plan.months; i += Math.max(1, Math.floor(plan.months / 12))) {
      labels.push(`Month ${i + 1}`);
      
      let principalPaid = 0;
      let interestPaid = 0;
      
      for (let j = 0; j <= i && j < plan.monthlyBreakdown.length; j++) {
        const month = plan.monthlyBreakdown[j];
        principalPaid += month.payment - month.interest;
        interestPaid += month.interest;
      }
      
      principalData.push(principalPaid);
      interestData.push(interestPaid);
    }

    this.chart = new Chart(this.elements.chartCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Principal Paid',
            data: principalData,
            backgroundColor: '#3498db'
          },
          {
            label: 'Interest Paid',
            data: interestData,
            backgroundColor: '#e74c3c'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterBody: (context) => {
                const dataIndex = context[0].dataIndex;
                const principal = principalData[dataIndex];
                const interest = interestData[dataIndex];
                const total = principal + interest;
                const interestPercentage = total > 0 ? (interest / total * 100).toFixed(1) : 0;
                return `Interest: ${interestPercentage}% of total`;
              }
            }
          }
        }
      }
    });
  }

  generateSchedule(plan) {
    if (!this.elements.scheduleBody) return;

    let html = '';
    const showMonths = Math.min(plan.months, 36); // Show first 36 months or less
    
    for (let i = 0; i < showMonths; i++) {
      const month = plan.monthlyBreakdown[i];
      if (!month) break;
      
      html += `
        <tr>
          <td>${month.month}</td>
          <td>${this.formatCurrency(month.payment)}</td>
          <td>${this.formatCurrency(month.interest)}</td>
          <td>
            <ul class="debt-list">
              ${month.debts.map(debt => `
                <li>${debt.name}: ${this.formatCurrency(debt.payment)} (${this.formatCurrency(debt.balance)})</li>
              `).join('')}
            </ul>
          </td>
        </tr>
      `;
    }
    
    // Add final payoff month if not in first 36 months
    if (plan.months > showMonths) {
      const lastMonth = plan.monthlyBreakdown[plan.months - 1];
      html += `
        <tr class="highlight">
          <td>...</td>
          <td colspan="2">${plan.months - showMonths - 1} months omitted</td>
          <td></td>
        </tr>
        <tr class="highlight">
          <td>${lastMonth.month}</td>
          <td>${this.formatCurrency(lastMonth.payment)}</td>
          <td>${this.formatCurrency(lastMonth.interest)}</td>
          <td>
            <ul class="debt-list">
              ${lastMonth.debts.map(debt => `
                <li>${debt.name}: ${this.formatCurrency(debt.payment)} (PAID OFF)</li>
              `).join('')}
            </ul>
          </td>
        </tr>
      `;
    }
    
    this.elements.scheduleBody.innerHTML = html;
  }

  showError(message) {
    if (this.elements.resultsContainer) {
      this.elements.resultsContainer.innerHTML = `
        <div class="error-message">${message}</div>
      `;
    }
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
  if (document.getElementById('debt-calculator')) {
    new DebtPayoffCalculator();
  }
});