import { NextResponse, type NextRequest } from "next/server";
import { listPayoutRuns, savePayoutRun, transactionSummary, type PayoutEntry } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [runs, summary] = await Promise.all([listPayoutRuns(), transactionSummary()]);
    return NextResponse.json({ runs, balance: summary.balance });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка выплат" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = Array.isArray(body?.entries) ? body.entries : [];
    const entries: PayoutEntry[] = raw
      .map((e: Record<string, unknown>) => ({
        userId: Number(e?.userId) || 0,
        username: String(e?.username ?? "").slice(0, 40),
        role: e?.role ? String(e.role).slice(0, 40) : undefined,
        amount: Math.max(0, Math.round(Number(e?.amount) || 0)),
        percent: typeof e?.percent === "number" ? e.percent : undefined,
      }))
      .filter((e: PayoutEntry) => e.username && e.amount > 0);

    if (!entries.length) {
      return NextResponse.json({ error: "Нет получателей с суммой больше нуля" }, { status: 400 });
    }
    const total = entries.reduce((a, e) => a + e.amount, 0);
    const { balance } = await transactionSummary();
    // The ledger only constrains the plan once it actually holds funds.
    // With an empty ledger the run is recorded as a payout plan.
    if (balance > 0 && total > balance) {
      return NextResponse.json(
        { error: `Недостаточно средств: нужно ${total} R$, доступно ${balance} R$` },
        { status: 400 }
      );
    }

    const run = await savePayoutRun({
      groupId: Number(body?.groupId) || undefined,
      groupName: body?.groupName ? String(body.groupName).slice(0, 80) : undefined,
      mode: String(body?.mode ?? "fixed"),
      note: body?.note ? String(body.note).slice(0, 200) : undefined,
      entries,
    });
    const [runs, summary] = await Promise.all([listPayoutRuns(), transactionSummary()]);
    return NextResponse.json({ run, runs, balance: summary.balance });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Не удалось провести выплату" },
      { status: 500 }
    );
  }
}
