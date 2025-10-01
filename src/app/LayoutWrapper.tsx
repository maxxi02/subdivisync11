import React from "react";
import "@mantine/core/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { Toaster } from "react-hot-toast";
const theme = createTheme({
  /** Put your mantine theme override here */
});
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <MantineProvider theme={theme} defaultColorScheme="light">
        {children}
        <Toaster />
      </MantineProvider>
    </>
  );
};

export default LayoutWrapper;
