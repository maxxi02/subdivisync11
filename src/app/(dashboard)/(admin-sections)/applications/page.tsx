// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Container,
//   Title,
//   Button,
//   Modal,
//   TextInput,
//   Textarea,
//   Select,
//   Group,
//   Stack,
//   Badge,
//   ActionIcon,
//   Text,
//   Paper,
//   Grid,
//   Alert,
//   LoadingOverlay,
//   Card,
//   Tabs,
//   SimpleGrid,
// } from "@mantine/core";
// import {
//   IconEye,
//   IconEdit,
//   IconTrash,
//   IconAlertCircle,
//   IconUser,
//   IconBuilding,
//   IconMail,
//   IconCheck,
//   IconX,
//   IconClock,
//   IconSearch,
//   IconFilter,
// } from "@tabler/icons-react";
// import { applicationAPI } from "./_components/application-api-actions";
// import { Application } from "@/types/application";

// const APPLICATION_STATUSES = [
//   { value: "Pending", label: "Pending", color: "yellow" },
//   { value: "Under Review", label: "Under Review", color: "blue" },
//   { value: "Approved", label: "Approved", color: "green" },
//   { value: "Rejected", label: "Rejected", color: "red" },
// ];

// const ApplicationsSection = () => {
//   const [loading, setLoading] = useState(false);
//   const [applications, setApplications] = useState<Application[]>([]);
//   const [selectedApplication, setSelectedApplication] =
//     useState<Application | null>(null);
//   const [detailsModalOpen, setDetailsModalOpen] = useState(false);
//   const [statusModalOpen, setStatusModalOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState<string | null>("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedStatus, setSelectedStatus] = useState<string | null>("all");

//   // Form state for status update
//   const [statusForm, setStatusForm] = useState({
//     status: "" as Application["status"],
//     admin_notes: "",
//   });

//   useEffect(() => {
//     fetchApplications();
//   }, []);

//   const fetchApplications = async () => {
//     try {
//       setLoading(true);
//       const response = await applicationAPI.getAll();
//       if (response.data.success) {
//         setApplications(response.data.applications || []);
//       }
//     } catch (error) {
//       console.error("Failed to fetch applications:", error);
//       showNotification("Error", "Failed to load applications", "red");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Mock notifications
//   const showNotification = (title: string, message: string, color: string) => {
//     console.log(`${title}: ${message}`);
//     alert(`${title}: ${message}`);
//   };

//   const getStatusColor = (status: string) => {
//     const statusConfig = APPLICATION_STATUSES.find((s) => s.value === status);
//     return statusConfig?.color || "gray";
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case "Pending":
//         return <IconClock size={16} />;
//       case "Under Review":
//         return <IconSearch size={16} />;
//       case "Approved":
//         return <IconCheck size={16} />;
//       case "Rejected":
//         return <IconX size={16} />;
//       default:
//         return <IconClock size={16} />;
//     }
//   };

//   const openDetailsModal = (application: Application) => {
//     setSelectedApplication(application);
//     setDetailsModalOpen(true);
//   };

//   const openStatusModal = (application: Application) => {
//     setSelectedApplication(application);
//     setStatusForm({
//       status: application.status,
//       admin_notes: application.admin_notes || "",
//     });
//     setStatusModalOpen(true);
//   };

//   const handleStatusUpdate = async () => {
//     if (!selectedApplication) return;

//     try {
//       setLoading(true);
//       const response = await applicationAPI.updateStatus(
//         selectedApplication._id,
//         statusForm.status,
//         statusForm.admin_notes
//       );

//       if (response.data.success) {
//         setApplications((prev) =>
//           prev.map((app) =>
//             app._id === selectedApplication._id
//               ? { ...app, ...response.data.application }
//               : app
//           )
//         );
//         showNotification(
//           "Success",
//           response.data.message || "Status updated successfully",
//           "green"
//         );
//         setStatusModalOpen(false);
//       }
//     } catch (error: unknown) {
//       console.error("Failed to update status:", error);
//       showNotification("Error", (error as Error).message, "red");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (applicationId: string) => {
//     if (!confirm("Are you sure you want to delete this application?")) return;

//     try {
//       setLoading(true);
//       const response = await applicationAPI.delete(applicationId);

//       if (response.data.success) {
//         setApplications((prev) =>
//           prev.filter((app) => app._id !== applicationId)
//         );
//         showNotification(
//           "Success",
//           response.data.message || "Application deleted successfully",
//           "green"
//         );
//       }
//     } catch (error) {
//       console.error("Failed to delete application:", error);
//       showNotification("Error", (error as Error).message, "red");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredApplications = applications.filter((application) => {
//     const matchesSearch =
//       application.personal_info.full_name
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase()) ||
//       application.property?.address
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase()) ||
//       application.user_email.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesStatus =
//       selectedStatus === "all" || application.status === selectedStatus;

//     const matchesTab =
//       activeTab === "all" ||
//       (activeTab === "pending" && application.status === "Pending") ||
//       (activeTab === "approved" && application.status === "Approved") ||
//       (activeTab === "rejected" && application.status === "Rejected");

//     return matchesSearch && matchesStatus && matchesTab;
//   });

//   const ApplicationCard = ({ application }: { application: Application }) => (
//     <Card shadow="sm" padding="lg" radius="md" withBorder>
//       <Stack gap="sm">
//         <Group justify="space-between" align="flex-start">
//           <Stack gap="xs">
//             <Group gap="xs">
//               <IconUser size={16} color="gray" />
//               <Text fw={600}>{application.personal_info.full_name}</Text>
//             </Group>
//             <Group gap="xs">
//               <IconBuilding size={16} color="gray" />
//               <Text size="sm" c="dimmed">
//                 {application.property?.address || "Property not found"}
//               </Text>
//             </Group>
//             <Group gap="xs">
//               <IconMail size={16} color="gray" />
//               <Text size="sm" c="dimmed">
//                 {application.user_email}
//               </Text>
//             </Group>
//           </Stack>
//           <Badge
//             color={getStatusColor(application.status)}
//             leftSection={getStatusIcon(application.status)}
//           >
//             {application.status}
//           </Badge>
//         </Group>

//         <Group gap="sm">
//           <Text size="sm" c="dimmed">
//             Applied: {new Date(application.created_at).toLocaleDateString()}
//           </Text>
//           {application.property && (
//             <Text size="sm" fw={500} c="blue">
//               ₱{application.property.rent_amount.toLocaleString()}/mo
//             </Text>
//           )}
//         </Group>

//         <Group grow mt="md">
//           <Button
//             leftSection={<IconEye size={16} />}
//             variant="filled"
//             onClick={() => openDetailsModal(application)}
//           >
//             View Details
//           </Button>
//           <Button
//             leftSection={<IconEdit size={16} />}
//             variant="outline"
//             onClick={() => openStatusModal(application)}
//           >
//             Update Status
//           </Button>
//           <ActionIcon
//             variant="subtle"
//             color="red"
//             onClick={() => handleDelete(application._id)}
//           >
//             <IconTrash size={16} />
//           </ActionIcon>
//         </Group>
//       </Stack>
//     </Card>
//   );

//   return (
//     <Container size="xl">
//       <Stack gap="xl">
//         {/* Header */}
//         <Group justify="space-between" align="center">
//           <Stack gap="xs">
//             <Title order={1}>Property Applications</Title>
//             <Text c="dimmed">
//               Manage and review tenant applications for your properties
//             </Text>
//           </Stack>
//           <Badge variant="outline" size="lg">
//             {filteredApplications.length} Applications
//           </Badge>
//         </Group>

//         {/* Search and Filters */}
//         <Paper shadow="xs" p="lg" radius="md" withBorder>
//           <Stack gap="md">
//             <Group gap="sm">
//               <IconSearch size={20} />
//               <Title order={4}>Search & Filter Applications</Title>
//             </Group>
//             <Grid>
//               <Grid.Col span={{ base: 12, md: 8 }}>
//                 <TextInput
//                   placeholder="Search by applicant name, email, or property address..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.currentTarget.value)}
//                   leftSection={<IconSearch size={16} />}
//                 />
//               </Grid.Col>
//               <Grid.Col span={{ base: 12, md: 4 }}>
//                 <Select
//                   placeholder="Filter by Status"
//                   value={selectedStatus}
//                   onChange={setSelectedStatus}
//                   data={[
//                     { value: "all", label: "All Status" },
//                     ...APPLICATION_STATUSES,
//                   ]}
//                   leftSection={<IconFilter size={16} />}
//                 />
//               </Grid.Col>
//             </Grid>
//           </Stack>
//         </Paper>

//         {/* Tabs */}
//         <Tabs value={activeTab} onChange={setActiveTab}>
//           <Tabs.List>
//             <Tabs.Tab value="all">All Applications</Tabs.Tab>
//             <Tabs.Tab value="pending">Pending</Tabs.Tab>
//             <Tabs.Tab value="approved">Approved</Tabs.Tab>
//             <Tabs.Tab value="rejected">Rejected</Tabs.Tab>
//           </Tabs.List>
//         </Tabs>

//         {/* Applications List */}
//         <LoadingOverlay visible={loading} />
//         {filteredApplications.length === 0 ? (
//           <Alert
//             icon={<IconAlertCircle size={20} />}
//             title="No applications found"
//             color="blue"
//             variant="light"
//           >
//             {applications.length === 0
//               ? "No applications have been submitted yet."
//               : "No applications match your search criteria."}
//           </Alert>
//         ) : (
//           <SimpleGrid
//             cols={{ base: 1, sm: 2, lg: 3 }}
//             spacing="lg"
//             verticalSpacing="lg"
//           >
//             {filteredApplications.map((application) => (
//               <ApplicationCard
//                 key={application._id}
//                 application={application}
//               />
//             ))}
//           </SimpleGrid>
//         )}

//         {/* Application Details Modal */}
//         <Modal
//           opened={detailsModalOpen}
//           onClose={() => setDetailsModalOpen(false)}
//           title="Application Details"
//           size="xl"
//         >
//           {selectedApplication && (
//             <Stack gap="xl">
//               <Paper p="md" withBorder>
//                 <Title order={3} mb="md">
//                   Applicant Information
//                 </Title>
//                 <Grid>
//                   <Grid.Col span={{ base: 12, md: 6 }}>
//                     <Text fw={500}>Full Name</Text>
//                     <Text>{selectedApplication.personal_info.full_name}</Text>
//                   </Grid.Col>
//                   <Grid.Col span={{ base: 12, md: 6 }}>
//                     <Text fw={500}>Email</Text>
//                     <Text>{selectedApplication.user_email}</Text>
//                   </Grid.Col>
//                   <Grid.Col span={{ base: 12, md: 6 }}>
//                     <Text fw={500}>Phone</Text>
//                     <Text>{selectedApplication.personal_info.phone}</Text>
//                   </Grid.Col>
//                   <Grid.Col span={{ base: 12, md: 6 }}>
//                     <Text fw={500}>Date of Birth</Text>
//                     <Text>
//                       {new Date(
//                         selectedApplication.personal_info.date_of_birth
//                       ).toLocaleDateString()}
//                     </Text>
//                   </Grid.Col>
//                   <Grid.Col span={12}>
//                     <Text fw={500}>Current Address</Text>
//                     <Text>
//                       {selectedApplication.personal_info.current_address}
//                     </Text>
//                   </Grid.Col>
//                 </Grid>
//               </Paper>

//               <Paper p="md" withBorder>
//                 <Title order={3} mb="md">
//                   Employment Information
//                 </Title>
//                 <Grid>
//                   <Grid.Col span={{ base: 12, md: 6 }}>
//                     <Text fw={500}>Employer</Text>
//                     <Text>
//                       {selectedApplication.employment_info.employer_name}
//                     </Text>
//                   </Grid.Col>
//                   <Grid.Col span={{ base: 12, md: 6 }}>
//                     <Text fw={500}>Job Title</Text>
//                     <Text>{selectedApplication.employment_info.job_title}</Text>
//                   </Grid.Col>
//                   <Grid.Col span={{ base: 12, md: 6 }}>
//                     <Text fw={500}>Annual Income</Text>
//                     <Text>
//                       $
//                       {selectedApplication.employment_info.annual_income.toLocaleString()}
//                     </Text>
//                   </Grid.Col>
//                   <Grid.Col span={{ base: 12, md: 6 }}>
//                     <Text fw={500}>Employment Length</Text>
//                     <Text>
//                       {selectedApplication.employment_info.employment_length}
//                     </Text>
//                   </Grid.Col>
//                 </Grid>
//               </Paper>

//               {selectedApplication.property && (
//                 <Paper p="md" withBorder>
//                   <Title order={3} mb="md">
//                     Property Information
//                   </Title>
//                   <Grid>
//                     <Grid.Col span={12}>
//                       <Text fw={500}>Address</Text>
//                       <Text>{selectedApplication.property.address}</Text>
//                     </Grid.Col>
//                     <Grid.Col span={{ base: 12, md: 6 }}>
//                       <Text fw={500}>Rent Amount</Text>
//                       <Text>
//                         ₱
//                         {selectedApplication.property.rent_amount.toLocaleString()}
//                         /mo
//                       </Text>
//                     </Grid.Col>
//                     <Grid.Col span={{ base: 12, md: 6 }}>
//                       <Text fw={500}>Bed/Bath</Text>
//                       <Text>
//                         {selectedApplication.property.bedrooms} Beds /{" "}
//                         {selectedApplication.property.bathrooms} Baths
//                       </Text>
//                     </Grid.Col>
//                   </Grid>
//                 </Paper>
//               )}

//               {selectedApplication.additional_info && (
//                 <Paper p="md" withBorder>
//                   <Title order={3} mb="md">
//                     Additional Information
//                   </Title>
//                   <Text>{selectedApplication.additional_info}</Text>
//                 </Paper>
//               )}
//             </Stack>
//           )}
//         </Modal>

//         {/* Status Update Modal */}
//         <Modal
//           opened={statusModalOpen}
//           onClose={() => setStatusModalOpen(false)}
//           title="Update Application Status"
//         >
//           <Stack gap="md">
//             <Select
//               label="Status"
//               value={statusForm.status}
//               onChange={(value) =>
//                 setStatusForm({
//                   ...statusForm,
//                   status: value as Application["status"],
//                 })
//               }
//               data={APPLICATION_STATUSES}
//             />

//             <Textarea
//               label="Admin Notes"
//               placeholder="Enter any notes for the applicant..."
//               value={statusForm.admin_notes}
//               onChange={(e) =>
//                 setStatusForm({
//                   ...statusForm,
//                   admin_notes: e.currentTarget.value,
//                 })
//               }
//               autosize
//               minRows={3}
//             />

//             <Group justify="flex-end" mt="md">
//               <Button
//                 variant="default"
//                 onClick={() => setStatusModalOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button onClick={handleStatusUpdate}>Update Status</Button>
//             </Group>
//           </Stack>
//         </Modal>
//       </Stack>
//     </Container>
//   );
// };

// export default ApplicationsSection;


import React from 'react'

const page = () => {
  return (
    <div>
      sdf
    </div>
  )
}

export default page
