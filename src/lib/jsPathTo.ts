// found at https://github.com/nidu/vscode-copy-json-path
// via https://www.google.com/search?q=json+path+from+cursor

import { parse } from "acorn";
var walk = require("acorn/dist/walk");

const DEFAULT_NON_QUOTED_KEY_REGEX = "^[a-zA-Z$_][a-zA-Z\\d$_]*$";

enum ColType {
  Object,
  Array,
}

interface Frame {
  colType: ColType;
  index?: number;
  key?: string;
}

function looksLikeJson(text: string) {
  return text.match(/^\s*[{\[](.|[\r\n])*[}\]]\s*$/);
}

export const tryJsPathTo = (
  text: string,
  offset: number,
  nonQuotedKeyRegex: string = DEFAULT_NON_QUOTED_KEY_REGEX,
) => {
  try {
    return jsPathTo(text, offset, nonQuotedKeyRegex);
  } catch (e) {
    return;
  }
};
/** returns a dotLocation for any json at an offset. Might be buggy. */
export function jsPathTo(
  text: string,
  offset: number,
  nonQuotedKeyRegex: string = DEFAULT_NON_QUOTED_KEY_REGEX,
) {
  if (looksLikeJson(text)) {
    const prefix = "a=";
    text = prefix + text;
    offset += prefix.length;
  }

  let path: Frame[] = [];

  function addProperty(p: any) {
    path.unshift({
      colType: ColType.Object,
      key: p.key.name || p.key.value,
    });
  }

  function findChildIndexAtOffset(node: any) {
    let children = node.elements || node.properties;
    let i = 0;
    while (i < children.length && children[i].start <= offset) i++;
    return Math.max(0, i - 1);
  }

  const catchKeys = ["ObjectExpression", "Property", "ArrayExpression"];

  try {
    walk.fullAncestor(
      parse(text, {
        ecmaVersion: "latest",
        allowReserved: true,
        sourceType: "module",
        allowImportExportEverywhere: true,
        allowAwaitOutsideFunction: true,
      }),
      (node: any, parents: any) => {
        if (node.start <= offset && node.end >= offset) {
          // console.log(`step for ${text}`, node)

          // Go down the stack until object or array is met. E.g. if object property has a function value
          let i = parents.length - 1;
          while (i >= 0 && catchKeys.indexOf(parents[i].type) == -1) {
            i--;
          }

          while (i >= 0) {
            let p = parents[i];
            switch (p.type) {
              case "ObjectExpression":
                if (path.length == 0) {
                  const index = findChildIndexAtOffset(p);
                  addProperty(p.properties[index]);
                }
                break;
              case "Property":
                addProperty(p);
                break;
              case "ArrayExpression":
                let index = findChildIndexAtOffset(p);
                path.unshift({
                  colType: ColType.Array,
                  index: index,
                });
                break;
              case "Identifier":
              case "Literal":
              case "ObjectExpression":
                break;
              default:
                throw "Ok";
            }
            i--;
          }

          throw "Ok";
        }
      },
    );
  } catch (e) {
    if (e == "Ok") return pathToString(path, nonQuotedKeyRegex);
    throw e;
  }
  return "";
}

function pathToString(path: Frame[], nonQuotedKeyRegex: string): string {
  let s = "";
  for (const frame of path) {
    if (frame.colType == ColType.Object) {
      if (!frame.key?.match(new RegExp(nonQuotedKeyRegex))) {
        const key = frame.key?.replace(/"/g, '\\"');
        s += `["${key}"]`;
      } else {
        if (s.length) {
          s += ".";
        }
        s += frame.key;
      }
    } else {
      s += `[${frame.index}]`;
    }
  }
  return s;
}

// const res = jsPathTo(
//   `{
//   wow: {
//     "type": "object",
//     "properties": {
//       "projectRelativeDbPath": {
//         "type": "string"
//       }
//     },
//     "required": [
//       "projectRelativeDbPath"
//     ],
//     "additionalProperties": false
//   }
// }`,
//   50,
// );
// console.log({ res });
