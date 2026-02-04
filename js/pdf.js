// ===================================
// Floos Expense Tracker - PDF Export
// PDF Report Generation using jsPDF
// ===================================

// Load jsPDF libraries from CDN
function loadPDFLibraries() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.jspdf && window.jspdf.jsPDF) {
            resolve();
            return;
        }

        // Load jsPDF
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script1.onload = () => {
            // Load jspdf-autotable
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
            script2.onload = () => resolve();
            script2.onerror = () => reject(new Error('Failed to load jspdf-autotable'));
            document.head.appendChild(script2);
        };
        script1.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(script1);
    });
}

// Generate PDF Report
async function generatePDF(transactions) {
    try {
        // Show loading toast
        showToast('Generating PDF report...', 'info');

        // Load libraries if needed
        await loadPDFLibraries();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Calculate date range
        let startDate = null;
        let endDate = null;
        if (transactions.length > 0) {
            const dates = transactions.map(t => new Date(t.date));
            startDate = new Date(Math.min(...dates));
            endDate = new Date(Math.max(...dates));
        }

        // Format filename
        const filename = generatePDFFilename(startDate, endDate);

        // Page setup
        let yPos = 20;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;

        // Header
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Floos Expense Report', margin, yPos);
        yPos += 10;

        // Date range
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        if (startDate && endDate) {
            const dateRangeText = `${formatDateForPDF(startDate)} - ${formatDateForPDF(endDate)}`;
            doc.text(dateRangeText, margin, yPos);
        }
        yPos += 5;

        // Generated on
        const generatedText = `Generated on: ${formatDateForPDF(new Date())}`;
        doc.text(generatedText, margin, yPos);
        yPos += 15;

        // Calculate totals
        let totalIncome = 0;
        let totalExpenses = 0;
        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else {
                totalExpenses += t.amount;
            }
        });
        const balance = totalIncome - totalExpenses;

        // Balance Summary
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Balance Summary', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Total Income: OMR ${totalIncome.toFixed(3)}`, margin, yPos);
        yPos += 6;
        doc.text(`Total Expenses: OMR ${totalExpenses.toFixed(3)}`, margin, yPos);
        yPos += 6;

        doc.setFont(undefined, 'bold');
        if (balance >= 0) {
            doc.setTextColor(16, 185, 129);
        } else {
            doc.setTextColor(239, 68, 68);
        }
        doc.text(`Net Balance: OMR ${balance.toFixed(3)}`, margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 15;

        // Category Breakdown
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Category Breakdown', margin, yPos);
        yPos += 10;

        // Income by category
        const incomeByCategory = calculateCategoryBreakdown(transactions, 'income');
        if (incomeByCategory.length > 0) {
            doc.setFontSize(12);
            doc.text('Income by Category', margin, yPos);
            yPos += 5;

            doc.autoTable({
                startY: yPos,
                head: [['Category', 'Amount', '% of Total']],
                body: incomeByCategory.map(item => [
                    item.category,
                    'OMR ' + item.amount.toFixed(3),
                    `${item.percentage.toFixed(1)}%`
                ]),
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] },
                margin: { left: margin, right: margin }
            });

            yPos = doc.lastAutoTable.finalY + 10;
        }

        // Expense by category
        const expenseByCategory = calculateCategoryBreakdown(transactions, 'expense');
        if (expenseByCategory.length > 0) {
            doc.setFontSize(12);
            doc.text('Expenses by Category', margin, yPos);
            yPos += 5;

            doc.autoTable({
                startY: yPos,
                head: [['Category', 'Amount', '% of Total']],
                body: expenseByCategory.map(item => [
                    item.category,
                    'OMR ' + item.amount.toFixed(3),
                    `${item.percentage.toFixed(1)}%`
                ]),
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68] },
                margin: { left: margin, right: margin }
            });

            yPos = doc.lastAutoTable.finalY + 15;
        }

        // Full Transaction List
        if (transactions.length > 0) {
            // Check if we need a new page
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('All Transactions', margin, yPos);
            yPos += 5;

            const tableData = transactions.map(t => {
                const date = new Date(t.date);
                const dateStr = `${date.getDate().toString().padStart(2, '0')} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]}`;
                const sign = t.type === 'income' ? '+' : '-';
                return [
                    dateStr,
                    t.type.charAt(0).toUpperCase() + t.type.slice(1),
                    t.category,
                    `${sign}OMR ${t.amount.toFixed(3)}`,
                    t.note || '-'
                ];
            });

            doc.autoTable({
                startY: yPos,
                head: [['Date', 'Type', 'Category', 'Amount', 'Note']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] },
                margin: { left: margin, right: margin },
                styles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 'auto' }
                }
            });
        }

        // Save PDF - Use Web Share API on iOS for native share sheet
        const pdfBlob = doc.output('blob');

        // Check if Web Share API is available (iOS PWA)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], filename, { type: 'application/pdf' })] })) {
            try {
                const file = new File([pdfBlob], filename, { type: 'application/pdf' });
                await navigator.share({
                    files: [file],
                    title: 'Floos Expense Report',
                    text: 'Your expense report from Floos'
                });
                showToast('PDF shared successfully', 'success');
            } catch (error) {
                // User cancelled share or error occurred
                if (error.name !== 'AbortError') {
                    // Fallback to download
                    doc.save(filename);
                    showToast('PDF downloaded', 'success');
                }
            }
        } else {
            // Fallback to traditional download for non-iOS or desktop
            doc.save(filename);
            showToast('PDF generated successfully', 'success');
        }

    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Failed to generate PDF', 'error');
    }
}

// Calculate Category Breakdown
function calculateCategoryBreakdown(transactions, type) {
    const filtered = transactions.filter(t => t.type === type);
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = {};
    filtered.forEach(t => {
        if (!categoryMap[t.category]) {
            categoryMap[t.category] = 0;
        }
        categoryMap[t.category] += t.amount;
    });

    return Object.entries(categoryMap)
        .map(([category, amount]) => ({
            category,
            amount,
            percentage: total > 0 ? (amount / total) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);
}

// Generate PDF Filename
function generatePDFFilename(startDate, endDate) {
    if (!startDate || !endDate) {
        return 'Floos_Report.pdf';
    }

    const formatMonth = (date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[date.getMonth()] + date.getDate();
    };

    if (startDate.toDateString() === endDate.toDateString()) {
        return `Floos_${formatMonth(startDate)}.pdf`;
    }

    return `Floos_${formatMonth(startDate)}_${formatMonth(endDate)}.pdf`;
}

// Format Date for PDF
function formatDateForPDF(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}
