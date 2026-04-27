import { jsPDF } from "jspdf";

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

export function exportCSV(expenses: Expense[], fileName: string = "expenses.csv") {
  const headers = ["Date", "Title", "Category", "Amount"];
  const rows = expenses.map(e => [
    new Date(e.created_at || e.date).toLocaleDateString(),
    e.title || "Untitled Expense",
    e.category || "Uncategorized",
    e.amount.toString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportPDF(expenses: Expense[], fileName: string = "expenses-report.pdf") {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  doc.text("ReceiptVault", margin, yPos);
  yPos += 10;

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text("Expense Report", margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
  yPos += 5;
  doc.text(`Total Expenses: ${expenses.length}`, margin, yPos);
  yPos += 5;

  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, margin, yPos);
  yPos += 15;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, "F");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("Date", margin + 5, yPos + 5.5);
  doc.text("Description", margin + 45, yPos + 5.5);
  doc.text("Category", margin + 105, yPos + 5.5);
  doc.text("Amount", pageWidth - margin - 20, yPos + 5.5);
  yPos += 8;

  expenses.forEach((expense, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    const bgColor = index % 2 === 0 ? 255 : 255;
    doc.setFillColor(bgColor, bgColor, bgColor);
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, "F");

    doc.setTextColor(71, 85, 105);
    doc.text(new Date(expense.created_at || expense.date).toLocaleDateString(), margin + 5, yPos + 5.5);

    doc.text((expense.title || "Untitled Expense").substring(0, 25), margin + 45, yPos + 5.5);

    doc.text((expense.category || "Uncategorized").substring(0, 15), margin + 105, yPos + 5.5);

    doc.setTextColor(30, 41, 59);
    doc.text(formatCurrency(expense.amount), pageWidth - margin - 20, yPos + 5.5);

    yPos += 8;
  });

  yPos += 10;
  doc.setFontSize(12);
  doc.setTextColor(59, 130, 246);
  doc.text("Snap. Tag. Report. Done.", margin, yPos);

  doc.save(fileName);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}