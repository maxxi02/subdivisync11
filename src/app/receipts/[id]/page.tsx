// src/app/receipts/[id]/page.tsx
import { connectDB, db } from "@/database/mongodb";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";

interface Receipt {
  _id: ObjectId;
  type: string;
  amount: number;
  paymentId?: string;
  requestId?: string;
  transactionId: string;
  paidDate: string;
  description: string;
  created_at: string;
}

export default async function ReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  await connectDB();
  const receiptsCollection = db.collection<Receipt>("receipts");
  const receipt = await receiptsCollection.findOne({
    _id: new ObjectId(params.id),
  });

  if (!receipt) {
    notFound();
  }

  return (
    <div>
      <h1>Receipt: {receipt.description}</h1>
      <p>Amount: PHP {receipt.amount}</p>
      <p>Paid on: {new Date(receipt.paidDate).toLocaleDateString()}</p>
      <p>Transaction ID: {receipt.transactionId}</p>
      {receipt.paymentId && <p>Payment ID: {receipt.paymentId}</p>}
      {receipt.requestId && <p>Request ID: {receipt.requestId}</p>}
    </div>
  );
}
