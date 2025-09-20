// lib/api/payments.ts

export interface CreatePaymentRequest {
  inquiryId: string;
  propertyId: string;
  amount: number;
  paymentMethod:
    | "gcash"
    | "bank_transfer"
    | "cash"
    | "online_banking"
    | "credit_card";
  paymentProof?: string; // Base64 image or file URL
  notes?: string;
  dueDate?: string;
}

export interface PaymentRecord {
  _id: string;
  inquiryId: string;
  propertyId: string;
  tenantId: string;
  amount: number;
  paymentMethod: string;
  paymentProof?: string;
  notes?: string;
  dueDate: string;
  paidDate?: string;
  status: "pending" | "verified" | "rejected" | "overdue";
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  created_at: string;
  updated_at?: string;

  // Enriched data
  property?: {
    _id: string;
    title: string;
    location: string;
    price: string;
    type: string;
    size?: string;
    images?: string[];
  };
  tenant?: {
    fullName: string;
    email: string;
    phone: string;
  };
  inquiry?: {
    selectedLeasePlan?: {
      id: string;
      name: string;
      duration: string;
      monthlyRate: string;
      totalAmount: string;
      interestRate?: string;
      features: string[];
      recommended?: boolean;
    };
    status: string;
    approvedAt?: string;
    fullName: string;
  };
  paymentProgress?: {
    totalPayments: number;
    verifiedPayments: number;
    remainingPayments: number;
    willComplete: boolean;
  };
}

export interface PaymentSummary {
  totalPaid: number;
  totalDue: number;
  nextPaymentDate: string | null;
  monthlyAmount: number;
  remainingBalance: number;
  paymentsPaid: number;
  totalPayments: number;
  paymentStatus: "current" | "due-soon" | "overdue" | "due-week";
  daysUntilPayment: number;
}

export interface BatchVerificationRequest {
  paymentIds: string[];
  action: "verify" | "reject";
  rejectionReason?: string;
}

export interface PaymentStatusUpdate {
  paymentId: string;
  status: "verified" | "rejected";
  message: string;
  ownershipTransferred?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaymentsListResponse {
  payments: PaymentRecord[];
  paymentSummary?: PaymentSummary;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface BatchVerificationResponse {
  results: PaymentStatusUpdate[];
  summary: {
    total: number;
    processed: number;
    failed: number;
    ownershipTransferred: number;
  };
}

export interface PaymentVerificationListResponse {
  payments: PaymentRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  summary: {
    pending: number;
    verified: number;
    rejected: number;
    overdue: number;
  };
}

class PaymentsApi {
  private baseUrl = "/api/payments";

  // Get payment history for a tenant or inquiry
  async getPayments(params?: {
    inquiryId?: string;
    propertyId?: string;
    tenantId?: string;
    status?: string;
    limit?: number;
    page?: number;
    type?: "history" | "summary";
  }): Promise<ApiResponse<PaymentsListResponse>> {
    try {
      const searchParams = new URLSearchParams();

      if (params?.inquiryId) searchParams.set("inquiryId", params.inquiryId);
      if (params?.propertyId) searchParams.set("propertyId", params.propertyId);
      if (params?.tenantId) searchParams.set("tenantId", params.tenantId);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.type) searchParams.set("type", params.type);

      const response = await fetch(
        `${this.baseUrl}?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: {
          payments: data.payments || [],
          paymentSummary: data.paymentSummary,
          pagination: data.pagination,
        },
        message: data.message,
      };
    } catch (error) {
      console.error("Error fetching payments:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  // Create a new payment
  async createPayment(
    paymentData: CreatePaymentRequest
  ): Promise<ApiResponse<PaymentRecord>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.payment,
        message: data.message,
      };
    } catch (error) {
      console.error("Error creating payment:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  // Get single payment details
  async getPayment(paymentId: string): Promise<ApiResponse<PaymentRecord>> {
    try {
      const response = await fetch(`${this.baseUrl}/${paymentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.payment,
        message: data.message,
      };
    } catch (error) {
      console.error("Error fetching payment:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  // Update payment (for tenants: notes only, for admins: verification status)
  async updatePayment(
    paymentId: string,
    updateData: {
      status?: "pending" | "verified" | "rejected" | "overdue";
      rejectionReason?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<PaymentRecord>> {
    try {
      const response = await fetch(`${this.baseUrl}/${paymentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.payment,
        message: data.message,
      };
    } catch (error) {
      console.error("Error updating payment:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  // Delete payment
  async deletePayment(paymentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/${paymentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Error deleting payment:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  // Get payments pending verification (Admin only)
  async getPaymentsForVerification(params?: {
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse<PaymentVerificationListResponse>> {
    try {
      const searchParams = new URLSearchParams();

      if (params?.status) searchParams.set("status", params.status);
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.page) searchParams.set("page", params.page.toString());

      const response = await fetch(
        `${this.baseUrl}/verify?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: {
          payments: data.payments || [],
          pagination: data.pagination,
          summary: data.summary,
        },
        message: data.message,
      };
    } catch (error) {
      console.error("Error fetching payments for verification:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  // Batch verify or reject payments (Admin only)
  async batchVerifyPayments(
    verificationData: BatchVerificationRequest
  ): Promise<ApiResponse<BatchVerificationResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(verificationData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: {
          results: data.results,
          summary: data.summary,
        },
        message: data.message,
      };
    } catch (error) {
      console.error("Error in batch verification:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  // Verify single payment (Admin only)
  async verifyPayment(
    paymentId: string,
    rejectionReason?: string
  ): Promise<ApiResponse<PaymentRecord>> {
    return this.updatePayment(paymentId, {
      status: "verified",
    });
  }

  // Reject single payment (Admin only)
  async rejectPayment(
    paymentId: string,
    rejectionReason: string
  ): Promise<ApiResponse<PaymentRecord>> {
    return this.updatePayment(paymentId, {
      status: "rejected",
      rejectionReason,
    });
  }

  // Calculate payment summary for an inquiry
  async getPaymentSummary(
    inquiryId: string
  ): Promise<ApiResponse<PaymentSummary>> {
    const response = await this.getPayments({
      inquiryId,
      type: "summary",
      limit: 1,
    });

    if (!response.success || !response.data?.paymentSummary) {
      return {
        success: false,
        error: "Failed to calculate payment summary",
      };
    }

    return {
      success: true,
      data: response.data.paymentSummary,
    };
  }

  // Helper method to format currency
  formatCurrency(amount: number | string): string {
    const numAmount =
      typeof amount === "string"
        ? parseFloat(amount.replace(/[₱,$]/g, "").replace(/,/g, ""))
        : amount;

    if (isNaN(numAmount)) return "₱0";

    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  }

  // Helper method to format dates
  formatDate(dateString: string): string {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Helper method to format date with time
  formatDateTime(dateString: string): string {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

// Create and export a singleton instance
export const paymentsApi = new PaymentsApi();

// Export the class for potential extension
export default PaymentsApi;
