export declare type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'DISABLED';
declare enum logLevel {
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    DISABLED = 5
}
export interface LoggerConfig {
    logLevel: LogLevel;
    silence?: boolean;
    onwarn?: (message: any, ...optionalParams: any[]) => void;
    onerror?: (message: any, ...optionalParams: any[]) => void;
}
export declare class Logger {
    private config;
    logLevel: logLevel;
    constructor(config: LoggerConfig);
    configure(config: Partial<LoggerConfig>): void;
    debug(message: any, ...optionalParams: any[]): void;
    info(message: any, ...optionalParams: any[]): void;
    warn(message: any, ...optionalParams: any[]): void;
    error(message: any, ...optionalParams: any[]): void;
}
export declare const logger: Logger;
export declare const configureLogger: (config: Partial<LoggerConfig>) => void;
export {};
