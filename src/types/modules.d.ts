declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';
  
  interface AutoTableOptions {
    head?: any[][];
    body?: any[][];
    startY?: number;
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      fillColor?: string | number[];
      textColor?: string | number[];
      fontStyle?: string;
    };
    headStyles?: {
      fillColor?: string | number[];
      textColor?: string | number[];
      fontStyle?: string;
    };
    bodyStyles?: {
      fillColor?: string | number[];
      textColor?: string | number[];
    };
    alternateRowStyles?: {
      fillColor?: string | number[];
    };
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    theme?: 'striped' | 'grid' | 'plain';
  }
  
  declare global {
    interface jsPDF {
      autoTable: (options: AutoTableOptions) => jsPDF;
      lastAutoTable?: {
        finalY: number;
      };
    }
  }
}

declare module 'papaparse' {
  export interface ParseConfig<T> {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    transformHeader?: (header: string) => string;
    dynamicTyping?: boolean | { [key: string]: boolean };
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseResult<T>, parser: Parser) => void;
    complete?: (results: ParseResult<T>, file?: File) => void;
    error?: (error: ParseError, file?: File) => void;
    download?: boolean;
    downloadRequestHeaders?: { [key: string]: string };
    skipEmptyLines?: boolean | 'greedy';
    chunk?: (results: ParseResult<T>, parser: Parser) => void;
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string | void;
    withCredentials?: boolean;
    transform?: (value: string, field: string | number) => any;
    delimitersToGuess?: string[];
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields?: string[];
  }

  export interface Parser {
    abort: () => void;
    pause: () => void;
    resume: () => void;
  }

  export interface UnparseConfig {
    quotes?: boolean | boolean[];
    quoteChar?: string;
    escapeChar?: string;
    delimiter?: string;
    header?: boolean;
    newline?: string;
    skipEmptyLines?: boolean | 'greedy';
    columns?: string[];
  }

  export function parse<T = any>(input: string | File, config?: ParseConfig<T>): ParseResult<T>;
  export function unparse(data: any[], config?: UnparseConfig): string;
}
