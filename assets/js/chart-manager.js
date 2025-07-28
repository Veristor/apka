/**
 * Enspirion Dashboard - Chart Manager
 * Zarządzanie wykresami z użyciem Chart.js
 * 
 * @class ChartManager
 * @description Centralne zarządzanie wszystkimi wykresami w aplikacji
 */

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.isInitialized = false;
        
        // Domyślne opcje dla wszystkich wykresów
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'Segoe UI', sans-serif"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    titleFont: { size: 14, weight: 'normal' },
                    bodyFont: { size: 13 },
                    padding: 12,
                    displayColors: true,
                    cornerRadius: 8
                }
            }
        };
        
        console.log('📊 Chart Manager initialized');
    }

    /**
     * Initialize all charts
     */
    async initializeCharts() {
        try {
            console.log('📊 Starting chart initialization...');
            
            // Ensure Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js not loaded, loading dynamically...');
                await this.loadChartJS();
            }

            // Register Chart.js defaults
            this.registerChartDefaults();

            // Initialize individual charts
            this.createGenerationForecastChart();
            this.createRiskHeatmap();
            this.createPVDistributionChart();
            this.createConstraintsDisplay();
            this.createRiskAssessmentChart();
            this.createForecastChart();
            this.isInitialized = true;
            console.log('✅ Charts initialized. Active charts:', Array.from(this.charts.keys()));
            
        } catch (error) {
            console.error('❌ Chart initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load Chart.js dynamically if not present
     */
    async loadChartJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Register Chart.js default configuration
     */
    registerChartDefaults() {
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.color = '#1f2937';
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
    }

    // ========================================
    // CHART 1: GENERATION FORECAST (STACKPLOT)
    // ========================================

    /**
     * Create Generation Forecast Chart
     */
    createGenerationForecastChart() {
        const canvas = document.getElementById('generation-forecast-chart');
        if (!canvas) {
            console.warn('Generation forecast chart canvas not found');
            return;
        }

        this.destroyChart('generation-forecast');
        
        const config = {
            type: 'line',
            data: {
                labels: [],
                datasets: this.getGenerationForecastDatasets()
            },
            options: this.getGenerationForecastOptions()
        };

        const chart = new Chart(canvas.getContext('2d'), config);
        this.charts.set('generation-forecast', chart);
    }

    /**
     * Get Generation Forecast datasets configuration
     */
    getGenerationForecastDatasets() {
        return [
            {
            label: 'JW RB (zak.)',
            data: [],
            backgroundColor: 'rgba(173, 216, 230, 0.4)', // Zmniejszona przezroczystość
            borderColor: 'rgba(173, 216, 230, 1)',
            borderWidth: 1,
            fill: true, // Zmiana z 'origin' na true
            order: 5
        },
        {
            label: 'Spoza RB (JGa+JGO)',
            data: [],
            backgroundColor: 'rgba(128, 128, 128, 0.3)', // Zmniejszona przezroczystość
            borderColor: 'rgba(128, 128, 128, 1)',
            borderWidth: 1,
            fill: true, // Zmiana z '-1' na true
            order: 4
        },
        {
            label: 'Generacja PV',
            data: [],
            backgroundColor: 'rgba(255, 204, 0, 0.3)', // Zmniejszona przezroczystość
            borderColor: 'rgba(255, 204, 0, 1)',
            borderWidth: 1,
            fill: true, // Zmiana z '-1' na true
            order: 2
        },
        {
            label: 'Generacja wiatrowa',
            data: [],
            backgroundColor: 'rgba(0, 255, 127, 0.4)', // Zmniejszona przezroczystość
            borderColor: 'rgba(0, 255, 127, 1)',
            borderWidth: 1,
            fill: true, // Zmiana z '-1' na true
            order: 1
        },
        {
            label: 'Zapotrzebowanie KSE',
            data: [],
            borderColor: 'rgba(255, 0, 0, 1)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 6,
            order: 0,
            borderDash: [0, 0] // Usuń kreskowanie
        }
    ];
}

    /**
     * Get Generation Forecast chart options
     */
    getGenerationForecastOptions() {
    return {
        ...this.defaultOptions,
        plugins: {
            ...this.defaultOptions.plugins,
            title: {
                display: false
            },
            tooltip: {
                ...this.defaultOptions.plugins.tooltip,
                callbacks: {
                    title: (tooltipItems) => `Czas: ${tooltipItems[0].label}`,
                    label: (context) => {
                        let label = context.dataset.label + ': ';
                        const value = context.parsed.y;
                        label += value.toLocaleString('pl-PL') + ' MW';
                        
                        // Add percentage for renewable sources
                        if (context.dataset.label === 'Generacja PV' || 
                            context.dataset.label === 'Generacja wiatrowa') {
                            const demandDataset = context.chart.data.datasets.find(d => 
                                d.label === 'Zapotrzebowanie KSE'
                            );
                            if (demandDataset) {
                                const demandValue = demandDataset.data[context.dataIndex];
                                const percentage = (value / demandValue * 100).toFixed(1);
                                label += ` (${percentage}%)`;
                            }
                        }
                        return label;
                    },
                    footer: (tooltipItems) => {
                        let sum = 0;
                        tooltipItems.forEach(item => {
                            if (item.dataset.label !== 'Zapotrzebowanie KSE') {
                                sum += item.parsed.y;
                            }
                        });
                        return `Suma generacji: ${sum.toLocaleString('pl-PL')} MW`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    font: { size: 10 },
                    maxRotation: 45,
                    minRotation: 45,
                    autoSkip: false, // Nie pomijaj etykiet
                    maxTicksLimit: 96, // Zwiększ limit dla 15-minutowych interwałów
                    callback: function(value, index, ticks) {
                        // Pokaż co godzinę (co 4 punkty dla 15-minutowych danych)
                        if (index % 4 === 0) {
                            return this.getLabelForValue(value);
                        }
                        return '';
                    }
                }
            },
            y: {
                beginAtZero: true,
                stacked: false, // WAŻNE: wyłącz stacking
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    font: { size: 11 },
                    callback: (value) => {
                        if (value >= 1000) {
                            return (value / 1000).toFixed(0) + ' GW';
                        }
                        return value.toLocaleString('pl-PL') + ' MW';
                    }
                },
                title: {
                    display: true,
                    text: 'Moc [MW]',
                    font: { size: 12, weight: 'normal' }
                }
            }
        }
    };
}
    /**
     * Update Generation Forecast Chart
     */
    updateGenerationForecastChart(data) {
        const chart = this.charts.get('generation-forecast');
        if (!chart) return;

        // Update chart data
        chart.data.labels = data.map(d => d.time);
        chart.data.datasets[0].data = data.map(d => d.gen_rb || 0);
        chart.data.datasets[1].data = data.map(d => d.gen_spoza_rb || 0);
        chart.data.datasets[2].data = data.map(d => d.gen_fv || 0);
        chart.data.datasets[3].data = data.map(d => d.gen_wi || 0);
        chart.data.datasets[4].data = data.map(d => d.demand || 0);

        chart.update('none');
    }

    // ========================================
    // CHART 2: RISK HEATMAP
    // ========================================

    /**
     * Create Risk Heatmap
     */
    createRiskHeatmap() {
        const container = document.getElementById('risk-heatmap');
        if (!container) {
            console.warn('Risk heatmap container not found');
            return;
        }

        container.innerHTML = '';
        
        // Create grid structure
        const days = 7;
        const hours = 24;
        
        for (let day = 0; day < days; day++) {
            for (let hour = 0; hour < hours; hour++) {
                const cell = document.createElement('div');
                cell.className = 'risk-cell';
                cell.dataset.day = day;
                cell.dataset.hour = hour;
                cell.title = `Dzień ${day + 1}, Godz ${hour}:00`;
                container.appendChild(cell);
            }
        }
    }

   /**
 * Update Risk Heatmap z nowym systemem scoringowym
 */
updateRiskHeatmap(riskData) {
    // Zmień ID na właściwy
    const container = document.getElementById('risk-heatmap-grid');
    if (!container) {
        console.error('Nie znaleziono kontenera risk-heatmap-grid');
        return;
    }

    // Upewnij się, że risk scorer jest zainicjalizowany
    if (!this.riskScorer && window.RedispatchRiskScorer) {
        this.riskScorer = new window.RedispatchRiskScorer();
    }

    const cells = container.querySelectorAll('.risk-cell');
    console.log('Found risk cells:', cells.length); // Debug
    
    // Definicja dni tygodnia
    const days = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
    
    // Jeśli mamy risk scorer i dane, użyj ich
    if (this.riskScorer && this.currentData) {
        cells.forEach((cell, index) => {
            const dayIndex = Math.floor(index / 24);
            const hourIndex = index % 24;
            
            // Przygotuj dane dla scorera
            const scoreData = {
                hour: hourIndex,
                dayOfWeek: dayIndex === 6 ? 0 : dayIndex + 1,
                systemLoad: this.currentData.systemLoad?.[hourIndex]?.load || 20000,
                pvGeneration: this.currentData.pvGeneration?.[hourIndex]?.totalPower || 0,
                windGeneration: this.currentData.windGeneration?.[hourIndex]?.totalPower || 0,
                baseloadGeneration: this.currentData.fullGenerationData?.[hourIndex * 4]?.gen_rb || 10000,
                availableCapacity: 25000,
                pvGradient: 0,
                windGradient: 0
            };
            
            // Oblicz ryzyko
            const risk = this.riskScorer.calculateRiskScore(scoreData);
            
            // Ustaw klasę i wartość
            cell.className = `risk-cell risk-${risk.riskLevel}`;
            cell.textContent = risk.totalScore;
            cell.title = `${days[dayIndex]} ${hourIndex}:00 - Ryzyko: ${risk.totalScore}% (${risk.riskLevel})`;
        });
    } else {
        console.warn('Risk scorer or data not available, using fallback');
        // Fallback - użyj mockowych danych
        cells.forEach((cell, index) => {
            const dayIndex = Math.floor(index / 24);
            const hourIndex = index % 24;
            const mockRisk = Math.floor(Math.random() * 100);
            const riskLevel = mockRisk < 25 ? 'low' : mockRisk < 50 ? 'medium' : mockRisk < 75 ? 'high' : 'critical';
            
            cell.className = `risk-cell risk-${riskLevel}`;
            cell.textContent = mockRisk;
            cell.title = `${days[dayIndex]} ${hourIndex}:00 - Ryzyko: ${mockRisk}%`;
        });
    }
}

// Dodaj metodę do przechowywania danych
setCurrentData(data) {
    this.currentData = data;
}

    // ========================================
    // CHART 3: PV DISTRIBUTION
    // ========================================

    /**
     * Create PV Distribution Chart
     */
    createPVDistributionChart() {
        const canvas = document.getElementById('pv-distribution-chart');
        if (!canvas) {
            console.warn('PV distribution chart canvas not found');
            return;
        }

        this.destroyChart('pv-distribution');
        
        const config = {
            type: 'bar',
            data: {
                labels: [],
                datasets: this.getPVDistributionDatasets()
            },
            options: this.getPVDistributionOptions()
        };

        const chart = new Chart(canvas.getContext('2d'), config);
        this.charts.set('pv-distribution', chart);
        
        // Setup view toggle
        this.setupPVDistributionViewToggle();
    }

    /**
     * Get PV Distribution datasets configuration
     */
    getPVDistributionDatasets() {
        return [
            {
                label: 'Generacja PV [MW]',
                data: [],
                backgroundColor: 'rgba(255, 152, 0, 0.7)',
                borderColor: 'rgba(255, 152, 0, 1)',
                borderWidth: 1,
                yAxisID: 'y',
                order: 2,
                type: 'bar'
            },
            {
                label: '% użycia PV w KSE',
                data: [],
                type: 'line',
                borderColor: 'rgba(33, 150, 243, 1)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                pointHoverRadius: 4,
                yAxisID: 'y1',
                order: 1
            },
            {
                label: 'Portfolio PV',
                data: [],
                type: 'line',
                borderColor: 'rgba(76, 175, 80, 1)',
                backgroundColor: 'transparent',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 5,
                yAxisID: 'y',
                order: 0,
                hidden: false
            }
        ];
    }

    /**
     * Get PV Distribution chart options
     */
    getPVDistributionOptions() {
        return {
            ...this.defaultOptions,
            plugins: {
                ...this.defaultOptions.plugins,
                title: { display: false },
                tooltip: {
                    ...this.defaultOptions.plugins.tooltip,
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label + ': ';
                            if (context.datasetIndex === 1) { // % usage
                                label += context.parsed.y.toFixed(2) + '%';
                            } else { // MW
                                label += context.parsed.y.toFixed(1) + ' MW';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 24
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 11 },
                        color: 'rgba(255, 152, 0, 1)',
                        callback: (value) => value.toFixed(0) + ' MW'
                    },
                    title: {
                        display: true,
                        text: 'Generacja PV [MW]',
                        color: 'rgba(255, 152, 0, 1)',
                        font: { size: 12 }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    suggestedMax: 120,
                    grid: { drawOnChartArea: false },
                    ticks: {
                        font: { size: 11 },
                        color: 'rgba(33, 150, 243, 1)',
                        callback: (value) => value + '%'
                    },
                    title: {
                        display: true,
                        text: '% użycia PV w KSE',
                        color: 'rgba(33, 150, 243, 1)',
                        font: { size: 12 }
                    }
                }
            }
        };
    }

    /**
     * Setup PV Distribution view toggle
     */
    setupPVDistributionViewToggle() {
        const container = document.querySelector('.pv-distribution-chart');
        if (!container) return;
        
        const buttons = container.querySelectorAll('.chart-btn[data-view]');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updatePVDistributionView(btn.dataset.view);
            });
        });
    }

    /**
     * Update PV Distribution view
     */
    updatePVDistributionView(view) {
        const chart = this.charts.get('pv-distribution');
        if (!chart) return;
        
        if (view === 'kse-overview') {
            chart.data.datasets[0].hidden = false; // PV generation bars
            chart.data.datasets[1].hidden = false; // % usage line
            chart.data.datasets[2].hidden = true;  // Portfolio line
            chart.options.scales.y.title.text = 'Generacja PV [MW]';
        } else if (view === 'portfolio-analysis') {
            chart.data.datasets[0].hidden = true;  // Hide PV generation bars
            chart.data.datasets[1].hidden = false; // Show % usage line
            chart.data.datasets[2].hidden = false; // Show portfolio line
            chart.options.scales.y.title.text = 'Generacja Portfolio [MW]';
        }
        
        chart.update('none');
    }

    /**
     * Update PV Distribution Chart
     */
    updatePVDistributionChart(data) {
        const chart = this.charts.get('pv-distribution');
        if (!chart) return;

        // Generate time labels
        const labels = [];
        for (let i = 0; i < data.pvGeneration.length; i++) {
            if (data.timestamps && data.timestamps[i]) {
                const time = new Date(data.timestamps[i]);
                labels.push(time.toLocaleTimeString('pl-PL', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }));
            } else {
                // Fallback for 15-minute intervals
                const hour = Math.floor(i / 4);
                const minute = (i % 4) * 15;
                labels.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
            }
        }
        
        chart.data.labels = labels;
        chart.data.datasets[0].data = data.pvGeneration || [];
        chart.data.datasets[1].data = data.pvPercentage || [];
        chart.data.datasets[2].data = data.portfolioGeneration || [];
        
        chart.update('none');
        
        // Update statistics
        this.updatePVStatistics(data);
    }

    /**
     * Update PV statistics panel
     */
    updatePVStatistics(data) {
        const now = new Date();
        
        // Find current or latest data point
        let currentIndex = data.timestamps?.length - 1 || 0;
        if (data.timestamps) {
            const tempIndex = data.timestamps.findIndex(ts => 
                Math.abs(new Date(ts).getTime() - now.getTime()) < 10 * 60 * 1000
            );
            if (tempIndex !== -1) currentIndex = tempIndex;
        }

        // Update UI elements
        const updates = {
            'current-pv-gen': `${(data.pvGeneration[currentIndex] || 0).toFixed(0)} MW`,
            'current-pv-share': `${(data.pvPercentage[currentIndex] || 0).toFixed(2)}%`,
            'portfolio-gen-calc': `${(data.portfolioGeneration[currentIndex] || 0).toFixed(1)} MW`,
            'avg-pv-share': `${this.calculateAverage(data.pvPercentage).toFixed(2)}%`
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    // ========================================
    // CHART 4: CONSTRAINTS DISPLAY
    // ========================================

    /**
     * Create Constraints Display
     */
    createConstraintsDisplay() {
        const container = document.getElementById('constraints-list');
        if (!container) {
            console.warn('Constraints list container not found');
            return;
        }
        
        // Initialize empty display
        this.updateConstraintsDisplay([]);
    }

    /**
     * Update Constraints Display
     */
    updateConstraintsDisplay(constraints) {
        const container = document.getElementById('constraints-list');
        if (!container) return;

        container.innerHTML = '';
        
        if (!constraints || constraints.length === 0) {
            container.innerHTML = `
                <div class="no-constraints">
                    <span class="icon">✅</span>
                    <p>Brak aktywnych ograniczeń</p>
                </div>
            `;
            this.updateConstraintsSummary(constraints);
            return;
        }

        // Sort by severity
        const sortedConstraints = [...constraints].sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
        });

        // Create constraint items
        sortedConstraints.forEach(constraint => {
            const item = this.createConstraintItem(constraint);
            container.appendChild(item);
        });

        this.updateConstraintsSummary(constraints);
    }

    /**
     * Create single constraint item
     */
    createConstraintItem(constraint) {
        const item = document.createElement('div');
        item.className = `constraint-item severity-${constraint.severity || 'low'}`;
        
        const fromTime = new Date(constraint.fromTime);
        const toTime = new Date(constraint.toTime);
        
        item.innerHTML = `
            <div class="constraint-header">
                <span class="constraint-area">${constraint.area || 'Nieznany'}</span>
                <span class="constraint-severity">${this.getSeverityLabel(constraint.severity)}</span>
            </div>
            <div class="constraint-details">
                <div class="constraint-resource">${constraint.resourceName || 'Zasób nieznany'}</div>
                <div class="constraint-time">
                    ${fromTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} - 
                    ${toTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div class="constraint-power">
                    Ograniczenie: ${constraint.minPower} - ${constraint.maxPower} MW
                </div>
            </div>
        `;
        
        return item;
    }

    /**
     * Update constraints summary
     */
    updateConstraintsSummary(constraints) {
        const summaryData = {
            total: constraints.length,
            critical: constraints.filter(c => c.severity === 'critical').length,
            affectedPower: constraints.reduce((sum, c) => 
                sum + (c.maxPower - c.minPower), 0
            ),
            avgDuration: this.calculateAverageDuration(constraints)
        };

        const updates = {
            'total-constraints': summaryData.total,
            'critical-constraints': summaryData.critical,
            'affected-power': `${summaryData.affectedPower.toFixed(0)} MW`,
            'constraint-duration': `${summaryData.avgDuration} min`
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
/**
 * Create Risk Assessment Chart
 */
createRiskAssessmentChart() {
    const container = document.getElementById('risk-heatmap-grid');
    if (!container) {
        console.warn('Risk assessment container not found');
        return;
    }

    container.innerHTML = '';
    
    // Inicjalizuj risk scorer
    if (!this.riskScorer && window.RedispatchRiskScorer) {
        this.riskScorer = new window.RedispatchRiskScorer();
    }
    
    // Nagłówek - pusta komórka w rogu
    const corner = document.createElement('div');
    corner.className = 'risk-corner';
    container.appendChild(corner);
    
    // Etykiety godzin
    for (let hour = 0; hour < 24; hour++) {
        const label = document.createElement('div');
        label.className = 'risk-hour-label';
        label.textContent = hour.toString().padStart(2, '0');
        container.appendChild(label);
    }
    
    // Dni tygodnia
    const days = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
    const today = new Date();
    const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1;
    
    for (let day = 0; day < 7; day++) {
        // Etykieta dnia
        const dayLabel = document.createElement('div');
        dayLabel.className = 'risk-day-label';
        
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() + (day - currentDay));
        
        dayLabel.textContent = `${days[day]} ${dayDate.getDate()}.${(dayDate.getMonth() + 1).toString().padStart(2, '0')}`;
        container.appendChild(dayLabel);
        
        // Komórki godzin
        for (let hour = 0; hour < 24; hour++) {
            const cell = document.createElement('div');
            cell.className = 'risk-cell';
            cell.dataset.day = day;
            cell.dataset.hour = hour;
            
            // Oznacz aktualną godzinę
            if (day === currentDay && hour === today.getHours()) {
                cell.classList.add('current');
            }
            
            // Domyślna wartość
            cell.textContent = '0';
            
            cell.addEventListener('click', () => this.showRiskDetails(day, hour));
            container.appendChild(cell);
        }
    }
    
    console.log('✅ Risk assessment chart created');
}
/**
 * Update Risk Assessment Chart
 */
updateRiskAssessmentChart(data) {
    if (!this.riskScorer && window.RedispatchRiskScorer) {
        this.riskScorer = new window.RedispatchRiskScorer();
    }
    
    if (!this.riskScorer) {
        console.warn('Risk scorer not initialized');
        return;
    }
    
    const cells = document.querySelectorAll('#risk-heatmap-grid .risk-cell');
    const days = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
    
    cells.forEach(cell => {
        const day = parseInt(cell.dataset.day);
        const hour = parseInt(cell.dataset.hour);
        
        // Przygotuj dane dla scorera
        const scoreData = {
            hour: hour,
            dayOfWeek: day === 6 ? 0 : day + 1,
            systemLoad: data.systemLoad?.[hour]?.load || 20000,
            pvGeneration: data.pvGeneration?.[hour]?.totalPower || 0,
            windGeneration: data.windGeneration?.[hour]?.totalPower || 0,
            baseloadGeneration: data.fullGenerationData?.[hour * 4]?.gen_rb || 10000,
            availableCapacity: 25000,
            pvGradient: 0,
            windGradient: 0
        };
        
        // Oblicz ryzyko
        const risk = this.riskScorer.calculateRiskScore(scoreData);
        
        // Zachowaj klasę current jeśli była
        const wasCurrent = cell.classList.contains('current');
        
        // Ustaw klasę i wartość
        cell.className = `risk-cell risk-${risk.riskLevel}`;
        if (wasCurrent) {
            cell.classList.add('current');
        }
        
        cell.textContent = risk.totalScore;
        cell.title = `${days[day]} ${hour}:00 - Ryzyko: ${risk.totalScore}% (${risk.riskLevel})`;
    });
    
    console.log('✅ Risk assessment chart updated');
}

/**
 * Show risk details
 */
showRiskDetails(day, hour) {
    const days = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
    
    // Znajdź komórkę
    const cell = document.querySelector(`[data-day="${day}"][data-hour="${hour}"]`);
    if (!cell) return;
    
    // Pobierz wartość ryzyka
    const riskScore = parseInt(cell.textContent) || 0;
    const riskLevel = cell.className.match(/risk-(\w+)/)?.[1] || 'unknown';
    
    // Aktualizuj panel szczegółów
    const scoreDisplay = document.getElementById('risk-score-display');
    if (scoreDisplay) {
        scoreDisplay.querySelector('.total-score').textContent = riskScore;
        scoreDisplay.querySelector('.risk-level').textContent = 
            riskLevel === 'low' ? 'Niskie ryzyko' :
            riskLevel === 'medium' ? 'Średnie ryzyko' :
            riskLevel === 'high' ? 'Wysokie ryzyko' :
            riskLevel === 'critical' ? 'Krytyczne ryzyko' : 'Nieznane';
    }
    
    // Aktualizuj komponenty ryzyka
    const componentsContainer = document.getElementById('risk-components');
    if (componentsContainer && this.riskScorer && this.currentData) {
        const scoreData = {
            hour: hour,
            dayOfWeek: day === 6 ? 0 : day + 1,
            systemLoad: this.currentData.systemLoad?.[hour]?.load || 20000,
            pvGeneration: this.currentData.pvGeneration?.[hour]?.totalPower || 0,
            windGeneration: this.currentData.windGeneration?.[hour]?.totalPower || 0,
            baseloadGeneration: this.currentData.fullGenerationData?.[hour * 4]?.gen_rb || 10000,
            availableCapacity: 25000,
            pvGradient: 0,
            windGradient: 0
        };
        
        const risk = this.riskScorer.calculateRiskScore(scoreData);
        
        componentsContainer.innerHTML = Object.entries(risk.components).map(([key, value]) => `
            <div class="risk-component">
                <div class="component-name">${this.getComponentName(key)}</div>
                <div class="component-score">${value}</div>
                <div class="component-bar">
                    <div class="component-fill risk-${this.getRiskLevel(value)}" style="width: ${value}%"></div>
                </div>
            </div>
        `).join('');
    }
    
    console.log(`Risk details for ${days[day]} ${hour}:00 - Score: ${riskScore}%`);
}

getComponentName(key) {
    const names = {
        powerReserve: 'Rezerwa mocy',
        renewableShare: 'Udział OZE',
        baseloadGeneration: 'Generacja bazowa',
        generationGradient: 'Gradient generacji',
        peakHours: 'Godziny szczytowe',
        historicalPattern: 'Wzorce historyczne'
    };
    return names[key] || key;
}

getRiskLevel(score) {
    if (score <= 25) return 'low';
    if (score <= 50) return 'medium';
    if (score <= 75) return 'high';
    return 'critical';
}
    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Destroy chart by ID
     */
    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
            this.charts.delete(chartId);
        }
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        this.charts.forEach((chart, id) => {
            this.destroyChart(id);
        });
    }

    /**
     * Get chart by ID
     */
    getChart(chartId) {
        return this.charts.get(chartId);
    }

    /**
     * Export chart as image
     */
    exportChartAsImage(chartId, filename = 'chart.png') {
        const chart = this.charts.get(chartId);
        if (!chart) return;
        
        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
    }

    /**
     * Calculate average of array
     */
    calculateAverage(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    /**
     * Calculate average duration of constraints
     */
    calculateAverageDuration(constraints) {
        if (!constraints || constraints.length === 0) return 0;
        
        const totalDuration = constraints.reduce((sum, c) => {
            const duration = (new Date(c.toTime) - new Date(c.fromTime)) / (1000 * 60);
            return sum + duration;
        }, 0);
        
        return Math.round(totalDuration / constraints.length);
    }

    /**
     * Get severity label
     */
    getSeverityLabel(severity) {
        const labels = {
            low: 'Niskie',
            medium: 'Średnie',
            high: 'Wysokie',
            critical: 'Krytyczne'
        };
        return labels[severity] || 'Nieznane';
    }

    /**
     * Check if charts are initialized
     */
    isReady() {
        return this.isInitialized && this.charts.size > 0;
    }

/**
 * Create Forecast Chart for Analysis section
 */
createForecastChart() {
    const canvas = document.getElementById('forecast-chart');
    if (!canvas) {
        console.warn('Forecast chart canvas not found');
        return;
    }

    this.destroyChart('forecast');
    
    const config = {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Prognoza PV',
                    data: [],
                    borderColor: 'rgba(255, 204, 0, 1)',
                    backgroundColor: 'rgba(255, 204, 0, 0.1)',
                    borderWidth: 2,
                    tension: 0.2,
                    yAxisID: 'y'
                },
                {
                    label: 'Prognoza Wiatr',
                    data: [],
                    borderColor: 'rgba(0, 255, 127, 1)',
                    backgroundColor: 'rgba(0, 255, 127, 0.1)',
                    borderWidth: 2,
                    tension: 0.2,
                    yAxisID: 'y'
                },
                {
                    label: 'Prognoza Zapotrzebowania',
                    data: [],
                    borderColor: 'rgba(255, 0, 0, 1)',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    tension: 0.2,
                    yAxisID: 'y'
                },
                {
                    label: '% udziału OZE',
                    data: [],
                    borderColor: 'rgba(33, 150, 243, 1)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    type: 'line',
                    yAxisID: 'y1',
                    pointRadius: 0
                }
            ]
        },
        options: {
            ...this.defaultOptions,
            plugins: {
                ...this.defaultOptions.plugins,
                title: {
                    display: true,
                    text: 'Prognoza generacji OZE i zapotrzebowania',
                    font: { size: 16 }
                },
                tooltip: {
                    ...this.defaultOptions.plugins.tooltip,
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            if (label.includes('%')) {
                                return `${label}: ${value.toFixed(1)}%`;
                            }
                            return `${label}: ${value.toFixed(0)} MW`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    
                    title: {
                        display: true,
                        text: 'Data i godzina'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Moc [MW]'
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Udział OZE [%]'
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    };

    const chart = new Chart(canvas.getContext('2d'), config);
    this.charts.set('forecast', chart);
}

/**
 * Update Forecast Chart
 */
updateForecastChart(data) {
    const chart = this.charts.get('forecast');
    if (!chart) {
        console.warn('Forecast chart not initialized');
        return;
    }

    // Przygotuj dane
    const labels = data.map(d => d.timestamp);
    const pvData = data.map(d => d.pvForecast);
    const windData = data.map(d => d.windForecast);
    const demandData = data.map(d => d.demandForecast);
    const renewableShareData = data.map(d => d.renewableShare);

    // Aktualizuj wykres
    chart.data.labels = labels;
    chart.data.datasets[0].data = pvData;
    chart.data.datasets[1].data = windData;
    chart.data.datasets[2].data = demandData;
    chart.data.datasets[3].data = renewableShareData;

    chart.update('none');

    // Oblicz statystyki
    this.updateForecastStatistics(data);
}

/**
 * Update forecast statistics
 */
updateForecastStatistics(data) {
    if (!data || data.length === 0) return;

    // Oblicz sumy energii (MWh -> GWh)
    const totalPV = data.reduce((sum, d) => sum + d.pvForecast, 0) / 1000;
    const totalWind = data.reduce((sum, d) => sum + d.windForecast, 0) / 1000;
    
    // Średni udział OZE
    const avgRenewable = data.reduce((sum, d) => sum + d.renewableShare, 0) / data.length;
    
    // Szczyt zapotrzebowania
    const peakDemand = Math.max(...data.map(d => d.demandForecast));

    // Aktualizuj elementy UI
    const updates = {
        'forecast-total-pv': `${totalPV.toFixed(2)} GWh`,
        'forecast-total-wind': `${totalWind.toFixed(2)} GWh`,
        'forecast-avg-renewable': `${avgRenewable.toFixed(1)}%`,
        'forecast-peak-demand': `${peakDemand.toFixed(0)} MW`
    };

    Object.entries(updates).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

}


// ========================================
// GLOBAL INSTANCE & INITIALIZATION
// ========================================

// Create global chart manager instance
window.ChartManager = new ChartManager();

// Export for modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}

// ========================================
// GLOBAL UTILITY FUNCTIONS
// ========================================

/**
 * Global function to render forecast chart (for external use)
 */
window.renderForecastKSE = function(data, containerId = 'generation-forecast-chart') {
    if (!window.ChartManager.isReady()) {
        console.warn('ChartManager not ready, initializing...');
        window.ChartManager.initializeCharts().then(() => {
            window.ChartManager.updateGenerationForecastChart(data);
        });
        return;
    }
    
    window.ChartManager.updateGenerationForecastChart(data);
};

console.log('✅ Chart Manager loaded successfully');

