import roundRect from "./roundRect";
import { randomTetromino, Tetromino, TetrominoShape } from "./util";

const CELLS_X = 10;
const CELLS_Y = 20;

class Base {
  protected ctx: CanvasRenderingContext2D;
  protected pixelSize: number;
  constructor(protected canvas: HTMLCanvasElement, cellXCount: number) {
    this.ctx = canvas.getContext("2d")!;
    this.initScale(cellXCount);
  }
  private initScale = (cellXCount: number) => {
    const { width, height } = this.canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio;

    this.canvas.setAttribute("width", width * ratio + "px");
    this.canvas.setAttribute("height", height * ratio + "px");
    this.canvas.setAttribute("style", `width=${width}px;height=${height}px`);
    this.ctx.scale(ratio, ratio);

    this.pixelSize = Math.floor(
      this.canvas.getBoundingClientRect().width / cellXCount
    );
  };
  protected getTetrominoContent = (type: Tetromino, rotation: number) => {
    return TetrominoShape[type].rotations[rotation];
  };
  protected drawPixel = (color: string | null, x: number, y: number) => {
    const realX = x * this.pixelSize;
    const realY = y * this.pixelSize;
    this.ctx.beginPath();
    if (color === null) {
      this.ctx.clearRect(realX, realY, this.pixelSize, this.pixelSize);
    } else {
      var grd = this.ctx.createLinearGradient(
        realX - this.pixelSize * 0.5,
        realY - this.pixelSize * 0.5,
        realX + this.pixelSize * 2,
        realY + this.pixelSize * 2
      );
      grd.addColorStop(0, color);
      grd.addColorStop(1, "white");
      this.ctx.fillStyle = grd;
      this.ctx.strokeStyle = color;
      roundRect(this.ctx, realX, realY, this.pixelSize, this.pixelSize, 5);
      this.ctx.fill();
      roundRect(
        this.ctx,
        realX + 0.5,
        realY + 0.5,
        this.pixelSize - 1,
        this.pixelSize - 1,
        5
      );
      this.ctx.stroke();
    }
  };
  protected drawTetromino = (
    color: string | null,
    x: number,
    y: number,
    type: Tetromino,
    rotation: number
  ) => {
    const content = this.getTetrominoContent(type, rotation);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (content[row][col] === 1) {
          this.drawPixel(color, x + col, y + row);
        }
      }
    }
  };
}

class Preview extends Base {
  constructor() {
    super(document.querySelector("#preview")!, 4);
  }
  public render(type: Tetromino) {
    this.ctx.clearRect(0, 0, this.pixelSize * 4, this.pixelSize * 4);
    const color = TetrominoShape[type].fill;
    this.drawTetromino(
      color,
      type === Tetromino.I || type === Tetromino.O ? 0 : 0.5,
      type === Tetromino.I ? 0.75 : 1.25,
      type,
      0
    );
  }
}

export default class Playfield extends Base {
  private field: (string | null)[][];
  private tetromino: {
    x: number;
    y: number;
    type: Tetromino;
    rotation: number;
  } | null = null;
  private tetrominoTimeout: number | null = null;
  private preview: Preview;
  private nextTetromino: Tetromino;
  constructor(
    canvas: HTMLCanvasElement,
    private onLinesCleared: (count: number) => void
  ) {
    super(canvas, CELLS_X);
    this.preview = new Preview();
    this.initField();
    this.initListeners();
    this.addTetromino(randomTetromino());
    this.genNextTetromino();
  }
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
      console.log(e.key);
      if (e.key === " ") {
        this.onSpace();
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
  private onSpace = () => {
    if (this.tetromino == null) {
      return;
    }
    this.clearCurrentTetromino();
    this.tetromino.y = this.getForceDropY(
      this.tetromino.x,
      this.tetromino.y,
      this.tetromino.type,
      this.tetromino.rotation
    );
    this.drawCurrentTetromino();
    this.commitTetromino();
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
      this.clearCurrentTetromino();
      this.tetromino.rotation = newRotation;
      this.drawCurrentTetromino();
    }
  };
  public addTetromino(type: Tetromino) {
    const x = Math.min(CELLS_X / 2 - 2);
    const y = -1;
    const rotation = 0;
    this.tetromino = {
      x,
      y,
      type,
      rotation,
    };
    this.drawCurrentTetromino(false);
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
  private getForceDropY(
    x: number,
    y: number,
    type: Tetromino,
    rotation: number
  ): number {
    let yAdd = 0;
    while (this.canTetronimoFit(x, y + yAdd + 1, type, rotation)) {
      yAdd++;
    }
    return y + yAdd;
  }
  private canTetronimoFit(
    x: number,
    y: number,
    type: Tetromino,
    rotation: number,
    skipBoundaryCheck: boolean = false
  ) {
    const content = this.getTetrominoContent(type, rotation);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (content[row][col] === 1) {
          const cellX = x + col;
          const cellY = y + row;
          // check bounds
          if (!skipBoundaryCheck) {
            if (cellX < 0 || cellX >= CELLS_X || cellY >= CELLS_Y) {
              return false;
            }
          }
          // check for conflicts
          if (
            cellY in this.field &&
            cellX in this.field[cellY] &&
            this.field[cellY][cellX] != null
          ) {
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
      this.clearCurrentTetromino();
      this.tetromino.x = newX;
      this.tetromino.y = newY;
      this.drawCurrentTetromino();
      return true;
    }
    return false;
  };
  private commitTetromino = () => {
    if (this.tetromino == null) {
      return;
    }
    const { type, rotation, x, y } = this.tetromino;
    if (y === -1) {
      this.onLinesCleared(0);
      this.initField();
      this.ctx.clearRect(
        0,
        0,
        this.pixelSize * CELLS_X,
        this.pixelSize * CELLS_Y
      );
    } else {
      const content = this.getTetrominoContent(type, rotation);
      const color = TetrominoShape[type].fill;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (content[row][col] === 1) {
            this.field[y + row][x + col] = color;
          }
        }
      }
    }
    this.tetromino = null;
    this.clearLines();
    this.addTetromino(this.nextTetromino);
    this.genNextTetromino();
  };
  private genNextTetromino() {
    let choice = randomTetromino();
    if (choice === this.nextTetromino) {
      choice = randomTetromino();
    }
    this.nextTetromino = choice;
    this.preview.render(this.nextTetromino);
  }
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
      this.drawCurrentTetromino();
      this.onLinesCleared(linesCleared);
    }
  };

  // rendering
  private drawCurrentTetromino = (clear?: boolean) => {
    if (this.tetromino == null) {
      return;
    }
    const { type, x, y, rotation } = this.tetromino;
    const color = clear ? null : TetrominoShape[type].fill;
    this.drawTetromino(color, x, y, type, rotation);
    const forceDropY = this.getForceDropY(x, y, type, rotation);
    this.ctx.globalAlpha = 0.25;
    this.drawTetromino(color, x, forceDropY, type, rotation);
    this.ctx.globalAlpha = 1;
  };
  private clearCurrentTetromino = () => {
    this.drawCurrentTetromino(true);
  };
}
