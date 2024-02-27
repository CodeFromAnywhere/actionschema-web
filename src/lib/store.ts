import { createStore } from "react-with-native-store";
import { actionSchemaInitialValues } from "actionschema-react";

const initialValues: {
  actionSchemaWebConfig: {
    isUsageCollected: boolean;
    useExecuteApi: boolean;
    executeApiPath: string;
    executeApiHeaders: { [key: string]: string };
  };
} = {
  actionSchemaWebConfig: {
    executeApiHeaders: {},
    isUsageCollected: true,
    executeApiPath: "",
    useExecuteApi: false,
  },
};

export const actionSchemaWebStore = createStore({
  ...initialValues,
  ...actionSchemaInitialValues,
});
