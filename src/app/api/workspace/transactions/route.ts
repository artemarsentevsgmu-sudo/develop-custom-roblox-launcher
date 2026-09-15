import { NextResponse, type NextRequest } from "next/server";
import { listTransactions, transactionSummary } from "@/lib/workspace";

export const dynamic = "force-dynamic";

function toCsv(rows: Awaited<ReturnType<typeof listTransactions>>): string {
  const head = ["Дата", "Тип", "Описание", "Контрагент", "Сумма (R$)", "Баланс (R$)"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      new Date(r.happenedAt).toLocaleString("ru-RU"),
      r.kind,
      r.title,
      r.counterparty ?? "",
      r.amount,
      r.balanceAfter,
    ]
      .map(esc)
      .join(";")
  );
  // BOM so Excel opens UTF-8 correctly
  return "\uFEFF" + [head.map(esc).join(";"), ...lines].join("\r\n");
}

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const kind = p.get("kind") ?? "all";
    const format = p.get("format");
    const limit = Number(p.get("limit")) || (format ? 2000 : 120);
    const rows = await listTransactions({ kind, limit });

    if (format === "csv") {
      return new NextResponse(toCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rolaunch-transactions-${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
        },
      });
    }

    const summary = await transactionSummary();
    return NextResponse.json({
      rows: rows.map((r) => ({
        id: r.id,
        happenedAt: r.happenedAt,
        kind: r.kind,
        title: r.title,
        counterparty: r.counterparty,
        amount: r.amount,
        balanceAfter: r.balanceAfter,
      })),
      summary,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка истории" },
      { status: 500 }
    );
  }
}
