import React from "react";
import "@mantine/core/styles.css";
import {
  MantineProvider,
  ActionIcon,
  useMantineColorScheme,
} from "@mantine/core";
import { Toaster } from "react-hot-toast";
import { IconMoonStars, IconSun } from "@tabler/icons-react";

// Toggle Color Scheme Component
const ToggleColorScheme = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon
      onClick={() => toggleColorScheme()}
      size="lg"
      variant="subtle"
      aria-label="Toggle color scheme"
    >
      {colorScheme === "dark" ? (
        <IconSun style={{ width: 18, height: 18 }} stroke={1.5} />
      ) : (
        <IconMoonStars style={{ width: 18, height: 18 }} stroke={1.5} />
      )}
    </ActionIcon>
  );
};

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <MantineProvider defaultColorScheme="dark">
      {children}
      <Toaster />
    </MantineProvider>
  );
};

export default LayoutWrapper;
export { ToggleColorScheme };
