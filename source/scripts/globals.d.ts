type clog = (...args: any[]) => void;

interface Window {
    clog: clog;
}

declare const clog: clog;
