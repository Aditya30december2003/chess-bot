// src/app/engines/StockfishEngine.js
export class StockfishEngine {
  constructor({ elo = 1200, depth = 12 } = {}) {
    // The asm.js build is itself a Web Worker script.
    // IMPORTANT: leading slash so it resolves from /public
    this.worker = new Worker('/engines/Stockfish.js');

    this._readyUci = false;
    this._readyOk = false;
    this._pending = null; // {resolve, reject}
    this._depth = depth;
    this._elo = elo;

    this._onLine = this._onLine.bind(this);
    this.worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : (e.data?.toString?.() ?? '');
      // console.log('[SF]', line);
      this._onLine(line);
    };

    this._readyPromise = new Promise((res, rej) => {
      this._readyResolve = res;
      this._readyReject = rej;
    });

    // boot
    this._send('uci');
  }

  _send(s) {
    // console.debug('[SF<<]', s);
    this.worker.postMessage(s);
  }

  _onLine(line) {
    if (line.startsWith('info')) return; // noisy

    if (!this._readyUci && line.includes('uciok')) {
      this._readyUci = true;

      // set strength
      this._send('setoption name UCI_LimitStrength value true');
      this._send(`setoption name UCI_Elo value ${Math.max(400, Math.min(3200, this._elo))}`);
      // you can add Skill Level instead if your build supports it:
      // this._send(`setoption name Skill Level value ${Math.round((this._elo - 400) / 2800 * 20)}`);

      // ping ready
      this._send('isready');
      return;
    }

    if (!this._readyOk && line.includes('readyok')) {
      this._readyOk = true;
      this._readyResolve();
      return;
    }

    if (line.startsWith('bestmove')) {
      const parts = line.split(/\s+/);
      const move = parts[1] && parts[1] !== '(none)' ? parts[1] : null;
      if (this._pending) {
        this._pending.resolve(move);
        this._pending = null;
      }
      return;
    }

    if (line.startsWith('error') || line.startsWith('Unknown command')) {
      if (this._pending) {
        this._pending.reject(new Error(line));
        this._pending = null;
      }
    }
  }

  async ready() {
    return this._readyPromise;
  }

  setStrength({ elo, depth }) {
    if (typeof depth === 'number') this._depth = depth;
    if (typeof elo === 'number') this._elo = Math.max(400, Math.min(3200, elo));
    // UCI option can be changed live:
    this._send('setoption name UCI_LimitStrength value true');
    this._send(`setoption name UCI_Elo value ${this._elo}`);
  }

  async getBestMove(fen) {
    if (!this._readyOk) await this.ready();

    // cancel any previous search
    if (this._pending) {
      // engine usually stops on next "position/go", but be explicit:
      this._send('stop');
      this._pending.reject?.(new Error('Search superseded'));
      this._pending = null;
    }

    const depth = this._depth || 12;

    this._send(`position fen ${fen}`);
    this._send(`go depth ${depth}`);

    return new Promise((resolve, reject) => {
      this._pending = { resolve, reject };
      // (optional) add a safety timeout if you want:
      // setTimeout(() => { if (this._pending) { this._send('stop'); reject(new Error('SF timeout')); this._pending = null; } }, 10000);
    });
  }

  destroy() {
    try { this.worker.terminate(); } catch {}
  }
}
