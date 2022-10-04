import Playfield from "./Playfield";
import { randomTetromino, Tetromino } from "./util";

export default function init(onLinesCleared: (count: number) => void) {
  const canvas = document.querySelector<HTMLCanvasElement>("#tetris")!!;
  const playfield = new Playfield(
    canvas,
    () => {
      playfield.addTetromino(randomTetromino());
    },
    onLinesCleared
  );
  playfield.addTetromino(randomTetromino());
}
