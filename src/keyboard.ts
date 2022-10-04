import LETTERS from "./letters";

function createKeyboard() {
  const container = document.querySelector("#letters")!;
  for (let index = 0; index < LETTERS.length; index++) {
    if (index % 5 === 0 && index > 0) {
      container.appendChild(document.createElement("br"));
    }
    const letter = LETTERS[index];
    const elem = document.createElement("span");
    elem.appendChild(document.createTextNode(letter));

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
  console.log("#letter-" + count);
  document.querySelector("#letter-" + count)?.classList?.add("letter-selected");
}

export default function init() {
  let cleared = 0;
  createKeyboard();
  updateCleared(cleared);
  const onLinesCleared = (count: number) => {
    cleared += count;
    console.log(count, cleared);
    updateCleared(cleared);
  };
  return onLinesCleared;
}
