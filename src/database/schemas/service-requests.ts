// src/database/schemas/service-requests.ts
import mongoose, { Document, Model } from "mongoose";

export interface ServiceRequest {
  id: string;
  category: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  images?: string[];
  user_id: string;
  user_email: string;
  user_name: string;
  created_at: Date;
  updated_at: Date;
  assigned_technician?: string;
  technician_notes?: string;
  completion_notes?: string;
  estimated_cost?: number;
  final_cost?: number;
  scheduled_date?: Date;
  assignment_message?: string;
  payment_status: "pending" | "paid" | "failed" | "pending_verification";
  payment_intent_id?: string;
  payment_id?: string;
  paid_at?: Date;
}

export interface CreateServiceRequest {
  category: string;
  description: string;
  priority: "low" | "medium" | "high";
  images?: string[];
  user_id: string;
  user_email: string;
  user_name: string;
}

// Mongoose Document interface (remove both _id and id, let Document handle them)
export interface IServiceRequestDocument
  extends Omit<ServiceRequest, "id">,
    Document {
  id: string; // Keep your custom id field
}

// Mongoose Schema
const ServiceRequestSchema = new mongoose.Schema<IServiceRequestDocument>(
  {
    id: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    images: [{ type: String }],
    user_id: { type: String, required: true },
    user_email: { type: String, required: true },
    user_name: { type: String, required: true },
    assigned_technician: { type: String },
    technician_notes: { type: String },
    completion_notes: { type: String },
    estimated_cost: { type: Number },
    final_cost: { type: Number },
    scheduled_date: { type: Date },
    assignment_message: { type: String },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "pending_verification"],
      default: "pending",
    },
    payment_intent_id: { type: String },
    payment_id: { type: String },
    paid_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Export the model (prevent recompilation in development)
export const ServiceRequestModel: Model<IServiceRequestDocument> =
  mongoose.models.ServiceRequest ||
  mongoose.model<IServiceRequestDocument>(
    "ServiceRequest",
    ServiceRequestSchema
  );
