import { FillStatus, Tetromino, TetrominoShape } from "./util";

const CELLS_X = 10;
const CELLS_Y = 20;

export default class Playfield {
  private ctx: CanvasRenderingContext2D;
  private field: (string | null)[][];
  private tetromino: {
    x: number;
    y: number;
    type: Tetromino;
    rotation: number;
  } | null = null;
  private tetrominoTimeout: number | null = null;
  private pixelSize: number;
  constructor(
    private canvas: HTMLCanvasElement,
    private onCommit: () => void,
    private onLinesCleared: (count: number) => void
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.init();
  }

  // init
  private init = () => {
    this.initField();
    this.initScale();
    this.initListeners();
  };
  private createArr = <T>(rows: number, cols: number, fill: T): T[][] => {
    const arr: T[][] = [];
    for (let i = 0; i < rows; i++) {
      arr.push(new Array(cols).fill(fill));
    }
    return arr;
  };
  private initField = () => {
    this.field = this.createArr(CELLS_Y, CELLS_X, null);
  };
  private initScale = () => {
    const { width, height } = this.canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio;

    this.canvas.setAttribute("width", width * ratio + "px");
    this.canvas.setAttribute("height", height * ratio + "px");
    this.canvas.setAttribute("style", `width=${width}px;height=${height}px`);
    this.ctx.scale(ratio, ratio);

    this.pixelSize = Math.floor(
      this.canvas.getBoundingClientRect().width / CELLS_X
    );
  };
  private initListeners = () => {
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        this.onKeyDown();
      }
      if (e.key === "ArrowLeft") {
        this.onKeyLeft();
      }
      if (e.key === "ArrowRight") {
        this.onKeyRight();
      }
      if (e.key === "ArrowUp") {
        this.onKeyUp();
      }
    });
  };

  // events
  private onKeyDown = () => {
    if (!this.moveTetromino(0, 1)) {
      // if we can't move it any further down, then commit it
      this.commitTetromino();
    } else {
      this.startTimeout();
    }
  };
  private onKeyLeft = () => {
    this.moveTetromino(-1, 0);
  };
  private onKeyRight = () => {
    this.moveTetromino(1, 0);
  };
  private onKeyUp = () => {
    if (this.tetromino == null) {
      return;
    }
    const newRotation = (this.tetromino.rotation + 1) % 4;
    if (
      this.canTetronimoFit(
        this.tetromino.x,
        this.tetromino.y,
        this.tetromino.type,
        newRotation
      )
    ) {
      this.clearTetromino();
      this.tetromino.rotation = newRotation;
      this.drawTetromino();
    }
  };
  public addTetromino(type: Tetromino) {
    this.tetromino = {
      x: Math.min(CELLS_X / 2 - 2),
      y: -1,
      type,
      rotation: 0,
    };
    this.drawTetromino(false);
    this.startTimeout();
  }

  // moving
  private clearTimeout = () => {
    if (this.tetrominoTimeout != null) {
      clearTimeout(this.tetrominoTimeout);
    }
  };
  private startTimeout = () => {
    this.clearTimeout();
    this.tetrominoTimeout = setTimeout(this.onKeyDown, 1000);
  };
  private canTetronimoFit(
    x: number,
    y: number,
    type: Tetromino,
    rotation: number
  ) {
    const content = this.getTetrominoContent(type, rotation);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (content[row][col] === 1) {
          const cellX = x + col;
          const cellY = y + row;
          // check bounds
          if (cellX < 0 || cellX >= CELLS_X || cellY < 0 || cellY >= CELLS_Y) {
            return false;
          }
          // check for conflicts
          if (this.field[cellY][cellX] != null) {
            return false;
          }
        }
      }
    }
    return true;
  }
  private moveTetromino = (x: number, y: number) => {
    if (this.tetromino == null) {
      return false;
    }
    const newX = this.tetromino.x + x;
    const newY = this.tetromino.y + y;
    // we can make this move, let's do it
    if (
      this.canTetronimoFit(
        newX,
        newY,
        this.tetromino.type,
        this.tetromino.rotation
      )
    ) {
      this.clearTetromino();
      this.tetromino.x = newX;
      this.tetromino.y = newY;
      this.drawTetromino();
      return true;
    }
    return false;
  };
  private commitTetromino = () => {
    if (this.tetromino == null) {
      return;
    }
    const { type, rotation, x, y } = this.tetromino;
    const content = this.getTetrominoContent(type, rotation);
    const color = TetrominoShape[type].fill;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (content[row][col] === 1) {
          this.field[y + row][x + col] = color;
        }
      }
    }
    this.tetromino = null;
    this.clearLines();
    this.onCommit();
  };
  private clearLines = () => {
    let linesCleared = 0;
    let confirmNoClear = false;
    while (!confirmNoClear) {
      confirmNoClear = true;
      for (let i = 0; i < this.field.length; i++) {
        if (!this.field[i].includes(null)) {
          confirmNoClear = false;
          linesCleared++;
          this.field.splice(i, 1);
          this.field = [new Array(CELLS_X).fill(null), ...this.field];
        }
      }
    }
    if (linesCleared > 0) {
      this.ctx.clearRect(
        0,
        0,
        this.pixelSize * CELLS_X,
        this.pixelSize * CELLS_Y
      );
      for (let row = 0; row < this.field.length; row++) {
        for (let col = 0; col < this.field[row].length; col++) {
          if (this.field[row][col] != null) {
            this.drawPixel(this.field[row][col], col, row);
          }
        }
      }
      this.drawTetromino();
      this.onLinesCleared(linesCleared);
    }
  };

  // rendering
  private getTetrominoContent = (type: Tetromino, rotation: number) => {
    return TetrominoShape[type].rotations[rotation];
  };
  private drawPixel = (color: string | null, x: number, y: number) => {
    const realX = x * this.pixelSize;
    const realY = y * this.pixelSize;
    this.ctx.beginPath();
    if (color === null) {
      this.ctx.clearRect(realX, realY, this.pixelSize, this.pixelSize);
    } else {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(realX, realY, this.pixelSize, this.pixelSize);
    }
  };
  private drawTetromino = (clear?: boolean) => {
    if (this.tetromino == null) {
      return;
    }
    const { type, x, y, rotation } = this.tetromino;
    const content = this.getTetrominoContent(type, rotation);
    const color = clear ? null : TetrominoShape[type].fill;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (content[row][col] === 1) {
          this.drawPixel(color, x + col, y + row);
        }
      }
    }
  };
  private clearTetromino = () => {
    this.drawTetromino(true);
  };
}
