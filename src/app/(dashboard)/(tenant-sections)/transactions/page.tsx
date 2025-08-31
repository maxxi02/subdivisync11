"use client";

import { useState } from "react";
import {
  Card,
  Text,
  Title,
  TextInput,
  Select,
  Button,
  Badge,
  Group,
  Stack,
  Paper,
  ActionIcon,
  FileInput,
  Modal,
} from "@mantine/core";
import {
  IconUpload,
  IconDownload,
  IconFilter,
  IconSearch,
  IconFileText,
  IconCheck,
  IconClock,
  IconX,
} from "@tabler/icons-react";

interface RentalTransaction {
  id: string;
  date: string;
  property: string;
  amount: number;
  dueDate: string;
  status: "verified" | "pending" | "rejected" | "overdue";
  paymentMethod: "gcash" | "bank_transfer" | "cash";
  proofUploaded: boolean;
  receiptAvailable: boolean;
  tenant: string;
}

const mockRentalTransactions: RentalTransaction[] = [
  {
    id: "1",
    date: "2024-01-15T10:30:00Z",
    property: "Unit 2A - Sunrise Apartments",
    amount: 15000.0,
    dueDate: "2024-01-15",
    status: "verified",
    paymentMethod: "gcash",
    proofUploaded: true,
    receiptAvailable: true,
    tenant: "John Doe",
  },
  {
    id: "2",
    date: "2024-01-10T15:45:00Z",
    property: "Unit 1B - Moonlight Condos",
    amount: 12000.0,
    dueDate: "2024-01-10",
    status: "pending",
    paymentMethod: "bank_transfer",
    proofUploaded: true,
    receiptAvailable: false,
    tenant: "Jane Smith",
  },
  {
    id: "3",
    date: "2024-01-05T09:15:00Z",
    property: "Unit 3C - Garden View",
    amount: 18000.0,
    dueDate: "2024-01-05",
    status: "rejected",
    paymentMethod: "gcash",
    proofUploaded: true,
    receiptAvailable: false,
    tenant: "Mike Johnson",
  },
  {
    id: "4",
    date: "",
    property: "Unit 4D - City Heights",
    amount: 20000.0,
    dueDate: "2024-01-20",
    status: "overdue",
    paymentMethod: "bank_transfer",
    proofUploaded: false,
    receiptAvailable: false,
    tenant: "Sarah Wilson",
  },
];

const TransactionsSection = () => {
  const [transactions] = useState<RentalTransaction[]>(mockRentalTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(
    null
  );

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.tenant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || transaction.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not paid";
    return new Date(dateString).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <IconCheck size={16} />;
      case "pending":
        return <IconClock size={16} />;
      case "rejected":
        return <IconX size={16} />;
      case "overdue":
        return <IconClock size={16} />;
      default:
        return <IconClock size={16} />;
    }
  };

  const handleUploadProof = (transactionId: string) => {
    setSelectedTransaction(transactionId);
    setUploadModalOpen(true);
  };

  const handleDownloadReceipt = (transactionId: string) => {
    // Simulate receipt download
    console.log(`Downloading receipt for transaction ${transactionId}`);
  };

  return (
    <Stack gap="lg">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="xs">
          <Title order={3}>Payment History</Title>
          <Text size="sm" c="dimmed">
            Complete record of all your rental payments
          </Text>
          <Group gap="xl">
            <div>
              <Text size="lg" fw={600} c="green">
                {
                  filteredTransactions.filter((t) => t.status === "verified")
                    .length
                }
              </Text>
              <Text size="sm" c="dimmed">
                Verified Payments
              </Text>
            </div>
            <div>
              <Text size="lg" fw={600} c="yellow">
                {
                  filteredTransactions.filter((t) => t.status === "pending")
                    .length
                }
              </Text>
              <Text size="sm" c="dimmed">
                Pending Verification
              </Text>
            </div>
            <div>
              <Text size="lg" fw={600} c="red">
                {
                  filteredTransactions.filter((t) => t.status === "overdue")
                    .length
                }
              </Text>
              <Text size="sm" c="dimmed">
                Overdue Payments
              </Text>
            </div>
          </Group>
        </Stack>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Title order={3}>Rental Transactions</Title>
              <Text size="sm" c="dimmed">
                Track payment verification and manage receipts
              </Text>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftSection={<IconFilter size={16} />}
            >
              Export History
            </Button>
          </Group>

          <Group gap="md">
            <TextInput
              flex={1}
              placeholder="Search by property or tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
            />
            <Select
              w={200}
              placeholder="Filter by status"
              value={filterStatus}
              onChange={(value) => setFilterStatus(value || "all")}
              data={[
                { value: "all", label: "All Status" },
                { value: "verified", label: "Verified" },
                { value: "pending", label: "Pending" },
                { value: "rejected", label: "Rejected" },
                { value: "overdue", label: "Overdue" },
              ]}
            />
          </Group>

          <Stack gap="xs">
            {filteredTransactions.map((transaction) => (
              <Paper
                key={transaction.id}
                p="md"
                radius="md"
                withBorder
                style={{ cursor: "pointer" }}
                className="hover:bg-gray-50"
              >
                <Group justify="space-between">
                  <Group gap="md">
                    <ActionIcon
                      size="lg"
                      radius="xl"
                      variant="light"
                      color={
                        transaction.status === "verified"
                          ? "green"
                          : transaction.status === "pending"
                            ? "yellow"
                            : transaction.status === "rejected"
                              ? "red"
                              : "orange"
                      }
                    >
                      {getStatusIcon(transaction.status)}
                    </ActionIcon>
                    <div>
                      <Text fw={500}>{transaction.property}</Text>
                      <Text size="sm" c="dimmed">
                        Tenant: {transaction.tenant}
                      </Text>
                      <Group gap="xs">
                        <Text size="sm" c="dimmed">
                          Due: {formatDate(transaction.dueDate)}
                        </Text>
                        {transaction.date && (
                          <Text size="sm" c="dimmed">
                            • Paid: {formatDate(transaction.date)}
                          </Text>
                        )}
                      </Group>
                    </div>
                  </Group>
                  <div style={{ textAlign: "right" }}>
                    <Text fw={600} size="lg">
                      {formatCurrency(transaction.amount)}
                    </Text>
                    <Badge
                      size="sm"
                      color={
                        transaction.status === "verified"
                          ? "green"
                          : transaction.status === "pending"
                            ? "yellow"
                            : transaction.status === "rejected"
                              ? "red"
                              : "orange"
                      }
                      variant="light"
                    >
                      {transaction.status}
                    </Badge>
                    <Group gap="xs" mt="xs" justify="flex-end">
                      {!transaction.proofUploaded &&
                        transaction.status !== "verified" && (
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconUpload size={14} />}
                            onClick={() => handleUploadProof(transaction.id)}
                          >
                            Upload Proof
                          </Button>
                        )}
                      {transaction.receiptAvailable && (
                        <Button
                          size="xs"
                          variant="light"
                          color="blue"
                          leftSection={<IconDownload size={14} />}
                          onClick={() => handleDownloadReceipt(transaction.id)}
                        >
                          Receipt
                        </Button>
                      )}
                    </Group>
                  </div>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Card>

      <Modal
        opened={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Payment Proof"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Upload your payment receipt or bank transfer confirmation for
            verification.
          </Text>
          <FileInput
            label="Payment Proof"
            placeholder="Choose file..."
            accept="image/*,.pdf"
            leftSection={<IconFileText size={16} />}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button leftSection={<IconUpload size={16} />}>Upload Proof</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default TransactionsSection;
