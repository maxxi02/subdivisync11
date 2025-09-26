// src/database/schemas/service-requests.ts
import { ObjectId } from "mongodb";

export interface ServiceRequest {
  _id?: ObjectId;
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
  payment_status: "pending" | "paid" | "failed";
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
