import { jsPathTo, tryJsPathTo } from "./jsPathTo";

export const getJsonSchemaDotLocationForPlugin = (
  jsonString: string | null,
  position: { lineNumber: number | null; column: number | null },
) => {
  if (!jsonString || !position.lineNumber || !position.column) {
    return {
      pluginPath: undefined,
      schemaPath: undefined,
      isPlugin: undefined,
    };
  }

  const offset =
    jsonString
      .split("\n")
      .slice(0, position.lineNumber - 1)
      .join("\n").length + position.column;

  const pathAtPosition = tryJsPathTo(jsonString, offset);

  const pluginPiece = '["x-plugin"]';

  if (!pathAtPosition || !pathAtPosition.includes(pluginPiece)) {
    //console.log("no plugin here");
    return {
      pluginPath: undefined,
      schemaPath: pathAtPosition,
      isPlugin: false,
    };
  }

  // get path before that
  const schemaPath = pathAtPosition.split(pluginPiece)[0];
  const pluginPath = schemaPath + pluginPiece;

  return { pluginPath, schemaPath, isPlugin: true };
};
