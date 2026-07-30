import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { transactionId, amount, notes, date, userId } = await req.json();
    
    if (!transactionId || !amount) {
      return Response.json({ success: false, message: "Transaction ID dan nominal pembayaran wajib diisi" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Transaction
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) throw new Error("Transaksi tidak ditemukan");

      // 2. Create Payment Record
      const payment = await tx.receivablePayment.create({
        data: {
          storeId: transaction.storeId,
          transactionId,
          amount: parsedAmount,
          notes,
          date: date ? new Date(date) : new Date(),
          userId: userId || null
        }
      });

      // 3. Update Transaction amountPaid & status
      const newAmountPaid = transaction.amountPaid + parsedAmount;
      let newStatus = transaction.paymentStatus;
      
      if (newAmountPaid >= transaction.grandTotal) {
        newStatus = 'PAID';
      } else if (newAmountPaid > 0) {
        newStatus = 'PARTIAL';
      }

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          amountPaid: newAmountPaid,
          paymentStatus: newStatus
        }
      });

      return payment;
    });

    return Response.json({ success: true, payment: result });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
