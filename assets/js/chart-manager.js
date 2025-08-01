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
        this.pseReservesCache = null;
        this.pseReservesCacheTime = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minut cache
        this.lastChartUpdate = null;
        this.CHART_UPDATE_THROTTLE = 10 * 1000; // 10 sekund między odświeżeniami wykresu
        
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
    // Znajdź metodę getGenerationForecastOptions() i zamień całą sekcję scales na:

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
                    font: { size: 9 },
                    maxRotation: 45,
                    minRotation: 45,
                    autoSkip: true,
                    autoSkipPadding: 3,    // Mniejszy padding = więcej etykiet
                    maxTicksLimit: 48,      // Więcej etykiet (48 zamiast 96)
                    
                    callback: function(value, index, ticks) {
                        // Pobierz etykietę
                        const label = this.getLabelForValue(value);
                        const totalLabels = this.chart.data.labels.length;
                        
                        // Określ co ile pokazywać etykiety
                        let showEvery;
                        if (totalLabels > 672) {        // >7 dni
                            showEvery = 48;              // Co 12h
                        } else if (totalLabels > 192) { // 2-7 dni
                            showEvery = 12;              // Co 3h
                        } else if (totalLabels > 96) {  // 1-2 dni
                            showEvery = 8;               // Co 2h
                        } else {                         // <1 dzień
                            showEvery = 4;               // Co 1h
                        }
                        
                        // Pokaż tylko wybrane etykiety
                        if (index % showEvery !== 0) {
                            return '';
                        }
                        
                        // Formatuj etykietę - USUŃ DŁUGIE CZĘŚCI
                        if (typeof label === 'string') {
                            // Jeśli to format typu "28.07 15:00" - zostaw jak jest
                            if (label.match(/^\d{2}\.\d{2}\s+\d{2}:\d{2}$/)) {
                                return label;
                            }
                            
                            // Jeśli to format typu "15:00" - zostaw jak jest
                            if (label.match(/^\d{2}:\d{2}$/)) {
                                return label;
                            }
                            
                            // Usuń timezone i inne śmieci
                            let cleanLabel = label
                                .replace(/\s*GMT[+-]\d{4}.*$/i, '')  // Usuń GMT+0200 itd
                                .replace(/\s*\(.*?\)/g, '')           // Usuń (Central European...)
                                .trim();
                            
                            // Jeśli zostało coś typu "Mon Jul 28 2025 15:00:00"
                            if (cleanLabel.includes(' ') && cleanLabel.length > 20) {
                                // Spróbuj wyciągnąć godzinę
                                const timeMatch = cleanLabel.match(/(\d{2}):(\d{2})/);
                                if (timeMatch) {
                                    const hour = timeMatch[0];
                                    // Jeśli to północ, dodaj datę
                                    if (hour === '00:00' || hour === '01:00') {
                                        const dateMatch = cleanLabel.match(/(\d{1,2})\s+(\w+)/);
                                        if (dateMatch) {
                                            return dateMatch[0];
                                        }
                                    }
                                    return hour;
                                }
                            }
                            
                            // Ostatnia deska ratunku - weź pierwsze 8 znaków
                            return cleanLabel.substring(0, 8);
                        }
                        
                        return label;
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
    // CHART 4: CONSTRAINTS DISPLAY & PSE RESERVES CHART
    // ========================================

    /**
     * Create Constraints Display
     */
    createConstraintsDisplay() {
        const container = document.getElementById('constraints-list');
        if (container) {
            // Initialize empty display
            this.updateConstraintsDisplay([]);
        }
        
        // Initialize PSE Reserves Chart
        this.createPSEReservesChart();
    }

    /**
     * Create PSE Reserves Chart (similar to plan koordynacyjny bartas)
     */
    createPSEReservesChart() {
        const container = document.getElementById('constraints-chart');
        if (!container) {
            console.warn('Constraints chart container not found');
            return;
        }

        // Clear container and add loading
        container.innerHTML = '<div class="chart-loading"><div class="loading-spinner small"></div><span>Ładowanie danych rezerw PSE...</span></div>';
        
        // Initialize with mock data for now
        setTimeout(() => {
            this.renderPSEReservesChart();
        }, 1000);
    }

    /**
     * Render PSE Reserves Chart using Plotly.js
     */
    async renderPSEReservesChart() {
        const container = document.getElementById('constraints-chart');
        if (!container) return;

        // Load Plotly.js if not available
        if (typeof Plotly === 'undefined') {
            await this.loadPlotly();
        }

        // Fetch real data from PSE API
        const data = await this.fetchPSEReservesData();
        
        // Create traces
        const traces = [
            {
                x: data.times,
                y: data.reserves,
                type: 'scatter',
                mode: 'lines',
                name: 'Rezerwa mocy',
                line: { color: '#27ae60', width: 3 },
                connectgaps: false
            },
            {
                x: data.times,
                y: data.required,
                type: 'scatter',
                mode: 'lines',
                name: 'Wymagana rezerwa mocy',
                line: { color: '#2c3e50', width: 2 },
                connectgaps: false
            },
            {
                x: data.times,
                y: Array(data.times.length).fill(1100),
                type: 'scatter',
                mode: 'lines',
                name: 'Stała linia (1100 MW)',
                line: { color: '#95a5a6', width: 1, dash: 'dash' }
            }
        ];

        // Add current hour marker
        const currentHour = this.getCurrentHourIndex(data.times);
        if (currentHour !== -1) {
            traces.push({
                x: [data.times[currentHour]],
                y: [data.reserves[currentHour]],
                type: 'scatter',
                mode: 'markers',
                name: 'Aktualna godzina',
                marker: { color: '#e74c3c', size: 12 }
            });
        }

        // Generuj etykiety dat (jak w oryginalnym pliku)
        const uniqueDates = [...new Set(data.times.map(time => time.substring(0, 10)))];
        const annotations = uniqueDates.map(date => {
        const dateObj = new Date(date + ' 12:00:00'); // Środek dnia - format lokalny
        const dateStr = dateObj.toLocaleDateString('pl-PL', { 
        day: '2-digit', 
        month: '2-digit'
    });
    
    return {
        x: date + ' 12:00:00', // Format zgodny z naszymi danymi
        y: Math.max(...data.reserves) * 1.15, // Zwiększone dla lepszej widoczności
        text: `<b>${dateStr}</b>`,
        showarrow: false,
        font: { size: 14, color: '#c0392b' },
        xanchor: 'center'
    };
});

        // Create layout
        const layout = {
            title: {
                text: 'Prognoza rezerw mocy na następne 72 godziny',
                font: { size: 18, color: '#2c3e50' }
            },
            annotations: annotations, // Dodaj etykiety dat
            xaxis: {
                title: 'Czas',
                tickangle: 45,
                showgrid: true,
                gridcolor: '#ecf0f1',
                tickformat: '%H:%M',
                dtick: 7200000, // 2 hours
                tickfont: { size: 11 }
            },
            yaxis: {
                title: 'Rezerwa mocy [MW]',
                showgrid: true,
                gridcolor: '#ecf0f1',
                tickfont: { size: 11 }
            },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            hovermode: 'x unified',
            legend: {
                orientation: 'h',
                y: -0.15,
                x: 0.5,
                xanchor: 'center'
            },
            margin: { t: 120, r: 30, b: 140, l: 70 }, // Zwiększ górny margines dla dat
            autosize: true,
            responsive: true,
            shapes: this.generateAlertLines(data)
        };

        // Plot the chart
        Plotly.newPlot(container, traces, layout, {
            responsive: true,
            displayModeBar: false
        });

        // Update statistics
        this.updateReservesStatistics(data);
    }

    /**
     * Load Plotly.js dynamically
     */
    async loadPlotly() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Fetch real PSE reserves data from API
     */
    async fetchPSEReservesData() {
    // Sprawdź cache
    const now = Date.now();
    if (this.pseReservesCache && this.pseReservesCacheTime && 
        (now - this.pseReservesCacheTime) < this.CACHE_DURATION) {
        console.log('📦 Using cached PSE reserves data');
        return this.pseReservesCache;
    }

    try {
        console.log('📊 Fetching PSE reserves data from API...');
        
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // WAŻNE: Użyj formatu ISO z czasem dla filtra
        const startDate = startOfToday.toISOString();
        const endOfPeriod = new Date(startOfToday.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 dni dla pewności
        const endDate = endOfPeriod.toISOString();
        
        console.log(`🗓️  API Query range:`);
        console.log(`   📅 Start: ${startDate}`);
        console.log(`   📅 End: ${endDate}`);
        
        const API_URL = 'https://api.raporty.pse.pl/api/pk5l-wp';
        
        // Spróbuj różnych formatów zapytania
        let data = null;
        
        // Próba 1: Z filtrem ISO
        try {
            const url1 = `${API_URL}?$filter=plan_dtime ge '${startDate}' and plan_dtime le '${endDate}'&$orderby=plan_dtime asc&$first=5000`;
            console.log('🌐 Try 1 - ISO filter:', url1);
            const response1 = await fetch(url1);
            if (response1.ok) {
                const json1 = await response1.json();
                if (json1.value && json1.value.length > 0) {
                    data = json1;
                    console.log(`✅ Got ${json1.value.length} records with ISO filter`);
                }
            }
        } catch (e) {
            console.log('❌ ISO filter failed:', e.message);
        }
        
        // Próba 2: Z filtrem tylko daty (bez czasu)
        if (!data) {
            try {
                const startDateOnly = startOfToday.toISOString().split('T')[0];
                const endDateOnly = endOfPeriod.toISOString().split('T')[0];
                const url2 = `${API_URL}?$filter=plan_dtime ge '${startDateOnly}' and plan_dtime le '${endDateOnly}'&$orderby=plan_dtime asc&$first=5000`;
                console.log('🌐 Try 2 - Date only filter:', url2);
                const response2 = await fetch(url2);
                if (response2.ok) {
                    const json2 = await response2.json();
                    if (json2.value && json2.value.length > 0) {
                        data = json2;
                        console.log(`✅ Got ${json2.value.length} records with date-only filter`);
                    }
                }
            } catch (e) {
                console.log('❌ Date-only filter failed:', e.message);
            }
        }
        
        // Próba 3: Bez filtra - pobierz wszystko
        if (!data) {
            try {
                const url3 = `${API_URL}?$orderby=plan_dtime asc&$first=5000`;
                console.log('🌐 Try 3 - No filter:', url3);
                const response3 = await fetch(url3);
                if (response3.ok) {
                    const json3 = await response3.json();
                    if (json3.value && json3.value.length > 0) {
                        data = json3;
                        console.log(`✅ Got ${json3.value.length} records without filter`);
                    }
                }
            } catch (e) {
                console.log('❌ No filter request failed:', e.message);
            }
        }
        
        if (data && data.value && data.value.length > 0) {
            // Debug: sprawdź zakres dat
            const dates = data.value.map(item => item.plan_dtime).filter(Boolean);
            const uniqueDates = [...new Set(dates.map(d => d.substring(0, 10)))];
            console.log(`📅 Unique dates in data: ${uniqueDates.join(', ')}`);
            
            const processedData = this.processPSEReservesData(data.value);
            
            // Zapisz do cache
            this.pseReservesCache = processedData;
            this.pseReservesCacheTime = Date.now();
            return processedData;
        }
        
        console.warn('No data received from API');
        return this.generateMockPSEReservesData();
        
    } catch (error) {
        console.error('❌ PSE API Error:', error);
        this.showAPIErrorMessage();
        return this.generateMockPSEReservesData();
    }
}
    /**
     * Show API error message to user
     */
    showAPIErrorMessage() {
        const container = document.getElementById('constraints-chart');
        if (container) {
            // Dodaj ostrzeżenie o problemach z API
            const warningDiv = document.createElement('div');
            warningDiv.className = 'api-warning';
            warningDiv.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(243, 156, 18, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            warningDiv.innerHTML = '⚠️ Problem z API PSE - używane dane demonstracyjne';
            
            // Usuń poprzednie ostrzeżenie jeśli istnieje
            const existingWarning = container.querySelector('.api-warning');
            if (existingWarning) {
                existingWarning.remove();
            }
            
            container.style.position = 'relative';
            container.appendChild(warningDiv);
            
            // Usuń ostrzeżenie po 10 sekundach
            setTimeout(() => {
                if (warningDiv.parentNode) {
                    warningDiv.remove();
                }
            }, 10000);
        }
    }

    /**
     * Process real PSE reserves data
     */
    processPSEReservesData(rawData) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let processed = [];
    
    console.log(`🔄 Processing ${rawData.length} raw data records`);
    
    // Debug: pokaż zakres dat w surowych danych
    const allDates = rawData
        .map(item => item.plan_dtime)
        .filter(Boolean)
        .sort();
    
    if (allDates.length > 0) {
        console.log(`📅 Raw data date range: ${allDates[0]} to ${allDates[allDates.length - 1]}`);
    }
    
    // Filtruj dane od północy dzisiaj
    const futureData = rawData.filter(item => {
        if (item.plan_dtime) {
            const itemDate = new Date(item.plan_dtime);
            // Uwzględnij dane od północy dzisiaj
            return itemDate >= startOfToday;
        }
        return false;
    });
    
    console.log(`✅ Found ${futureData.length} current/future data points`);
    
    // Sortuj dane chronologicznie
    futureData.sort((a, b) => new Date(a.plan_dtime) - new Date(b.plan_dtime));
    
    // Przetwórz dane
    futureData.forEach(item => {
        if (item.req_pow_res !== null && item.req_pow_res !== undefined) {
            const timestamp = new Date(item.plan_dtime);
            
            let available = 0;
            
            // Sprawdź różne pola dla dostępnej rezerwy
            if (item.surplus_cap_avail_tso !== null && item.surplus_cap_avail_tso !== undefined) {
                available = parseFloat(item.surplus_cap_avail_tso);
            } else if (item.avail_cap_gen_units_stor_prov !== null && item.avail_cap_gen_units_stor_prov !== undefined) {
                available = parseFloat(item.avail_cap_gen_units_stor_prov);
            }
            
            // Jeśli brak rezerwy, użyj formuły jak w Pythonie
            if (available === 0 || isNaN(available)) {
                const required = parseFloat(item.req_pow_res);
                available = required + 1000; // Dodaj 1000 MW marginesu
            }
            
            const required = parseFloat(item.req_pow_res);
            
            if (!isNaN(available) && !isNaN(required)) {
                // Format czasu jak w Pythonie
                const timeStr = timestamp.getFullYear() + '-' + 
                              String(timestamp.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(timestamp.getDate()).padStart(2, '0') + ' ' +
                              String(timestamp.getHours()).padStart(2, '0') + ':00:00';
                
                processed.push({
                    time: timeStr,
                    reserve: available,
                    required: required
                });
            }
        }
    });
    
    // Pokaż ile dni mamy
    const uniqueDays = [...new Set(processed.map(d => d.time.substring(0, 10)))];
    console.log(`📊 Processed data for ${uniqueDays.length} days: ${uniqueDays.join(', ')}`);
    console.log(`📈 Total ${processed.length} hourly records`);
    
    // Ogranicz do 72 godzin (3 dni)
    if (processed.length > 72) {
        processed = processed.slice(0, 72);
        console.log(`📏 Limited to first 72 hours`);
    }
    
    return {
        times: processed.map(d => d.time),
        reserves: processed.map(d => d.reserve),
        required: processed.map(d => d.required)
    };
}
    

    /**
     * Generate alert lines and day boundaries for reserves chart
     */
    generateAlertLines(data) {
        const shapes = [];
        const ALERT_THRESHOLD_ORANGE = 500;
        const ALERT_THRESHOLD_RED = 300;
        
        const maxY = Math.max(...data.reserves);

        // 1. Najpierw dodaj pionowe linie oddzielające dni (jak w oryginalnym pliku)
        const uniqueDates = [...new Set(data.times.map(time => time.substring(0, 10)))];
        
        // Dodaj linie na granicach dni (od drugiego dnia)
        uniqueDates.slice(1).forEach(date => {
            shapes.push({
                type: 'line',
                x0: date + ' 00:00:00', // Format zgodny z naszymi danymi
                y0: 0,
                x1: date + ' 00:00:00',
                y1: maxY * 1.1,
                line: {
                    color: '#95a5a6',  // Szara linia jak w oryginale
                    width: 2,
                    dash: 'dash'       // Przerywana linia
                }
            });
        });

        // 2. Następnie dodaj linie alertów
        data.times.forEach((time, index) => {
            const difference = data.reserves[index] - data.required[index];
            
            if (difference <= ALERT_THRESHOLD_RED) {
                shapes.push({
                    type: 'line',
                    x0: time,
                    y0: 0,
                    x1: time,
                    y1: maxY * 1.1,
                    line: {
                        color: '#e74c3c',
                        width: 3,
                        dash: 'dot'
                    }
                });
            } else if (difference <= ALERT_THRESHOLD_ORANGE) {
                shapes.push({
                    type: 'line',
                    x0: time,
                    y0: 0,
                    x1: time,
                    y1: maxY * 1.1,
                    line: {
                        color: '#f39c12',
                        width: 2,
                        dash: 'dot'
                    }
                });
            }
        });

        console.log(`📏 Generated ${shapes.length} shapes (day boundaries + alerts) for chart`);
        return shapes;
    }

    /**
     * Get current hour index in data array
     */
    getCurrentHourIndex(times) {
        const now = new Date();
        const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
        
        return times.findIndex(time => {
            const dataTime = new Date(time);
            return Math.abs(dataTime.getTime() - currentHour.getTime()) < 30 * 60 * 1000; // 30 min tolerance
        });
    }

    /**
     * Update reserves statistics
     */
    updateReservesStatistics(data) {
        const margins = data.reserves.map((res, i) => res - data.required[i]);
        const avgMargin = margins.reduce((sum, m) => sum + m, 0) / margins.length;
        const minMargin = Math.min(...margins);
        const minMarginIndex = margins.indexOf(minMargin);
        const coverage = (data.reserves.reduce((sum, r) => sum + r, 0) / data.required.reduce((sum, r) => sum + r, 0) * 100);

        // Update UI elements
        const updates = {
            'avg-margin': `${avgMargin.toFixed(0)} MW`,
            'min-margin': `${minMargin.toFixed(0)} MW`,
            'coverage-percent': `${coverage.toFixed(1)}%`,
            'critical-hour': new Date(data.times[minMarginIndex]).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Update risk analysis
        this.updateRiskAnalysis(data, margins);
        
        // Update alerts history
        this.updateConstraintsAlertsHistory(data, margins);
        
        // Update data source info
        this.updateDataSourceInfo(data);
    }

    /**
     * Update risk analysis section
     */
    updateRiskAnalysis(data, margins) {
        const riskSummary = document.getElementById('risk-summary');
        if (!riskSummary) return;

        const criticalHours = margins.filter(m => m <= 300).length;
        const warningHours = margins.filter(m => m <= 500 && m > 300).length;
        const minMargin = Math.min(...margins);

        let riskLevel = 'low';
        let riskColor = '#27ae60';
        let riskText = 'Niskie ryzyko';

        if (criticalHours > 0) {
            riskLevel = 'critical';
            riskColor = '#e74c3c';
            riskText = 'Wysokie ryzyko';
        } else if (warningHours > 3) {
            riskLevel = 'medium';
            riskColor = '#f39c12';
            riskText = 'Średnie ryzyko';
        }

        riskSummary.innerHTML = `
            <div class="risk-indicator" style="background-color: ${riskColor}20; border-left: 4px solid ${riskColor};">
                <h4 style="color: ${riskColor}; margin: 0 0 10px 0;">${riskText}</h4>
                <div class="risk-stats">
                    <div class="risk-stat">
                        <span class="label">Godziny krytyczne (≤300 MW):</span>
                        <span class="value" style="color: #e74c3c;">${criticalHours}</span>
                    </div>
                    <div class="risk-stat">
                        <span class="label">Godziny ostrzegawcze (≤500 MW):</span>
                        <span class="value" style="color: #f39c12;">${warningHours}</span>
                    </div>
                    <div class="risk-stat">
                        <span class="label">Minimalny margines:</span>
                        <span class="value" style="color: ${minMargin <= 300 ? '#e74c3c' : minMargin <= 500 ? '#f39c12' : '#27ae60'};">${minMargin.toFixed(0)} MW</span>
                    </div>
                </div>
            </div>
        `;

        // Update risk timeline
        this.updateRiskTimeline(data, margins);
    }

    /**
     * Update risk timeline
     */
    updateRiskTimeline(data, margins) {
        const timeline = document.getElementById('risk-timeline');
        if (!timeline) return;

        timeline.innerHTML = '<h4>Timeline ryzyka (następne 24h)</h4>';
        
        const next24Hours = margins.slice(0, 24);
        const timelineItems = [];

        next24Hours.forEach((margin, index) => {
            if (margin <= 500) {
                const time = new Date(data.times[index]);
                const severity = margin <= 300 ? 'critical' : 'warning';
                const color = margin <= 300 ? '#e74c3c' : '#f39c12';
                
                timelineItems.push(`
                    <div class="timeline-item ${severity}">
                        <div class="timeline-time">${time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div class="timeline-content">
                            <div class="timeline-title" style="color: ${color};">
                                ${margin <= 300 ? '🔴 Alert krytyczny' : '🟠 Ostrzeżenie'}
                            </div>
                            <div class="timeline-details">
                                Margines: ${margin.toFixed(0)} MW<br>
                                Rezerwa: ${data.reserves[index].toFixed(0)} MW<br>
                                Wymagana: ${data.required[index].toFixed(0)} MW
                            </div>
                        </div>
                    </div>
                `);
            }
        });

        if (timelineItems.length === 0) {
            timeline.innerHTML += '<div class="no-alerts">✅ Brak alertów w najbliższych 24 godzinach</div>';
        } else {
            timeline.innerHTML += `<div class="timeline-container">${timelineItems.join('')}</div>`;
        }
    }

    /**
     * Refresh constraints chart with new data (with throttling)
     */
    refreshConstraintsChart() {
        const now = Date.now();
        
        // Throttle chart updates to prevent excessive refreshing
        if (this.lastChartUpdate && (now - this.lastChartUpdate) < this.CHART_UPDATE_THROTTLE) {
            console.log('⏳ Chart update throttled, skipping...');
            return;
        }
        
        console.log('🔄 Refreshing constraints chart...');
        this.lastChartUpdate = now;
        this.renderPSEReservesChart();
    }

    /**
     * Export constraints data
     */
    async exportConstraintsData() {
        const data = await this.fetchPSEReservesData();
        const csvContent = this.generateConstraintsCSV(data);
        this.downloadCSV(csvContent, 'pse_reserves_data.csv');
    }

    /**
     * Generate CSV for constraints data
     */
    generateConstraintsCSV(data) {
        let csv = 'Czas,Rezerwa (MW),Wymagana (MW),Margines (MW)\n';
        
        data.times.forEach((time, index) => {
            const timeStr = new Date(time).toLocaleString('pl-PL');
            const margin = data.reserves[index] - data.required[index];
            csv += `${timeStr},${data.reserves[index].toFixed(0)},${data.required[index].toFixed(0)},${margin.toFixed(0)}\n`;
        });
        
        return csv;
    }

    /**
     * Download CSV file
     */
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Update constraints alerts history
     */
    updateConstraintsAlertsHistory(data, margins) {
        const alertsList = document.getElementById('constraints-alerts-list');
        if (!alertsList) return;

        const alerts = [];
        const now = new Date();

        // Znajdź alerty z ostatnich 24 godzin
        data.times.forEach((time, index) => {
            const timeDate = new Date(time);
            const hoursDiff = (now - timeDate) / (1000 * 60 * 60);
            
            if (Math.abs(hoursDiff) <= 24) {
                const margin = margins[index];
                if (margin <= 500) {
                    alerts.push({
                        time: timeDate,
                        margin: margin,
                        reserve: data.reserves[index],
                        required: data.required[index],
                        severity: margin <= 300 ? 'critical' : 'warning'
                    });
                }
            }
        });

        // Sortuj według czasu
        alerts.sort((a, b) => b.time - a.time);

        if (alerts.length === 0) {
            alertsList.innerHTML = '<div class="no-alerts">✅ Brak alertów w ostatnich 24 godzinach</div>';
            return;
        }

        // Generuj HTML alertów
        const alertsHTML = alerts.map(alert => {
            const timeStr = alert.time.toLocaleString('pl-PL', { 
                day: '2-digit', 
                month: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            const severityText = alert.severity === 'critical' ? '🔴 Krytyczny' : '🟠 Ostrzeżenie';
            const severityColor = alert.severity === 'critical' ? '#e74c3c' : '#f39c12';

            return `
                <div class="alert-item ${alert.severity}">
                    <div class="alert-time">${timeStr}</div>
                    <div class="alert-content">
                        <div class="alert-title" style="color: ${severityColor};">
                            ${severityText}
                        </div>
                        <div class="alert-details">
                            Margines: ${alert.margin.toFixed(0)} MW<br>
                            Rezerwa: ${alert.reserve.toFixed(0)} MW<br>
                            Wymagana: ${alert.required.toFixed(0)} MW
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        alertsList.innerHTML = alertsHTML;
    }

    /**
     * Update data source information
     */
    updateDataSourceInfo(data) {
        // Dodaj informację o źródle danych do tytułu wykresu
        const chartHeader = document.querySelector('#constraints-chart').closest('.chart-card')?.querySelector('.chart-header h3');
        if (chartHeader) {
            const now = new Date();
            const isCached = this.pseReservesCacheTime && (Date.now() - this.pseReservesCacheTime) < this.CACHE_DURATION;
            const dataSource = isCached ? 'PSE API (cache)' : 'PSE API (live)';
            const lastUpdate = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
            
            chartHeader.innerHTML = `📊 Rezerwa Wymagana vs Prognozowana <small style="font-weight: normal; color: #666; font-size: 12px;">(${dataSource} - ${lastUpdate})</small>`;
        }
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
    
    // Dni tygodnia - tylko dzisiaj i przyszłe
    const days = ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    
    // Zawsze pokazuj 7 dni, zaczynając od dzisiaj
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() + dayOffset);
        const dayOfWeek = dayDate.getDay();
        
        // Etykieta dnia
        const dayLabel = document.createElement('div');
        dayLabel.className = 'risk-day-label';
        
        const dayName = dayOffset === 0 ? 'Dziś' : days[dayOfWeek];
        dayLabel.textContent = `${dayName} ${dayDate.getDate()}.${(dayDate.getMonth() + 1).toString().padStart(2, '0')}`;
        container.appendChild(dayLabel);
        
        // Komórki godzin
        for (let hour = 0; hour < 24; hour++) {
            const cell = document.createElement('div');
            cell.className = 'risk-cell';
            cell.dataset.dayOffset = dayOffset;
            cell.dataset.hour = hour;
            cell.dataset.dayOfWeek = dayOfWeek;
            
            // Oznacz aktualną godzinę tylko dla dzisiejszego dnia
            if (dayOffset === 0 && hour === today.getHours()) {
                cell.classList.add('current');
            }
            
            // Domyślna wartość
            cell.textContent = '0';
            
            cell.addEventListener('click', () => this.showRiskDetails(dayOffset, hour, dayOfWeek));
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
showRiskDetails(dayOffset, hour, dayOfWeek) {
    const days = ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    
    // Znajdź komórkę po dayOffset i hour
    const cell = document.querySelector(`[data-day-offset="${dayOffset}"][data-hour="${hour}"]`);
    if (!cell) return;
    
    // Pobierz wartość ryzyka
    const riskScore = parseInt(cell.textContent) || 0;
    const riskLevel = cell.className.match(/risk-(\w+)/)?.[1] || 'unknown';
    
    // Zaznacz aktywną komórkę
    document.querySelectorAll('.risk-cell').forEach(c => c.classList.remove('selected'));
    cell.classList.add('selected');
    
    // Aktualizuj panel szczegółów
    const detailsPanel = document.getElementById('risk-details');
    if (detailsPanel) {
        detailsPanel.style.display = 'block';
        detailsPanel.classList.add('has-data');
        
        // Na mobile dodaj klasę visible
        if (window.innerWidth <= 768) {
            detailsPanel.classList.add('visible');
            
            // Dodaj przycisk zamknięcia na mobile
            if (!detailsPanel.querySelector('.close-details')) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'close-details';
                closeBtn.innerHTML = '×';
                closeBtn.onclick = () => {
                    detailsPanel.classList.remove('visible');
                    setTimeout(() => {
                        detailsPanel.style.display = 'none';
                    }, 300);
                    document.querySelectorAll('.risk-cell').forEach(c => c.classList.remove('selected'));
                };
                detailsPanel.insertBefore(closeBtn, detailsPanel.firstChild);
            }
        } else {
            // Na desktop przewiń do panelu szczegółów
            setTimeout(() => {
                detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
        
        // Nagłówek z datą i godziną
        const dayName = dayOffset === 0 ? 'Dziś' : days[dayOfWeek];
        const dateStr = `${dayName}, ${targetDate.getDate()}.${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        detailsPanel.innerHTML = `
            <h4>Analiza Ryzyka - ${dateStr}, ${hour.toString().padStart(2, '0')}:00</h4>
            <div id="risk-score-display" class="risk-score-display">
                <div class="total-score ${riskLevel}">${riskScore}%</div>
                <div class="risk-level">${this.getRiskLevelText(riskLevel)}</div>
            </div>
            <div id="risk-components" class="risk-components">
                <div class="components-loading">
                    <div class="loading-spinner small"></div>
                    <span>Obliczanie składowych...</span>
                </div>
            </div>
        `;
        
        // Oblicz składowe ryzyka
        setTimeout(() => {
            if (this.riskScorer) {
                // Użyj rzeczywistych danych jeśli dostępne, w przeciwnym razie mockowe
                let scoreData;
                
                if (this.currentData && this.currentData.systemLoad && this.currentData.systemLoad[hour]) {
                    scoreData = {
                        hour: hour,
                        dayOfWeek: dayOfWeek,
                        systemLoad: this.currentData.systemLoad[hour].load || 20000,
                        pvGeneration: this.currentData.pvGeneration?.[hour]?.totalPower || 0,
                        windGeneration: this.currentData.windGeneration?.[hour]?.totalPower || 0,
                        baseloadGeneration: this.currentData.fullGenerationData?.[hour * 4]?.gen_rb || 10000,
                        availableCapacity: 25000,
                        pvGradient: 0,
                        windGradient: 0
                    };
                } else {
                    // Dane mockowe dla demonstracji
                    const baseLoad = 20000;
                    const sunFactor = Math.max(0, Math.sin((hour - 6) * Math.PI / 12));
                    
                    scoreData = {
                        hour: hour,
                        dayOfWeek: dayOfWeek,
                        systemLoad: baseLoad * (0.8 + 0.4 * Math.sin((hour - 6) * Math.PI / 12)),
                        pvGeneration: sunFactor * 8000 * (0.7 + Math.random() * 0.3),
                        windGeneration: 3000 + Math.random() * 2000,
                        baseloadGeneration: baseLoad * 0.5,
                        availableCapacity: 25000,
                        pvGradient: 0,
                        windGradient: 0
                    };
                }
                
                const risk = this.riskScorer.calculateRiskScore(scoreData);
                
                const componentsHTML = `
                    <h5>Składowe ryzyka:</h5>
                    ${Object.entries(risk.components).map(([key, value]) => `
                        <div class="risk-component">
                            <div class="component-header">
                                <span class="component-name">${this.getComponentName(key)}</span>
                                <span class="component-score">${value}%</span>
                            </div>
                            <div class="component-bar">
                                <div class="component-fill risk-${this.getRiskLevel(value)}" 
                                     style="width: ${value}%"
                                     title="${value}%"></div>
                            </div>
                            <div class="component-weight">Waga: ${this.riskScorer.weights[key]}%</div>
                        </div>
                    `).join('')}
                    
                    <div class="risk-recommendations">
                        <h5>Rekomendacje:</h5>
                        ${risk.recommendations.length > 0 ? 
                            risk.recommendations.map(r => `<div class="recommendation">• ${r}</div>`).join('') :
                            '<div class="recommendation">✅ Brak szczególnych zaleceń</div>'
                        }
                    </div>
                    
                    <div class="risk-data-summary">
                        <h5>Dane wejściowe:</h5>
                        <div class="data-row">
                            <span>Obciążenie KSE:</span>
                            <span>${scoreData.systemLoad.toFixed(0)} MW</span>
                        </div>
                        <div class="data-row">
                            <span>Generacja PV:</span>
                            <span>${scoreData.pvGeneration.toFixed(0)} MW</span>
                        </div>
                        <div class="data-row">
                            <span>Generacja wiatrowa:</span>
                            <span>${scoreData.windGeneration.toFixed(0)} MW</span>
                        </div>
                        <div class="data-row">
                            <span>Generacja JW RB:</span>
                            <span>${scoreData.baseloadGeneration.toFixed(0)} MW</span>
                        </div>
                    </div>
                `;
                
                document.getElementById('risk-components').innerHTML = componentsHTML;
            }
        }, 100);
    }
}

getRiskLevelText(level) {
    const texts = {
        low: 'Niskie ryzyko',
        medium: 'Średnie ryzyko',
        high: 'Wysokie ryzyko',
        critical: 'Krytyczne ryzyko'
    };
    return texts[level] || 'Nieznane';
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
    
    // Plugin do rysowania pionowych linii oddzielających dni
    const dayDividerPlugin = {
        id: 'dayDivider',
        afterDraw: (chart) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;
            
            if (!chart.data.labels || chart.data.labels.length === 0) return;
            
            // Zapisz stan kontekstu
            ctx.save();
            
            // Ustawienia linii
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]); // Linia przerywana
            
            let previousDay = null;
            
            chart.data.labels.forEach((label, index) => {
                // Wyciągnij dzień z etykiety (format: DD.MM HH:MM)
                const day = label.split(' ')[0];
                
                // Jeśli zmienił się dzień i to nie jest pierwsza etykieta
                if (previousDay && day !== previousDay && index > 0) {
                    // Pobierz pozycję X dla tego indeksu
                    const x = xAxis.getPixelForValue(index - 0.5);
                    
                    // Rysuj pionową linię
                    ctx.beginPath();
                    ctx.moveTo(x, yAxis.top);
                    ctx.lineTo(x, yAxis.bottom);
                    ctx.stroke();
                }
                
                previousDay = day;
            });
            
            // Przywróć stan kontekstu
            ctx.restore();
        }
    };
    
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
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { 
                            size: 11 
                        },
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        autoSkipPadding: 10,
                        maxTicksLimit: 24
                    },
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
        },
        plugins: [dayDividerPlugin] // WAŻNE: Dodaj plugin tutaj
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

    // Przygotuj dane - formatuj etykiety jako dzień i godzina
    const labels = data.map(d => {
        const date = new Date(d.timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${day}.${month} ${hour}:${minute}`;
    });
    
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

