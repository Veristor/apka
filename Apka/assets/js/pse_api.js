/**
 * Enspirion Dashboard - PSE API Service
 * Serwis do komunikacji z PSE API v2 z obsługą VPN i corporate firewall
 */

class PSEApiService {
    constructor() {
        this.config = window.EnspirionConfig.PSE;
        this.cache = new Map();
        this.requestQueue = [];
        this.isOnline = navigator.onLine;
        this.lastRequestTime = 0;
        this.requestCount = 0;
        
        this.setupNetworkListeners();
        this.setupRateLimiting();
        
        console.log('🔌 PSE API Service initialized');
    }

    /**
     * Setup network status listeners
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Network connection restored');
            this.processQueuedRequests();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📡 Network connection lost - using cached data');
        });
    }

    /**
     * Setup rate limiting for corporate VPN
     */
    setupRateLimiting() {
        this.rateLimiter = {
            requests: [],
            
            async wait() {
                const now = Date.now();
                
                // Clean old requests
                this.requests = this.requests.filter(
                    time => now - time < window.EnspirionConfig.PSE.rateLimit.windowMs
                );

                // Check if we need to wait
                if (this.requests.length >= window.EnspirionConfig.PSE.rateLimit.maxRequests) {
                    const oldestRequest = Math.min(...this.requests);
                    const waitTime = window.EnspirionConfig.PSE.rateLimit.windowMs - (now - oldestRequest);
                    
                    console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }

                this.requests.push(now);
            }
        };
    }

    /**
     * Main API request method with VPN optimization
     */
    async request(endpoint, params = {}, options = {}) {
        try {
            // Check network connectivity
            if (!this.isOnline) {
                return this.getCachedData(endpoint, params);
            }

            // Rate limiting
            await this.rateLimiter.wait();

            // Build URL
            const url = this.buildUrl(endpoint, params);
            const cacheKey = this.generateCacheKey(endpoint, params);

            // Check cache first (aggressive caching for VPN)
            if (this.cache.has(cacheKey) && !options.forceRefresh) {
                const cached = this.cache.get(cacheKey);
                if (!this.isCacheExpired(cached, options.maxAge)) {
                    console.log(`📦 Cache hit: ${endpoint}`);
                    return cached.data;
                }
            }

            // Make request with retries
            const response = await this.requestWithRetries(url, options);
            
            // Cache response
            this.cacheResponse(cacheKey, response, options);
            
            console.log(`✅ API success: ${endpoint}`);
            return response;

        } catch (error) {
            console.error(`❌ API error: ${endpoint}`, error);
            
            // Fallback to cache on error
            const cachedData = this.getCachedData(endpoint, params);
            if (cachedData) {
                console.log(`📦 Fallback to cache: ${endpoint}`);
                return cachedData;
            }
            
            throw error;
        }
    }

    /**
     * Build request URL with OData parameters
     */
    buildUrl(endpoint, params) {
        const baseUrl = this.config.baseUrl;
        const url = new URL(endpoint, baseUrl);

        // Add OData parameters
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, value.toString());
            }
        });

        return url.toString();
    }

    /**
     * Make request with retries and VPN-optimized timeouts
     */
    async requestWithRetries(url, options = {}) {
        const maxRetries = options.retries || this.config.retries;
        const timeout = options.timeout || this.config.timeout;
        
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 API request attempt ${attempt}/${maxRetries}: ${url}`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Enspirion-Dashboard/2.0.0'
                    },
                    signal: controller.signal,
                    // Corporate firewall optimization
                    cache: 'no-cache',
                    credentials: 'omit'
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data;

            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
                    console.log(`⏳ Retry ${attempt} after ${delay}ms`);
                    await this.delay(delay);
                } else {
                    console.error(`❌ All ${maxRetries} attempts failed for: ${url}`);
                }
            }
        }

        throw lastError;
    }

    /**
     * Cache management
     */
    generateCacheKey(endpoint, params) {
        return `${endpoint}:${JSON.stringify(params)}`;
    }

    cacheResponse(key, data, options = {}) {
        const maxAge = options.maxAge || 300000; // 5 minutes default
        
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
            maxAge: maxAge
        });

        // Cleanup old cache entries
        if (this.cache.size > window.EnspirionConfig.DATA.cache.maxSize) {
            this.cleanupCache();
        }
    }

    isCacheExpired(cached, maxAge) {
        const age = Date.now() - cached.timestamp;
        const cacheMaxAge = maxAge || cached.maxAge;
        return age > cacheMaxAge;
    }

    getCachedData(endpoint, params) {
        const cacheKey = this.generateCacheKey(endpoint, params);
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            console.log(`📦 Using cached data: ${endpoint}`);
            return cached.data;
        }
        
        return null;
    }

    cleanupCache() {
        const entries = Array.from(this.cache.entries());
        const now = Date.now();
        
        // Remove expired entries
        entries.forEach(([key, value]) => {
            if (this.isCacheExpired(value)) {
                this.cache.delete(key);
            }
        });

        console.log(`🧹 Cache cleanup: ${this.cache.size} entries remaining`);
    }

    /**
     * Utility methods
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getToday() {
        return new Date().toISOString().split('T')[0];
    }

    getYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    getDateRange(days) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }

    /**
     * Specific PSE API methods for business logic
     */

    /**
     * Get current PV generation data
     */
    async getPVGeneration(date = null, options = {}) {
        const targetDate = date || this.getToday();
        
        const params = {
            $filter: `business_date eq '${targetDate}'`,
            $select: 'business_date,hour,power,resource_name',
            $orderby: 'hour asc',
            $first: 1000
        };

        const data = await this.request(this.config.endpoints.generation, params, {
            maxAge: 300000, // 5 minutes for current data
            ...options
        });

        return this.processPVGenerationData(data);
    }

    /**
     * Get KSE system load data
     */
    async getSystemLoad(date = null, options = {}) {
        const targetDate = date || this.getToday();
        
        const params = {
            $filter: `business_date eq '${targetDate}'`,
            $select: 'business_date,hour,load',
            $orderby: 'hour asc',
            $first: 24
        };

        const data = await this.request(this.config.endpoints.systemLoad, params, {
            maxAge: 300000, // 5 minutes
            ...options
        });

        return this.processSystemLoadData(data);
    }

    /**
     * Get redispatch events
     */
    async getRedispatchEvents(dateRange = null, options = {}) {
        const range = dateRange || this.getDateRange(30); // Last 30 days
        
        const params = {
            $filter: `business_date ge '${range.start}' and business_date le '${range.end}'`,
            $select: 'business_date,from_dtime,to_dtime,resource_name,direction,pol_min_power_of_unit,pol_max_power_of_unit,limiting_element',
            $orderby: 'from_dtime desc',
            $first: 500
        };

        const data = await this.request(this.config.endpoints.operationalLimits, params, {
            maxAge: 900000, // 15 minutes
            ...options
        });

        return this.processRedispatchData(data);
    }

    /**
     * Get price forecasts (proxy for generation forecasts)
     */
    async getPriceForecasts(date = null, options = {}) {
        const targetDate = date || this.getToday();
        
        const params = {
            $filter: `business_date eq '${targetDate}'`,
            $select: 'business_date,hour,price',
            $orderby: 'hour asc',
            $first: 24
        };

        const data = await this.request(this.config.endpoints.priceForecasts, params, {
            maxAge: 3600000, // 1 hour for forecasts
            ...options
        });

        return this.processPriceForecastData(data);
    }

    /**
     * Data processing methods
     */
    processPVGenerationData(rawData) {
        if (!rawData?.value) return [];

        const pvData = rawData.value.filter(item => 
            this.isPVResource(item.resource_name)
        );

        // Group by hour and sum power
        const hourlyData = {};
        pvData.forEach(item => {
            const hour = parseInt(item.hour);
            const power = parseFloat(item.power) || 0;
            
            if (!hourlyData[hour]) {
                hourlyData[hour] = {
                    hour: hour,
                    totalPower: 0,
                    units: 0,
                    timestamp: new Date(`${item.business_date}T${hour.toString().padStart(2, '0')}:00:00`)
                };
            }
            
            hourlyData[hour].totalPower += power;
            hourlyData[hour].units += 1;
        });

        return Object.values(hourlyData).sort((a, b) => a.hour - b.hour);
    }

    processSystemLoadData(rawData) {
        if (!rawData?.value) return [];

        return rawData.value.map(item => ({
            hour: parseInt(item.hour),
            load: parseFloat(item.load) || 0,
            timestamp: new Date(`${item.business_date}T${item.hour.toString().padStart(2, '0')}:00:00`)
        })).sort((a, b) => a.hour - b.hour);
    }

    processRedispatchData(rawData) {
        if (!rawData?.value) return [];

        return rawData.value
            .filter(item => this.isPVResource(item.resource_name))
            .map(item => ({
                resourceName: item.resource_name,
                direction: item.direction,
                fromTime: new Date(item.from_dtime),
                toTime: new Date(item.to_dtime),
                minPower: parseFloat(item.pol_min_power_of_unit) || 0,
                maxPower: parseFloat(item.pol_max_power_of_unit) || 0,
                limitingElement: item.limiting_element,
                severity: this.calculateRedispatchSeverity(item),
                duration: this.calculateDuration(item.from_dtime, item.to_dtime),
                powerReduction: (parseFloat(item.pol_max_power_of_unit) || 0) - (parseFloat(item.pol_min_power_of_unit) || 0)
            }))
            .sort((a, b) => b.fromTime - a.fromTime);
    }

    processPriceForecastData(rawData) {
        if (!rawData?.value) return [];

        return rawData.value.map(item => ({
            hour: parseInt(item.hour),
            price: parseFloat(item.price) || 0,
            timestamp: new Date(`${item.business_date}T${item.hour.toString().padStart(2, '0')}:00:00`)
        })).sort((a, b) => a.hour - b.hour);
    }

    /**
     * Helper methods
     */
    isPVResource(resourceName) {
        if (!resourceName) return false;
        
        const pvFilters = window.EnspirionConfig.DATA.transformation.pvResourceFilters;
        return pvFilters.some(filter => 
            resourceName.toUpperCase().includes(filter.toUpperCase())
        );
    }

    calculateRedispatchSeverity(item) {
        const powerReduction = (parseFloat(item.pol_max_power_of_unit) || 0) - 
                              (parseFloat(item.pol_min_power_of_unit) || 0);
        
        if (powerReduction > 10) return 'critical';
        if (powerReduction > 5) return 'high';
        if (powerReduction > 1) return 'medium';
        return 'low';
    }

    calculateDuration(fromTime, toTime) {
        const start = new Date(fromTime);
        const end = new Date(toTime);
        return Math.round((end - start) / (1000 * 60)); // minutes
    }

    /**
     * Queue management for offline scenarios
     */
    queueRequest(endpoint, params, options) {
        this.requestQueue.push({
            endpoint,
            params,
            options,
            timestamp: Date.now()
        });
    }

    async processQueuedRequests() {
        if (this.requestQueue.length === 0) return;

        console.log(`🔄 Processing ${this.requestQueue.length} queued requests`);
        
        const requests = [...this.requestQueue];
        this.requestQueue = [];

        for (const request of requests) {
            try {
                await this.request(request.endpoint, request.params, request.options);
            } catch (error) {
                console.error('❌ Failed to process queued request:', error);
            }
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const testEndpoint = this.config.endpoints.systemLoad;
            const params = {
                $select: 'business_date',
                $first: 1
            };
            
            await this.request(testEndpoint, params, {
                timeout: 5000,
                retries: 1
            });
            
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                latency: Date.now() - this.lastRequestTime
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get API statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            requestCount: this.requestCount,
            queueLength: this.requestQueue.length,
            isOnline: this.isOnline,
            rateLimitRequests: this.rateLimiter.requests.length,
            lastRequestTime: this.lastRequestTime
        };
    }
}

// Create global PSE API service instance
window.PSEApiService = new PSEApiService();

// Export for modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PSEApiService;
}

console.log('✅ PSE API Service loaded successfully');