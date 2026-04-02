function rawtextToString(input) {
  let obj;

  if (typeof input === "string") {
    try {
      obj = JSON.parse(input);
    } catch {
      throw new Error("JSONとして解釈できない文字列です");
    }
  } else if (typeof input === "object" && input !== null) {
    obj = input;
  } else {
    throw new Error("入力が無効です（文字列またはオブジェクトのみ許可）");
  }

  if (!Array.isArray(obj.rawtext)) {
    throw new Error("rawtext 配列が見つかりません");
  }

  return obj.rawtext
    .map(part => {
      if (part.text) return part.text;
      if (part.translate) {
        // translateにwithがある場合はネストを展開
        if (part.with?.rawtext) {
          return rawtextToString(part.with);
        }
        return part.translate;
      }
      return "";
    })
    .join("");
}
export default rawtextToString;