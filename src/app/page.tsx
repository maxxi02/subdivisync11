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
  Box,
  SimpleGrid,
} from "@mantine/core";
import { IconStarFilled } from "@tabler/icons-react";
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

interface Feedback {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  message: string;
  createdAt: Date;
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
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [cardWidth, setCardWidth] = useState(550);
  
  // House model image indices
  const [sofiaImageIndex, setSofiaImageIndex] = useState(0);
  const [zerinaImageIndex, setZerinaImageIndex] = useState(0);
  const [sofiaTransition, setSofiaTransition] = useState(true);
  const [zerinaTransition, setZerinaTransition] = useState(true);


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

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        console.log("Fetching feedbacks...");
        // Use a public endpoint without authentication
        const response = await fetch("/api/feedbacks?limit=6&viewAll=true&sort=rating");
        const data = await response.json();
        console.log("Feedbacks API response:", data);
        
        if (data.success && data.feedbacks && data.feedbacks.length > 0) {
          setFeedbacks(data.feedbacks);
          console.log("Feedbacks set:", data.feedbacks);
        } else {
          console.log("No feedbacks found or API error, using placeholder data");
          // Use placeholder data if API fails or returns no data
          setFeedbacks([
            {
              _id: "placeholder1",
              userId: "user1",
              userName: "John Doe",
              userEmail: "john@example.com",
              rating: 5,
              message: "We love our new home in Lynville! The community is perfect for our family.",
              createdAt: new Date()
            },
            {
              _id: "placeholder2",
              userId: "user2",
              userName: "Maria Santos",
              userEmail: "maria@example.com",
              rating: 4,
              message: "Great location and excellent amenities. The security gives us peace of mind.",
              createdAt: new Date()
            },
            {
              _id: "placeholder3",
              userId: "user3",
              userName: "Robert Cruz",
              userEmail: "robert@example.com",
              rating: 5,
              message: "The property management team is very responsive. Highly recommended!",
              createdAt: new Date()
            },
            {
              _id: "placeholder4",
              userId: "user4",
              userName: "Sarah Garcia",
              userEmail: "sarah@example.com",
              rating: 4,
              message: "We've been living here for a year and love the community atmosphere.",
              createdAt: new Date()
            },
            {
              _id: "placeholder5",
              userId: "user5",
              userName: "Michael Reyes",
              userEmail: "michael@example.com",
              rating: 5,
              message: "The house quality exceeded our expectations. Very satisfied with our purchase.",
              createdAt: new Date()
            },
            {
              _id: "placeholder6",
              userId: "user6",
              userName: "Jennifer Tan",
              userEmail: "jennifer@example.com",
              rating: 5,
              message: "Excellent value for money and the location is perfect for commuting to work.",
              createdAt: new Date()
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch feedbacks", (err as Error).message);
        // Use placeholder data if API fails
        setFeedbacks([
          {
            _id: "error1",
            userId: "user1",
            userName: "John Doe",
            userEmail: "john@example.com",
            rating: 5,
            message: "We love our new home in Lynville! The community is perfect for our family.",
            createdAt: new Date()
          },
          {
            _id: "error2",
            userId: "user2",
            userName: "Maria Santos",
            userEmail: "maria@example.com",
            rating: 4,
            message: "Great location and excellent amenities. The security gives us peace of mind.",
            createdAt: new Date()
          },
          {
            _id: "error3",
            userId: "user3",
            userName: "Robert Cruz",
            userEmail: "robert@example.com",
            rating: 5,
            message: "The property management team is very responsive. Highly recommended!",
            createdAt: new Date()
          }
        ]);
      }
    };
    fetchFeedbacks();
  }, []);

  // Calculate card width to show exactly 2 cards side by side
  useEffect(() => {
    const calculateCardWidth = () => {
      const scrollContainer = document.getElementById("house-models-scroll-container");
      if (!scrollContainer) return;
      
      const containerWidth = scrollContainer.clientWidth;
      setCardWidth(containerWidth);
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
        minHeight: "70vh",
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
          position: "relative",
          padding: "8rem 0",
          minHeight: "70vh",
          overflow: "hidden",
        }}
      >
        {/* YouTube Video Background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <iframe
            src="https://www.youtube.com/embed/IKufP6JoOgo?autoplay=1&mute=1&loop=1&playlist=IKufP6JoOgo&controls=0&showinfo=0&modestbranding=1&rel=0&disablekb=1&fs=0&iv_load_policy=3"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "100vw",
              height: "56.25vw",
              minHeight: "100%",
              minWidth: "177.78vh",
              transform: "translate(-50%, -50%)",
              border: "none",
            }}
            allow="autoplay; encrypted-media"
            title="Background Video"
          />
          {/* Dark overlay for better text readability */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          />
        </div>
        <Container size="lg" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "60vh" }}>
          <Stack
            gap="xl"
            align="flex-start"
            style={{
              maxWidth: "600px",
              textAlign: "left",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <Title
                order={1}
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                  fontWeight: 700,
                  color: theme.white,
                  lineHeight: 1.2,
                  textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                }}
              >
                Lynville Residences Malvar 2 Sonera
              </Title>
              <Text
                size="lg"
                style={{
                  color: theme.colors.gray[3],
                  lineHeight: 1.6,
                  textShadow: "0 1px 5px rgba(0,0,0,0.3)",
                }}
              >
                A Beautiful and Modern Community in Brgy San Fernando and
                Santiago, Malvar, Batangas.
              </Text>
            <Group gap="md" wrap="wrap" justify="flex-start">
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
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease-in-out, background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <Paper
                    radius="md"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: "rgba(59, 130, 246, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <type.icon size={20} color={theme.colors.blue[4]} />
                  </Paper>
                  <Stack gap={0}>
                    <Text
                      style={{
                        fontWeight: 600,
                        color: theme.white,
                      }}
                    >
                      {type.label}
                    </Text>
                    <Text
                      size="sm"
                      style={{
                        color: theme.colors.gray[3],
                      }}
                    >
                      {type.count}
                    </Text>
                  </Stack>
                </Paper>
              ))}
              </Group>
          </Stack>
          <Center style={{ width: "100%", paddingBottom: "2.5rem" }}>
            <Stack align="center" gap="xs">
              <Text
                style={{
                  color: theme.colors.gray[3],
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
                  minWidth: "auto",
                  overflow: "visible",
                }}
              >
                <ChevronDown
                  size={20}
                  style={{
                    color: theme.colors.gray[3],
                    animation: "bounce 1s infinite",
                  }}
                />
              </MantineButton>
            </Stack>
          </Center>
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
            <Stack align="center" gap="md" mb="xl">
              <Title
                order={2}
                style={{
                  color:
                    colorScheme === "dark" ? theme.white : theme.colors.gray[9],
                  fontSize: "1.75rem",
                  fontWeight: 600
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
                  fontSize: "0.95rem"
                }}
              >
                Explore our diverse range of modern house models designed to suit your lifestyle and budget
              </Text>
            </Stack>
            <div
              className="house-models-scroll"
              id="house-models-scroll-container"
              style={{
                overflow: "visible",
                paddingBottom: "16px",
                width: "100%",
                margin: "0 auto"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: isMobile ? "wrap" : "nowrap",
                  gap: "20px",
                  padding: "8px 24px",
                  width: "100%",
                }}
              >
                {[
                  {
                    name: "Sofia Delux",
                    images: [
                      "/sofia-delux/s 1.jpg",
                      "/sofia-delux/s 2.jpg",
                      "/sofia-delux/s 3.jpg",
                      "/sofia-delux/s 4.jpg",
                      "/sofia-delux/s 5.jpg",
                      "/sofia-delux/s 6.jpg"
                    ]
                  },
                  {
                    name: "Zerina Premium",
                    images: [
                      "/zerina-premium/zerina-premium 1.jpg",
                      "/zerina-premium/z 2.jpg",
                      "/zerina-premium/z 3.jpg",
                      "/zerina-premium/z 4.jpg",
                      "/zerina-premium/z 5.jpg"
                    ]
                  }
                ].map((model, index) => {
                  const currentImageIndex = index === 0 ? sofiaImageIndex : zerinaImageIndex;
                  const setCurrentImageIndex = index === 0 ? setSofiaImageIndex : setZerinaImageIndex;
                  const hasTransition = index === 0 ? sofiaTransition : zerinaTransition;
                  const setHasTransition = index === 0 ? setSofiaTransition : setZerinaTransition;
                  
                  const prevImage = () => {
                    const isLooping = currentImageIndex === 0;
                    if (isLooping) {
                      setHasTransition(false);
                      setTimeout(() => setHasTransition(true), 50);
                    }
                    setCurrentImageIndex(prev => 
                      prev === 0 ? model.images.length - 1 : prev - 1
                    );
                  };
                  
                  const nextImage = () => {
                    const isLooping = currentImageIndex === model.images.length - 1;
                    if (isLooping) {
                      setHasTransition(false);
                      setTimeout(() => setHasTransition(true), 50);
                    }
                    setCurrentImageIndex(prev => 
                      prev === model.images.length - 1 ? 0 : prev + 1
                    );
                  };
                  
                  return (
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
                            ? "#2A2A2A"
                            : theme.white,
                        cursor: "pointer",
                        transition: "all 0.3s ease-in-out",
                        minWidth: `${cardWidth/2 + 40}px`,
                        maxWidth: `${cardWidth/2 + 40}px`,
                        width: `${cardWidth/2 + 40}px`,
                        flexShrink: 0,
                        border: `1px solid ${colorScheme === "dark" ? "#3f3f3f" : "#e9e9e9"}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = theme.shadows.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = theme.shadows.sm;
                      }}
                    >
                  <CardSection>
                    <div style={{ position: "relative", width: "100%", paddingBottom: "55%" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", borderTopLeftRadius: theme.radius.md, borderTopRightRadius: theme.radius.md }}>
                        <div
                          style={{
                            display: "flex",
                            transition: hasTransition ? "transform 0.3s ease" : "none",
                            transform: `translateX(-${currentImageIndex * (100 / model.images.length)}%)`,
                            width: `${model.images.length * 100}%`,
                            height: "100%",
                          }}
                        >
                          {model.images.map((img, idx) => (
                            <Image
                              key={idx}
                              src={img}
                              alt={`${model.name} ${idx + 1}`}
                              style={{
                                width: `${100 / model.images.length}%`,
                                height: "100%",
                                objectFit: "cover",
                                flexShrink: 0,
                                display: "block"
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      {model.images.length > 1 && (
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
                              backgroundColor: "rgba(0, 0, 0, 0.5)",
                              width: "28px",
                              height: "28px",
                              padding: 0,
                              minWidth: "28px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage();
                            }}
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
                              backgroundColor: "rgba(0, 0, 0, 0.5)",
                              width: "28px",
                              height: "28px",
                              padding: 0,
                              minWidth: "28px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage();
                            }}
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
                    </div>
                  </CardSection>
                  <CardSection p="sm" style={{ backgroundColor: colorScheme === "dark" ? "#2A2A2A" : theme.white, paddingTop: "12px", paddingBottom: "12px" }}>
                    <Title
                      order={4}
                      style={{
                        color:
                          colorScheme === "dark"
                            ? theme.white
                            : theme.colors.gray[9],
                        fontSize: "0.95rem",
                        textAlign: "center",
                        fontWeight: 500,
                        margin: 0
                      }}
                    >
                      {model.name}
                    </Title>
                  </CardSection>
                </Card>
              );
            })}
            </div>
            </div>
            <Center mt="xl">
              <MantineButton
                size="md"
                variant="filled"
                color="blue"
                rightSection={<ArrowRight size={16} />}
                style={{
                  paddingLeft: "1.5rem",
                  paddingRight: "1.5rem",
                  backgroundColor: "#3182CE",
                  borderRadius: "4px",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  height: "38px"
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
                  transition: "all 0.2s ease-in-out",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.backgroundColor = theme.colors.blue[6];
                  const iconContainer = e.currentTarget.querySelector('[data-icon-container]') as HTMLElement;
                  if (iconContainer) {
                    iconContainer.style.backgroundColor = theme.white;
                    iconContainer.style.color = theme.colors.blue[6];
                  }
                  const title = e.currentTarget.querySelector('h3') as HTMLElement;
                  if (title) {
                    title.style.color = theme.white;
                  }
                  const text = e.currentTarget.querySelector('p') as HTMLElement;
                  if (text) {
                    text.style.color = theme.colors.blue[1];
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.backgroundColor =
                    colorScheme === "dark"
                      ? theme.colors.dark[5]
                      : theme.white;
                  const iconContainer = e.currentTarget.querySelector('[data-icon-container]') as HTMLElement;
                  if (iconContainer) {
                    iconContainer.style.backgroundColor = theme.colors.blue[6];
                    iconContainer.style.color = theme.white;
                  }
                  const title = e.currentTarget.querySelector('h3') as HTMLElement;
                  if (title) {
                    title.style.color =
                      colorScheme === "dark"
                        ? theme.white
                        : theme.colors.gray[9];
                  }
                  const text = e.currentTarget.querySelector('p') as HTMLElement;
                  if (text) {
                    text.style.color =
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[6];
                  }
                }}
              >
                <CardSection p="md" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <Paper
                    data-icon-container
                    radius="md"
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: theme.colors.blue[6],
                      color: theme.white,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    <item.icon size={24} color="currentColor" />
                  </Paper>
                  <Title
                    order={3}
                    style={{
                      marginBottom: 12,
                      color:
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[9],
                      transition: "color 0.2s ease-in-out",
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
                      transition: "color 0.2s ease-in-out",
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

      {/* Customer Feedback Ratings */}
      {(
        <section
          style={{
            padding: "4rem 0",
            backgroundColor:
              colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[0],
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
                What Our Homeowners Say
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
                Real feedback from our valued homeowners
              </Text>
            </Stack>
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3 }}
              spacing="lg"
            >
              {feedbacks.map((feedback) => (
                <Card
                  key={feedback._id}
                  shadow="sm"
                  radius="md"
                  withBorder
                  p="lg"
                  style={{
                    backgroundColor:
                      colorScheme === "dark"
                        ? theme.colors.dark[5]
                        : theme.white,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    cursor: "default",
                    height: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <Stack gap="md">
                    {/* Rating stars */}
                    <Group gap="xs">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconStarFilled
                          key={star}
                          size={18}
                          color={
                            star <= feedback.rating
                              ? theme.colors.yellow[6]
                              : theme.colors.gray[4]
                          }
                        />
                      ))}
                    </Group>

                    {/* Feedback message */}
                    <Text
                      size="sm"
                      style={{
                        color:
                          colorScheme === "dark"
                            ? theme.colors.gray[3]
                            : theme.colors.gray[7],
                        lineHeight: 1.6,
                        fontStyle: "italic",
                      }}
                    >
                      "{feedback.message}"
                    </Text>

                    {/* User name and date */}
                    <Box
                      style={{
                        borderTop: `1px solid ${
                          colorScheme === "dark"
                            ? theme.colors.dark[4]
                            : theme.colors.gray[2]
                        }`,
                        paddingTop: 12,
                        marginTop: "auto",
                      }}
                    >
                      <Group justify="space-between">
                        <Text
                          size="sm"
                          fw={500}
                          style={{
                            color:
                              colorScheme === "dark"
                                ? theme.white
                                : theme.colors.gray[9],
                          }}
                        >
                          {feedback.userName?.split(" ")[0] || "Anonymous"}
                        </Text>
                        <Text
                          size="xs"
                          style={{
                            color:
                              colorScheme === "dark"
                                ? theme.colors.gray[5]
                                : theme.colors.gray[5],
                          }}
                        >
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Box>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Container>
        </section>
      )}

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
              width: "100%",
              textAlign: "center",
            }}
          >
            <Group justify="center" gap="md" mb="md" style={{ width: "100%" }}>
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
                href="/faqs"
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
                FAQs
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
