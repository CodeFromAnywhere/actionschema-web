import { ReactJsonSchemaForm } from "actionschema-react";
import { actionSchemaWebStore } from "./store";

export const SetupForm = () => {
  const [actionSchemaWebConfig, setActionSchemaWebConfig] =
    actionSchemaWebStore.useStore("actionSchemaWebConfig");

  return (
    <div className="m-4">
      <div
        className="cursor-pointer"
        onClick={() => {
          let ok = prompt("Type 'ok' if you want to clear all your changes.");
          if (ok !== "ok") {
            alert("Ok, I won't clear it.");
            return;
          }
          window.localStorage.clear();

          window.location.reload();
        }}
      >
        Reset Local Storage
      </div>

      <ReactJsonSchemaForm
        schema={{
          type: "object",
          properties: {
            isUsageCollected: {
              type: "boolean",
              title: "Anonymous usage info collection",
              description:
                "To improve ActionSchema we do research based on anonymous usage data. You can opt-out of this by unchecking this box.",
            },
            useExecuteApi: {
              title: "Execute API",
              description:
                "By default, the browser is used for executing your ActionSchemas. If you use a hosted ActionSchema solution, set your API Url here.",
              type: "object",
              properties: {
                useExecuteApi: {
                  title: "Use Execute API",
                  type: "boolean",
                  enum: [true, false],
                  default: false,
                },
              },
              required: ["useExecuteApi"],
              dependencies: {
                useExecuteApi: {
                  oneOf: [
                    {
                      properties: {
                        useExecuteApi: {
                          enum: [false],
                        },
                      },
                    },
                    {
                      properties: {
                        useExecuteApi: {
                          enum: [true],
                        },

                        executeApiPath: {
                          type: "string",
                          title: "Execute API Path",
                        },

                        executeApiHeaders: {
                          type: "object",
                          title: "Execute API Headers",
                          default: { Authorization: "Bearer xxx" },
                          additionalProperties: { type: "string" },
                        },
                      },
                      required: ["executeApiHeaders", "executeApiPath"],
                    },
                  ],
                },
              },
            },
          },
        }}
        formData={actionSchemaWebConfig}
        onChange={(value) => {
          if (!value) {
            return;
          }
          setActionSchemaWebConfig(value as any);
        }}
      />
    </div>
  );
};
