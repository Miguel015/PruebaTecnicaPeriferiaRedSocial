import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// stub scroll behavior for jsdom tests
let _scrollY = 0
Object.defineProperty(window, 'scrollY', { get: () => _scrollY })
window.scrollTo = (x: number, y: number) => { _scrollY = y || 0 }
