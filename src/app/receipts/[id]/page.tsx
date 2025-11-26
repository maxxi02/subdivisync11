"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Divider,
  Badge,
  Button,
  LoadingOverlay,
  useMantineTheme,
  useMantineColorScheme,
  Card,
  ThemeIcon,
} from "@mantine/core";
import { IconCheck, IconReceipt, IconDownload, IconPrinter, IconX } from "@tabler/icons-react";
import axios from "axios";

interface Receipt {
  _id: string;
  type: string;
  amount: number;
  requestId: string;
  transactionId: string;
  paidDate: string;
  description: string;
  created_at: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryTextColor = colorScheme === "dark" ? "white" : "dark";
  const secondaryTextColor = colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6];
  const borderColor = colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3];

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/receipts/${params.id}`);
        
        if (response.data.success) {
          setReceipt(response.data.receipt);
        } else {
          setError(response.data.error || "Failed to load receipt");
        }
      } catch (err) {
        console.error("Error fetching receipt:", err);
        setError("Receipt not found or could not be loaded");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReceipt();
    }
  }, [params.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Container size="sm" py="xl" className="receipt-container">
        <Paper p="xl" radius="md" withBorder>
          <LoadingOverlay visible={true} />
          <Stack align="center" py="xl">
            <Title order={2}>Loading Receipt...</Title>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (error || !receipt) {
    return (
      <Container size="sm" py="xl" className="receipt-container">
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="md" py="xl">
            <ThemeIcon size={60} radius="xl" color="red" variant="light">
              <IconX size={30} stroke={1.5} />
            </ThemeIcon>
            <Title order={2} c={primaryTextColor}>Receipt Not Found</Title>
            <Text ta="center" c={secondaryTextColor}>
              {error || "The receipt you're looking for could not be found. It may have been deleted or the link is incorrect."}
            </Text>
            <Button 
              component="a" 
              href="/service-requests" 
              variant="filled" 
              color="blue"
              mt="md"
            >
              Back to Service Requests
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl" className="receipt-container">
      <Paper p="xl" radius="md" withBorder className="receipt-paper">
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Stack gap={0}>
              <Group gap="xs" align="center">
                <IconReceipt size={24} color={theme.colors.blue[6]} />
                <Title order={2} c={primaryTextColor}>Payment Receipt</Title>
              </Group>
              <Text size="sm" c={secondaryTextColor}>
                SubdiviSync Payment System
              </Text>
            </Stack>
          </Group>

          <Divider />

          {/* Receipt Details */}
          <Card withBorder p="md" radius="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={500} c={primaryTextColor}>Receipt ID:</Text>
                <Text c={secondaryTextColor}>{receipt._id}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text fw={500} c={primaryTextColor}>Transaction ID:</Text>
                <Text c={secondaryTextColor}>{receipt.transactionId}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text fw={500} c={primaryTextColor}>Payment Date:</Text>
                <Text c={secondaryTextColor}>{formatDate(receipt.paidDate)}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text fw={500} c={primaryTextColor}>Description:</Text>
                <Text c={secondaryTextColor}>{receipt.description}</Text>
              </Group>
            </Stack>
          </Card>

          {/* Amount */}
          <Card withBorder p="md" radius="md" bg={colorScheme === "dark" ? "dark.6" : "gray.0"}>
            <Stack gap="xs" align="center">
              <Text size="sm" fw={500} c={secondaryTextColor}>TOTAL AMOUNT PAID</Text>
              <Text size="xl" fw={700} c={primaryTextColor}>
                {formatCurrency(receipt.amount)}
              </Text>
              <Group gap="xs">
                <ThemeIcon size="xs" radius="xl" color="green">
                  <IconCheck size={10} />
                </ThemeIcon>
                <Text size="xs" c="green">Payment Successful</Text>
              </Group>
            </Stack>
          </Card>

          {/* Actions */}
          <Group justify="center" gap="md" className="no-print">
            <Button
              variant="outline"
              leftSection={<IconPrinter size={16} />}
              onClick={handlePrint}
            >
              Print Receipt
            </Button>
            <Button
              component="a"
              href="/service-requests"
              variant="filled"
              color="blue"
            >
              Back to Service Requests
            </Button>
          </Group>

          {/* Footer */}
          <Divider className="mt-auto" />
          <Text size="xs" ta="center" c={secondaryTextColor}>
            This is an official receipt for your payment. Thank you for using SubdiviSync.
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
