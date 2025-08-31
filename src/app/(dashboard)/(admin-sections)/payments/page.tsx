"use client"

import { useState } from "react"
import {
  Card,
  Text,
  Title,
  Select,
  Button,
  Badge,
  Group,
  Stack,
  Paper,
  Tabs,
  FileInput,
  Modal,
  Alert,
  ActionIcon,
  Menu,
  Divider,
} from "@mantine/core"
import {
  IconDeviceMobile,
  IconSend,
  IconCreditCard,
  IconCheck,
  IconUpload,
  IconReceipt,
  IconAlertTriangle,
  IconDots,
  IconEye,
  IconDownload,
  IconBrandPaypal,
  IconCalendar,
  IconHome,
} from "@tabler/icons-react"

interface PaymentHistory {
  id: string
  tenant: string
  property: string
  amount: number
  dueDate: string
  paidDate?: string
  status: "paid" | "pending" | "overdue" | "partial"
  method: "gcash" | "paypal" | "manual" | "bank"
  receiptUrl?: string
  proofUrl?: string
  notes?: string
}

const mockPaymentHistory: PaymentHistory[] = [
  {
    id: "1",
    tenant: "John Doe",
    property: "Unit 101 - Sunrise Apartments",
    amount: 15000.0,
    dueDate: "2024-01-01",
    paidDate: "2024-01-02",
    status: "paid",
    method: "gcash",
    receiptUrl: "/receipts/receipt-001.pdf",
  },
  {
    id: "2",
    tenant: "Maria Santos",
    property: "Unit 205 - Moonlight Condos",
    amount: 18000.0,
    dueDate: "2024-01-01",
    paidDate: "2024-01-15",
    status: "paid",
    method: "paypal",
    receiptUrl: "/receipts/receipt-002.pdf",
  },
  {
    id: "3",
    tenant: "Carlos Rivera",
    property: "Unit 302 - Sunset Towers",
    amount: 20000.0,
    dueDate: "2024-01-01",
    status: "overdue",
    method: "gcash",
    notes: "Payment reminder sent on Jan 10",
  },
  {
    id: "4",
    tenant: "Ana Lopez",
    property: "Unit 150 - Garden View",
    amount: 12000.0,
    dueDate: "2024-01-15",
    paidDate: "2024-01-14",
    status: "paid",
    method: "manual",
    proofUrl: "/proofs/proof-004.jpg",
    receiptUrl: "/receipts/receipt-004.pdf",
  },
]

const PaymentsSection = () => {
  const [paymentHistory] = useState<PaymentHistory[]>(mockPaymentHistory)
  const [sendAmount, setSendAmount] = useState<number | string>("")
  const [recipient, setRecipient] = useState("")
  const [note, setNote] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("gcash")
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleSendPayment = () => {
    console.log("Sending payment:", { sendAmount, recipient, note, paymentMethod })
  }

  const generateReceipt = (payment: PaymentHistory) => {
    console.log("Generating receipt for payment:", payment.id)
    // Receipt generation logic would go here
  }

  const handleProofUpload = (paymentId: string, file: File) => {
    console.log("Uploading proof for payment:", paymentId, file)
    // Proof upload logic would go here
  }

  const getOverdueCount = () => {
    return paymentHistory.filter((p) => p.status === "overdue").length
  }

  const getFilteredPayments = () => {
    if (filterStatus === "all") return paymentHistory
    return paymentHistory.filter((p) => p.status === filterStatus)
  }

  return (
    <Stack gap="lg">
      {/* GCash Balance Card */}
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        style={{
          background: "linear-gradient(135deg, #1c7ed6 0%, #1864ab 100%)",
          color: "white",
        }}
      >
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconHome size={24} />
            <Title order={3} c="white">
              Rental Payments
            </Title>
          </Group>
          {getOverdueCount() > 0 && (
            <Badge variant="light" color="red">
              {getOverdueCount()} Overdue
            </Badge>
          )}
        </Group>
        <Group justify="space-between">
          <div>
            <Text size="xl" fw={700} mb="xs">
              ₱
              {paymentHistory
                .filter((p) => p.status === "paid")
                .reduce((sum, p) => sum + p.amount, 0)
                .toLocaleString()}
            </Text>
            <Text size="sm" style={{ opacity: 0.8 }}>
              Total Collected This Month
            </Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <Text size="lg" fw={600}>
              ₱
              {paymentHistory
                .filter((p) => p.status === "pending" || p.status === "overdue")
                .reduce((sum, p) => sum + p.amount, 0)
                .toLocaleString()}
            </Text>
            <Text size="sm" style={{ opacity: 0.8 }}>
              Pending Collection
            </Text>
          </div>
        </Group>
      </Card>

      {/* Overdue Payments Alert */}
      {getOverdueCount() > 0 && (
        <Alert icon={<IconAlertTriangle size={16} />} title="Overdue Payments" color="red" variant="light">
          You have {getOverdueCount()} overdue payment{getOverdueCount() > 1 ? "s" : ""} that require immediate
          attention.
        </Alert>
      )}

      {/* Payment Actions */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <div>
            <Title order={3}>Payment Management</Title>
            <Text size="sm" c="dimmed">
              Track and manage rental payments from tenants
            </Text>
          </div>

          <Tabs defaultValue="track">
            <Tabs.List>
              <Tabs.Tab value="track" leftSection={<IconCalendar size={16} />}>
                Payment Tracking
              </Tabs.Tab>
              <Tabs.Tab value="methods" leftSection={<IconCreditCard size={16} />}>
                Payment Methods
              </Tabs.Tab>
              <Tabs.Tab value="receipts" leftSection={<IconReceipt size={16} />}>
                Receipts
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="track" pt="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Select
                    placeholder="Filter by status"
                    value={filterStatus}
                    onChange={(value) => setFilterStatus(value || "all")}
                    data={[
                      { value: "all", label: "All Payments" },
                      { value: "paid", label: "Paid" },
                      { value: "pending", label: "Pending" },
                      { value: "overdue", label: "Overdue" },
                      { value: "partial", label: "Partial" },
                    ]}
                    style={{ width: 200 }}
                  />
                  <Button leftSection={<IconSend size={16} />}>Send Reminder</Button>
                </Group>

                <Stack gap="xs">
                  {getFilteredPayments().map((payment) => (
                    <Paper key={payment.id} p="md" radius="md" withBorder style={{ cursor: "pointer" }}>
                      <Group justify="space-between">
                        <Group gap="md">
                          <Paper
                            p="xs"
                            radius="xl"
                            bg={
                              payment.status === "paid"
                                ? "green.1"
                                : payment.status === "overdue"
                                  ? "red.1"
                                  : "yellow.1"
                            }
                          >
                            <IconHome
                              size={16}
                              color={
                                payment.status === "paid" ? "green" : payment.status === "overdue" ? "red" : "orange"
                              }
                            />
                          </Paper>
                          <div>
                            <Text fw={500}>{payment.tenant}</Text>
                            <Text size="sm" c="dimmed">
                              {payment.property}
                            </Text>
                            <Group gap="xs">
                              <Text size="sm" c="dimmed">
                                Due: {new Date(payment.dueDate).toLocaleDateString()}
                              </Text>
                              {payment.paidDate && (
                                <Text size="sm" c="dimmed">
                                  • Paid: {new Date(payment.paidDate).toLocaleDateString()}
                                </Text>
                              )}
                            </Group>
                          </div>
                        </Group>
                        <Group gap="md">
                          <div style={{ textAlign: "right" }}>
                            <Text fw={600} size="lg">
                              ₱{payment.amount.toLocaleString()}
                            </Text>
                            <Badge
                              size="sm"
                              color={
                                payment.status === "paid"
                                  ? "green"
                                  : payment.status === "overdue"
                                    ? "red"
                                    : payment.status === "partial"
                                      ? "orange"
                                      : "yellow"
                              }
                              variant="light"
                              leftSection={payment.status === "paid" ? <IconCheck size={12} /> : undefined}
                            >
                              {payment.status}
                            </Badge>
                          </div>
                          <Menu>
                            <Menu.Target>
                              <ActionIcon variant="subtle">
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item leftSection={<IconEye size={14} />}>View Details</Menu.Item>
                              {payment.receiptUrl && (
                                <Menu.Item leftSection={<IconDownload size={14} />}>Download Receipt</Menu.Item>
                              )}
                              <Menu.Item leftSection={<IconReceipt size={14} />}>Generate Receipt</Menu.Item>
                              <Menu.Item leftSection={<IconSend size={14} />}>Send Reminder</Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="methods" pt="md">
              <Stack gap="md">
                <Text size="sm" c="dimmed" mb="md">
                  Supported payment methods for tenants
                </Text>

                <Paper p="md" withBorder radius="md">
                  <Group justify="space-between">
                    <Group gap="md">
                      <IconDeviceMobile size={24} color="blue" />
                      <div>
                        <Text fw={500}>GCash</Text>
                        <Text size="sm" c="dimmed">
                          Digital wallet payments
                        </Text>
                      </div>
                    </Group>
                    <Badge color="green" variant="light">
                      Active
                    </Badge>
                  </Group>
                </Paper>

                <Paper p="md" withBorder radius="md">
                  <Group justify="space-between">
                    <Group gap="md">
                      <IconBrandPaypal size={24} color="blue" />
                      <div>
                        <Text fw={500}>PayPal</Text>
                        <Text size="sm" c="dimmed">
                          International payments
                        </Text>
                      </div>
                    </Group>
                    <Badge color="green" variant="light">
                      Active
                    </Badge>
                  </Group>
                </Paper>

                <Paper p="md" withBorder radius="md">
                  <Group justify="space-between">
                    <Group gap="md">
                      <IconUpload size={24} color="gray" />
                      <div>
                        <Text fw={500}>Manual Upload</Text>
                        <Text size="sm" c="dimmed">
                          Upload payment proof
                        </Text>
                      </div>
                    </Group>
                    <Badge color="green" variant="light">
                      Active
                    </Badge>
                  </Group>
                </Paper>

                <Divider my="md" />

                <FileInput
                  label="Upload Payment Proof"
                  placeholder="Select payment proof file"
                  leftSection={<IconUpload size={16} />}
                  value={proofFile}
                  onChange={setProofFile}
                  accept="image/*,application/pdf"
                />

                {proofFile && (
                  <Button onClick={() => handleProofUpload("manual", proofFile)} leftSection={<IconUpload size={16} />}>
                    Upload Proof
                  </Button>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="receipts" pt="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Generate and manage payment receipts
                  </Text>
                  <Button
                    variant="outline"
                    leftSection={<IconReceipt size={16} />}
                    onClick={() => setReceiptModalOpen(true)}
                  >
                    Generate Receipt
                  </Button>
                </Group>

                <Stack gap="xs">
                  {paymentHistory
                    .filter((p) => p.receiptUrl)
                    .map((payment) => (
                      <Paper key={payment.id} p="md" withBorder radius="md">
                        <Group justify="space-between">
                          <Group gap="md">
                            <IconReceipt size={20} color="blue" />
                            <div>
                              <Text fw={500}>Receipt #{payment.id}</Text>
                              <Text size="sm" c="dimmed">
                                {payment.tenant} - ₱{payment.amount.toLocaleString()}
                              </Text>
                            </div>
                          </Group>
                          <Group gap="xs">
                            <ActionIcon variant="subtle">
                              <IconEye size={16} />
                            </ActionIcon>
                            <ActionIcon variant="subtle">
                              <IconDownload size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                </Stack>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Card>

      {/* Receipt Generation Modal */}
      <Modal opened={receiptModalOpen} onClose={() => setReceiptModalOpen(false)} title="Generate Receipt" size="md">
        <Stack gap="md">
          <Select
            label="Select Payment"
            placeholder="Choose a payment to generate receipt"
            data={paymentHistory
              .filter((p) => p.status === "paid")
              .map((p) => ({
                value: p.id,
                label: `${p.tenant} - ₱${p.amount.toLocaleString()}`,
              }))}
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setReceiptModalOpen(false)}>
              Cancel
            </Button>
            <Button leftSection={<IconReceipt size={16} />}>Generate</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

export default PaymentsSection
