// lib/paymongo.ts
interface PayMongoSource {
  id: string;
  type: string;
  amount: number;
  currency: string;
  redirect: {
    success: string;
    failed: string;
  };
  billing?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface PayMongoPayment {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  statement_descriptor: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  source: {
    id: string;
    type: string;
  };
  created_at: number;
  updated_at: number;
}

interface CreateSourceRequest {
  amount: number;
  currency: string;
  type:
    | "gcash"
    | "grab_pay"
    | "paymaya"
    | "billease"
    | "dob"
    | "dob_ubp"
    | "brankas_bdo"
    | "brankas_landbank"
    | "brankas_metrobank";
  redirect: {
    success: string;
    failed: string;
  };
  billing?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface CreatePaymentRequest {
  amount: number;
  currency: string;
  description: string;
  statement_descriptor: string;
  source: {
    id: string;
    type: string;
  };
}

class PayMongoService {
  private publicKey: string;
  private secretKey: string;
  private baseUrl = "https://api.paymongo.com/v1";

  constructor() {
    this.publicKey = process.env.PAYMONGO_PUBLIC_API_KEY || "";
    this.secretKey = process.env.PAYMONGO_SECRET_API_KEY || "";
  }

  private getAuthHeaders(useSecret = false) {
    const key = useSecret ? this.secretKey : this.publicKey;
    const encoded = Buffer.from(key).toString("base64");

    return {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    };
  }

  // Create a payment source (for e-wallets and online banking)
  async createSource(
    data: CreateSourceRequest
  ): Promise<{ success: boolean; source?: PayMongoSource; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/sources`, {
        method: "POST",
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({
          data: {
            attributes: {
              type: data.type,
              amount: data.amount * 100, // Convert to centavos
              currency: data.currency,
              redirect: data.redirect,
              billing: data.billing,
            },
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            result.errors?.[0]?.detail || "Failed to create payment source",
        };
      }

      return {
        success: true,
        source: {
          id: result.data.id,
          type: result.data.attributes.type,
          amount: result.data.attributes.amount / 100, // Convert back to peso
          currency: result.data.attributes.currency,
          redirect: result.data.attributes.redirect,
          billing: result.data.attributes.billing,
        },
      };
    } catch (error) {
      console.error("PayMongo createSource error:", error);
      return {
        success: false,
        error: "Network error while creating payment source",
      };
    }
  }

  // Create a payment using a source
  async createPayment(
    data: CreatePaymentRequest
  ): Promise<{ success: boolean; payment?: PayMongoPayment; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: "POST",
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({
          data: {
            attributes: {
              amount: data.amount * 100, // Convert to centavos
              currency: data.currency,
              description: data.description,
              statement_descriptor: data.statement_descriptor,
              source: {
                id: data.source.id,
                type: data.source.type,
              },
            },
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.errors?.[0]?.detail || "Failed to create payment",
        };
      }

      return {
        success: true,
        payment: {
          id: result.data.id,
          type: result.data.attributes.type,
          amount: result.data.attributes.amount / 100, // Convert back to peso
          currency: result.data.attributes.currency,
          description: result.data.attributes.description,
          statement_descriptor: result.data.attributes.statement_descriptor,
          status: result.data.attributes.status,
          source: result.data.attributes.source,
          created_at: result.data.attributes.created_at,
          updated_at: result.data.attributes.updated_at,
        },
      };
    } catch (error) {
      console.error("PayMongo createPayment error:", error);
      return {
        success: false,
        error: "Network error while creating payment",
      };
    }
  }

  // Get payment details
  async getPayment(
    paymentId: string
  ): Promise<{ success: boolean; payment?: PayMongoPayment; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        method: "GET",
        headers: this.getAuthHeaders(true),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.errors?.[0]?.detail || "Failed to get payment",
        };
      }

      return {
        success: true,
        payment: {
          id: result.data.id,
          type: result.data.attributes.type,
          amount: result.data.attributes.amount / 100, // Convert back to peso
          currency: result.data.attributes.currency,
          description: result.data.attributes.description,
          statement_descriptor: result.data.attributes.statement_descriptor,
          status: result.data.attributes.status,
          source: result.data.attributes.source,
          created_at: result.data.attributes.created_at,
          updated_at: result.data.attributes.updated_at,
        },
      };
    } catch (error) {
      console.error("PayMongo getPayment error:", error);
      return {
        success: false,
        error: "Network error while getting payment",
      };
    }
  }

  // Create payment intent (for card payments)
  async createPaymentIntent(
    amount: number,
    currency: string = "PHP",
    description: string = "Property Payment"
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents`, {
        method: "POST",
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({
          data: {
            attributes: {
              amount: amount * 100, // Convert to centavos
              payment_method_allowed: ["card", "paymaya", "gcash", "grab_pay"],
              payment_method_options: {
                card: {
                  request_three_d_secure: "automatic",
                },
              },
              currency,
              description,
              capture_type: "automatic",
            },
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            result.errors?.[0]?.detail || "Failed to create payment intent",
        };
      }

      return {
        success: true,
        paymentIntent: result.data,
      };
    } catch (error) {
      console.error("PayMongo createPaymentIntent error:", error);
      return {
        success: false,
        error: "Network error while creating payment intent",
      };
    }
  }

  // Attach payment method to payment intent
  async attachPaymentMethod(
    paymentIntentId: string,
    paymentMethodId: string,
    clientKey: string
  ) {
    try {
      const response = await fetch(
        `${this.baseUrl}/payment_intents/${paymentIntentId}/attach`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(clientKey).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              attributes: {
                payment_method: paymentMethodId,
                client_key: clientKey,
              },
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            result.errors?.[0]?.detail || "Failed to attach payment method",
        };
      }

      return {
        success: true,
        paymentIntent: result.data,
      };
    } catch (error) {
      console.error("PayMongo attachPaymentMethod error:", error);
      return {
        success: false,
        error: "Network error while attaching payment method",
      };
    }
  }

  // Verify payment status
  async verifyPayment(sourceId: string): Promise<{
    success: boolean;
    isPaid: boolean;
    payment?: PayMongoPayment;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/sources/${sourceId}`, {
        method: "GET",
        headers: this.getAuthHeaders(true),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          isPaid: false,
          error: result.errors?.[0]?.detail || "Failed to verify payment",
        };
      }

      const status = result.data.attributes.status;
      const isPaid = status === "chargeable" || status === "paid";

      // If payment is successful, get the payment details
      if (isPaid && result.data.attributes.payments?.length > 0) {
        const paymentId = result.data.attributes.payments[0].id;
        const paymentResult = await this.getPayment(paymentId);

        return {
          success: true,
          isPaid,
          payment: paymentResult.payment,
        };
      }

      return {
        success: true,
        isPaid,
      };
    } catch (error) {
      console.error("PayMongo verifyPayment error:", error);
      return {
        success: false,
        isPaid: false,
        error: "Network error while verifying payment",
      };
    }
  }
}

export const payMongoService = new PayMongoService();
export default PayMongoService;
