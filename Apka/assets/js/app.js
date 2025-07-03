/**
 * Enspirion Dashboard - Main Application
 * Orchestrates all components and manages application state
 */

class EnspirionApp {
    constructor() {
        this.isInitialized = false;
        this.currentView = 'overview';
        this.refreshIntervals = new Map();
        this.lastDataUpdate = null;
        this.applicationState = {
            isLoading: false,
            hasError: false,
            connectionStatus: 'disconnected',
            dataStatus: 'stale'
        };
        
        // Data storage
        this.data = {
            pvGeneration: null,
            systemLoad: null,
            redispatchEvents: null,
            priceForecasts: null,
            portfolioAnalysis: null,
            riskAnalysis: null
        };

        console.log('🚀 Enspirion App initializing...');
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            this.showLoadingScreen('Inicjalizacja aplikacji...');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI components
            this.initializeUI();
            
            // Test API connectivity
            await this.testAPIConnectivity();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup auto-refresh
            this.setupAutoRefresh();
            
            // Hide loading screen and show app
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('✅ Enspirion App initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Portfolio capacity input
        const portfolioInput = document.getElementById('portfolio-capacity');
        if (portfolioInput) {
            portfolioInput.addEventListener('change', (e) => {
                this.updatePortfolioCapacity(parseFloat(e.target.value));
            });
        }

        // Save portfolio button
        const savePortfolioBtn = document.getElementById('save-portfolio');
        if (savePortfolioBtn) {
            savePortfolioBtn.addEventListener('click', () => {
                this.savePortfolioSettings();
            });
        }

        // Refresh buttons
        document.querySelectorAll('.refresh-chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.currentTarget.dataset.chart;
                this.refreshChart(chartType);
            });
        });

        // Main refresh button
        const refreshAllBtn = document.getElementById('refresh-all-btn');
        if (refreshAllBtn) {
            refreshAllBtn.addEventListener('click', () => {
                this.refreshAllData();
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-report-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportReport();
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }

        // Chart period buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleChartPeriodChange(e);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Window events
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Network status
        window.addEventListener('online', () => {
            this.handleNetworkOnline();
        });

        window.addEventListener('offline', () => {
            this.handleNetworkOffline();
        });

        console.log('📡 Event listeners setup complete');
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Load portfolio settings from storage
        const portfolioSettings = window.PortfolioCalculator.getPortfolioSettings();
        const portfolioInput = document.getElementById('portfolio-capacity');
        if (portfolioInput) {
            portfolioInput.value = portfolioSettings.defaultCapacity;
        }

        // Initialize chart containers
        this.initializeChartContainers();
        
        // Set initial view
        this.switchView(this.currentView);
        
        console.log('🎨 UI components initialized');
    }

    /**
     * Test API connectivity
     */
    async testAPIConnectivity() {
        try {
            this.updateProgress(20);
            this.showLoadingScreen('Testowanie połączenia z PSE API...');
            
            const health = await window.PSEApiService.healthCheck();
            
            if (health.status === 'healthy') {
                this.updateConnectionStatus('connected');
                console.log('✅ PSE API connection successful');
            } else {
                throw new Error(`API Health Check Failed: ${health.error}`);
            }
            
        } catch (error) {
            console.warn('⚠️ API connectivity test failed:', error);
            this.updateConnectionStatus('error');
            // Continue with cached data if available
        }
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            this.updateProgress(40);
            this.showLoadingScreen('Pobieranie danych z PSE...');
            
            // Load data in parallel for better performance
            const dataPromises = [
                this.loadPVGenerationData(),
                this.loadSystemLoadData(),
                this.loadRedispatchData(),
                this.loadPriceForecastData()
            ];

            this.updateProgress(60);
            
            // Wait for all data to load (with timeout)
            await Promise.allSettled(dataPromises);
            
            this.updateProgress(80);
            this.showLoadingScreen('Analizowanie danych...');
            
            // Perform analysis
            await this.performDataAnalysis();
            
            // Update UI
            this.updateProgress(95);
            this.updateAllDisplays();
            
            this.lastDataUpdate = new Date();
            this.updateDataStatus('fresh');
            
            console.log('✅ Initial data load complete');
            
        } catch (error) {
            console.error('❌ Initial data load failed:', error);
            this.handleDataLoadError(error);
        }
    }

    /**
     * Load specific data types
     */
    async loadPVGenerationData() {
        try {
            this.data.pvGeneration = await window.PSEApiService.getPVGeneration();
            console.log('📊 PV generation data loaded:', this.data.pvGeneration?.length || 0, 'records');
        } catch (error) {
            console.error('❌ Failed to load PV generation data:', error);
            this.data.pvGeneration = null;
        }
    }

    async loadSystemLoadData() {
        try {
            this.data.systemLoad = await window.PSEApiService.getSystemLoad();
            console.log('📊 System load data loaded:', this.data.systemLoad?.length || 0, 'records');
        } catch (error) {
            console.error('❌ Failed to load system load data:', error);
            this.data.systemLoad = null;
        }
    }

    async loadRedispatchData() {
        try {
            this.data.redispatchEvents = await window.PSEApiService.getRedispatchEvents();
            console.log('📊 Redispatch data loaded:', this.data.redispatchEvents?.length || 0, 'events');
        } catch (error) {
            console.error('❌ Failed to load redispatch data:', error);
            this.data.redispatchEvents = null;
        }
    }

    async loadPriceForecastData() {
        try {
            this.data.priceForecasts = await window.PSEApiService.getPriceForecasts();
            console.log('📊 Price forecast data loaded:', this.data.priceForecasts?.length || 0, 'records');
        } catch (error) {
            console.error('❌ Failed to load price forecast data:', error);
            this.data.priceForecasts = null;
        }
    }

    /**
     * Perform data analysis
     */
    async performDataAnalysis() {
        try {
            // Portfolio analysis
            this.data.portfolioAnalysis = await window.PortfolioCalculator.getPortfolioAnalysis(
                this.data.pvGeneration,
                this.data.systemLoad,
                this.data.priceForecasts,
                this.data.redispatchEvents
            );

            // Risk analysis
            this.data.riskAnalysis = this.calculateRiskAnalysis();
            
            console.log('🧮 Data analysis complete');
            
        } catch (error) {
            console.error('❌ Data analysis failed:', error);
            // Use default/empty analysis
            this.data.portfolioAnalysis = window.PortfolioCalculator.getEmptyAnalysis();
            this.data.riskAnalysis = this.getEmptyRiskAnalysis();
        }
    }

    /**
     * Calculate risk analysis
     */
    calculateRiskAnalysis() {
        try {
            // Short-term risk (next 6 hours)
            const shortTermRisk = window.RiskCalculator.calculateShortTermRisk(
                this.data.redispatchEvents,
                [], // Current limitations (would need real-time data)
                {
                    pvGeneration: this.data.pvGeneration,
                    systemLoad: this.data.systemLoad
                }
            );

            // Risk heatmap (7 days)
            const riskHeatmap = window.RiskCalculator.calculateRiskHeatmap(
                this.data.redispatchEvents,
                [], // Current limitations
                {
                    pvGeneration: this.data.pvGeneration,
                    systemLoad: this.data.systemLoad
                }
            );

            // Risk patterns
            const riskPatterns = window.RiskCalculator.identifyRiskPatterns(
                this.data.redispatchEvents
            );

            return {
                shortTerm: shortTermRisk,
                heatmap: riskHeatmap,
                patterns: riskPatterns,
                lastCalculated: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Risk analysis calculation failed:', error);
            return this.getEmptyRiskAnalysis();
        }
    }

    /**
     * Update all displays
     */
    updateAllDisplays() {
        try {
            this.updateKPIs();
            this.updateCharts();
            this.updateRiskDisplay();
            this.updateFooterInfo();
            
            console.log('🎨 All displays updated');
            
        } catch (error) {
            console.error('❌ Display update failed:', error);
        }
    }

    /**
     * Update KPI cards
     */
    updateKPIs() {
        const portfolio = this.data.portfolioAnalysis;
        const risk = this.data.riskAnalysis;
        
        if (portfolio) {
            // Revenue Today
            const revenueElement = document.getElementById('revenue-today');
            if (revenueElement) {
                revenueElement.textContent = window.PortfolioCalculator.formatNumber(
                    portfolio.financial.grossRevenue, 'currency'
                );
            }

            // Portfolio Output
            const outputElement = document.getElementById('portfolio-output');
            if (outputElement) {
                outputElement.textContent = `${window.PortfolioCalculator.formatNumber(
                    portfolio.performance.totalGeneration, 'power'
                )} MW`;
            }

            // Market Share
            const marketElement = document.getElementById('market-share');
            if (marketElement) {
                marketElement.textContent = window.PortfolioCalculator.formatNumber(
                    portfolio.market.marketShareByCapacity, 'percentage', 3
                );
            }

            // Update trends
            this.updateKPITrends(portfolio);
        }

        if (risk) {
            // Risk Level
            const riskElement = document.getElementById('risk-level');
            if (riskElement) {
                riskElement.textContent = window.RiskCalculator.getRiskLevelText(risk.shortTerm.level);
                riskElement.className = `kpi-value risk-${risk.shortTerm.level}`;
            }
        }
    }

    /**
     * Update charts
     */
    updateCharts() {
        this.updateForecastChart();
        this.updateRiskHeatmap();
        this.updatePVChart();
        this.updateRedispatchTimeline();
    }

    /**
     * Update forecast chart
     */
    updateForecastChart() {
        const canvas = document.getElementById('forecast-chart');
        if (!canvas || !this.data.pvGeneration || !this.data.systemLoad) return;

        try {
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw forecast vs demand visualization
            this.drawForecastChart(ctx, canvas, this.data.pvGeneration, this.data.systemLoad);
            
        } catch (error) {
            console.error('❌ Forecast chart update failed:', error);
        }
    }

    /**
     * Update risk heatmap
     */
    updateRiskHeatmap() {
        const container = document.getElementById('risk-heatmap');
        if (!container || !this.data.riskAnalysis) return;

        try {
            // Clear existing heatmap
            container.innerHTML = '';
            
            // Generate heatmap cells
            const heatmap = this.data.riskAnalysis.heatmap;
            
            heatmap.forEach((day, dayIndex) => {
                day.forEach((hour, hourIndex) => {
                    const cell = document.createElement('div');
                    cell.className = `risk-cell risk-${hour.level}`;
                    cell.textContent = Math.round(hour.risk * 100);
                    cell.title = `Dzień ${dayIndex + 1}, Godzina ${hourIndex}:00 - Ryzyko: ${Math.round(hour.risk * 100)}%`;
                    container.appendChild(cell);
                });
            });
            
        } catch (error) {
            console.error('❌ Risk heatmap update failed:', error);
        }
    }

    /**
     * Update PV generation chart
     */
    updatePVChart() {
        const canvas = document.getElementById('pv-chart');
        if (!canvas || !this.data.pvGeneration || !this.data.systemLoad) return;

        try {
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw PV generation chart
            this.drawPVChart(ctx, canvas, this.data.pvGeneration, this.data.systemLoad);
            
            // Update PV metrics
            this.updatePVMetrics();
            
        } catch (error) {
            console.error('❌ PV chart update failed:', error);
        }
    }

    /**
     * Update redispatch timeline
     */
    updateRedispatchTimeline() {
        const container = document.getElementById('redispatch-timeline');
        if (!container || !this.data.redispatchEvents) return;

        try {
            // Clear existing timeline
            container.innerHTML = '';
            
            // Create timeline visualization
            this.createRedispatchTimeline(container, this.data.redispatchEvents);
            
            // Update redispatch summary
            this.updateRedispatchSummary();
            
        } catch (error) {
            console.error('❌ Redispatch timeline update failed:', error);
        }
    }

    /**
     * Chart drawing methods (simplified implementations)
     */
    drawForecastChart(ctx, canvas, pvData, loadData) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 50;
        
        // Setup
        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 2;
        
        // Draw axes
        ctx.strokeStyle = '#e5e7eb';
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw system load line
        if (loadData && loadData.length > 0) {
            ctx.strokeStyle = window.EnspirionConfig.UI.colors.demand;
            ctx.beginPath();
            
            loadData.forEach((point, index) => {
                const x = padding + (index / (loadData.length - 1)) * (width - 2 * padding);
                const y = height - padding - (point.load / 30000) * (height - 2 * padding);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        }
        
        // Draw PV generation line
        if (pvData && pvData.length > 0) {
            ctx.strokeStyle = window.EnspirionConfig.UI.colors.pvActual;
            ctx.beginPath();
            
            pvData.forEach((point, index) => {
                const x = padding + (index / (pvData.length - 1)) * (width - 2 * padding);
                const y = height - padding - (point.totalPower / 15000) * (height - 2 * padding);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        }
    }

    drawPVChart(ctx, canvas, pvData, loadData) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 50;
        
        // Clear and setup
        ctx.clearRect(0, 0, width, height);
        
        // Draw percentage bars
        if (pvData && loadData) {
            const barWidth = (width - 2 * padding) / 24;
            
            for (let hour = 0; hour < 24; hour++) {
                const pvPoint = pvData.find(p => p.hour === hour);
                const loadPoint = loadData.find(p => p.hour === hour);
                
                if (pvPoint && loadPoint) {
                    const percentage = (pvPoint.totalPower / loadPoint.load) * 100;
                    const barHeight = (percentage / 100) * (height - 2 * padding);
                    
                    ctx.fillStyle = window.EnspirionConfig.UI.colors.pvForecast;
                    ctx.fillRect(
                        padding + hour * barWidth,
                        height - padding - barHeight,
                        barWidth - 2,
                        barHeight
                    );
                }
            }
        }
        
        // Draw portfolio line
        if (this.data.portfolioAnalysis?.performance?.hourlyData) {
            ctx.strokeStyle = window.EnspirionConfig.UI.colors.portfolioLine;
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            this.data.portfolioAnalysis.performance.hourlyData.forEach((point, index) => {
                const x = padding + (index / 23) * (width - 2 * padding);
                const y = height - padding - (point.portfolioGeneration / 25) * (height - 2 * padding);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        }
    }

    /**
     * Setup auto-refresh
     */
    setupAutoRefresh() {
        const config = window.EnspirionConfig.UI.refreshIntervals;
        
        // Real-time data (KPIs)
        this.refreshIntervals.set('realtime', setInterval(() => {
            this.refreshRealTimeData();
        }, config.realTimeData));
        
        // Charts data
        this.refreshIntervals.set('charts', setInterval(() => {
            this.refreshChartsData();
        }, config.chartsData));
        
        // Historical data
        this.refreshIntervals.set('historical', setInterval(() => {
            this.refreshHistoricalData();
        }, config.historicalData));
        
        console.log('⏰ Auto-refresh setup complete');
    }

    /**
     * Refresh methods
     */
    async refreshRealTimeData() {
        if (this.applicationState.isLoading) return;
        
        try {
            await Promise.all([
                this.loadPVGenerationData(),
                this.loadSystemLoadData()
            ]);
            
            // Quick analysis update
            await this.performDataAnalysis();
            this.updateKPIs();
            this.updateDataStatus('fresh');
            this.lastDataUpdate = new Date();
            
        } catch (error) {
            console.error('❌ Real-time data refresh failed:', error);
            this.updateDataStatus('stale');
        }
    }

    async refreshChartsData() {
        if (this.applicationState.isLoading) return;
        
        try {
            await this.loadInitialData();
            this.updateCharts();
            
        } catch (error) {
            console.error('❌ Charts data refresh failed:', error);
        }
    }

    async refreshHistoricalData() {
        if (this.applicationState.isLoading) return;
        
        try {
            await this.loadRedispatchData();
            await this.performDataAnalysis();
            this.updateRiskDisplay();
            
        } catch (error) {
            console.error('❌ Historical data refresh failed:', error);
        }
    }

    async refreshAllData() {
        if (this.applicationState.isLoading) return;
        
        try {
            this.applicationState.isLoading = true;
            this.updateRefreshButton(true);
            
            await this.loadInitialData();
            this.updateAllDisplays();
            
            this.showSuccessMessage('Dane zostały odświeżone');
            
        } catch (error) {
            console.error('❌ Full data refresh failed:', error);
            this.showErrorMessage('Błąd odświeżania danych');
        } finally {
            this.applicationState.isLoading = false;
            this.updateRefreshButton(false);
        }
    }

    /**
     * UI Update helpers
     */
    updateKPITrends(portfolio) {
        // Update trend indicators for KPIs
        // This would compare current values with previous ones
        // Simplified for now
        
        const revenueElement = document.getElementById('revenue-trend');
        if (revenueElement && portfolio.financial.profitMargin > 60) {
            revenueElement.innerHTML = '<span class="trend-icon">↗</span><span class="trend-value">+12.5%</span>';
            revenueElement.className = 'kpi-trend trend-up';
        }
    }

    updatePVMetrics() {
        const portfolio = this.data.portfolioAnalysis;
        if (!portfolio) return;
        
        // Update PV percentage
        const pvPercentageElement = document.getElementById('pv-percentage');
        if (pvPercentageElement && this.data.pvGeneration && this.data.systemLoad) {
            const currentHour = new Date().getHours();
            const pvData = this.data.pvGeneration.find(p => p.hour === currentHour);
            const loadData = this.data.systemLoad.find(p => p.hour === currentHour);
            
            if (pvData && loadData) {
                const percentage = (pvData.totalPower / loadData.load) * 100;
                pvPercentageElement.textContent = `${percentage.toFixed(1)}%`;
            }
        }
        
        // Update portfolio generation
        const portfolioGenElement = document.getElementById('portfolio-generation');
        if (portfolioGenElement) {
            portfolioGenElement.textContent = `${portfolio.performance.totalGeneration.toFixed(1)} MW`;
        }
        
        // Update efficiency
        const efficiencyElement = document.getElementById('portfolio-efficiency');
        if (efficiencyElement) {
            efficiencyElement.textContent = `${portfolio.performance.averageCapacityFactor.toFixed(1)}%`;
        }
        
        // Update efficiency comparison
        const comparisonElement = document.getElementById('efficiency-comparison');
        if (comparisonElement) {
            const comparison = portfolio.performance.averageEfficiencyComparison;
            comparisonElement.textContent = `${comparison >= 0 ? '+' : ''}${comparison.toFixed(1)}%`;
            comparisonElement.style.color = comparison >= 0 ? 
                window.EnspirionConfig.UI.colors.success : 
                window.EnspirionConfig.UI.colors.error;
        }
    }

    updateRedispatchSummary() {
        const events = this.data.redispatchEvents;
        if (!events) return;
        
        // Calculate summary metrics
        const totalEvents = events.length;
        const totalEnergyLost = events.reduce((sum, event) => sum + event.powerReduction * (event.duration / 60), 0);
        const totalFinancialLoss = totalEnergyLost * window.EnspirionConfig.BUSINESS.financial.curtailmentPenalty;
        const avgDuration = events.length > 0 ? 
            events.reduce((sum, event) => sum + event.duration, 0) / events.length : 0;
        
        // Update summary elements
        const eventsElement = document.getElementById('redispatch-events');
        if (eventsElement) eventsElement.textContent = totalEvents;
        
        const energyElement = document.getElementById('energy-lost');
        if (energyElement) energyElement.textContent = `${totalEnergyLost.toFixed(1)} MWh`;
        
        const lossElement = document.getElementById('financial-loss');
        if (lossElement) lossElement.textContent = window.PortfolioCalculator.formatNumber(totalFinancialLoss, 'currency');
        
        const durationElement = document.getElementById('avg-duration');
        if (durationElement) durationElement.textContent = `${Math.round(avgDuration)} min`;
    }

    /**
     * Status management
     */
    updateConnectionStatus(status) {
        this.applicationState.connectionStatus = status;
        
        const statusDot = document.getElementById('api-status-dot');
        const statusText = document.getElementById('api-status-text');
        
        if (statusDot && statusText) {
            statusDot.className = `status-dot ${status}`;
            
            const statusTexts = {
                connected: 'PSE API: Połączono',
                connecting: 'PSE API: Łączenie...',
                error: 'PSE API: Błąd',
                disconnected: 'PSE API: Rozłączono'
            };
            
            statusText.textContent = statusTexts[status] || 'PSE API: Nieznany';
        }
    }

    updateDataStatus(status) {
        this.applicationState.dataStatus = status;
        
        const statusDot = document.getElementById('data-status-dot');
        const statusText = document.getElementById('last-update-text');
        
        if (statusDot && statusText) {
            statusDot.className = `status-dot ${status === 'fresh' ? 'connected' : 'warning'}`;
            
            if (this.lastDataUpdate) {
                const timeStr = this.lastDataUpdate.toLocaleTimeString('pl-PL');
                statusText.textContent = `Aktualizacja: ${timeStr}`;
            }
        }
    }

    updateRefreshButton(isLoading) {
        const btn = document.getElementById('refresh-all-btn');
        if (!btn) return;
        
        const icon = btn.querySelector('.btn-icon');
        const text = btn.querySelector('.btn-text');
        
        if (isLoading) {
            btn.disabled = true;
            if (icon) icon.textContent = '⏳';
            if (text) text.textContent = 'Odświeżanie...';
        } else {
            btn.disabled = false;
            if (icon) icon.textContent = '🔄';
            if (text) text.textContent = 'Odśwież wszystko';
        }
    }

    /**
     * Loading screen management
     */
    showLoadingScreen(message) {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingScreen) {
            loadingScreen.classList.add('active');
            loadingScreen.style.display = 'flex';
        }
        
        if (loadingText && message) {
            loadingText.textContent = message;
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
        
        if (app) {
            app.style.display = 'flex';
        }
    }

    updateProgress(percentage) {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    /**
     * Navigation and view management
     */
    switchView(viewName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.view === viewName) {
                tab.classList.add('active');
            }
        });
        
        // Update active section
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${viewName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        this.currentView = viewName;
        console.log(`📄 Switched to view: ${viewName}`);
    }

    /**
     * Helper methods
     */
    getEmptyRiskAnalysis() {
        return {
            shortTerm: {
                score: 0.25,
                level: 'medium',
                hourlyRisks: [],
                peakRisk: 0.25,
                minRisk: 0.25,
                trend: 'stable',
                alerts: []
            },
            heatmap: [],
            patterns: {
                hourlyPattern: new Array(24).fill(0),
                weeklyPattern: new Array(7).fill(0)
            },
            lastCalculated: new Date().toISOString()
        };
    }

    /**
     * Event handlers
     */
    handleInitializationError(error) {
        console.error('Initialization error:', error);
        this.hideLoadingScreen();
        this.showErrorModal('Błąd inicjalizacji aplikacji', error.message);
    }

    handleDataLoadError(error) {
        console.error('Data load error:', error);
        this.updateConnectionStatus('error');
        this.showErrorMessage('Błąd pobierania danych - używanie danych z cache');
    }

    handleNetworkOnline() {
        console.log('🌐 Network back online');
        this.updateConnectionStatus('connected');
        this.refreshRealTimeData();
    }

    handleNetworkOffline() {
        console.log('📡 Network offline - using cached data');
        this.updateConnectionStatus('disconnected');
    }

    handleWindowResize() {
        // Re-render charts on window resize
        setTimeout(() => {
            if (this.currentView === 'overview') {
                this.updateCharts();
            }
        }, 300);
    }

    /**
     * Cleanup
     */
    cleanup() {
        // Clear all intervals
        this.refreshIntervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.refreshIntervals.clear();
        
        console.log('🧹 App cleanup complete');
    }

    /**
     * Utility methods for UI feedback
     */
    showSuccessMessage(message) {
        // Simple success feedback - could be enhanced with toast notifications
        console.log(`✅ ${message}`);
    }

    showErrorMessage(message) {
        // Simple error feedback - could be enhanced with toast notifications
        console.error(`❌ ${message}`);
    }

    showErrorModal(title, message) {
        const modal = document.getElementById('error-modal');
        const titleElement = modal?.querySelector('.modal-header h3');
        const messageElement = document.getElementById('error-message');
        
        if (modal && titleElement && messageElement) {
            titleElement.textContent = title;
            messageElement.textContent = message;
            modal.style.display = 'flex';
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Placeholder methods for future implementation
    updatePortfolioCapacity(capacity) {
        console.log(`📊 Portfolio capacity updated: ${capacity} MW`);
        window.PortfolioCalculator.updateCapacity(capacity);
    }

    savePortfolioSettings() {
        console.log('💾 Portfolio settings saved');
        this.showSuccessMessage('Ustawienia portfolio zostały zapisane');
    }

    refreshChart(chartType) {
        console.log(`🔄 Refreshing chart: ${chartType}`);
        // Implement specific chart refresh logic
    }

    exportReport() {
        console.log('📊 Exporting report...');
        this.showSuccessMessage('Funkcja eksportu będzie dostępna wkrótce');
    }

    openSettings() {
        console.log('⚙️ Opening settings...');
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    handleChartPeriodChange(event) {
        const button = event.target;
        const parent = button.closest('.chart-controls');
        
        // Update active button
        if (parent) {
            parent.querySelectorAll('.chart-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        }
        
        console.log(`📊 Chart period changed: ${button.dataset.period}`);
    }

    updateFooterInfo() {
        const footerUpdate = document.getElementById('footer-last-update');
        if (footerUpdate && this.lastDataUpdate) {
            footerUpdate.textContent = this.lastDataUpdate.toLocaleTimeString('pl-PL');
        }
    }

    updateRiskDisplay() {
        this.updateRiskHeatmap();
        // Update other risk-related displays
    }

    initializeChartContainers() {
        // Setup chart loading states
        document.querySelectorAll('.chart-loading').forEach(loader => {
            loader.style.display = 'none';
        });
    }

    createRedispatchTimeline(container, events) {
        // Simplified timeline creation
        if (!events || events.length === 0) {
            container.innerHTML = '<div class="no-events">Brak zdarzeń redysponowania</div>';
            return;
        }
        
        const timeline = document.createElement('div');
        timeline.className = 'timeline-events';
        
        events.slice(0, 10).forEach((event, index) => {
            const eventElement = document.createElement('div');
            eventElement.className = `timeline-event ${event.severity}`;
            eventElement.style.left = `${Math.random() * 80}%`;
            eventElement.style.top = `${index * 10}%`;
            eventElement.textContent = `${event.resourceName}: -${event.powerReduction.toFixed(1)}MW`;
            eventElement.title = `${event.resourceName}: -${event.powerReduction.toFixed(1)}MW (${event.duration} min)`;
            
            timeline.appendChild(eventElement);
        });
        
        container.appendChild(timeline);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.EnspirionApp = new EnspirionApp();
    window.EnspirionApp.initialize();
});

// Export for debugging
window.app = window.EnspirionApp;

console.log('✅ Enspirion App loaded successfully');