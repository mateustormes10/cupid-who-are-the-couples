export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this._listeners = new Map();

    this.mouse = { x: 0, y: 0, down: false };
    this.worldMouse = { x: 0, y: 0 };

    this.keys = new Map();

    this._onMouseMove = (e) => this._handleMouseMove(e);
    this._onMouseDown = (e) => this._handleMouseDown(e);
    this._onMouseUp = () => (this.mouse.down = false);
    this._onKeyDown = (e) => this._handleKeyDown(e);
    this._onKeyUp = (e) => this._handleKeyUp(e);

    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  on(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }

  emit(type, payload) {
    const list = this._listeners.get(type) ?? [];
    for (const fn of list) fn(payload);
  }

  _handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;

    this.mouse.x = cx;
    this.mouse.y = cy;
    this.worldMouse.x = cx * this.canvas.width;
    this.worldMouse.y = cy * this.canvas.height;
  }

  _handleMouseDown(e) {
    if (e.button !== 0) return;
    this.mouse.down = true;
    this.emit('shoot');
  }

  isKeyDown(code) {
    return this.keys.get(code) === true;
  }

  getMoveVector() {
    const left = this.isKeyDown('KeyA') ? 1 : 0;
    const right = this.isKeyDown('KeyD') ? 1 : 0;
    const up = this.isKeyDown('KeyW') ? 1 : 0;
    const down = this.isKeyDown('KeyS') ? 1 : 0;

    let x = right - left;
    let y = down - up;
    const len = Math.hypot(x, y);
    if (len > 0) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  _handleKeyDown(e) {
    this.keys.set(e.code, true);
    this.emit('key', e.code);
  }

  _handleKeyUp(e) {
    this.keys.set(e.code, false);
  }
}
