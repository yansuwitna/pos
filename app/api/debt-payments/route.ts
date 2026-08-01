import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { purchaseId, amount, notes, date, userId } = await req.json();
    
    if (!purchaseId || !amount) {
      return Response.json({ success: false, message: "Purchase ID dan nominal pembayaran wajib diisi" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Purchase
      const purchase = await tx.purchase.findUnique({
        where: { id: purchaseId }
      });

      if (!purchase) throw new Error("Data pembelian tidak ditemukan");

      // 2. Create Payment Record
      const payment = await tx.debtPayment.create({
        data: {
          storeId: purchase.storeId,
          purchaseId,
          amount: parsedAmount,
          notes,
          date: date ? new Date(date) : new Date(),
          userId: userId || null
        }
      });

      // 3. Update Purchase amountPaid & status
      const newAmountPaid = purchase.amountPaid + parsedAmount;
      let newStatus = purchase.paymentStatus;
      
      if (newAmountPaid >= purchase.totalCost) {
        newStatus = 'PAID';
      } else if (newAmountPaid > 0) {
        newStatus = 'PARTIAL';
      }

      await tx.purchase.update({
        where: { id: purchaseId },
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
