"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Card,
  CardSection,
  Badge,
  Title,
  Text,
  Stack,
  Group,
  Button as MantineButton,
  Image,
  Center,
  Paper,
} from "@mantine/core";
import {
  Home,
  Building2,
  ChevronDown,
  Users,
  Shield,
  Globe,
  ArrowRight,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMantineTheme, useMantineColorScheme, rgba } from "@mantine/core";
import { ToggleColorScheme } from "./LayoutWrapper";
import Link from "next/link";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high";
  scheduledDate: string;
  images: { url: string; publicId: string }[];
  created_by: string;
  created_at: string;
  updated_at?: string;
}

const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = announcement.images || [];

  const prev = useCallback(
    () => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1)),
    [images.length]
  );
  const next = useCallback(
    () => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1)),
    [images.length]
  );

  const priorityColor = {
    high: theme.colors.red[6],
    medium: theme.colors.yellow[6],
    low: theme.colors.green[6],
  }[announcement.priority];

  return (
    <Card
      shadow="sm"
      radius="md"
      withBorder
      style={{
        overflow: "hidden",
        backgroundColor:
          colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
        transition: "box-shadow 0.3s",
        "&:hover": { boxShadow: theme.shadows.lg },
      }}
    >
      <CardSection>
        <div style={{ position: "relative" }}>
          {!images || images.length === 0 ? (
            <div
              style={{
                width: "100%",
                height: 192,
                backgroundColor:
                  colorScheme === "dark"
                    ? theme.colors.violet[9]
                    : theme.colors.violet[1],
              }}
            />
          ) : (
            <>
              <div style={{ overflow: "hidden", width: "100%", height: 320 }}>
                <div
                  style={{
                    display: "flex",
                    transition: "transform 0.3s",
                    transform: `translateX(-${currentIndex * 100}%)`,
                  }}
                >
                  {images.map((img, idx) => (
                    <Image
                      width={500}
                      height={320}
                      key={img.publicId}
                      src={img.url}
                      alt={announcement.title}
                      style={{
                        width: "100%",
                        height: 320,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
              {images.length > 1 && (
                <>
                  <MantineButton
                    variant="filled"
                    color="gray"
                    size="xs"
                    style={{
                      position: "absolute",
                      left: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      backgroundColor:
                        colorScheme === "dark"
                          ? "rgba(0, 0, 0, 0.5)"
                          : "rgba(255, 255, 255, 0.7)",
                      "&:hover": {
                        backgroundColor:
                          colorScheme === "dark"
                            ? "rgba(0, 0, 0, 0.7)"
                            : "rgba(255, 255, 255, 0.9)",
                      },
                    }}
                    onClick={prev}
                  >
                    <ArrowLeft
                      size={16}
                      color={
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[8]
                      }
                    />
                  </MantineButton>
                  <MantineButton
                    variant="filled"
                    color="gray"
                    size="xs"
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      backgroundColor:
                        colorScheme === "dark"
                          ? "rgba(0, 0, 0, 0.5)"
                          : "rgba(255, 255, 255, 0.7)",
                      "&:hover": {
                        backgroundColor:
                          colorScheme === "dark"
                            ? "rgba(0, 0, 0, 0.7)"
                            : "rgba(255, 255, 255, 0.9)",
                      },
                    }}
                    onClick={next}
                  >
                    <ArrowRightIcon
                      size={16}
                      color={
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[8]
                      }
                    />
                  </MantineButton>
                </>
              )}
            </>
          )}
          <Badge
            color="blue"
            style={{ position: "absolute", top: 12, left: 12 }}
          >
            {announcement.category}
          </Badge>
          <Badge
            color={priorityColor}
            style={{ position: "absolute", top: 12, right: 12 }}
          >
            {announcement.priority}
          </Badge>
        </div>
      </CardSection>
      <CardSection style={{ padding: 16 }}>
        <Title
          order={3}
          style={{
            marginBottom: 8,
            color: colorScheme === "dark" ? theme.white : theme.colors.gray[9],
          }}
        >
          {announcement.title}
        </Title>
        <Text
          size="sm"
          style={{
            color:
              colorScheme === "dark"
                ? theme.colors.gray[4]
                : theme.colors.gray[5],
            marginBottom: 8,
          }}
        >
          {announcement.content}
        </Text>
        <Text
          size="sm"
          style={{
            color:
              colorScheme === "dark"
                ? theme.colors.gray[5]
                : theme.colors.gray[4],
          }}
        >
          Posted on {new Date(announcement.scheduledDate).toLocaleDateString()}
        </Text>
      </CardSection>
    </Card>
  );
};

export default function HomePage() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // === Hero carousel images & state (NEW) ===
  const heroImages = [
    "https://lynville.com.ph/wp-content/uploads/2019/01/SOFIA-DELUXE-ACTUAL-LIPA-2-SAN-NICOLAS-2-1920x1280.jpg",
    "https://lynville.com.ph/wp-content/uploads/2018/11/Sofia_Deluxe_SuggestedInterior1-934x700.jpg",
    "https://lynville.com.ph/wp-content/uploads/2018/11/Sofia_Deluxe_SuggestedInterior2-934x700.jpg",
    "https://lynville.com.ph/wp-content/uploads/2018/11/Sofia_Deluxe_SuggestedInterior3-934x700.jpg",
    "https://lynville.com.ph/wp-content/uploads/2020/02/Lynville-Cabuyao_Moment2-1920x1080.jpg",
  ];

  const [heroIndex, setHeroIndex] = useState(0);

  // Autoplay for hero carousel
  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((i) => (i === heroImages.length - 1 ? 0 : i + 1));
    }, 5000);
    return () => clearInterval(id);
  }, [heroImages.length]);

  const prevHero = useCallback(
    () => setHeroIndex((i) => (i === 0 ? heroImages.length - 1 : i - 1)),
    [heroImages.length]
  );
  const nextHero = useCallback(
    () => setHeroIndex((i) => (i === heroImages.length - 1 ? 0 : i + 1)),
    [heroImages.length]
  );
  // === End hero carousel additions ===

  const getDefaultShadow = () => {
    const baseShadow = "0 1px 3px";
    const opacity = colorScheme === "dark" ? 0.2 : 0.12;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements?limit=6");
        const data = await response.json();
        console.log("API Response:", data); // Debug log
        if (data.success) {
          const currentDate = new Date();
          console.log("Current Date:", currentDate); // Debug log
          const filtered = data.announcements.filter((ann: Announcement) => {
            const schedDate = new Date(ann.scheduledDate);
            // Compare only the date part (ignoring time)
            schedDate.setHours(0, 0, 0, 0);
            const today = new Date(currentDate);
            today.setHours(0, 0, 0, 0);
            console.log(
              `Announcement: ${ann.title}, Date: ${schedDate}, Today: ${today}`
            );
            return schedDate <= today;
          });
          console.log("Filtered Announcements:", filtered); // Debug log
          filtered.sort(
            (a: Announcement, b: Announcement) =>
              new Date(b.scheduledDate).getTime() -
              new Date(a.scheduledDate).getTime()
          );
          setAnnouncements(filtered.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to fetch announcements", (err as Error).message);
      }
    };
    fetchAnnouncements();
  }, []);

  const propertyTypes = [
    { icon: Home, label: "Total Units", count: "737" },
    { icon: Building2, label: "Project Area", count: "11.7 hectares" },
  ];

  const differentiators = [
    {
      icon: Users,
      title: "Expert Advice",
      description: "Guidance to financing and reservation..",
    },
    {
      icon: Shield,
      title: "Secure Community",
      description: "Gated and planned for long-term value.",
    },
    {
      icon: Globe,
      title: "Accessible Location",
      description:
        "Near key transport and commercial hubs in Malvar / Lipa area",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor:
          colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
      }}
    >
      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(10px);
          }
        }

        @media (max-width: 768px) {
          .hero-group {
            flex-direction: column !important;
          }

          .stats-group {
            flex-direction: column !important;
          }
        }
      `}</style>
      {/* Header */}
      <header
        style={{
          borderBottom: `1px solid ${
            colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
          }`,
          backgroundColor:
            colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Container size="lg" py="sm">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Paper
                radius="md"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: theme.colors.blue[6],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Home size={20} color={theme.white} />
              </Paper>
              <Title
                order={4}
                style={{
                  color:
                    colorScheme === "dark" ? theme.white : theme.colors.gray[9],
                }}
              >
                Subdivisync
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

      {/* Hero Section */}
      <section
        style={{
          background:
            colorScheme === "dark"
              ? `linear-gradient(to bottom right, ${theme.colors.dark[5]}, ${theme.colors.dark[7]})`
              : `linear-gradient(to bottom right, ${theme.colors.gray[0]}, ${theme.white})`,
          padding: "5rem 0",
        }}
      >
        <Container size="lg">
          <Group
            align="center"
            gap="xl"
            className="hero-group"
            style={{
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <Stack gap="xl" style={{ flex: 1 }}>
              <Stack gap="md">
                <Title
                  order={1}
                  style={{
                    fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                    fontWeight: 700,
                    color:
                      colorScheme === "dark"
                        ? theme.white
                        : theme.colors.gray[9],
                    lineHeight: 1.2,
                  }}
                >
                  Lynville Residences Malvar 2 Sonera
                </Title>
                <Text
                  size="lg"
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[4]
                        : theme.colors.gray[6],
                    lineHeight: 1.6,
                  }}
                >
                  A Beautiful and Modern Community in Brgy San Fernando and
                  Santiago, Malvar, Batangas.
                </Text>
              </Stack>
              <Group gap="md" wrap="wrap">
                {propertyTypes.map((type, index) => (
                  <Paper
                    key={index}
                    shadow="sm"
                    radius="md"
                    p="md"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      backgroundColor:
                        colorScheme === "dark"
                          ? theme.colors.dark[6]
                          : theme.white,
                      border: `1px solid ${
                        colorScheme === "dark"
                          ? theme.colors.dark[4]
                          : theme.colors.gray[2]
                      }`,
                    }}
                  >
                    <Paper
                      radius="md"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: theme.colors.blue[1],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <type.icon size={20} color={theme.colors.blue[6]} />
                    </Paper>
                    <Stack gap={0}>
                      <Text
                        style={{
                          fontWeight: 600,
                          color:
                            colorScheme === "dark"
                              ? theme.white
                              : theme.colors.gray[9],
                        }}
                      >
                        {type.label}
                      </Text>
                      <Text
                        size="sm"
                        style={{
                          color:
                            colorScheme === "dark"
                              ? theme.colors.gray[4]
                              : theme.colors.gray[5],
                        }}
                      >
                        {type.count}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
              </Group>
              <Center>
                <Stack align="center" gap="xs">
                  <Text
                    style={{
                      color:
                        colorScheme === "dark"
                          ? theme.colors.gray[4]
                          : theme.colors.gray[5],
                    }}
                  >
                    Scroll down to explore
                  </Text>
                  <MantineButton
                    variant="subtle"
                    onClick={() => {
                      const announcementsSection = document.querySelector(
                        'section[data-section="announcements"]'
                      );
                      announcementsSection?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                    style={{
                      padding: 0,
                      minWidth: "auto",
                      height: "auto",
                    }}
                  >
                    <ChevronDown
                      size={20}
                      style={{
                        color:
                          colorScheme === "dark"
                            ? theme.colors.gray[4]
                            : theme.colors.gray[4],
                        animation: "bounce 1s infinite",
                      }}
                    />
                  </MantineButton>
                </Stack>
              </Center>
            </Stack>

            {/* === Hero Carousel (NEW) === */}
            <div style={{ flex: 1, maxWidth: 500, position: "relative" }}>
              <div
                style={{
                  overflow: "hidden",
                  width: "100%",
                  borderRadius: theme.radius.xl,
                  boxShadow: getDefaultShadow(),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: `${heroImages.length * 100}%`,
                    transform: `translateX(-${heroIndex * (100 / heroImages.length)}%)`,
                    transition: "transform 0.6s ease",
                  }}
                >
                  {heroImages.map((src, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${100 / heroImages.length}%`,
                        flexShrink: 0,
                        height: isMobile ? 240 : 360,
                        display: "block",
                        position: "relative",
                      }}
                    >
                      <Image
                        src={src}
                        alt={`Lynville ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: theme.radius.xl,
                          display: "block",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Left / Right controls */}
              <MantineButton
                variant="filled"
                size="xs"
                onClick={prevHero}
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background:
                    colorScheme === "dark"
                      ? "rgba(0,0,0,0.5)"
                      : "rgba(255,255,255,0.85)",
                  padding: 6,
                  minWidth: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft
                  size={16}
                  color={
                    colorScheme === "dark" ? theme.white : theme.colors.gray[8]
                  }
                />
              </MantineButton>

              <MantineButton
                variant="filled"
                size="xs"
                onClick={nextHero}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background:
                    colorScheme === "dark"
                      ? "rgba(0,0,0,0.5)"
                      : "rgba(255,255,255,0.85)",
                  padding: 6,
                  minWidth: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight
                  size={16}
                  color={
                    colorScheme === "dark" ? theme.white : theme.colors.gray[8]
                  }
                />
              </MantineButton>

              {/* Indicators */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 12,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {heroImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      border: "none",
                      background:
                        i === heroIndex
                          ? theme.colors.blue[6]
                          : colorScheme === "dark"
                            ? theme.colors.dark[4]
                            : theme.colors.gray[4],
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
            {/* === End Hero Carousel === */}
          </Group>
        </Container>
      </section>

      {/* Announcements Section */}
      <section
        data-section="announcements"
        style={{
          padding: "4rem 0",
          backgroundColor:
            colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center" mb="lg">
            <Title
              order={2}
              style={{
                color:
                  colorScheme === "dark" ? theme.white : theme.colors.gray[9],
              }}
            >
              Announcements
            </Title>
            <MantineButton
              variant="subtle"
              color="blue"
              rightSection={<ArrowRight size={16} />}
            >
              <Link href={"/announcements"}>See More</Link>
            </MantineButton>
          </Group>
          <Group
            gap="md"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            }}
          >
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement._id}
                announcement={announcement}
              />
            ))}
          </Group>
        </Container>
      </section>

      {/* Statistics Section */}
      <section
        style={{
          padding: "4rem 0",
          backgroundColor:
            colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
        }}
      >
        <Container size="lg">
          <Group
            align="center"
            gap="xl"
            className="stats-group"
            style={{
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <Stack gap="md" style={{ flex: 1 }}>
              <Title
                order={2}
                style={{
                  fontSize: "clamp(2rem, 4vw, 2.5rem)",
                  fontWeight: 700,
                  color:
                    colorScheme === "dark" ? theme.white : theme.colors.gray[9],
                }}
              >
                Your New Home in Malvar, Batangas
              </Title>
              <Text
                size="md"
                style={{
                  color:
                    colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                  lineHeight: 1.6,
                }}
              >
                Located in Barangay San Fernando and Santiago, Malvar, Batangas.
                Lynville Residences Sonerra is the 2nd Phase of Lynville
                Residences Primera in Malvar. It is a secure, gated community,
                with modern designed and durable homes that is very affordable
                with Pagibig Fund to the working filipino.
              </Text>
              {/* Learn More button removed as requested */}
            </Stack>
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 24,
              }}
            >
              <Card
                shadow="sm"
                radius="md"
                style={{
                  textAlign: "center",
                  backgroundColor: theme.colors.blue[6],
                  color: theme.white,
                }}
              >
                <CardSection p="lg">
                  <Text size="xl" fw={700} style={{ marginBottom: 8 }}>
                    737
                  </Text>
                  <Text size="sm" style={{ color: theme.colors.blue[1] }}>
                    Total Units
                  </Text>
                </CardSection>
              </Card>
              <Card
                shadow="sm"
                radius="md"
                style={{
                  textAlign: "center",
                  backgroundColor:
                    colorScheme === "dark"
                      ? theme.colors.dark[6]
                      : theme.colors.gray[9],
                  color: theme.white,
                }}
              >
                <CardSection p="lg">
                  <Text size="xl" fw={700} style={{ marginBottom: 8 }}>
                    11.7 Hectares
                  </Text>
                  <Text size="sm" style={{ color: theme.colors.gray[3] }}>
                    Project Area
                  </Text>
                </CardSection>
              </Card>
              <Card
                shadow="sm"
                radius="md"
                withBorder
                style={{
                  textAlign: "center",
                  backgroundColor:
                    colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                }}
              >
                <CardSection p="lg">
                  <Text
                    size="xl"
                    fw={700}
                    style={{
                      marginBottom: 8,
                      color:
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[9],
                    }}
                  >
                    Php 1,766,000 - Php 2,200,000
                  </Text>
                  <Text
                    size="sm"
                    style={{
                      color:
                        colorScheme === "dark"
                          ? theme.colors.gray[4]
                          : theme.colors.gray[6],
                    }}
                  >
                    Price Range
                  </Text>
                </CardSection>
              </Card>
              <Card
                shadow="sm"
                radius="md"
                withBorder
                style={{
                  textAlign: "center",
                  backgroundColor:
                    colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                }}
              >
                <CardSection p="lg">
                  <Text
                    size="xl"
                    fw={700}
                    style={{
                      marginBottom: 8,
                      color:
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[9],
                    }}
                  >
                    Parks, Playground, Clubhouse
                  </Text>
                  <Text
                    size="sm"
                    style={{
                      color:
                        colorScheme === "dark"
                          ? theme.colors.gray[4]
                          : theme.colors.gray[6],
                    }}
                  >
                    Amenities
                  </Text>
                </CardSection>
              </Card>
            </div>
          </Group>
        </Container>
      </section>

      {/* Differentiators Section */}
      <section
        style={{
          padding: "4rem 0",
          backgroundColor:
            colorScheme === "dark"
              ? theme.colors.dark[6]
              : theme.colors.gray[9],
        }}
      >
        <Container size="lg">
          <Stack align="center" gap="md" mb="xl">
            <Title order={2} style={{ color: theme.white }}>
              Why Lynville
            </Title>
            <Text
              size="md"
              style={{
                color: theme.colors.gray[3],
                maxWidth: 672,
                textAlign: "center",
              }}
            >
              Secure gated community, modern durable homes, affordable financing
              options design for Filipino families
            </Text>
          </Stack>
          <Group
            gap="lg"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            }}
          >
            {differentiators.map((item, index) => (
              <Card
                key={index}
                shadow="sm"
                radius="md"
                withBorder
                style={{
                  backgroundColor:
                    colorScheme === "dark"
                      ? theme.colors.dark[5]
                      : theme.colors.gray[8],
                  borderColor:
                    colorScheme === "dark"
                      ? theme.colors.dark[4]
                      : theme.colors.gray[7],
                }}
              >
                <CardSection p="md">
                  <Paper
                    radius="md"
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: theme.colors.blue[6],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <item.icon size={24} color={theme.white} />
                  </Paper>
                  <Title
                    order={3}
                    style={{ marginBottom: 12, color: theme.white }}
                  >
                    {item.title}
                  </Title>
                  <Text
                    size="sm"
                    style={{ color: theme.colors.gray[3], lineHeight: 1.6 }}
                  >
                    {item.description}
                  </Text>
                </CardSection>
              </Card>
            ))}
          </Group>
        </Container>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor:
            colorScheme === "dark"
              ? theme.colors.dark[6]
              : theme.colors.gray[9],
          padding: "3rem 0",
          color: theme.white,
        }}
      >
        <Container size="lg">
          <Group
            wrap="nowrap"
            style={{
              width: "100%",
            }}
          >
            <Stack gap="md" style={{ minWidth: "200px", flex: 1 }}>
              <Group gap="xs">
                <Paper
                  radius="md"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: theme.colors.blue[6],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Home size={20} color={theme.white} />
                </Paper>
                <Title order={4} style={{ color: theme.white }}>
                  Lynville Residences Malvar 2 Sonera
                </Title>
              </Group>
              <Text size="sm" style={{ color: theme.colors.gray[4] }}>
                Your trusted partner in finding the perfect property that suits
                your lifestyle.
              </Text>
            </Stack>
            <Stack gap="md" style={{ minWidth: "200px", flex: 1 }}>
              <Title order={4} style={{ color: theme.white }}>
                Contact
              </Title>
              <Stack gap="xs">
                <Text size="sm" style={{ color: theme.colors.gray[4] }}>
                  Barangay San Fernando & Santiago, Malvar
                </Text>
                <Text size="sm" style={{ color: theme.colors.gray[4] }}>
                  Phone: 09178039073
                </Text>
                <Text size="sm" style={{ color: theme.colors.gray[4] }}>
                  Email: customercare@lynvilleland.com.ph
                </Text>
              </Stack>
            </Stack>
          </Group>
          <div
            style={{
              borderTop: `1px solid ${
                colorScheme === "dark"
                  ? theme.colors.dark[4]
                  : theme.colors.gray[8]
              }`,
              marginTop: 32,
              paddingTop: 32,
              textAlign: "center",
            }}
          >
            <Text size="sm" style={{ color: theme.colors.gray[4] }}>
              &copy; 2025 Lynville Residences Malvar 2 Sonera. All rights
              reserved.
            </Text>
          </div>
        </Container>
      </footer>
    </div>
  );
}
