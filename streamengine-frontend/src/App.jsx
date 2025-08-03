import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import React, { useEffect, useState } from 'react';
import './index.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [alert, setAlert] = useState(null);

  // Set your threshold here
  const THRESHOLD = 0.9;

  useEffect(() => {
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:4000');
// For API calls, use process.env.REACT_APP_API_URL
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('Raw message:', msg);
        if (msg.value !== 'Test message from backend') {
          // Extract numeric value for charting
          const numericValue = parseFloat(msg.value.match(/[\d.]+/));
          console.log('Extracted numericValue:', numericValue);
          setMessages(prev => [
            {
              ...msg,
              number: !isNaN(numericValue) ? numericValue : null,
            },
            ...prev,
          ]);
          if (!isNaN(numericValue) && numericValue > THRESHOLD) {
            setAlert(`⚠️ Value exceeded threshold: ${numericValue}`);
            setTimeout(() => setAlert(null), 5000);
          }
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    // Log the messages array whenever it updates
    console.log('Messages array:', messages);
  }, [messages]);

  return (
    <div style={{
      maxWidth: 600,
      margin: '40px auto',
      padding: 24,
      background: '#f9f9f9',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', color: '#1976d2' }}>Real-Time Kafka Messages</h1>
      {alert && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: 8,
          marginBottom: 16,
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {alert}
        </div>
      )}
      <LineChart width={500} height={300} data={messages.slice(0, 20).reverse()}>
        <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="number" stroke="#8884d8" />
      </LineChart>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {messages.map((msg, idx) => (
          <li key={idx} style={{
            background: '#fff',
            margin: '12px 0',
            padding: '12px 18px',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <strong>{msg.value}</strong>
            <div style={{ fontSize: 12, color: '#888' }}>{msg.timestamp}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

//