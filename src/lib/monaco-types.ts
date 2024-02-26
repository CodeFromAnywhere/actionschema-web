import monaco from "monaco-editor";

type MonacoOptions = monaco.editor.IStandaloneEditorConstructionOptions;
const testOptions: MonacoOptions = { wordWrap: "on", codeLens: false };

//https://microsoft.github.io/monaco-editor/typedoc/interfaces/languages.CompletionItemProvider.html
const editor = monaco.editor.getEditors()?.[0]; // get editor for typesafety checks

editor;
