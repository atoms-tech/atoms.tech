/**
 * Real-time Performance Tests
 * Testing WebSocket, SSE, and real-time feature performance
 */

const WebSocket = require('ws');
const EventSource = require('eventsource');
const { performance } = require('perf_hooks');

describe('Real-time Performance Tests', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const WS_URL = BASE_URL.replace('http', 'ws');
  
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  describe('WebSocket Performance', () => {
    test('WebSocket connection establishment time', async () => {
      const startTime = performance.now();
      
      const ws = new WebSocket(`${WS_URL}/ws`);
      
      const connectionTime = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          resolve(performance.now() - startTime);
        });
        
        ws.on('error', reject);
      });
      
      ws.close();
      
      console.log('WebSocket Connection Time:', `${connectionTime.toFixed(2)}ms`);
      expect(connectionTime).toBeLessThan(1000); // Less than 1 second
    });

    test('WebSocket message latency', async () => {
      const ws = new WebSocket(`${WS_URL}/ws`);
      const latencies = [];
      
      await new Promise(resolve => {
        ws.on('open', resolve);
      });
      
      // Send multiple messages and measure round-trip time
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        const messageId = `test-${i}-${Date.now()}`;
        
        const latency = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Message timeout'));
          }, 5000);
          
          ws.send(JSON.stringify({
            type: 'ping',
            id: messageId,
            timestamp: startTime,
          }));
          
          const messageHandler = (data) => {
            try {
              const message = JSON.parse(data);
              if (message.id === messageId) {
                clearTimeout(timeout);
                ws.removeListener('message', messageHandler);
                resolve(performance.now() - startTime);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          };
          
          ws.on('message', messageHandler);
        });
        
        latencies.push(latency);
        await delay(100); // Small delay between messages
      }
      
      ws.close();
      
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);
      
      console.log('WebSocket Message Latency:', {
        avgLatency: `${avgLatency.toFixed(2)}ms`,
        maxLatency: `${maxLatency.toFixed(2)}ms`,
        minLatency: `${minLatency.toFixed(2)}ms`,
      });
      
      expect(avgLatency).toBeLessThan(100); // Less than 100ms average
      expect(maxLatency).toBeLessThan(500); // Less than 500ms max
    });

    test('WebSocket concurrent connections performance', async () => {
      const connectionCount = 50;
      const connections = [];
      const connectionTimes = [];
      
      // Create connections in parallel
      const connectionPromises = Array.from({ length: connectionCount }, async (_, i) => {
        const startTime = performance.now();
        const ws = new WebSocket(`${WS_URL}/ws`);
        
        const connectionTime = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Connection ${i} timeout`));
          }, 10000);
          
          ws.on('open', () => {
            clearTimeout(timeout);
            resolve(performance.now() - startTime);
          });
          
          ws.on('error', reject);
        });
        
        connections.push(ws);
        connectionTimes.push(connectionTime);
        
        return { ws, connectionTime };
      });
      
      const results = await Promise.all(connectionPromises);
      
      // Close all connections
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      
      const avgConnectionTime = connectionTimes.reduce((sum, time) => sum + time, 0) / connectionTimes.length;
      const maxConnectionTime = Math.max(...connectionTimes);
      
      console.log('WebSocket Concurrent Connections:', {
        connectionCount,
        avgConnectionTime: `${avgConnectionTime.toFixed(2)}ms`,
        maxConnectionTime: `${maxConnectionTime.toFixed(2)}ms`,
        successRate: `${(results.length / connectionCount * 100).toFixed(2)}%`,
      });
      
      expect(avgConnectionTime).toBeLessThan(2000); // Less than 2 seconds average
      expect(results.length).toBe(connectionCount); // All connections successful
    });

    test('WebSocket message throughput', async () => {
      const ws = new WebSocket(`${WS_URL}/ws`);
      let messagesReceived = 0;
      let messagesSent = 0;
      
      await new Promise(resolve => {
        ws.on('open', resolve);
      });
      
      // Count received messages
      ws.on('message', () => {
        messagesReceived++;
      });
      
      const startTime = performance.now();
      const testDuration = 5000; // 5 seconds
      
      // Send messages continuously
      const sendInterval = setInterval(() => {
        if (performance.now() - startTime < testDuration) {
          ws.send(JSON.stringify({
            type: 'throughput-test',
            data: 'test-data',
            timestamp: Date.now(),
          }));
          messagesSent++;
        } else {
          clearInterval(sendInterval);
        }
      }, 10); // Send every 10ms
      
      // Wait for test duration
      await delay(testDuration + 1000);
      
      ws.close();
      
      const messagesPerSecond = messagesSent / (testDuration / 1000);
      const deliveryRate = messagesReceived / messagesSent;
      
      console.log('WebSocket Throughput:', {
        messagesSent,
        messagesReceived,
        messagesPerSecond: messagesPerSecond.toFixed(2),
        deliveryRate: `${(deliveryRate * 100).toFixed(2)}%`,
      });
      
      expect(messagesPerSecond).toBeGreaterThan(50); // At least 50 messages/second
      expect(deliveryRate).toBeGreaterThan(0.8); // At least 80% delivery rate
    });
  });

  describe('Server-Sent Events Performance', () => {
    test('SSE connection establishment time', async () => {
      const startTime = performance.now();
      
      const eventSource = new EventSource(`${BASE_URL}/api/events`);
      
      const connectionTime = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('SSE connection timeout'));
        }, 5000);
        
        eventSource.onopen = () => {
          clearTimeout(timeout);
          resolve(performance.now() - startTime);
        };
        
        eventSource.onerror = reject;
      });
      
      eventSource.close();
      
      console.log('SSE Connection Time:', `${connectionTime.toFixed(2)}ms`);
      expect(connectionTime).toBeLessThan(2000); // Less than 2 seconds
    });

    test('SSE message delivery performance', async () => {
      const eventSource = new EventSource(`${BASE_URL}/api/events`);
      const events = [];
      
      await new Promise(resolve => {
        eventSource.onopen = resolve;
      });
      
      // Collect events for test duration
      const testDuration = 10000; // 10 seconds
      const startTime = performance.now();
      
      eventSource.onmessage = (event) => {
        events.push({
          data: event.data,
          timestamp: Date.now(),
          receivedAt: performance.now(),
        });
      };
      
      await delay(testDuration);
      eventSource.close();
      
      const eventsPerSecond = events.length / (testDuration / 1000);
      const avgTimeBetweenEvents = events.length > 1 ? 
        (events[events.length - 1].receivedAt - events[0].receivedAt) / (events.length - 1) : 0;
      
      console.log('SSE Message Delivery:', {
        eventsReceived: events.length,
        eventsPerSecond: eventsPerSecond.toFixed(2),
        avgTimeBetweenEvents: `${avgTimeBetweenEvents.toFixed(2)}ms`,
      });
      
      expect(events.length).toBeGreaterThan(0); // Should receive at least some events
      expect(eventsPerSecond).toBeGreaterThan(0.1); // At least 0.1 events/second
    });

    test('SSE concurrent connections performance', async () => {
      const connectionCount = 25;
      const connections = [];
      const allEvents = [];
      
      // Create multiple SSE connections
      for (let i = 0; i < connectionCount; i++) {
        const eventSource = new EventSource(`${BASE_URL}/api/events`);
        connections.push(eventSource);
        
        eventSource.onmessage = (event) => {
          allEvents.push({
            connectionId: i,
            data: event.data,
            timestamp: Date.now(),
          });
        };
      }
      
      // Wait for connections to establish
      await delay(2000);
      
      // Collect events for test duration
      const testDuration = 8000; // 8 seconds
      await delay(testDuration);
      
      // Close all connections
      connections.forEach(eventSource => {
        eventSource.close();
      });
      
      const eventsPerConnection = allEvents.length / connectionCount;
      const uniqueConnections = new Set(allEvents.map(e => e.connectionId)).size;
      
      console.log('SSE Concurrent Connections:', {
        connectionCount,
        totalEvents: allEvents.length,
        eventsPerConnection: eventsPerConnection.toFixed(2),
        activeConnections: uniqueConnections,
      });
      
      expect(uniqueConnections).toBeGreaterThan(connectionCount * 0.8); // At least 80% connections active
      expect(eventsPerConnection).toBeGreaterThan(0); // Some events per connection
    });
  });

  describe('Real-time Data Synchronization Performance', () => {
    test('Document collaboration performance', async () => {
      const ws1 = new WebSocket(`${WS_URL}/ws`);
      const ws2 = new WebSocket(`${WS_URL}/ws`);
      
      // Wait for both connections
      await Promise.all([
        new Promise(resolve => ws1.on('open', resolve)),
        new Promise(resolve => ws2.on('open', resolve)),
      ]);
      
      const documentId = 'test-doc-123';
      const updates = [];
      const latencies = [];
      
      // Subscribe to document updates
      ws1.send(JSON.stringify({
        type: 'subscribe',
        documentId,
      }));
      
      ws2.send(JSON.stringify({
        type: 'subscribe',
        documentId,
      }));
      
      // Listen for updates on ws1
      ws1.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'document-update') {
            const latency = Date.now() - message.timestamp;
            latencies.push(latency);
            updates.push(message);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });
      
      // Send updates from ws2
      const updateCount = 10;
      for (let i = 0; i < updateCount; i++) {
        ws2.send(JSON.stringify({
          type: 'document-update',
          documentId,
          change: {
            type: 'insert',
            position: i,
            text: `Update ${i}`,
          },
          timestamp: Date.now(),
        }));
        
        await delay(100);
      }
      
      // Wait for all updates to be received
      await delay(2000);
      
      ws1.close();
      ws2.close();
      
      const avgLatency = latencies.length > 0 ? 
        latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
      const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
      
      console.log('Document Collaboration Performance:', {
        updatesSent: updateCount,
        updatesReceived: updates.length,
        avgLatency: `${avgLatency.toFixed(2)}ms`,
        maxLatency: `${maxLatency.toFixed(2)}ms`,
        syncRate: `${(updates.length / updateCount * 100).toFixed(2)}%`,
      });
      
      expect(updates.length).toBeGreaterThan(updateCount * 0.8); // At least 80% sync rate
      expect(avgLatency).toBeLessThan(500); // Less than 500ms average latency
    });

    test('Real-time notifications performance', async () => {
      const ws = new WebSocket(`${WS_URL}/ws`);
      const notifications = [];
      
      await new Promise(resolve => {
        ws.on('open', resolve);
      });
      
      // Subscribe to notifications
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'notifications',
      }));
      
      // Listen for notifications
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'notification') {
            notifications.push({
              ...message,
              receivedAt: Date.now(),
            });
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });
      
      // Trigger notifications (simulate from another source)
      const notificationCount = 5;
      for (let i = 0; i < notificationCount; i++) {
        // In a real scenario, this would be triggered by backend events
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'trigger-notification',
            notification: {
              id: `notif-${i}`,
              message: `Test notification ${i}`,
              timestamp: Date.now(),
            },
          }));
        }, i * 500);
      }
      
      // Wait for notifications
      await delay(5000);
      
      ws.close();
      
      const avgDeliveryTime = notifications.length > 0 ? 
        notifications.reduce((sum, notif) => sum + (notif.receivedAt - notif.timestamp), 0) / notifications.length : 0;
      
      console.log('Real-time Notifications Performance:', {
        notificationsExpected: notificationCount,
        notificationsReceived: notifications.length,
        avgDeliveryTime: `${avgDeliveryTime.toFixed(2)}ms`,
        deliveryRate: `${(notifications.length / notificationCount * 100).toFixed(2)}%`,
      });
      
      expect(notifications.length).toBeGreaterThan(0); // Should receive some notifications
      expect(avgDeliveryTime).toBeLessThan(1000); // Less than 1 second delivery time
    });
  });

  describe('Real-time Performance Under Load', () => {
    test('WebSocket performance under high message volume', async () => {
      const ws = new WebSocket(`${WS_URL}/ws`);
      let messagesSent = 0;
      let messagesReceived = 0;
      const errors = [];
      
      await new Promise(resolve => {
        ws.on('open', resolve);
      });
      
      // Handle incoming messages
      ws.on('message', () => {
        messagesReceived++;
      });
      
      ws.on('error', (error) => {
        errors.push(error.message);
      });
      
      // Send high volume of messages
      const messagesPerSecond = 100;
      const testDuration = 5000; // 5 seconds
      const totalMessages = (messagesPerSecond * testDuration) / 1000;
      
      const startTime = performance.now();
      
      const sendMessages = () => {
        if (performance.now() - startTime < testDuration && messagesSent < totalMessages) {
          ws.send(JSON.stringify({
            type: 'load-test',
            id: messagesSent,
            timestamp: Date.now(),
          }));
          messagesSent++;
          
          // Schedule next message
          setTimeout(sendMessages, 1000 / messagesPerSecond);
        }
      };
      
      sendMessages();
      
      // Wait for test completion
      await delay(testDuration + 2000);
      
      ws.close();
      
      const actualMessagesPerSecond = messagesSent / (testDuration / 1000);
      const messageDeliveryRate = messagesReceived / messagesSent;
      
      console.log('WebSocket High Volume Performance:', {
        messagesSent,
        messagesReceived,
        actualMessagesPerSecond: actualMessagesPerSecond.toFixed(2),
        messageDeliveryRate: `${(messageDeliveryRate * 100).toFixed(2)}%`,
        errorCount: errors.length,
      });
      
      expect(messageDeliveryRate).toBeGreaterThan(0.9); // At least 90% delivery rate
      expect(errors.length).toBeLessThan(messagesSent * 0.1); // Less than 10% error rate
    });
  });
});