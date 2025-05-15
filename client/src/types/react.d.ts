/// <reference types="react" />

import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  interface FormEvent<T = Element> extends React.SyntheticEvent<T> {
    preventDefault(): void;
    stopPropagation(): void;
  }

  interface ChangeEvent<T = Element> extends React.SyntheticEvent<T> {
    target: EventTarget & T;
  }

  interface EventTarget {
    name: string;
    value: string;
    files?: FileList;
  }
} 