export default function init() {
  let output = "";
  const onSubmitLetter = (letter: string) => {
    if (letter === "Submit") {
      alert(
        "You submitted '" +
          output +
          "'. I can't believe you got all the way here"
      );
      return;
    }
    if (letter === "Clear") {
      output = "";
    } else {
      output += letter;
    }
    document.querySelector("#actual-output")!.innerHTML = output;
  };
  return onSubmitLetter;
}
