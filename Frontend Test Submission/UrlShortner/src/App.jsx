const { useState, useEffect, useCallback, useMemo } = React;
const { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Snackbar, 
  Alert, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip, 
  IconButton, 
  Divider, 
  CircularProgress
} = MaterialUI;

// Application Configuration
const CONFIG = {
  baseUrl: "http://localhost:3000",
  defaultValidityMinutes: 30,
  maxConcurrentUrls: 5,
  shortCodeLength: 6,
  base62Chars: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  locationData: {
    defaultLocation: "Unknown",
    fallbackLocation: "Local Network"
  },
  validationRules: {
    customShortCodeRegex: /^[a-zA-Z0-9]{3,10}$/,
    minValidityMinutes: 1,
    maxValidityMinutes: 10080
  }
};

// Logging Middleware
class Logger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data || '');
    
    // Store logs in localStorage for persistence
    try {
      const logs = JSON.parse(localStorage.getItem('urlShortener_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('urlShortener_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  }

  static info(message, data) {
    this.log('info', message, data);
  }

  static warn(message, data) {
    this.log('warn', message, data);
  }

  static error(message, data) {
    this.log('error', message, data);
  }

  static debug(message, data) {
    this.log('debug', message, data);
  }
}

// Utility Functions
const Utils = {
  generateBase62: (length = CONFIG.shortCodeLength) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += CONFIG.base62Chars.charAt(Math.floor(Math.random() * CONFIG.base62Chars.length));
    }
    return result;
  },

  validateUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  validateCustomShortCode: (shortCode) => {
    return CONFIG.validationRules.customShortCodeRegex.test(shortCode);
  },

  validateValidity: (validity) => {
    const num = parseInt(validity);
    return !isNaN(num) && num >= CONFIG.validationRules.minValidityMinutes && num <= CONFIG.validationRules.maxValidityMinutes;
  },

  formatDate: (date) => {
    return new Date(date).toLocaleString();
  },

  isExpired: (expiresAt) => {
    return new Date() > new Date(expiresAt);
  },

  getCoarseLocation: () => {
    const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    return locations[Math.floor(Math.random() * locations.length)] || CONFIG.locationData.fallbackLocation;
  },

  getSource: () => {
    return window.location.origin || 'Direct';
  }
};

// URL Shortener Service
class URLShortenerService {
  constructor() {
    this.urls = this.loadUrls();
  }

  loadUrls() {
    try {
      return JSON.parse(localStorage.getItem('urlShortener_urls') || '[]');
    } catch (error) {
      Logger.error('Failed to load URLs from localStorage', { error: error.message });
      return [];
    }
  }

  createShortUrl(originalUrl, customShortCode = null, validityMinutes = CONFIG.defaultValidityMinutes) {
    Logger.info('Creating short URL', { originalUrl, customShortCode, validityMinutes });

    // Validate inputs
    if (!Utils.validateUrl(originalUrl)) {
      throw new Error('Invalid URL format');
    }

    if (!Utils.validateValidity(validityMinutes)) {
      throw new Error('Invalid validity period');
    }

    if (customShortCode && !Utils.validateCustomShortCode(customShortCode)) {
      throw new Error('Invalid custom shortcode format');
    }

    // Generate or validate shortcode
    let shortCode = customShortCode;
    if (!shortCode) {
      do {
        shortCode = Utils.generateBase62();
      } while (this.urls.find(url => url.shortCode === shortCode));
    } else {
      if (this.urls.find(url => url.shortCode === shortCode)) {
        throw new Error('Shortcode already exists');
      }
    }

    // Create URL object
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000);
    
    const urlObj = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      originalUrl,
      shortCode,
      customShortCode: !!customShortCode,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      clicks: 0,
      clickHistory: []
    };

    this.urls.push(urlObj);
    this.saveUrls();

    Logger.info('Short URL created successfully', { shortCode, originalUrl });
    return urlObj;
  }

  getUrlByShortCode(shortCode) {
    return this.urls.find(url => url.shortCode === shortCode);
  }

  recordClick(shortCode) {
    const urlObj = this.getUrlByShortCode(shortCode);
    if (!urlObj) {
      Logger.warn('Short URL not found for click tracking', { shortCode });
      return null;
    }

    if (Utils.isExpired(urlObj.expiresAt)) {
      Logger.warn('Attempted to access expired URL', { shortCode, expiresAt: urlObj.expiresAt });
      throw new Error('URL has expired');
    }

    urlObj.clicks++;
    urlObj.clickHistory.push({
      timestamp: new Date().toISOString(),
      source: Utils.getSource(),
      location: Utils.getCoarseLocation()
    });

    this.saveUrls();
    Logger.info('Click recorded', { shortCode, clicks: urlObj.clicks });
    return urlObj;
  }

  getAllUrls() {
    return [...this.urls];
  }

  saveUrls() {
    try {
      localStorage.setItem('urlShortener_urls', JSON.stringify(this.urls));
    } catch (error) {
      Logger.error('Failed to save URLs to localStorage', { error: error.message });
    }
  }

  clearExpiredUrls() {
    const originalCount = this.urls.length;
    this.urls = this.urls.filter(url => !Utils.isExpired(url.expiresAt));
    const clearedCount = originalCount - this.urls.length;
    
    if (clearedCount > 0) {
      this.saveUrls();
      Logger.info('Expired URLs cleared', { clearedCount });
    }
    
    return clearedCount;
  }

  clearAllUrls() {
    this.urls = [];
    this.saveUrls();
    Logger.info('All URLs cleared');
  }
}

// Initialize service
const urlService = new URLShortenerService();

// URL Form Component
const URLForm = ({ onSubmit, loading }) => {
  const [urls, setUrls] = useState([{ 
    url: '', 
    validity: CONFIG.defaultValidityMinutes.toString(), 
    shortCode: '' 
  }]);
  const [errors, setErrors] = useState({});

  const addUrlField = useCallback(() => {
    if (urls.length < CONFIG.maxConcurrentUrls) {
      setUrls(prev => [...prev, { 
        url: '', 
        validity: CONFIG.defaultValidityMinutes.toString(), 
        shortCode: '' 
      }]);
      Logger.debug('URL field added', { currentCount: urls.length + 1 });
    }
  }, [urls.length]);

  const removeUrlField = useCallback((index) => {
    setUrls(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
    Logger.debug('URL field removed', { index });
  }, []);

  const updateUrl = useCallback((index, field, value) => {
    setUrls(prev => {
      const newUrls = [...prev];
      newUrls[index] = { ...newUrls[index], [field]: value };
      return newUrls;
    });

    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${index}_${field}`];
      return newErrors;
    });
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    urls.forEach((urlData, index) => {
      if (!urlData.url.trim()) {
        newErrors[`${index}_url`] = 'URL is required';
        isValid = false;
      } else if (!Utils.validateUrl(urlData.url)) {
        newErrors[`${index}_url`] = 'Invalid URL format';
        isValid = false;
      }

      if (urlData.validity && !Utils.validateValidity(parseInt(urlData.validity))) {
        newErrors[`${index}_validity`] = `Validity must be between ${CONFIG.validationRules.minValidityMinutes} and ${CONFIG.validationRules.maxValidityMinutes} minutes`;
        isValid = false;
      }

      if (urlData.shortCode && !Utils.validateCustomShortCode(urlData.shortCode)) {
        newErrors[`${index}_shortCode`] = 'Shortcode must be 3-10 alphanumeric characters';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [urls]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    Logger.debug('Form submission attempted', { urlCount: urls.length });
    
    if (validateForm()) {
      const validUrls = urls.filter(urlData => urlData.url.trim());
      onSubmit(validUrls);
    } else {
      Logger.warn('Form validation failed', { errors });
    }
  }, [urls, validateForm, onSubmit]);

  const clearForm = useCallback(() => {
    setUrls([{ 
      url: '', 
      validity: CONFIG.defaultValidityMinutes.toString(), 
      shortCode: '' 
    }]);
    setErrors({});
    Logger.debug('Form cleared');
  }, []);

  return (
    <Card className="url-form-container">
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Create Short URLs
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Enter up to {CONFIG.maxConcurrentUrls} URLs to shorten simultaneously
        </Typography>
        
        <form onSubmit={handleSubmit}>
          {urls.map((urlData, index) => (
            <div key={index} className="url-input-row">
              <TextField
                className="url-field"
                label="Original URL"
                variant="outlined"
                fullWidth
                value={urlData.url}
                onChange={(e) => updateUrl(index, 'url', e.target.value)}
                error={!!errors[`${index}_url`]}
                helperText={errors[`${index}_url`]}
                placeholder="https://example.com/your-long-url"
              />
              
              <TextField
                className="validity-field"
                label="Validity (minutes)"
                variant="outlined"
                type="number"
                value={urlData.validity}
                onChange={(e) => updateUrl(index, 'validity', e.target.value)}
                error={!!errors[`${index}_validity`]}
                helperText={errors[`${index}_validity`]}
                inputProps={{ min: 1, max: 10080 }}
              />
              
              <TextField
                className="shortcode-field"
                label="Custom Shortcode (optional)"
                variant="outlined"
                value={urlData.shortCode}
                onChange={(e) => updateUrl(index, 'shortCode', e.target.value)}
                error={!!errors[`${index}_shortCode`]}
                helperText={errors[`${index}_shortCode`]}
                placeholder="abc123"
              />
              
              {urls.length > 1 && (
                <IconButton
                  className="remove-url-btn"
                  onClick={() => removeUrlField(index)}
                  color="error"
                >
                  <span className="material-icons">remove</span>
                </IconButton>
              )}
            </div>
          ))}
          
          <div className="form-actions">
            <Button
              variant="contained"
              type="submit"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <span className="material-icons">link</span>}
            >
              {loading ? 'Creating...' : 'Create Short URLs'}
            </Button>
            
            {urls.length < CONFIG.maxConcurrentUrls && (
              <Button
                variant="outlined"
                onClick={addUrlField}
                startIcon={<span className="material-icons">add</span>}
              >
                Add URL
              </Button>
            )}
            
            <Button
              variant="outlined"
              onClick={clearForm}
              startIcon={<span className="material-icons">clear</span>}
            >
              Clear All
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Results Display Component
const ResultsDisplay = ({ results, onCopy }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="results-container">
      <Typography variant="h6" gutterBottom>
        Created Short URLs
      </Typography>
      
      {results.map((result, index) => (
        <Card key={result.id} className="result-card">
          <CardContent>
            <div className="result-header">
              <Typography variant="h6">
                URL #{index + 1}
              </Typography>
              <Chip
                label={Utils.isExpired(result.expiresAt) ? 'Expired' : 'Active'}
                className={Utils.isExpired(result.expiresAt) ? 'expired-badge' : 'active-badge'}
                size="small"
              />
            </div>
            
            <div className="result-urls">
              <div className="url-item">
                <Typography className="url-label" variant="body2">
                  Original:
                </Typography>
                <Typography className="url-value" variant="body2">
                  <a href={result.originalUrl} target="_blank" rel="noopener noreferrer">
                    {result.originalUrl}
                  </a>
                </Typography>
              </div>
              
              <div className="url-item">
                <Typography className="url-label" variant="body2">
                  Short URL:
                </Typography>
                <Typography className="url-value" variant="body2">
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    try {
                      const urlObj = urlService.recordClick(result.shortCode);
                      if (urlObj) {
                        window.open(urlObj.originalUrl, '_blank');
                      }
                    } catch (error) {
                      alert(error.message);
                    }
                  }}>
                    {CONFIG.baseUrl}/{result.shortCode}
                  </a>
                </Typography>
                <IconButton
                  className="copy-btn"
                  onClick={() => onCopy(`${CONFIG.baseUrl}/${result.shortCode}`)}
                  size="small"
                >
                  <span className="material-icons">content_copy</span>
                </IconButton>
              </div>
            </div>
            
            <div className="expiry-info">
              <span className="material-icons">schedule</span>
              <Typography variant="body2" color="text.secondary">
                Created: {Utils.formatDate(result.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Expires: {Utils.formatDate(result.expiresAt)}
              </Typography>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// URL Shortener Page Component
const URLShortenerPage = ({ onRefreshStats }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSubmit = useCallback(async (urls) => {
    setLoading(true);
    setResults([]);
    
    try {
      Logger.info('Processing URL shortening request', { count: urls.length });
      
      const shortUrlResults = [];
      
      for (const urlData of urls) {
        try {
          const result = urlService.createShortUrl(
            urlData.url,
            urlData.shortCode || null,
            parseInt(urlData.validity) || CONFIG.defaultValidityMinutes
          );
          shortUrlResults.push(result);
        } catch (error) {
          Logger.error('Error creating short URL', { url: urlData.url, error: error.message });
          throw error;
        }
      }
      
      setResults(shortUrlResults);
      setSnackbar({
        open: true,
        message: `Successfully created ${shortUrlResults.length} short URL(s)`,
        severity: 'success'
      });
      
      // Refresh stats if callback provided
      if (onRefreshStats) {
        onRefreshStats();
      }
      
    } catch (error) {
      Logger.error('URL shortening failed', { error: error.message });
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [onRefreshStats]);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSnackbar({
        open: true,
        message: 'Short URL copied to clipboard!',
        severity: 'success'
      });
      Logger.debug('URL copied to clipboard', { url: text });
    }).catch(() => {
      setSnackbar({
        open: true,
        message: 'Failed to copy URL',
        severity: 'error'
      });
    });
  }, []);

  return (
    <div>
      <URLForm onSubmit={handleSubmit} loading={loading} />
      <ResultsDisplay results={results} onCopy={handleCopy} />
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

// Statistics Page Component
const StatisticsPage = ({ refreshTrigger }) => {
  const [urls, setUrls] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const loadStatistics = useCallback(() => {
    const allUrls = urlService.getAllUrls();
    setUrls(allUrls);
    Logger.debug('Statistics loaded', { urlCount: allUrls.length });
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics, refreshTrigger]);

  const clearExpiredUrls = useCallback(() => {
    const clearedCount = urlService.clearExpiredUrls();
    loadStatistics();
    setSnackbar({
      open: true,
      message: `Cleared ${clearedCount} expired URL(s)`,
      severity: 'info'
    });
  }, [loadStatistics]);

  const clearAllUrls = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all URLs? This cannot be undone.')) {
      urlService.clearAllUrls();
      loadStatistics();
      setSnackbar({
        open: true,
        message: 'All URLs cleared',
        severity: 'info'
      });
    }
  }, [loadStatistics]);

  const handleShortUrlClick = useCallback((shortCode) => {
    try {
      const urlObj = urlService.recordClick(shortCode);
      if (urlObj) {
        window.open(urlObj.originalUrl, '_blank');
        loadStatistics(); // Refresh stats to show updated click count
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  }, [loadStatistics]);

  const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
  const activeUrls = urls.filter(url => !Utils.isExpired(url.expiresAt)).length;
  const expiredUrls = urls.length - activeUrls;

  return (
    <div className="stats-container">
      <div className="stats-header">
        <Typography variant="h4">
          URL Statistics
        </Typography>
        <div>
          <Button
            variant="outlined"
            onClick={clearExpiredUrls}
            style={{ marginRight: '8px' }}
            startIcon={<span className="material-icons">clear</span>}
          >
            Clear Expired
          </Button>
          <Button
            variant="outlined"
            onClick={clearAllUrls}
            color="error"
            startIcon={<span className="material-icons">delete</span>}
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="stats-summary">
        <Card className="stats-card">
          <CardContent>
            <Typography className="stats-number">
              {urls.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total URLs
            </Typography>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent>
            <Typography className="stats-number">
              {activeUrls}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active URLs
            </Typography>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent>
            <Typography className="stats-number">
              {expiredUrls}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Expired URLs
            </Typography>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent>
            <Typography className="stats-number">
              {totalClicks}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Clicks
            </Typography>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            URL Details
          </Typography>
          
          {urls.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No URLs have been created yet. Visit the URL Shortener page to create some short URLs.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Short URL</TableCell>
                    <TableCell>Original URL</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Clicks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {urls.map((url) => (
                    <TableRow key={url.id}>
                      <TableCell>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleShortUrlClick(url.shortCode);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {CONFIG.baseUrl}/{url.shortCode}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a href={url.originalUrl} target="_blank" rel="noopener noreferrer">
                          {url.originalUrl.length > 50 ? url.originalUrl.substring(0, 50) + '...' : url.originalUrl}
                        </a>
                      </TableCell>
                      <TableCell>{Utils.formatDate(url.createdAt)}</TableCell>
                      <TableCell>{Utils.formatDate(url.expiresAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={Utils.isExpired(url.expiresAt) ? 'Expired' : 'Active'}
                          className={Utils.isExpired(url.expiresAt) ? 'expired-badge' : 'active-badge'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{url.clicks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {urls.some(url => url.clickHistory.length > 0) && (
        <Card style={{ marginTop: '24px' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Click Activity
            </Typography>
            
            <div className="click-history">
              {urls
                .filter(url => url.clickHistory.length > 0)
                .map(url => (
                  <div key={url.id}>
                    <Typography variant="subtitle2" gutterBottom>
                      {CONFIG.baseUrl}/{url.shortCode}
                    </Typography>
                    {url.clickHistory.slice(-5).map((click, index) => (
                      <div key={index} className="click-item">
                        <div>
                          <Typography className="click-timestamp">
                            {Utils.formatDate(click.timestamp)}
                          </Typography>
                          <Typography className="click-source">
                            Source: {click.source} • Location: {click.location}
                          </Typography>
                        </div>
                      </div>
                    ))}
                    <Divider style={{ margin: '16px 0' }} />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = useCallback((event, newValue) => {
    setCurrentTab(newValue);
    Logger.debug('Tab changed', { tab: newValue });
  }, []);

  const handleRefreshStats = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    Logger.info('URL Shortener App initialized');
    
    // Clear expired URLs on app start
    const clearedCount = urlService.clearExpiredUrls();
    if (clearedCount > 0) {
      Logger.info('Cleared expired URLs on startup', { count: clearedCount });
    }
  }, []);

  return (
    <div className="app-container">
      <Container maxWidth="lg" className="main-content">
        <Typography variant="h4" gutterBottom style={{ textAlign: 'center', marginBottom: '32px' }}>
          URL Shortener
        </Typography>
        
        <div className="navigation-tabs">
          <Tabs value={currentTab} onChange={handleTabChange} centered>
            <Tab label="Create Short URLs" />
            <Tab label="Statistics" />
          </Tabs>
        </div>

        {currentTab === 0 && <URLShortenerPage onRefreshStats={handleRefreshStats} />}
        {currentTab === 1 && <StatisticsPage refreshTrigger={refreshTrigger} />}
      </Container>
    </div>
  );
};

// Render the application
ReactDOM.render(<App />, document.getElementById('root'));