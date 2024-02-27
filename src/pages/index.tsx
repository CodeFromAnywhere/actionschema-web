import { useSelect } from "@/lib/select-input/useSelect";
import { Item } from "@/lib/select-input/types";
import Image from "next/image";
import { useState, useEffect } from "react";
import type {
  ActionSchema,
  Plugin,
} from "actionschema/src/types/action-schema.schema";
import Link from "next/link";
import { getDotLocation } from "actionschema/build/util/getDotLocation";
import { CapableJsonSchemaPluginInput } from "actionschema-react";
import { useHorizontalDraggableDiv } from "react-util";
import { set } from "actionschema/build/util/dot-wild";
import { SetupForm } from "@/lib/SetupForm";
import { executeBrowser } from "actionschema/build/environments/browser/executeBrowser";
import { fetchExecute } from "actionschema/build/plugin/fetchExecute";
import { getJsonSchemaDotLocationForPlugin } from "@/lib/getJsonSchemaDotLocationForPlugin";
import { actionSchemaWebStore } from "@/lib/store";
import { ExecuteContext } from "actionschema/build/plugin/types";
import { getSchemaAtDotLocation } from "actionschema/build/util/getSchemaAtDotLocation";
import { tryParseJson } from "js-util";
import { format } from "prettier";
import { indexedDbGetItems } from "actionschema/build/environments/browser/storage/indexedDb";

const authToken = "jlgdgmsuwpqqxrwkwmdxaore";

const getSchemaJson = async (schemaKey: string) => {
  //get immediately
  const schemaCode = window.localStorage.getItem(schemaKey);

  if (!schemaCode) {
    return;
  }

  // const prettifiedNewContents = await format(schemaCode, {
  //   // parser: "json",
  //   trailingComma: "all",
  // });

  const json = schemaCode ? tryParseJson<ActionSchema>(schemaCode) : null;
  return json;
};
const hardcodedPlugins = [
  {
    __id: "https://api.codefromanywhere.com/openapi.json",
    url: "https://api.codefromanywhere.com/openapi.json",
    headers: `{"Authorization":"Bearer ${authToken}"}`,
    localhostOpenapiUrl:
      "http://localhost:42000/openapi.json?hostname=api.codefromanywhere.com",
  },
];
/**
Simple UI like https://rjsf-team.github.io/react-jsonschema-form/

- Show a list of ActionSchema examples that all use different OpenAPIs like OpenAI and Deepgram
- Show a button to setup your authentication such as the authorization keys for different platforms.
- Show the ActionSchema
- When a plugin is selected in the text-box, render the form with rjsf
- When no plugin is selected, show the indexed-db data.
*/
export const IndexPage = () => {
  useHorizontalDraggableDiv(true);

  const [
    { isUsageCollected, executeApiHeaders, executeApiPath, useExecuteApi },
  ] = actionSchemaWebStore.useStore("actionSchemaWebConfig");

  const items: Item<ActionSchema>[] = [
    {
      label: "Calendar Event",
      value:
        "https://raw.githubusercontent.com/CodeFromAnywhere/ActionSchema/main/schemas/calendar-event.schema.json",
      group: "Code From Anywhere",
    },
    {
      label: "Action Schema",
      value:
        "https://raw.githubusercontent.com/CodeFromAnywhere/ActionSchema/main/schemas/action-schema.schema.json",
      group: "Code From Anywhere",
    },
    {
      label: "Open API",
      value:
        "https://raw.githubusercontent.com/CodeFromAnywhere/ActionSchema/main/schemas/openapi.schema.json",
      group: "Code From Anywhere",
    },
    {
      label: "Screenless",
      value:
        "https://raw.githubusercontent.com/CodeFromAnywhere/ActionSchema/main/schemas/phone-recording-inbox.schema.json",
      group: "Code From Anywhere",
    },
    {
      label: "Example 4",
      value: "example4.schema.json",
      group: "OpenAI",
    },
    {
      label: "Example 5",
      value: "example5.schema.json",
      group: "OpenAI",
    },
  ];

  const [showSetup, setShowSetup] = useState(false);
  const [status, setStatus] = useState({ amountLoading: 0, amountStale: 0 });
  const isLoading = status.amountLoading + status.amountStale > 0;

  const [SelectActionSchema, selectedActionSchemaItem] = useSelect(
    items,
    items[0],
  );

  const schemaUrl = selectedActionSchemaItem?.value || items[0].value;
  const schemaKey = `schema.${schemaUrl}`;
  const dataKey = `data.${schemaUrl}`;

  const [plugin, setPlugin] = useState<{
    schemaPath: string | undefined;
    pluginPath: string | undefined;
    plugin: Plugin | null | undefined;
  }>({ pluginPath: undefined, schemaPath: undefined, plugin: undefined });

  useEffect(
    () => {
      // Ensures we select the plugin by listening
      if (typeof window === "undefined") {
        return;
      }

      // NB: The status interval doesn't work because it fucks up the form state... I can't edit a form normally anymore with this. find another way. Probably I can just do it inside a smaller component!
      // setInterval(() => {
      //   (async () => {
      //     // If data has updated, check and update Status into state
      //     const statuses = await indexedDbGetItems(`status-${dataKey}`);
      //     const amountLoading = statuses.filter((x) => x === "busy").length;
      //     const amountStale = statuses.filter((x) => x === "stale").length;
      //     setStatus({ amountLoading, amountStale });
      //     return;
      //   })();
      // }, 500);

      const updatePlugin = async (e: StorageEvent) => {
        // NB: This doesn't work. for some reason, it logs nothing here anymore. Weird....
        // console.log({ KEYEYEYEYEYEY: e.key });

        if (e.newValue === null) {
          return;
        }

        // console.log(`storage event:`, e.key);
        if (e.key === schemaKey) {
          setPlugin((old) => {
            if (!old.pluginPath || !old.plugin) {
              // don't change if we didn't have them
              return old;
            }

            const newJson = tryParseJson(e.newValue!);
            const newPlugin = getDotLocation(newJson, old.pluginPath);
            return { ...old, plugin: newPlugin };
          });
          return;
        }

        if (e.key !== "position-1" || e.newValue === null) {
          return;
        }

        const position: {
          lineNumber: number | null;
          column: number | null;
        } = JSON.parse(e.newValue);

        if (position.lineNumber === 1 && position.column === 1) {
          // NB: HACK: this gets launched if you are unfocused so lets just ignore this one
          return;
        }
        // console.log("New position", position);

        const schemaCode = window.localStorage.getItem(schemaKey);

        const { pluginPath, schemaPath, isPlugin } =
          getJsonSchemaDotLocationForPlugin(schemaCode, position);

        const json = schemaCode ? tryParseJson(schemaCode) : null;

        const xPlugin =
          isPlugin && pluginPath
            ? (getDotLocation(json, pluginPath) as Plugin | undefined)
            : undefined;

        setPlugin({ pluginPath, schemaPath, plugin: xPlugin });
      };

      // Add the listener and remove it again when unmounting this side-effect
      window.addEventListener("storage", updatePlugin);
      return () => window.removeEventListener("storage", updatePlugin);
    },
    // NB: change whenever we select another schema
    [schemaKey],
  );

  const header = (
    <div className="flex flex-row justify-between items-center">
      {/* Left side of header */}
      <div className="flex flex-row gap-8 items-center">
        <Link
          href="/"
          className="flex items-center justify-center px-4 text-3xl"
        >
          <Image
            priority
            loading="eager"
            src={`/logo.png`}
            width={50}
            className="dark:invert"
            height={40}
            alt="logo"
          />
        </Link>

        <SelectActionSchema />

        <div
          className="cursor-pointer select-none"
          onClick={() => setShowSetup((v) => !v)}
        >
          {showSetup ? "Let's go" : "Setup"}
        </div>
      </div>

      {/* Right side of header */}
      <iframe
        src="https://ghbtns.com/github-btn.html?user=codefromanywhere&repo=actionschema&type=star&count=true&size=large"
        frameBorder="0"
        scrolling="0"
        width="170"
        height="46"
        className="my-2 p-2 bg-white rounded-md"
        title="GitHub"
      ></iframe>
    </div>
  );

  const leftPanelContent = showSetup ? (
    <SetupForm />
  ) : (
    <div className="w-full h-full">
      <iframe
        width="100%"
        height="100%"
        src={`/editor.html?fetchUrl=${schemaUrl}&storageKey=${schemaKey}&id=1`}
      ></iframe>
    </div>
  );

  const rightPanelContent = plugin.plugin ? (
    <div>
      <CapableJsonSchemaPluginInput
        // key={String(hashCode(schemaKey))}
        extra={{
          //    id: String(hashCode(schemaKey)),
          actionSchemaPlugins: hardcodedPlugins,
          variableJsonSchema: undefined,
          variableTags: [],
        }}
        onChange={async (v, responseContentSchema) => {
          const newPlugin = v as Plugin | null | undefined;

          console.log({ newPlugin });
          if (newPlugin === undefined) {
            return;
          }

          if (!plugin.pluginPath || !plugin.schemaPath) {
            return;
          }

          if (JSON.stringify(plugin) === JSON.stringify(newPlugin)) {
            //same same
            return;
          }

          // calculate type based on outputlocation

          const typeSchema: ActionSchema | undefined =
            v?.outputLocation && responseContentSchema
              ? getSchemaAtDotLocation(responseContentSchema, v?.outputLocation)
              : responseContentSchema;

          // items and properties get removed unless the type is clearly an object or array
          const realTypeSchema = !typeSchema
            ? { type: "null", items: undefined, properties: undefined }
            : typeSchema.type === "object" || typeSchema.type === "array"
            ? typeSchema
            : { ...typeSchema, items: undefined, properties: undefined };

          const json = await getSchemaJson(schemaKey);
          if (!json) {
            return;
          }

          const schema = getDotLocation(json, plugin.schemaPath);

          // NB: needed for surrounding fields as they don't want to insta update due to some react optimisation
          setPlugin((p) => ({ ...p, plugin: newPlugin }));

          // NB: we also put the type schema here
          const newSchema = {
            ...schema,
            ...realTypeSchema,
            "x-plugin": newPlugin === null ? undefined : newPlugin,
          };

          const newJson = set(json, plugin.schemaPath, newSchema);

          window.localStorage.setItem(
            schemaKey,
            JSON.stringify(newJson, undefined, 2),
          );
        }}
        //@ts-ignore (WAIT UNTIL I INORPROate all)
        value={plugin.plugin}
      />
    </div>
  ) : (
    <iframe
      key={selectedActionSchemaItem?.value}
      width="100%"
      height="100%"
      src={`/editor.html?storageKey=${dataKey}&id=2`}
    ></iframe>
  );

  const rightPanelHeader = (
    <div>
      <div className="flex flex-row justify-between">
        <p>{plugin.pluginPath || ""}</p>
        {plugin.pluginPath && !plugin.plugin ? (
          <div
            className="cursor-pointer"
            onClick={() => {
              // should put set(json, plugin.path, {"x-plugin":{}})
            }}
          >
            [New Plugin]
          </div>
        ) : plugin.plugin ? (
          <div
            className="cursor-pointer"
            onClick={() => {
              setPlugin({
                pluginPath: undefined,
                schemaPath: undefined,
                plugin: undefined,
              });
            }}
          >
            [Close]
          </div>
        ) : null}
      </div>
      {isLoading ? (
        <div>
          {status.amountLoading} loading, {status.amountStale} waiting
        </div>
      ) : null}
    </div>
  );

  const statusIcon = (
    <div
      className="absolute -left-11 top-[51%] rounded-full w-20 h-20 border-dotted border-black dark:!border-white border-[6px] bg-white dark:!bg-black flex items-center justify-center cursor-pointer"
      onClick={async () => {
        // const schemaCode = window.localStorage.getItem(schemaKey);

        // const schema = schemaCode
        //   ? (JSON.parse(schemaCode) as ActionSchema)
        //   : null;

        const schema = await getSchemaJson(schemaKey);

        if (!schema) {
          alert?.("Schema could not be parsed");
        }

        //non-admin, hardcoded for now

        const executeContext: ExecuteContext = {
          // root of the schema
          dotLocation: "",

          // Reset to nothing before firing the plugins
          value: null,
          databaseId: dataKey,
          schema,
          // Hardcoded for now!
          actionSchemaPlugins: hardcodedPlugins,
        };

        if (useExecuteApi && executeApiPath) {
          const result = await fetchExecute({
            executeApiPath,
            executeApiHeaders,
            ...executeContext,
          });
          console.log({ result });

          return;
        }

        // otherwise, just use the browser
        const result = await executeBrowser(executeContext);

        console.log({ result });
      }}
    >
      <div className="relative">
        {/* <div className="absolute bg-black rounded-full w-2 h-2 animate-dot">
          ...
        </div> */}
        <Image
          priority
          loading="eager"
          className={
            isLoading
              ? "animate-[wiggle_1s_ease-in-out_infinite] scale-150 dark:invert"
              : "ml-2 rotate-90 hover:scale-150 transform transition-all dark:invert"
          }
          src={`/logo.png`}
          width={60}
          height={50}
          alt="logo"
        />
      </div>
    </div>
  );

  return (
    // outer
    <div className="w-screen h-screen flex flex-col">
      {header}

      {/* intermediate. key is overflow-hidden! */}
      <div className="h-full overflow-hidden flex-1 flex flex-row">
        <div className="self-start h-full inline-block overflow-y-scroll w-[50%]">
          {leftPanelContent}
        </div>

        <div
          id="horizontalDraggable"
          className="z-50 border-l-[6px] bg-white dark:!bg-black border-dotted border-black dark:!border-white pl-2 relative"
        >
          {statusIcon}
        </div>

        <div
          // NB: Some magic for the size
          style={{ flexGrow: 1, flexShrink: 1, flexBasis: "0%" }}
          className={`min-h-0 overflow-y-scroll h-full inline-block`}
        >
          {rightPanelHeader}
          {rightPanelContent}
        </div>
      </div>
    </div>
  );
};
export default IndexPage;
