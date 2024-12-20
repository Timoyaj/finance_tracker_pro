// charts.js
class FinanceCharts {
    constructor() {
        this.charts = {};
        this.initializeCharts();
    }

    async initializeCharts() {
        await this.loadChartData();
        this.createSpendingTrendChart();
        this.createCategoryDistributionChart();
    }

    async loadChartData() {
        try {
            const response = await fetch('/transactions');
            const data = await response.json();
            if (data.success) {
                this.processChartData(data.transactions);
            }
        } catch (error) {
            console.error('Failed to load chart data:', error);
        }
    }

    processChartData(transactions) {
        // Process data for spending trend
        const monthlyData = {};
        const categoryData = {};

        transactions.forEach(transaction => {
            // Monthly spending trend
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey] += transaction.amount;

            // Category distribution
            if (!categoryData[transaction.category]) {
                categoryData[transaction.category] = 0;
            }
            categoryData[transaction.category] += Math.abs(transaction.amount);
        });

        this.monthlyData = monthlyData;
        this.categoryData = categoryData;
    }

    createSpendingTrendChart() {
        const ctx = document.getElementById('spending-trend-chart');
        if (!ctx) return;

        const labels = Object.keys(this.monthlyData).sort();
        const data = labels.map(month => this.monthlyData[month]);

        if (this.charts.spendingTrend) {
            this.charts.spendingTrend.destroy();
        }

        this.charts.spendingTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Spending Trend',
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                // Continuing charts.js
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Monthly Spending Trend'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: localStorage.getItem('currency') || 'USD'
                            }).format(value);
                        }
                    }
                }
            }
        }
    });
}

createCategoryDistributionChart() {
    const ctx = document.getElementById('category-distribution-chart');
    if (!ctx) return;

    const categories = Object.keys(this.categoryData);
    const data = categories.map(category => this.categoryData[category]);

    if (this.charts.categoryDistribution) {
        this.charts.categoryDistribution.destroy();
    }

    this.charts.categoryDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Spending by Category'
                }
            }
        }
    });
}

updateCharts() {
    this.loadChartData().then(() => {
        this.createSpendingTrendChart();
        this.createCategoryDistributionChart();
    });
}
}

// Initialize charts on DOM load
document.addEventListener('DOMContentLoaded', () => {
new FinanceCharts();
});