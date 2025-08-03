import App from './App';
import React from 'react';
import { render, screen, act } from '@testing-library/react';

// Mock WebSocket
class MockWebSocket {
  static instances = [];
  static listeners = {};
  constructor() {
    MockWebSocket.instances.push(this);
    this.readyState = 1;
    this.listeners = {};
  }
  send() {}
  close() {}
  addEventListener(event, cb) {
    this.listeners[event] = cb;
  }
  set onmessage(fn) {
    this.listeners['message'] = fn;
  }
  set onerror(fn) {
    this.listeners['error'] = fn;
  }
  triggerMessage(data) {
    if (this.listeners['message']) {
      this.listeners['message']({ data: JSON.stringify(data) });
    }
  }
  triggerError(event = {}) {
    if (this.listeners['error']) {
      this.listeners['error'](event);
    }
  }
}
global.WebSocket = MockWebSocket;

describe('App', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
  });

  it('renders the title', () => {
    render(<App />);
    expect(screen.getByText(/Real-Time Kafka Messages/i)).toBeInTheDocument();
  });

  it('shows messages received via WebSocket', async () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];
    const testMsg = {
      value: 'Sensor reading: 0.42',
      timestamp: '2025-08-03T20:24:50.302Z'
    };
    act(() => {
      ws.triggerMessage(testMsg);
    });
    expect(await screen.findByText(/Sensor reading: 0.42/)).toBeInTheDocument();
    const allTimestamps = await screen.findAllByText(/2025-08-03T20:24:50.302Z/);
expect(allTimestamps.length).toBeGreaterThan(0);
  });

  it('shows alert if value exceeds threshold', async () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];
    const testMsg = {
      value: 'Sensor reading: 1.42',
      timestamp: '2025-08-03T20:24:50.302Z'
    };
    act(() => {
      ws.triggerMessage(testMsg);
    });
    expect(await screen.findByText(/Value exceeded threshold/)).toBeInTheDocument();
  });

  it('renders chart with numeric data', async () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];
    const testMsg = {
      value: 'Sensor reading: 0.55',
      timestamp: '2025-08-03T20:24:50.302Z'
    };
    act(() => {
      ws.triggerMessage(testMsg);
    });
    // Chart renders SVG elements
    expect(await screen.findByText(/Sensor reading: 0.55/)).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('handles WebSocket error gracefully', async () => {
    render(<App />);
    const ws = MockWebSocket.instances[0];
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    act(() => {
      ws.triggerError();
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
