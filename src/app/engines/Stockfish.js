export class StockfishEngine {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.currentPosition = '';
    this.engineStrength = 1500;
    this.depth = 15;
    this.moveCallback = null;
    this.initEngine();
  }

  initEngine() {
    try {
      // Create worker from public file to avoid static analysis issues
      this.worker = new Worker(new URL('../engines/stockfish-worker', import.meta.url));
      
      this.worker.onmessage = (event) => {
        const message = event.data;
        console.log('Stockfish:', message);
        
        if (message.includes('uciok')) {
          this.isReady = true;
          this.configureEngine();
        } else if (message.startsWith('bestmove')) {
          const bestMove = message.split(' ')[1];
          if (this.moveCallback && bestMove && bestMove !== '(none)') {
            this.moveCallback(bestMove);
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('Stockfish Worker error:', error);
        this.cleanup();
      };

      // Start UCI protocol
      this.worker.postMessage('uci');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      this.cleanup();
    }
  }

  configureEngine() {
    if (!this.worker || !this.isReady) return;
    
    this.worker.postMessage('setoption name Skill Level value 10');
    this.worker.postMessage('setoption name UCI_LimitStrength value true');
    this.worker.postMessage(`setoption name UCI_Elo value ${this.engineStrength}`);
    this.worker.postMessage('isready');
  }

  getBestMove(fen, callback) {
    if (!this.worker || !this.isReady) {
      console.warn('Stockfish not ready');
      callback(null);
      return;
    }

    this.moveCallback = callback;
    this.currentPosition = fen;
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${this.depth}`);
  }

  cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;
  }

  destroy() {
    this.cleanup();
  }
}