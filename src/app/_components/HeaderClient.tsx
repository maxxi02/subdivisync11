"use client";

import { Container, Group, Paper, Title, Button as MantineButton, useMantineTheme, useComputedColorScheme } from "@mantine/core";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ToggleColorScheme } from "../LayoutWrapper";

export default function HeaderClient() {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true });
  const router = useRouter();

  return (
    <header
      style={{
        borderBottom: `1px solid ${
          colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
        }`,
        backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Container size="lg" py="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Image
              src="/lynville-icon.png"
              alt="SubdiviSync Logo"
              width={50}
              height={50}
              style={{
                borderRadius: theme.radius.md,
              }}
            />
            <Title
              order={4}
              style={{
                color: colorScheme === "dark" ? theme.white : theme.colors.gray[9],
              }}
            >
              SubdiviSync
            </Title>
          </Group>

          <Group gap="sm">
            <MantineButton
              variant="subtle"
              color={colorScheme === "dark" ? "gray.4" : "gray.6"}
              onClick={() => router.push("/login")}
            >
              Log In
            </MantineButton>
            <ToggleColorScheme />
          </Group>
        </Group>
      </Container>
    </header>
  );
}
