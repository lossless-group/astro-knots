---
title: "Using Test Coverage to Constrain AI Code Assistants"
authors:
  - Michael Staton
date_created: 2025-08-12
date_modified: 2025-08-21
tags: [Explorations, Fine-Tuners]
publish: true
slug: using-test-coverage-to-constrain-ai-code-assistants
at_semantic_version: 0.0.0.1
image_prompt: "A robot representing AI is fully sequestered in a prisoners full body jacket, mask, and chains just like silence of the lambs"
banner_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Using-Test-Coverage-to-Constrain-AI_banner_image_1755820554515_LXR3-zkWM.webp"
portrait_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Using-Test-Coverage-to-Constrain-AI_portrait_image_1755820560605_fP88ZsNeC.webp"
square_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Using-Test-Coverage-to-Constrain-AI_square_image_1755820567410_PSpRWhFep.webp"
site_uuid: e9a97882-f620-4f4c-b2b7-27236cbb6266
hex_code: dqf8c6
type: Explorations
---
## Context

This document demonstrates how comprehensive test coverage can be used to effectively constrain and guide AI code assistants, using the `ModeSwitcher` class as an example.

## Test File Overview

We have a test file at `src/utils/__tests__/mode-switcher.test.js` that tests the `ModeSwitcher` class. The tests are organized using `describe` blocks to group related functionality.

## 1. Setup and Mocks

First, we set up our test environment with mocks in `setup.js`:

```javascript
// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};

// Mock window object
global.window = {
  matchMedia: () => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }),
  localStorage: localStorageMock,
  dispatchEvent: vi.fn(),
  CustomEvent: class {}
};

// Mock document
global.document = {
  documentElement: {
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    hasAttribute: vi.fn().mockReturnValue(false),
    getAttribute: vi.fn().mockReturnValue(null)
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};
```

## 2. Test Cases

### 2.1 Constructor Test

```javascript
it('should initialize with light mode by default', () => {
  expect(switcher.getCurrentMode()).toBe('light');
});
```

Verifies that a new `ModeSwitcher` instance defaults to 'light' mode.

### 2.2 setMode Tests

#### 2.2.1 Setting Dark Mode

```javascript
it('should set and apply dark mode', () => {
  const result = switcher.setMode('dark');
  
  expect(result).toBe('dark');
  expect(switcher.getCurrentMode()).toBe('dark');
  expect(window.localStorage.setItem).toHaveBeenCalledWith('mode', 'dark');
  expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-mode', 'dark');
});
```

**Tests that setting dark mode:**
- Returns 'dark'
- Updates the current mode
- Saves to localStorage
- Sets the correct data attribute on the document

#### 2.2.2 Setting Light Mode

```javascript
it('should set and apply light mode', () => {
  // First set to dark to test the transition
  switcher.setMode('dark');
  vi.clearAllMocks();
  
  const result = switcher.setMode('light');
  
  expect(result).toBe('light');
  expect(switcher.getCurrentMode()).toBe('light');
  expect(window.localStorage.setItem).toHaveBeenCalledWith('mode', 'light');
  expect(document.documentElement.removeAttribute).toHaveBeenCalledWith('data-mode');
});
```

**Tests:**
- Transitioning from dark to light mode
- Verifies the data attribute is removed for light mode

#### 2.2.3 Invalid Mode

```javascript
it('should warn and return current mode for invalid mode', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  
  const result = switcher.setMode('invalid-mode');
  
  expect(result).toBe('light'); // Should remain at default
  expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid mode: invalid-mode. Valid modes are 'light' and 'dark'.");
  
  consoleWarnSpy.mockRestore();
});
```

**Tests:**
- Invalid modes are rejected
- Warning is logged
- Current mode remains unchanged

### 2.3 toggleMode Tests

#### 2.3.1 Toggle from Light to Dark

```javascript
it('should toggle from light to dark mode', () => {
  switcher.toggleMode();
  
  expect(switcher.getCurrentMode()).toBe('dark');
  expect(window.localStorage.setItem).toHaveBeenCalledWith('mode', 'dark');
  expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-mode', 'dark');
});
```

**Tests:**
- Toggling from light to dark
- Mode is saved and applied

#### 2.3.2 Toggle from Dark to Light

```javascript
it('should toggle from dark to light mode', () => {
  // First set to dark
  switcher.setMode('dark');
  vi.clearAllMocks();
  
  switcher.toggleMode();
  
  expect(switcher.getCurrentMode()).toBe('light');
  expect(window.localStorage.setItem).toHaveBeenCalledWith('mode', 'light');
  expect(document.documentElement.removeAttribute).toHaveBeenCalledWith('data-mode');
});
```

**Tests:**
- Toggling from dark to light
- Data attribute is removed

### 2.4 getCurrentMode Test

```javascript
it('should return the current mode', () => {
  expect(switcher.getCurrentMode()).toBe('light');
  
  switcher.setMode('dark');
  expect(switcher.getCurrentMode()).toBe('dark');
});
```

**Verifies:**
- Getter returns the current mode
- Updates correctly after mode changes

## 3. Test Isolation

Each test is isolated because:
- We create a fresh `ModeSwitcher` instance in `beforeEach`
- We clear all mocks between tests
- We restore any spied functions after use

## 4. What These Tests Ensure

- **State Management**: The mode is correctly tracked and updated
- **Persistence**: Modes are properly saved to localStorage
- **DOM Updates**: The correct data attributes are set/removed
- **Error Handling**: Invalid inputs are handled gracefully
- **API Contract**: The public interface behaves as expected

## 5. Potential Additional Tests

While we have good coverage, we could add tests for:
- System preference detection
- Initializing with a stored preference
- Edge cases like localStorage being unavailable
- Integration with the actual UI components

## Conclusion

This comprehensive test suite effectively constrains the behavior of the `ModeSwitcher` class, ensuring that any modifications or refactoring maintain the expected functionality. By testing all public methods and edge cases, we create a safety net that helps prevent regressions and guides future development.