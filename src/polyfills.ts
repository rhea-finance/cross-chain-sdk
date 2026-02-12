import { Buffer } from 'buffer'

if (typeof globalThis.Buffer === 'undefined') {
  ;(globalThis as any).Buffer = Buffer
}

if (typeof globalThis.process === 'undefined') {
  ;(globalThis as any).process = {
    env: {},
    browser: true,
    version: '',
    versions: {},
    nextTick: (cb: () => void) => queueMicrotask(cb),
    pid: 0,
    noDeprecation: true,
    throwDeprecation: false,
    traceDeprecation: false,
    emit: () => {},
  }
}

if (typeof globalThis.global === 'undefined') {
  ;(globalThis as any).global = globalThis
}

export { Buffer }
