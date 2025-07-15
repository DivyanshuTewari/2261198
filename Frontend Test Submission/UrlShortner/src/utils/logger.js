// This is a mock logger - in a real app, this would send logs to your backend
export function logAction(action, data = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    ...data
  };
  
  // In a real app, this would be an API call to your logging middleware
  console.log('[LOGGER]', logEntry);
  
  // Store logs in localStorage for demo purposes
  const logs = JSON.parse(localStorage.getItem('appLogs') || []);
  logs.push(logEntry);
  localStorage.setItem('appLogs', JSON.stringify(logs));
}