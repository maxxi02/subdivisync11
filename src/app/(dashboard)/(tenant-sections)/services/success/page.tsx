"use client";
import { useEffect, useState } from "react";
import {
  Container,
  Card,
  Text,
  Stack,
  Button,
  Group,
  LoadingOverlay,
} from "@mantine/core";
import { IconCheck, IconReceipt } from "@tabler/icons-react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    if (paymentId) {
      checkPaymentStatus();
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  const checkPaymentStatus = async () => {
    try {
      // Wait a bit for webhook to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // FIX: Changed from fetch`...` to fetch(...)
      const response = await fetch(`/api/tenant/monthly-payments/${paymentId}`);
      const data = await response.json();

      if (data.success && data.payment?.receiptUrl) {
        setReceiptUrl(data.payment.receiptUrl);
      }
    } catch (error) {
      console.error("Error checking payment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" py="xl">
      <LoadingOverlay visible={loading} />
      <Card shadow="md" padding="xl" radius="lg" withBorder>
        <Stack gap="xl" align="center">
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCheck size={48} color="white" stroke={3} />
          </div>
          <Stack gap="xs" align="center">
            <Text size="xl" fw={700}>
              Payment Successful!
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Your payment has been processed successfully.
            </Text>
          </Stack>
          <Group gap="md">
            {receiptUrl && (
              <Button
                leftSection={<IconReceipt size={16} />}
                onClick={() => window.open(receiptUrl, "_blank")}
                variant="filled"
              >
                View Receipt
              </Button>
            )}
            <Button
              onClick={() => router.push("/transactions")}
              variant="outline"
            >
              Back to Transactions
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
