/**
Simple way to import a well-equipped monaco editor into react! Uses query parameters `fetchUrl` and `storageKey` to fetch and store its contents locally.

Useful for development:

// Replace monaco by typedMonaco to check out types in the monaco editor


import typedMonaco from "monaco-editor";
*/

window.onkeydown = function (e) {
  const saveShortcut = e.metaKey && e.key === "s";
  if (saveShortcut) {
    e.preventDefault();
    saveContents().then((result) => result && alert(result));
    return;
  }

  // console.log("wow, other onkeydown",parent.document)
  // NB: all other events need to bubble up. but this doesn't work!
  // parent.document.dispatchEvent(e)
};

require.config({ paths: { vs: "monaco-editor/min/vs" } });

const monacoPromise = new Promise((resolve) =>
  require(["vs/editor/editor.main"], function () {
    resolve(monaco);
  }),
);

const query = new URL(window.location.href).search;
const fetchUrl = new URLSearchParams(query).get("fetchUrl");
const storageKey = new URLSearchParams(query).get("storageKey");
const id = new URLSearchParams(query).get("id");
const positionKey = `position-${id}`;
console.log({ storageKey });
const storePosition = (position) => {
  window.localStorage.setItem(
    positionKey,
    JSON.stringify({
      lineNumber: position?.lineNumber,
      column: position?.column,
    }),
  );
};

const loadCode = async () => {
  if (!storageKey) {
    return "Error: No storage key given";
  }

  const code = window.localStorage.getItem(storageKey);

  if (code !== null) {
    // If we have saved it, take from there
    return code;
  }

  if (!fetchUrl) {
    // If no fetchUrl, its empty initially
    return "";
  }

  // If not saved yet, take from fetchUrl
  const text = await fetch(fetchUrl).then((response) =>
    response.ok ? response.text() : null,
  );

  if (text === null) {
    return;
  }

  localStorage.setItem(storageKey, text);

  return text;
};

// Add the listener and remove it again when unmounting this side-effect
window.addEventListener("storage", (e) => {
  if (e.key !== storageKey || e.newValue === null) {
    return;
  }

  const model = monaco.editor.getEditors()[0];
  if (!model) {
    return;
  }
  const currentValue = model.getValue();
  if (currentValue === e.newValue) {
    return;
  }

  // data changed
  model.setValue(e.newValue);
});

//NB: load simultaneously
const loadCodePromise = loadCode();

loadCodePromise.then(async (fileContents) => {
  const monaco = await monacoPromise;

  monaco.languages.json.jsonDefaults.diagnosticsOptions.enableSchemaRequest = true;

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,

    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    typeRoots: ["node_modules/@types"],
    jsx: monaco.languages.typescript.JsxEmit.React,
    //https://gist.github.com/RoboPhred/f767bea5cbc972e04155a625dc11da11
  });

  const isDarkmode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      const isDarkmode = event.matches;

      monaco.editor.setTheme(isDarkmode ? "vs-dark" : "vs");
    });

  //https://stackoverflow.com/questions/56954280/monaco-editor-how-to-disable-errors-typescript

  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    //noSemanticValidation: true,
    diagnosticCodesToIgnore: [],
    allowNonTsExtensions: true,
    // noSyntaxValidation: true,
  });

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    allowNonTsExtensions: true,
  });

  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

  var editor = monaco.editor.create(document.getElementById("monacodo"), {
    language: "json",
    wordWrap: "on",
    theme: isDarkmode ? "vs-dark" : "vs",
    model: null,
  });

  // NB: Ensure we keep track of the cursor
  const position = editor.getPosition();

  // storePosition(position);
  editor.onDidChangeCursorPosition((e) => {
    if (!e.position) {
      return;
    }
    storePosition(e.position);
  });

  const mainModel = monaco.editor.createModel(
    fileContents,
    "json",
    monaco.Uri.file("json.json"),
  );

  editor.setModel(mainModel);

  monaco.editor.getModels()?.[0]?.onDidChangeContent(async () => {
    //console.log("ONChange fired");

    // console.log(monaco.editor.getModels().map((x) => x.uri));

    const saveButton = document.getElementById("save");
    if (!saveButton) {
      alert("No savebutton");
      return;
    }

    const value = editor?.getValue();
    const storedValue = await loadCode();

    if (value === undefined) {
      alert("No value");
      return;
    }

    if (storedValue === value) {
      // console.log("it's equal");
      return;
    }

    // unsaved value. show save button.
    saveButton.style.display = "block";
  });

  window.onresize = function () {
    editor.layout();
  };
});

const saveContents = async () => {
  const monaco = await monacoPromise;

  const editor = monaco.editor.getEditors()?.[0];
  //https://github.com/microsoft/monaco-editor/issues/2664
  await editor?.getAction("editor.action.formatDocument")?.run();

  // await new Promise((resolve) => setTimeout(() => resolve(), 100));

  const value = editor?.getValue();

  if (value === undefined) {
    return "Could not get file contents";
  }

  window.localStorage.setItem(storageKey, value);

  const saveButton = document.getElementById("save");
  if (!saveButton) {
    alert("Error: No savebutton");
    return;
  }
  saveButton.style.display = "none";
  // successfull. no message needed
};
