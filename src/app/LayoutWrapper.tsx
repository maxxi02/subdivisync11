import React from "react";
import "@mantine/core/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";

const theme = createTheme({
  /** Put your mantine theme override here */
});
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <MantineProvider theme={theme} defaultColorScheme="light">
        {children}
      </MantineProvider>
    </>
  );
};

export default LayoutWrapper;
