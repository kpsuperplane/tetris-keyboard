import letters from "./letters";
import LETTERS from "./letters";

function createKeyboard() {
  const container = document.querySelector("#letters")!;
  for (let index = 0; index < LETTERS.length; index++) {
    if (index % 6 === 0 && index > 0) {
      container.appendChild(document.createElement("br"));
    }
    const letter = LETTERS[index];
    const elem = document.createElement("span");
    elem.appendChild(document.createTextNode(letter));
    elem.setAttribute("data-letter", letter);

    const label = document.createElement("span");
    label.appendChild(document.createTextNode(`${index}`));
    elem.appendChild(label);

    elem.setAttribute("id", "letter-" + index);
    container.appendChild(elem);
  }
}

function updateCleared(count: number) {
  document.querySelector("#cleared-count")!.innerHTML = `${count}`;
  document
    .querySelector(".letter-selected")
    ?.classList?.remove("letter-selected");
  document.querySelector("#letter-" + count)?.classList?.add("letter-selected");
  if (LETTERS[count].length === 1) {
    document.querySelector("#output-placeholder")!.innerHTML = LETTERS[count];
  }
}

export default function init(submitLetter: (letter: string) => void) {
  let cleared = 0;
  createKeyboard();
  updateCleared(cleared);
  const onLinesCleared = (count: number) => {
    // special case: submit
    if (count === 0) {
      submitLetter(LETTERS[cleared]);
      cleared = 0;
      updateCleared(cleared);
    }
    cleared = (cleared + count) % LETTERS.length;
    updateCleared(cleared);
  };
  return onLinesCleared;
}
