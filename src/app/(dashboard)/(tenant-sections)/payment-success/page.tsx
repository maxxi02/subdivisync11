"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Container, 
  Title, 
  Text, 
  Stack, 
  LoadingOverlay, 
  Button, 
  Card,
  Group,
  Badge,
  ThemeIcon,
  useMantineTheme,
  useMantineColorScheme,
  rgba
} from "@mantine/core";
import { IconCheck, IconX, IconReceipt, IconArrowLeft, IconCreditCard } from "@tabler/icons-react";
import axios from "axios";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Verifying your payment...");
  const [isOpenedFromTab, setIsOpenedFromTab] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string | null>(null);
  const [paymentDescription, setPaymentDescription] = useState<string | null>(null);
  
  const primaryTextColor = colorScheme === "dark" ? "white" : "dark";
  const secondaryTextColor = colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6];
  
  const getDefaultShadow = () => {
    const baseShadow = "0 1px 3px";
    const opacity = colorScheme === "dark" ? 0.2 : 0.12;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };

  // Check if window was opened from another tab
  useEffect(() => {
    setIsOpenedFromTab(!!window.opener);
  }, []);

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentIntentId = searchParams.get("payment_intent_id");
      const requestId = searchParams.get("request_id");

      console.log("Payment success page loaded with params:", {
        paymentIntentId,
        requestId,
        url: window.location.href
      });

      if (!paymentIntentId || !requestId) {
        console.error("Missing payment parameters:", {
          paymentIntentId,
          requestId,
          searchParams: Object.fromEntries(searchParams.entries())
        });
        setStatus("failed");
        setMessage("Missing payment information. Please try again.");
        setLoading(false);
        return;
      }

      // Wait 3 seconds for webhook to process
      setMessage("Waiting for payment confirmation...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Try verification with progressive delays
      const maxRetries = 6;
      const delays = [3000, 5000, 7000, 10000, 15000, 20000]; // 3s, 5s, 7s, 10s, 15s, 20s

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            setMessage(`Verifying payment... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
          }

          const response = await axios.post("/api/create-payment/verify-payment", {
            paymentIntentId,
            requestId,
          });

          const responseData = response.data;

          // Payment successful!
          if (responseData.success && responseData.localStatus === "paid") {
            // Clear localStorage to notify original tab
            localStorage.removeItem('pending_payment');
            
            setStatus("success");
            setMessage("Payment completed successfully!");
            
            if (responseData.receiptUrl) {
              setReceiptUrl(responseData.receiptUrl);
            }
            
            // Set payment details if available
            if (responseData.amount) {
              setPaymentAmount(responseData.amount.toFixed(2));
            }
            
            if (responseData.description) {
              setPaymentDescription(responseData.description);
            }
            
            setLoading(false);
            return;
          }

          // Payment failed
          if (responseData.localStatus === "failed" || responseData.error) {
            setStatus("failed");
            setMessage(responseData.error || "Payment verification failed. Please contact support.");
            setLoading(false);
            return;
          }

          // Still pending - continue to next attempt
          if (responseData.localStatus === "pending") {
            setMessage(`Payment still processing... (attempt ${attempt + 1}/${maxRetries})`);
            continue;
          }

          // Unknown status
          setStatus("failed");
          setMessage("Unable to verify payment status. Please check your payment history.");
          setLoading(false);
          return;

        } catch (error) {
          console.error(`Payment verification error (attempt ${attempt + 1}):`, error);
          
          // Log detailed error information
          if (axios.isAxiosError(error)) {
            console.error("Axios error details:", {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              message: error.message,
              url: error.config?.url
            });
          }
          
          // If it's the last attempt, show error
          if (attempt === maxRetries - 1) {
            setStatus("failed");
            const errorMessage = axios.isAxiosError(error) 
              ? error.response?.data?.error || error.message 
              : "Failed to verify payment";
            setMessage(`${errorMessage}. Please check your payment history or contact support.`);
            setLoading(false);
            return;
          }
          
          // Otherwise, continue to next attempt
          setMessage(`Retrying verification... (attempt ${attempt + 2}/${maxRetries})`);
        }
      }

      // If we get here, all retries exhausted
      setStatus("failed");
      setMessage("Payment verification timed out. Please check your payment history.");
      setLoading(false);
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Card padding="xl" radius="lg" withBorder style={{ boxShadow: getDefaultShadow() }}>
          <Stack align="center" gap="md" py="xl">
            <ThemeIcon size={60} radius="xl" color="blue" variant="light">
              <IconCreditCard size={30} stroke={1.5} />
            </ThemeIcon>
            <Title order={2} ta="center" c={primaryTextColor}>
              {message}
            </Title>
            <Text ta="center" size="md" c="dimmed" maw={400} mx="auto">
              Please wait while we verify your payment status with our payment provider...
            </Text>
            <LoadingOverlay visible style={{ borderRadius: theme.radius.lg }} />
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Card padding="xl" radius="lg" withBorder style={{ boxShadow: getDefaultShadow() }}>
        <Stack align="center" gap="lg" py="md">
          {status === "success" ? (
            <>
              <ThemeIcon size={80} radius="xl" color="green" variant="light">
                <IconCheck size={40} stroke={1.5} />
              </ThemeIcon>
              
              <Title order={2} ta="center" c={primaryTextColor}>Payment Successful!</Title>
              
              <Badge size="xl" radius="md" color="green" variant="filled" px="lg" py="md">
                Payment Completed
              </Badge>
              
              {paymentAmount && (
                <Text ta="center" size="xl" fw={700} c="green">
                  ₱{paymentAmount}
                </Text>
              )}
              
              {paymentDescription && (
                <Text ta="center" size="md" c={primaryTextColor}>
                  {paymentDescription}
                </Text>
              )}
              
              <Card 
                withBorder 
                radius="md" 
                padding="md" 
                bg={colorScheme === "dark" ? "green.9" : "green.0"}
                style={{ width: '100%' }}
              >
                <Group gap="sm">
                  <ThemeIcon size="md" radius="xl" color="green" variant="light">
                    <IconCheck size={16} />
                  </ThemeIcon>
                  <Text fw={500} c={colorScheme === "dark" ? "white" : "green.8"}>
                    Your payment has been processed successfully
                  </Text>
                </Group>
                <Text size="sm" c="dimmed" mt="xs" ml={30}>
                  A receipt has been generated and your service request has been updated.
                </Text>
              </Card>
              
              <Group justify="center" gap="md" mt="md" style={{ width: '100%' }}>
                {receiptUrl && (
                  <Button
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                    size="md"
                    radius="md"
                    onClick={() => window.open(receiptUrl, "_blank")}
                    leftSection={<IconReceipt size={20} />}
                  >
                    View Receipt
                  </Button>
                )}
                
                <Button
                  variant="light"
                  color="gray"
                  size="md"
                  radius="md"
                  onClick={() => {
                    // Close this tab if it was opened from another tab
                    if (isOpenedFromTab) {
                      window.close();
                    } else {
                      router.push("/service-requests");
                    }
                  }}
                  leftSection={<IconArrowLeft size={20} />}
                >
                  {isOpenedFromTab ? "Close Tab" : "Back to Service Requests"}
                </Button>
              </Group>
            </>
          ) : (
            <>
              <ThemeIcon size={80} radius="xl" color="red" variant="light">
                <IconX size={40} stroke={1.5} />
              </ThemeIcon>
              
              <Title order={2} ta="center" c={primaryTextColor}>Payment Verification Failed</Title>
              
              <Badge size="lg" radius="md" color="red" variant="filled">
                Verification Failed
              </Badge>
              
              <Text ta="center" size="md" maw={450} mx="auto">
                {message || "There was an issue verifying your payment. Please try again."}
              </Text>
              
              <Card 
                withBorder 
                radius="md" 
                padding="md" 
                bg={colorScheme === "dark" ? "orange.9" : "orange.0"}
                style={{ width: '100%' }}
              >
                <Group gap="sm">
                  <ThemeIcon size="md" radius="xl" color="orange" variant="light">
                    <IconCheck size={16} />
                  </ThemeIcon>
                  <Text fw={500} c={colorScheme === "dark" ? "white" : "orange.8"}>
                    What to do next
                  </Text>
                </Group>
                <Text size="sm" c="dimmed" mt="xs" ml={30}>
                  If you completed the payment, it may still be processing. Please check your service requests page in a few minutes.
                </Text>
              </Card>
              
              <Button
                variant="light"
                color="gray"
                size="md"
                radius="md"
                onClick={() => {
                  if (isOpenedFromTab) {
                    window.close();
                  } else {
                    router.push("/service-requests");
                  }
                }}
                leftSection={<IconArrowLeft size={20} />}
              >
                {isOpenedFromTab ? "Close Tab" : "Back to Service Requests"}
              </Button>
            </>
          )}
        </Stack>
      </Card>
    </Container>
  );
}