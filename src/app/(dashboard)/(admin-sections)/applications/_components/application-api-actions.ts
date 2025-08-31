// // _components/application-api-actions.ts
// import { Application, ApplicationFormData } from "@/types/application";

// const API_BASE = "/api/applications";

// interface APIResponse<T> {
//   data: {
//     success: boolean;
//     applications?: T[];
//     application?: T;
//     message?: string;
//     error?: string;
//   };
// }

// export const applicationAPI = {
//   // Get all applications (Admin gets all, Tenant gets their own)
//   getAll: async (params?: {
//     status?: string;
//     propertyId?: string;
//   }): Promise<APIResponse<Application>> => {
//     let url = API_BASE;

//     if (params) {
//       const searchParams = new URLSearchParams();
//       if (params.status) searchParams.append("status", params.status);
//       if (params.propertyId)
//         searchParams.append("propertyId", params.propertyId);

//       if (searchParams.toString()) {
//         url += `?${searchParams.toString()}`;
//       }
//     }

//     const response = await fetch(url, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     const data = await response.json();
//     return { data };
//   },

//   // Get single application by ID
//   getById: async (id: string): Promise<APIResponse<Application>> => {
//     const response = await fetch(`${API_BASE}/${id}`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     const data = await response.json();
//     return { data };
//   },

//   // Create new application (Tenant only)
//   create: async (
//     applicationData: ApplicationFormData
//   ): Promise<APIResponse<Application>> => {
//     const response = await fetch(API_BASE, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(applicationData),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || "Failed to submit application");
//     }

//     return { data };
//   },

//   // Update application status (Admin only)
//   updateStatus: async (
//     id: string,
//     status: Application["status"],
//     adminNotes?: string
//   ): Promise<APIResponse<Application>> => {
//     const response = await fetch(`${API_BASE}/${id}`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ status, admin_notes: adminNotes }),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || "Failed to update application");
//     }

//     return { data };
//   },

//   // Delete application
//   delete: async (id: string): Promise<APIResponse<void>> => {
//     const response = await fetch(`${API_BASE}/${id}`, {
//       method: "DELETE",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || "Failed to delete application");
//     }

//     return { data };
//   },

//   // Get applications for a specific property (Admin only)
//   getByProperty: async (
//     propertyId: string
//   ): Promise<APIResponse<Application>> => {
//     return applicationAPI.getAll({ propertyId });
//   },

//   // Get applications by status
//   getByStatus: async (
//     status: Application["status"]
//   ): Promise<APIResponse<Application>> => {
//     return applicationAPI.getAll({ status });
//   },
// };
