export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: any;
}

const MAX_LOGS = 1000;

class Logger {
  private logs: LogEntry[] = [];
  
  constructor() {
    this.loadLogs();
  }
  
  private loadLogs(): void {
    try {
      const savedLogs = localStorage.getItem('application-logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs from localStorage', error);
      this.logs = [];
    }
  }
  
  private saveLogs(): void {
    try {
      // Keep only the most recent MAX_LOGS logs
      if (this.logs.length > MAX_LOGS) {
        this.logs = this.logs.slice(-MAX_LOGS);
      }
      
      localStorage.setItem('application-logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs to localStorage', error);
    }
  }
  
  public log(level: LogLevel, message: string, details?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    };
    
    // Log to console as well
    console[level](message, details || '');
    
    // Add to logs array
    this.logs.push(logEntry);
    
    // Save to localStorage
    this.saveLogs();
  }
  
  public info(message: string, details?: any): void {
    this.log('info', message, details);
  }
  
  public warn(message: string, details?: any): void {
    this.log('warn', message, details);
  }
  
  public error(message: string, details?: any): void {
    this.log('error', message, details);
  }
  
  public clear(): void {
    this.logs = [];
    localStorage.removeItem('application-logs');
  }
}

// Create a singleton instance
const logger = new Logger();

export default logger;
