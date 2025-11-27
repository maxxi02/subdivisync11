"use client";

import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Card,
  CardSection,
  Image,
  Badge,
  Group,
  Button as MantineButton,
} from "@mantine/core";
import { useMantineTheme, useComputedColorScheme } from "@mantine/core";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

const HeaderClientNoSSR = dynamic(
  () => import("../_components/HeaderClient"),
  { ssr: false }
);

const houseModels = [
  {
    name: "Sofia Delux",
    description: "A modern two-storey townhouse featuring 3 bedrooms, 2 toilet & bath, a spacious living area, dining room, and kitchen. Perfect for growing families seeking comfort and style in a secure community.",
    specs: {
      bedrooms: 3,
      bathrooms: 2,
      floorArea: "54 sqm",
      lotArea: "36 sqm",
    },
    priceRange: "₱1,766,000 - ₱1,900,000",
    images: [
      "/sofia-delux/s 1.jpg",
      "/sofia-delux/s 2.jpg",
      "/sofia-delux/s 3.jpg",
      "/sofia-delux/s 4.jpg",
      "/sofia-delux/s 5.jpg",
      "/sofia-delux/s 6.jpg",
    ],
  },
  {
    name: "Zerina Premium",
    description: "An elegant two-storey townhouse with premium finishes. Features 3 bedrooms, 2 toilet & bath, with modern architectural design and quality materials. Ideal for families who appreciate quality living spaces.",
    specs: {
      bedrooms: 3,
      bathrooms: 2,
      floorArea: "54 sqm",
      lotArea: "36 sqm",
    },
    priceRange: "₱2,000,000 - ₱2,200,000",
    images: [
      "/zerina-premium/zerina-premium 1.jpg",
      "/zerina-premium/z 2.jpg",
      "/zerina-premium/z 3.jpg",
      "/zerina-premium/z 4.jpg",
      "/zerina-premium/z 5.jpg",
    ],
  },
];

export default function HouseModelsPage() {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true });
  
  const [imageIndices, setImageIndices] = useState<number[]>(houseModels.map(() => 0));

  const handlePrevImage = (modelIndex: number, imagesLength: number) => {
    setImageIndices((prev) => {
      const newIndices = [...prev];
      newIndices[modelIndex] = newIndices[modelIndex] === 0 ? imagesLength - 1 : newIndices[modelIndex] - 1;
      return newIndices;
    });
  };

  const handleNextImage = (modelIndex: number, imagesLength: number) => {
    setImageIndices((prev) => {
      const newIndices = [...prev];
      newIndices[modelIndex] = newIndices[modelIndex] === imagesLength - 1 ? 0 : newIndices[modelIndex] + 1;
      return newIndices;
    });
  };

  return (
    <div
      suppressHydrationWarning
      style={{
        minHeight: "100vh",
        backgroundColor:
          colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
      }}
    >
      <HeaderClientNoSSR />

      <Container size="lg" py="xl">
        <Stack gap="xl">
          <Title
            order={1}
            style={{
              color:
                colorScheme === "dark" ? theme.white : theme.colors.gray[9],
            }}
          >
            Available House Models
          </Title>

          <Text
            size="sm"
            style={{
              color:
                colorScheme === "dark"
                  ? theme.colors.gray[4]
                  : theme.colors.gray[6],
            }}
          >
            Explore our diverse range of modern house models designed to suit your lifestyle and budget
          </Text>

          <Stack gap="xl">
            {houseModels.map((model, modelIndex) => (
              <Card
                key={modelIndex}
                shadow="sm"
                radius="lg"
                withBorder
                style={{
                  backgroundColor:
                    colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  {/* Image Section */}
                  <CardSection>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "400px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          transition: "transform 0.3s ease",
                          transform: `translateX(-${imageIndices[modelIndex] * 100}%)`,
                          height: "100%",
                        }}
                      >
                        {model.images.map((img, imgIndex) => (
                          <Image
                            key={imgIndex}
                            src={img}
                            alt={`${model.name} ${imgIndex + 1}`}
                            style={{
                              minWidth: "100%",
                              height: "100%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>

                      {/* Navigation Arrows */}
                      {model.images.length > 1 && (
                        <>
                          <MantineButton
                            variant="filled"
                            color="gray"
                            size="sm"
                            style={{
                              position: "absolute",
                              left: 16,
                              top: "50%",
                              transform: "translateY(-50%)",
                              backgroundColor: "rgba(0, 0, 0, 0.6)",
                              width: "40px",
                              height: "40px",
                              padding: 0,
                              minWidth: "40px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                            }}
                            onClick={() => handlePrevImage(modelIndex, model.images.length)}
                          >
                            <ArrowLeft size={20} color="#fff" />
                          </MantineButton>
                          <MantineButton
                            variant="filled"
                            color="gray"
                            size="sm"
                            style={{
                              position: "absolute",
                              right: 16,
                              top: "50%",
                              transform: "translateY(-50%)",
                              backgroundColor: "rgba(0, 0, 0, 0.6)",
                              width: "40px",
                              height: "40px",
                              padding: 0,
                              minWidth: "40px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                            }}
                            onClick={() => handleNextImage(modelIndex, model.images.length)}
                          >
                            <ArrowRight size={20} color="#fff" />
                          </MantineButton>
                        </>
                      )}

                      {/* Image Counter */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 16,
                          right: 16,
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          color: "#fff",
                          padding: "4px 12px",
                          borderRadius: "16px",
                          fontSize: "0.875rem",
                        }}
                      >
                        {imageIndices[modelIndex] + 1} / {model.images.length}
                      </div>
                    </div>
                  </CardSection>

                  {/* Content Section */}
                  <CardSection p="xl" pt={0}>
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <Title
                          order={2}
                          style={{
                            color:
                              colorScheme === "dark"
                                ? theme.white
                                : theme.colors.gray[9],
                          }}
                        >
                          {model.name}
                        </Title>
                        <Badge
                          size="lg"
                          variant="light"
                          color="green"
                          style={{ fontSize: "0.9rem", padding: "8px 16px" }}
                        >
                          {model.priceRange}
                        </Badge>
                      </Group>

                      <Text
                        size="md"
                        style={{
                          color:
                            colorScheme === "dark"
                              ? theme.colors.gray[3]
                              : theme.colors.gray[7],
                          lineHeight: 1.7,
                        }}
                      >
                        {model.description}
                      </Text>

                      {/* Specifications */}
                      <Paper
                        p="md"
                        radius="md"
                        style={{
                          backgroundColor:
                            colorScheme === "dark"
                              ? theme.colors.dark[7]
                              : theme.colors.gray[0],
                        }}
                      >
                        <Group gap="xl" wrap="wrap">
                          <Stack gap={4}>
                            <Text
                              size="xs"
                              fw={500}
                              style={{
                                color:
                                  colorScheme === "dark"
                                    ? theme.colors.gray[5]
                                    : theme.colors.gray[5],
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Bedrooms
                            </Text>
                            <Text
                              size="lg"
                              fw={600}
                              style={{
                                color:
                                  colorScheme === "dark"
                                    ? theme.white
                                    : theme.colors.gray[9],
                              }}
                            >
                              {model.specs.bedrooms}
                            </Text>
                          </Stack>
                          <Stack gap={4}>
                            <Text
                              size="xs"
                              fw={500}
                              style={{
                                color:
                                  colorScheme === "dark"
                                    ? theme.colors.gray[5]
                                    : theme.colors.gray[5],
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Bathrooms
                            </Text>
                            <Text
                              size="lg"
                              fw={600}
                              style={{
                                color:
                                  colorScheme === "dark"
                                    ? theme.white
                                    : theme.colors.gray[9],
                              }}
                            >
                              {model.specs.bathrooms}
                            </Text>
                          </Stack>
                          <Stack gap={4}>
                            <Text
                              size="xs"
                              fw={500}
                              style={{
                                color:
                                  colorScheme === "dark"
                                    ? theme.colors.gray[5]
                                    : theme.colors.gray[5],
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Floor Area
                            </Text>
                            <Text
                              size="lg"
                              fw={600}
                              style={{
                                color:
                                  colorScheme === "dark"
                                    ? theme.white
                                    : theme.colors.gray[9],
                              }}
                            >
                              {model.specs.floorArea}
                            </Text>
                          </Stack>
                          <Stack gap={4}>
                            <Text
                              size="xs"
                              fw={500}
                              style={{
                                color:
                                  colorScheme === "dark"
                                    ? theme.colors.gray[5]
                                    : theme.colors.gray[5],
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Lot Area
                            </Text>
                            <Text
                              size="lg"
                              fw={600}
                              style={{
                                color:
                                  colorScheme === "dark"
                                    ? theme.white
                                    : theme.colors.gray[9],
                              }}
                            >
                              {model.specs.lotArea}
                            </Text>
                          </Stack>
                        </Group>
                      </Paper>
                    </Stack>
                  </CardSection>
                </div>
              </Card>
            ))}
          </Stack>

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link
              href="/"
              style={{
                color:
                  colorScheme === "dark"
                    ? theme.colors.blue[4]
                    : theme.colors.blue[6],
                textDecoration: "none",
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </Stack>
      </Container>
    </div>
  );
}
