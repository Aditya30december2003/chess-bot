// Load Stockfish from CDN
importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/16.0.0/stockfish.js');

// Initialize engine
const engine = new Stockfish();
engine.onmessage = function(event) {
  postMessage(event.data);
};

// Handle messages from main thread
self.onmessage = function(e) {
  const command = e.data;
  
  if (command === 'uci') {
    postMessage('id name Stockfish');
    postMessage('id author T. Romstad, M. Costalba, J. Kiiski, G. Linscott');
    postMessage('uciok');
  }
  else {
    // Forward other commands to Stockfish
    engine.postMessage(command);
  }
};