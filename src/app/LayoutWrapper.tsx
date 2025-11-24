"use client";

import React, { useEffect, useState } from "react";
import "@mantine/core/styles.css";
import {
  MantineProvider,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
} from "@mantine/core";
import { Toaster } from "react-hot-toast";
import { IconMoonStars, IconSun } from "@tabler/icons-react";

const mantineTheme = {
  fontFamily: "var(--font-manrope)",
  fontFamilyMonospace: "var(--font-geist-mono)",
};

// Toggle Color Scheme Component
const ToggleColorScheme = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("dark", {
    getInitialValueInEffect: true,
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <ActionIcon
      onClick={() =>
        setColorScheme(computedColorScheme === "dark" ? "light" : "dark")
      }
      size="lg"
      variant="subtle"
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === "dark" ? (
        <IconSun style={{ width: 18, height: 18 }} stroke={1.5} />
      ) : (
        <IconMoonStars style={{ width: 18, height: 18 }} stroke={1.5} />
      )}
    </ActionIcon>
  );
};

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <MantineProvider defaultColorScheme="dark" theme={mantineTheme}>
      {children}
      <Toaster />
    </MantineProvider>
  );
};

export default LayoutWrapper;
export { ToggleColorScheme };
