import { ActionSchema } from "actionschema/src/types/action-schema.schema";
export const schemas: {
  [key: string]: ActionSchema;
} = {
  example1: {
    $schema:
      "https://raw.githubusercontent.com/CodeFromAnywhere/ActionSchema/main/schemas/action-schema.schema.json",
    "x-is-public": true,
    properties: {
      $schema: {
        type: "string",
      },
      items: {
        type: "array",
        items: {
          $ref: "#/definitions/CalendarEvent",
        },
      },
    },
    definitions: {
      CalendarEvent: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Description about the event",
          },
          when: {
            type: "string",
            description:
              "When is it (natural language)\n\nIf this is filled in manually, can be used (together with some variable context) to determine the rules and exact fire date times.",
          },
          isRecurring: {
            type: "string",
            description: "",
          },
          fireDatetime: {
            type: "string",
            description: "When it should be fired. Easy to sort on this",

            "x-plugin": {
              $openapi: {
                operationId: "jsonGptPlugin",
                method: "POST",
                path: "/function/jsonGptPlugin",
                url: "https://api.codefromanywhere.com/openapi.json",
              },
              condition: "",
              type: "creation",
              context: {
                description:
                  "Current date/time: ${system.datetime}\n\nAn event is planned: ${when}\n\nPlease write the when this FUTURE event will take place, in the following format: YYYY-MM-DDTHH:mm:ss",
                jsonFormat: '{ "isoDatetimeString": string }',
                model: "auto",
              },
              outputLocation: "result.isoDatetimeString",
              propertyDependencies: ["when"],
            },
          },
          cronRule: {
            type: "string",
            description: "See https://crontab.guru",
          },
          scheduleVirtualMeetingDialIn: {
            type: "string",
            description: "",

            "x-plugin": {
              $openapi: {
                method: "post",
                operationId: "scheduleExecute",
                path: "/function/scheduleExecute",
                url: "https://api.codefromanywhere.com/openapi.json",
                emoji: "🪝",
              },
              type: "creation",
              context: {
                propertyKey: "virtualMeetingDialIn",
                mode: "recalculate",
                fireDatetime: "${fireDatetime}",
                delayUnit: "s",
              },
              propertyDependencies: ["fireDatetime"],
              isVerticalExpandEnabled: false,
              outputLocation: "result",
            },
          },
          scheduleOnFire: {
            type: "string",
            description: "scheduleOnFire",

            "x-plugin": {
              $openapi: {
                method: "post",
                operationId: "scheduleExecute",
                path: "/function/scheduleExecute",
                url: "https://api.codefromanywhere.com/openapi.json",
                emoji: "🪝",
              },
              context: {
                propertyKey: "onFire",
                mode: "only-empty",
                fireDatetime: "${fireDatetime}",
              },
              outputLocation: "result",
            },
          },
          schedulePhoneNumberDial: {
            type: "string",
            description:
              "If there's no virtual meeting present, lets schedule a call with the relation (if present).",

            "x-plugin": {
              $openapi: {
                method: "post",
                operationId: "scheduleExecute",
                path: "/function/scheduleExecute",
                url: "https://api.codefromanywhere.com/openapi.json",
                emoji: "🪝",
              },
              context: {
                propertyKey: "phoneNumberDial",
                mode: "only-empty",
                fireDatetime: "${fireDatetime}",
              },
              outputLocation: "result",
              condition: "${!virtualMeetingPin}",
            },
          },
          onFire: {
            type: "string",
            description:
              "Event to be re-executed whenever this happens.\n\nTODO: should also make all things after become stale if there are things later.",
          },
          __id: {
            type: "string",
            description:
              "As a person doesn't have more than, let's say, 10000 events, this can be a 4 letter unique identifier, short enough to make it easy for the LLM",
          },
          virtualMeetingPin: {
            type: "string",
            description: "virtualMeetingPin",
          },
          virtualMeetingPhone: {
            type: "string",
            description: "virtualMeetingPhone",
          },
          virtualMeetingLink: {
            type: "string",
            description: "virtualMeetingLink",
          },
          virtualMeetingDialIn: {
            type: "string",
            description: "virtualMeetingDialIn",

            "x-plugin": {
              $openapi: {
                method: "post",
                operationId: "createDoublePhonecall",
                path: "/function/createDoublePhonecall",
                url: "https://api.codefromanywhere.com/openapi.json",
                emoji: "👥",
              },
              context: {
                otherPhoneNumber: "${virtualMeetingPhone}",
                sendDigits: "ww${virtualMeetingPin}#",
              },
              outputLocation: "result",
              propertyDependencies: [
                "virtualMeetingPin",
                "virtualMeetingPhone",
              ],
            },
          },
          phoneNumberDial: {
            type: "string",
            description: "If there's a phonenumber, dial it",

            "x-plugin": {
              $openapi: {
                method: "post",
                operationId: "createDoublePhonecall",
                path: "/function/createDoublePhonecall",
                url: "https://api.codefromanywhere.com/openapi.json",
                emoji: "👥",
              },
              context: {
                otherPhoneNumber: "${phoneNumber}",
              },
              outputLocation: "result",
            },
          },
          phoneNumber: {
            type: "string",
            description:
              "Tries to find the relation phone number based on the relationName found in the description",

            "x-plugin": {
              $openapi: {
                method: "post",
                operationId: "readRelation",
                path: "/v1/relation/read",
                url: "https://root.actionschema.com/openapi.json\n",
              },
              context: {
                rowIds: [""],
                filter: [],
                sort: [],
                objectParameterKeys: [],
                ignoreObjectParameterKeys: [],
                search: "${relationName}",
              },
              outputLocation: "result.json.items[0].phoneNumber",
              propertyDependencies: [],
            },
          },
          relationName: {
            type: "string",
            description: "relationName",

            "x-plugin": {
              $openapi: {
                method: "post",
                operationId: "jsonGptPlugin",
                path: "/function/jsonGptPlugin",
                url: "https://api.codefromanywhere.com/openapi.json",
                emoji: "🗂",
              },
              context: {
                description:
                  "Consider this calendar event description: ${description}\n\nIs a name of another person mentioned? If give me the name.",
                jsonFormat: '{ "relationName": string | null }',
              },
              outputLocation: "result.relationName",
              propertyDependencies: ["description"],
            },
          },
        },
      },
    },
    required: ["items"],
    title: "JSON Schema for CalendarEvent interface",
    type: "object",
    description: "📆 Useful user-centric model to play around with",
  },
  example2: {},
  example3: {},
  example4: {},
  example5: {},
};
