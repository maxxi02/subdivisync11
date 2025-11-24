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
import { useMantineTheme, useComputedColorScheme, rgba } from "@mantine/core";
import dynamic from "next/dynamic";

const HeaderClientNoSSR = dynamic(
  () => import("./_components/HeaderClient"),
  { ssr: false }
);
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
  const colorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true });
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
          Posted on
          {" "}
          {new Date(announcement.scheduledDate).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </CardSection>
    </Card>
  );
};

export default function HomePage() {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [cardWidth, setCardWidth] = useState(550);

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

  // Calculate card width to show exactly 2 cards
  useEffect(() => {
    const calculateCardWidth = () => {
      const scrollContainer = document.getElementById("house-models-scroll-container");
      if (!scrollContainer) return;
      
      const containerWidth = scrollContainer.clientWidth;
      const gap = 24;
      const calculatedWidth = (containerWidth - gap) / 2;
      setCardWidth(calculatedWidth);
    };

    calculateCardWidth();
    window.addEventListener("resize", calculateCardWidth);
    return () => window.removeEventListener("resize", calculateCardWidth);
  }, []);

  // Arrow key navigation for house models
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const scrollContainer = document.getElementById("house-models-scroll-container");
      if (!scrollContainer) return;

      // Only handle arrow keys when the container is in view
      const rect = scrollContainer.getBoundingClientRect();
      const isInView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!isInView) return;

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const gap = 24;
        const scrollAmount = cardWidth + gap;

        if (e.key === "ArrowLeft") {
          scrollContainer.scrollBy({
            left: -scrollAmount,
            behavior: "smooth",
          });
        } else if (e.key === "ArrowRight") {
          scrollContainer.scrollBy({
            left: scrollAmount,
            behavior: "smooth",
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cardWidth]);

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
      suppressHydrationWarning
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

        .house-models-scroll {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
        }

        .house-models-scroll::-webkit-scrollbar {
          height: 8px;
        }

        .house-models-scroll::-webkit-scrollbar-track {
          border-radius: 4px;
        }

        .house-models-scroll::-webkit-scrollbar-thumb {
          border-radius: 4px;
        }

        .house-model-card {
          scroll-snap-align: start;
        }

        @media (max-width: 768px) {
          .house-model-card {
            min-width: calc(100vw - 80px) !important;
            max-width: calc(100vw - 80px) !important;
            width: calc(100vw - 80px) !important;
          }
        }
      `}</style>
      {/* Header */}
      <HeaderClientNoSSR />

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
                      cursor: "pointer",
                      transition: "transform 0.2s ease-in-out",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
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

      {/* House Models Section */}
      <section
        style={{
          padding: "4rem 0",
          backgroundColor:
            colorScheme === "dark"
              ? theme.colors.dark[7]
              : theme.white,
        }}
      >
        <Container size="lg">
          <Stack gap="xl">
            <Stack align="center" gap="md">
              <Title
                order={2}
                style={{
                  color:
                    colorScheme === "dark" ? theme.white : theme.colors.gray[9],
                }}
              >
                Available House Models
              </Title>
              <Text
                size="md"
                style={{
                  color:
                    colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                  maxWidth: 672,
                  textAlign: "center",
                }}
              >
                Explore our diverse range of modern house models designed to suit
                your lifestyle and budget
              </Text>
            </Stack>
            <div
              className="house-models-scroll"
              id="house-models-scroll-container"
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                paddingBottom: "16px",
                scrollbarWidth: "thin",
                scrollbarColor: `${colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]} ${colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0]}`,
                width: "100%",
                scrollSnapType: "x mandatory",
                scrollBehavior: "smooth",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "24px",
                  padding: "8px 0",
                  width: "max-content",
                }}
              >
                {[
                  {
                    name: "Lynville 1",
                    area: "42 sqm",
                    bedrooms: 2,
                    bathrooms: 1,
                    price: "PHP 1,766,000",
                    color: theme.colors.blue[6],
                  },
                  {
                    name: "Lynville 2",
                    area: "50 sqm",
                    bedrooms: 3,
                    bathrooms: 2,
                    price: "PHP 2,000,000",
                    color: theme.colors.green[6],
                  },
                  {
                    name: "Lynville 3",
                    area: "60 sqm",
                    bedrooms: 3,
                    bathrooms: 2,
                    price: "PHP 2,200,000",
                    color: theme.colors.violet[6],
                  },
                  {
                    name: "Lynville 4",
                    area: "75 sqm",
                    bedrooms: 4,
                    bathrooms: 3,
                    price: "PHP 2,500,000",
                    color: theme.colors.orange[6],
                  },
                  {
                    name: "Lynville 5",
                    area: "45 sqm",
                    bedrooms: 2,
                    bathrooms: 1,
                    price: "PHP 1,850,000",
                    color: theme.colors.blue[7],
                  },
                  {
                    name: "Lynville 6",
                    area: "55 sqm",
                    bedrooms: 3,
                    bathrooms: 2,
                    price: "PHP 2,100,000",
                    color: theme.colors.green[7],
                  },
                  {
                    name: "Lynville 7",
                    area: "65 sqm",
                    bedrooms: 3,
                    bathrooms: 2,
                    price: "PHP 2,350,000",
                    color: theme.colors.violet[7],
                  },
                  {
                    name: "Lynville 8",
                    area: "70 sqm",
                    bedrooms: 4,
                    bathrooms: 2,
                    price: "PHP 2,400,000",
                    color: theme.colors.orange[7],
                  },
                  {
                    name: "Lynville 9",
                    area: "80 sqm",
                    bedrooms: 4,
                    bathrooms: 3,
                    price: "PHP 2,650,000",
                    color: theme.colors.red[6],
                  },
                  {
                    name: "Lynville 10",
                    area: "48 sqm",
                    bedrooms: 2,
                    bathrooms: 2,
                    price: "PHP 1,950,000",
                    color: theme.colors.blue[5],
                  },
                  {
                    name: "Lynville 11",
                    area: "58 sqm",
                    bedrooms: 3,
                    bathrooms: 2,
                    price: "PHP 2,150,000",
                    color: theme.colors.green[5],
                  },
                  {
                    name: "Lynville 12",
                    area: "68 sqm",
                    bedrooms: 3,
                    bathrooms: 3,
                    price: "PHP 2,450,000",
                    color: theme.colors.yellow[6],
                  },
                  {
                    name: "Lynville 13",
                    area: "85 sqm",
                    bedrooms: 4,
                    bathrooms: 3,
                    price: "PHP 2,750,000",
                    color: theme.colors.violet[5],
                  },
                  {
                    name: "Lynville 14",
                    area: "52 sqm",
                    bedrooms: 3,
                    bathrooms: 2,
                    price: "PHP 2,050,000",
                    color: theme.colors.orange[5],
                  },
                ].map((model, index) => (
                  <Card
                    key={index}
                    className="house-model-card"
                    shadow="sm"
                    radius="md"
                    withBorder
                    style={{
                      overflow: "hidden",
                      backgroundColor:
                        colorScheme === "dark"
                          ? theme.colors.dark[6]
                          : theme.white,
                      cursor: "pointer",
                      transition: "all 0.3s ease-in-out",
                      minWidth: `${cardWidth}px`,
                      maxWidth: `${cardWidth}px`,
                      width: `${cardWidth}px`,
                      flexShrink: 0,
                      scrollSnapAlign: "start",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-8px)";
                      e.currentTarget.style.boxShadow = theme.shadows.lg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = theme.shadows.sm;
                    }}
                  >
                  <CardSection>
                    <div
                      style={{
                        width: "100%",
                        height: 400,
                        backgroundColor: model.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      <Text
                        size="xl"
                        fw={700}
                        style={{
                          color: theme.white,
                          textAlign: "center",
                          padding: "0 16px",
                          fontSize: "1.75rem",
                        }}
                      >
                        {model.name}
                      </Text>
                      <Badge
                        color="white"
                        variant="filled"
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(10px)",
                          color: theme.white,
                        }}
                      >
                        Coming Soon
                      </Badge>
                    </div>
                  </CardSection>
                  <CardSection p="md">
                    <Stack gap="xs">
                      <Title
                        order={4}
                        style={{
                          color:
                            colorScheme === "dark"
                              ? theme.white
                              : theme.colors.gray[9],
                          fontSize: "1.1rem",
                          marginBottom: 4,
                        }}
                      >
                        {model.name}
                      </Title>
                      <Stack gap={4}>
                        <Text
                          size="sm"
                          style={{
                            color:
                              colorScheme === "dark"
                                ? theme.colors.gray[4]
                                : theme.colors.gray[6],
                            lineHeight: 1.4,
                          }}
                        >
                          <strong>Bedroom{model.bedrooms !== 1 ? "s" : ""}:</strong> {model.bedrooms} • <strong>Bathroom{model.bathrooms !== 1 ? "s" : ""}:</strong> {model.bathrooms} • {model.area}
                        </Text>
                        <Text
                          size="sm"
                          fw={600}
                          style={{
                            color: model.color,
                            marginTop: 4,
                          }}
                        >
                          {model.price}
                        </Text>
                      </Stack>
                    </Stack>
                  </CardSection>
                </Card>
              ))}
              </div>
            </div>
            <Center mt="xl">
              <MantineButton
                size="lg"
                variant="filled"
                color="blue"
                rightSection={<ArrowRight size={18} />}
                style={{
                  paddingLeft: "2rem",
                  paddingRight: "2rem",
                }}
              >
                Browse All House Models
              </MantineButton>
            </Center>
          </Stack>
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
                withBorder
                style={{
                  textAlign: "center",
                  backgroundColor:
                    colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.backgroundColor = theme.colors.blue[6];
                  const textElements = e.currentTarget.querySelectorAll("p");
                  textElements.forEach((el) => {
                    (el as HTMLElement).style.color = theme.white;
                  });
                  const smallText = e.currentTarget.querySelector("p:last-child");
                  if (smallText) {
                    (smallText as HTMLElement).style.color = theme.colors.blue[1];
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.backgroundColor =
                    colorScheme === "dark"
                      ? theme.colors.dark[6]
                      : theme.white;
                  const textElements = e.currentTarget.querySelectorAll("p");
                  textElements.forEach((el, index) => {
                    if (index === 0) {
                      (el as HTMLElement).style.color =
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[9];
                    } else {
                      (el as HTMLElement).style.color =
                        colorScheme === "dark"
                          ? theme.colors.gray[4]
                          : theme.colors.gray[6];
                    }
                  });
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
                    737
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
                    Total Units
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
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.backgroundColor = theme.colors.blue[6];
                  const textElements = e.currentTarget.querySelectorAll("p");
                  textElements.forEach((el) => {
                    (el as HTMLElement).style.color = theme.white;
                  });
                  const smallText = e.currentTarget.querySelector("p:last-child");
                  if (smallText) {
                    (smallText as HTMLElement).style.color = theme.colors.blue[1];
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.backgroundColor =
                    colorScheme === "dark"
                      ? theme.colors.dark[6]
                      : theme.white;
                  const textElements = e.currentTarget.querySelectorAll("p");
                  textElements.forEach((el, index) => {
                    if (index === 0) {
                      (el as HTMLElement).style.color =
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[9];
                    } else {
                      (el as HTMLElement).style.color =
                        colorScheme === "dark"
                          ? theme.colors.gray[4]
                          : theme.colors.gray[6];
                    }
                  });
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
                    11.7 Hectares
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
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.backgroundColor = theme.colors.blue[6];
                  const textElements = e.currentTarget.querySelectorAll("p");
                  textElements.forEach((el) => {
                    (el as HTMLElement).style.color = theme.white;
                  });
                  const smallText = e.currentTarget.querySelector("p:last-child");
                  if (smallText) {
                    (smallText as HTMLElement).style.color = theme.colors.blue[1];
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.backgroundColor =
                    colorScheme === "dark"
                      ? theme.colors.dark[6]
                      : theme.white;
                  const textElements = e.currentTarget.querySelectorAll("p");
                  textElements.forEach((el, index) => {
                    if (index === 0) {
                      (el as HTMLElement).style.color =
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[9];
                    } else {
                      (el as HTMLElement).style.color =
                        colorScheme === "dark"
                          ? theme.colors.gray[4]
                          : theme.colors.gray[6];
                    }
                  });
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
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.backgroundColor = theme.colors.blue[6];
                  const textElements = e.currentTarget.querySelectorAll("p");
                  textElements.forEach((el) => {
                    (el as HTMLElement).style.color = theme.white;
                  });
                  const smallText = e.currentTarget.querySelector("p:last-child");
                  if (smallText) {
                    (smallText as HTMLElement).style.color = theme.colors.blue[1];
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.backgroundColor =
                    colorScheme === "dark"
                      ? theme.colors.dark[6]
                      : theme.white;
                  const textElements = e.currentTarget.querySelectorAll("p");
                  textElements.forEach((el, index) => {
                    if (index === 0) {
                      (el as HTMLElement).style.color =
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[9];
                    } else {
                      (el as HTMLElement).style.color =
                        colorScheme === "dark"
                          ? theme.colors.gray[4]
                          : theme.colors.gray[6];
                    }
                  });
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
              ? theme.colors.dark[7]
              : theme.white,
        }}
      >
        <Container size="lg">
          <Stack align="center" gap="md" mb="xl">
            <Title
              order={2}
              style={{
                color:
                  colorScheme === "dark"
                    ? theme.white
                    : theme.colors.gray[9],
              }}
            >
              Why Lynville
            </Title>
            <Text
              size="md"
              style={{
                color:
                  colorScheme === "dark"
                    ? theme.colors.gray[3]
                    : theme.colors.gray[6],
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
              backgroundColor:
                colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[0],
              padding: "2rem",
              alignItems: "stretch",
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
                      : theme.white,
                  borderColor:
                    colorScheme === "dark"
                      ? theme.colors.dark[4]
                      : theme.colors.gray[2],
                  cursor: "pointer",
                  transition: "transform 0.2s ease-in-out",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <CardSection p="md" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
                    style={{
                      marginBottom: 12,
                      color:
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[9],
                    }}
                  >
                    {item.title}
                  </Title>
                  <Text
                    size="sm"
                    style={{
                      color:
                        colorScheme === "dark"
                          ? theme.colors.gray[3]
                          : theme.colors.gray[6],
                      lineHeight: 1.6,
                    }}
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
              : theme.colors.gray[0],
          padding: "3rem 0",
          color:
            colorScheme === "dark" ? theme.white : theme.colors.gray[9],
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
                <Title
                  order={4}
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.white
                        : theme.colors.gray[9],
                  }}
                >
                  Lynville Residences Malvar 2 Sonera
                </Title>
              </Group>
              <Text
                size="sm"
                style={{
                  color:
                    colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                }}
              >
                Your trusted partner in finding the perfect property that suits
                your lifestyle.
              </Text>
            </Stack>
            <Stack gap="md" style={{ minWidth: "200px", flex: 1 }}>
              <Title
                order={4}
                style={{
                  color:
                    colorScheme === "dark"
                      ? theme.white
                      : theme.colors.gray[9],
                }}
              >
                Contact
              </Title>
              <Stack gap="xs">
                <Text
                  size="sm"
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[4]
                        : theme.colors.gray[6],
                  }}
                >
                  Barangay San Fernando & Santiago, Malvar
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
                  Phone: 09178039073
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
            }}
          >
            <Group justify="center" gap="xl" mb="md">
              <Link
                href="/terms-of-service"
                style={{
                  color:
                    colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color =
                    colorScheme === "dark"
                      ? theme.colors.blue[4]
                      : theme.colors.blue[6];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color =
                    colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6];
                }}
              >
                Terms and Conditions
              </Link>
              <Text
                size="sm"
                style={{
                  color:
                    colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                }}
              >
                •
              </Text>
              <Link
                href="/privacy-policy"
                style={{
                  color:
                    colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color =
                    colorScheme === "dark"
                      ? theme.colors.blue[4]
                      : theme.colors.blue[6];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color =
                    colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6];
                }}
              >
                Privacy Policy
              </Link>
            </Group>
            <Text
              size="sm"
              style={{
                color:
                  colorScheme === "dark"
                    ? theme.colors.gray[4]
                    : theme.colors.gray[6],
                textAlign: "center",
              }}
            >
              &copy; 2025 Lynville Residences Malvar 2 Sonera. All rights
              reserved.
            </Text>
          </div>
        </Container>
      </footer>
    </div>
  );
}
