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
          const filtered = data.announcements.filter(
            (ann: Announcement) => {
              const schedDate = new Date(ann.scheduledDate);
              // Compare only the date part (ignoring time)
              schedDate.setHours(0, 0, 0, 0);
              const today = new Date(currentDate);
              today.setHours(0, 0, 0, 0);
              console.log(`Announcement: ${ann.title}, Date: ${schedDate}, Today: ${today}`);
              return schedDate <= today;
            }
          );
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
    { icon: Home, label: "House", count: "2340 PROPERTIES" },
    { icon: Building2, label: "Villa", count: "2145 PROPERTIES" },
    { icon: Building2, label: "Condo", count: "924 PROPERTIES" },
  ];

  const differentiators = [
    {
      icon: Users,
      title: "Expert Advice",
      description:
        "Our property has been designed with attention to every detail, both commercial and client.",
    },
    {
      icon: Shield,
      title: "Exclusive Property",
      description:
        "All our properties have been designed to be exclusive to every client, both commercial and client.",
    },
    {
      icon: Globe,
      title: "Global Network",
      description:
        "Access to our extensive network of properties worldwide with local expertise.",
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
          borderBottom: `1px solid ${colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
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
                  Find a Perfect Property to Suit Your Lifestyle
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
                  Seamlessly blend life and living. Discover a property that
                  complements your rhythm, turning every moment into a
                  reflection of your lifestyle.
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
                      border: `1px solid ${colorScheme === "dark"
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
            <div style={{ flex: 1, maxWidth: 500 }}>
              <Image
                width={500}
                height={500}
                src="/modern-house.jpg"
                alt="Modern luxury property"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: theme.radius.xl,
                  boxShadow: getDefaultShadow(),
                }}
              />
            </div>
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
                Take a big step into the future of living
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
                Our approach goes beyond transactions through transparent
                dealings, ethical practices, and a genuine commitment to client
                satisfaction. We prioritize building lasting relationships over
                quick sales ventures. With a rich legacy of excellence, we have
                consistently surpassed industry standards to redefine the art of
                property acquisition and sales.
              </Text>
              <MantineButton
                color="blue"
                rightSection={<ArrowRight size={16} />}
              >
                Learn More
              </MantineButton>
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
                    3500+
                  </Text>
                  <Text size="sm" style={{ color: theme.colors.blue[1] }}>
                    Happy Customer
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
                    15+
                  </Text>
                  <Text size="sm" style={{ color: theme.colors.gray[3] }}>
                    Years Experience
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
                    10,000+
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
                    Property Ready
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
                    500+
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
                    Financing Assistance
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
              What are Our Differentiation?
            </Title>
            <Text
              size="md"
              style={{
                color: theme.colors.gray[3],
                maxWidth: 672,
                textAlign: "center",
              }}
            >
              Our properties have been designed with attention to every detail,
              both commercial and client. oh yeah!
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
            gap="xl"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            <Stack gap="md">
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
                  Subdivisync
                </Title>
              </Group>
              <Text size="sm" style={{ color: theme.colors.gray[4] }}>
                Your trusted partner in finding the perfect property that suits
                your lifestyle.
              </Text>
            </Stack>
            <Stack gap="md">
              <Title order={4} style={{ color: theme.white }}>
                Quick Links
              </Title>
              <Stack gap="xs">
                <Text
                  component="a"
                  href="#"
                  style={{
                    color: theme.colors.gray[4],
                    "&:hover": { color: theme.white },
                  }}
                >
                  Home
                </Text>
                <Text
                  component="a"
                  href="#"
                  style={{
                    color: theme.colors.gray[4],
                    "&:hover": { color: theme.white },
                  }}
                >
                  Properties
                </Text>
                <Text
                  component="a"
                  href="#"
                  style={{
                    color: theme.colors.gray[4],
                    "&:hover": { color: theme.white },
                  }}
                >
                  Services
                </Text>
                <Text
                  component="a"
                  href="#"
                  style={{
                    color: theme.colors.gray[4],
                    "&:hover": { color: theme.white },
                  }}
                >
                  About Us
                </Text>
              </Stack>
            </Stack>
            <Stack gap="md">
              <Title order={4} style={{ color: theme.white }}>
                Services
              </Title>
              <Stack gap="xs">
                <Text
                  component="a"
                  href="#"
                  style={{
                    color: theme.colors.gray[4],
                    "&:hover": { color: theme.white },
                  }}
                >
                  Buy Property
                </Text>
                <Text
                  component="a"
                  href="#"
                  style={{
                    color: theme.colors.gray[4],
                    "&:hover": { color: theme.white },
                  }}
                >
                  Rent Property
                </Text>
                <Text
                  component="a"
                  href="#"
                  style={{
                    color: theme.colors.gray[4],
                    "&:hover": { color: theme.white },
                  }}
                >
                  Property Management
                </Text>
                <Text
                  component="a"
                  href="#"
                  style={{
                    color: theme.colors.gray[4],
                    "&:hover": { color: theme.white },
                  }}
                >
                  Investment
                </Text>
              </Stack>
            </Stack>
            <Stack gap="md">
              <Title order={4} style={{ color: theme.white }}>
                Contact
              </Title>
              <Stack gap="xs">
                <Text size="sm" style={{ color: theme.colors.gray[4] }}>
                  123 Real Estate St.
                </Text>
                <Text size="sm" style={{ color: theme.colors.gray[4] }}>
                  City, State 12345
                </Text>
                <Text size="sm" style={{ color: theme.colors.gray[4] }}>
                  Phone: (555) 123-4567
                </Text>
                <Text size="sm" style={{ color: theme.colors.gray[4] }}>
                  Email: info@Subdivisync.com
                </Text>
              </Stack>
            </Stack>
          </Group>
          <div
            style={{
              borderTop: `1px solid ${colorScheme === "dark"
                ? theme.colors.dark[4]
                : theme.colors.gray[8]
                }`,
              marginTop: 32,
              paddingTop: 32,
              textAlign: "center",
            }}
          >
            <Text size="sm" style={{ color: theme.colors.gray[4] }}>
              &copy; 2025 Subdivisync. All rights reserved.
            </Text>
          </div>
        </Container>
      </footer>
    </div>
  );
}
