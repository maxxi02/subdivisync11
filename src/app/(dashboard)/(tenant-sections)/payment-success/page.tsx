"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Container, Title, Text, Stack, LoadingOverlay, Button, Card } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import axios from "axios";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentIntentId = searchParams.get("payment_intent_id");
      const requestId = searchParams.get("request_id");

      if (!paymentIntentId || !requestId) {
        setStatus("failed");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post("/api/create-payment/verify-payment", {
          paymentIntentId,
          requestId,
        });

        if (response.data.success && response.data.localStatus === "paid") {
          setStatus("success");
          // Fetch the updated request to get receipt URL
          const requestResponse = await axios.get(`/api/service-requests?id=${requestId}`);
          if (requestResponse.data.success) {
            setReceiptUrl(requestResponse.data.serviceRequest.receipt_url);
          }
        } else {
          setStatus("failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <LoadingOverlay visible />
        <Text ta="center">Verifying your payment...</Text>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Card padding="xl" radius="lg" withBorder>
        <Stack align="center" gap="md">
          {status === "success" ? (
            <>
              <IconCheck size={64} color="green" />
              <Title order={2}>Payment Successful!</Title>
              <Text ta="center">
                Your payment has been processed successfully. Thank you!
              </Text>
              {receiptUrl && (
                <Button
                  variant="filled"
                  color="blue"
                  onClick={() => window.open(receiptUrl, "_blank")}
                >
                  View Receipt
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push("/service-requests")}
              >
                Back to Service Requests
              </Button>
            </>
          ) : (
            <>
              <IconX size={64} color="red" />
              <Title order={2}>Payment Failed</Title>
              <Text ta="center">
                There was an issue processing your payment. Please try again.
              </Text>
              <Button
                variant="outline"
                onClick={() => router.push("/service-requests")}
              >
                Back to Service Requests
              </Button>
            </>
          )}
        </Stack>
      </Card>
    </Container>
  );
}