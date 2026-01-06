class PayslipManager {
    // Add this method to the PayslipManager class in payslip.js
static generatePayslip(employee, payrollData, monthDetails, settings = null) {
    if (!settings) {
        settings = StateManager.getSettings();
    }
    
    const content = `
        <div class="payslip-border">
            <div class="d-flex justify-content-between align-items-center border-bottom border-success border-2 pb-3 mb-4">
                <div>
                    <h3 class="fw-800 text-success m-0">${settings.name.toUpperCase()}</h3>
                    <p class="m-0 small text-muted font-monospace">${settings.address || 'Nairobi, Kenya'}</p>
                    <p class="m-0 small text-muted">PIN: ${settings.pin}</p>
                </div>
                ${settings.logo ? `<img src="${settings.logo}" class="logo-preview">` : 
                  '<div class="h-100 bg-light p-2 rounded small text-muted">COMPANY LOGO</div>'}
            </div>

            <div class="d-flex justify-content-between mb-4 small">
                <div>
                    <p class="m-0"><b>Employee:</b> ${employee.name}</p>
                    <p class="m-0"><b>KRA PIN:</b> ${employee.pin}</p>
                    ${employee.employeeId ? `<p class="m-0"><b>Employee ID:</b> ${employee.employeeId}</p>` : ''}
                    ${employee.nationalId ? `<p class="m-0"><b>National ID:</b> ${employee.nationalId}</p>` : ''}
                </div>
                <div class="text-end">
                    <p class="m-0"><b>Pay Period:</b> ${monthDetails.monthName} ${monthDetails.year}</p>
                    <p class="m-0"><b>Payment Date:</b> ${new Date().toLocaleDateString('en-KE')}</p>
                    <p class="m-0"><b>Pay Slip No:</b> ${employee.id}-${monthDetails.year}-${monthDetails.monthIdx + 1}</p>
                    <p class="m-0"><b>Status:</b> PAID</p>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-6">
                    <h6 class="fw-bold border-bottom pb-1 text-uppercase small text-success">Earnings</h6>
                    <div class="d-flex justify-content-between small mb-1">
                        <span>Basic Pay</span>
                        <span>KES ${payrollData.basic.toLocaleString()}</span>
                    </div>
                    ${payrollData.benefits > 0 ? `
                    <div class="d-flex justify-content-between small mb-1">
                        <span>Benefits</span>
                        <span>KES ${payrollData.benefits.toLocaleString()}</span>
                    </div>` : ''}
                    ${payrollData.quarters > 0 ? `
                    <div class="d-flex justify-content-between small mb-1">
                        <span>Quarters</span>
                        <span>KES ${payrollData.quarters.toLocaleString()}</span>
                    </div>` : ''}
                    <div class="d-flex justify-content-between fw-bold border-top pt-1 mt-2">
                        <span>Gross Pay</span>
                        <span>KES ${(payrollData.basic + (payrollData.benefits || 0) + (payrollData.quarters || 0)).toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="col-6 border-start">
                    <h6 class="fw-bold border-bottom pb-1 text-uppercase small text-danger">Deductions</h6>
                    ${payrollData.paye > 0 ? `
                    <div class="d-flex justify-content-between small mb-1">
                        <span>PAYE (Tax)</span>
                        <span>KES ${payrollData.paye.toLocaleString()}</span>
                    </div>` : ''}
                    ${payrollData.nssf > 0 ? `
                    <div class="d-flex justify-content-between small mb-1">
                        <span>NSSF</span>
                        <span>KES ${payrollData.nssf.toLocaleString()}</span>
                    </div>` : ''}
                    ${payrollData.shif > 0 ? `
                    <div class="d-flex justify-content-between small mb-1">
                        <span>SHIF</span>
                        <span>KES ${payrollData.shif.toLocaleString()}</span>
                    </div>` : ''}
                    ${payrollData.ahl > 0 ? `
                    <div class="d-flex justify-content-between small mb-1">
                        <span>Housing Levy</span>
                        <span>KES ${payrollData.ahl.toLocaleString()}</span>
                    </div>` : ''}
                    <div class="d-flex justify-content-between fw-bold border-top pt-1 mt-2">
                        <span>Total Deductions</span>
                        <span>KES ${((payrollData.paye || 0) + (payrollData.nssf || 0) + (payrollData.shif || 0) + (payrollData.ahl || 0)).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div class="mt-4 p-3 bg-light rounded text-center">
                <p class="m-0 small text-uppercase fw-bold text-muted">Net Salary Payable</p>
                <h2 class="fw-800 text-success mb-1">KES ${payrollData.net.toLocaleString()}.00</h2>
                <p class="m-0 small italic text-muted">
                    Amount in Words: <i>${Utils.numberToWords(payrollData.net)}</i>
                </p>
            </div>

            <div class="mt-4 row">
                <div class="col-6">
                    <div style="border-top: 1px solid #000; margin-top: 40px; padding-top: 10px;">
                        <p class="small mb-0">Employee Signature</p>
                    </div>
                </div>
                <div class="col-6 text-end">
                    <div style="border-top: 1px solid #000; margin-top: 40px; padding-top: 10px;">
                        <p class="small mb-0">Authorized Signature</p>
                        <p class="small text-muted mb-0">${settings.name}</p>
                    </div>
                </div>
            </div>

            <div class="mt-4 text-center">
                <p class="text-[10px] text-muted mb-0 italic">
                    This is a computer-generated payslip. No signature required for digital records.
                </p>
            </div>
        </div>
    `;

    // Create and show modal
    const modalId = 'payslip-modal-' + Date.now();
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Payslip - ${employee.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-success" onclick="window.print()">
                            🖨️ Print Payslip
                        </button>
                        <button type="button" class="btn btn-primary" onclick="PayslipManager.downloadPayslipAsPDF('${modalId}')">
                            💾 Save as PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

    static viewExistingPayslip(payrollKey) {
        const [year, month, employeeId] = payrollKey.split('-');
        const employee = StateManager.getEmployees().find(e => e.id == employeeId);
        const payrollData = StateManager.getPayrolls()[payrollKey];
        
        if (!employee || !payrollData) {
            Utils.showToast('Payslip data not found', 'error');
            return;
        }

        const monthDetails = {
            year,
            monthName: month,
            monthIdx: ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"]
                     .indexOf(month)
        };

        this.generatePayslip(employee, payrollData, monthDetails);
    }

    static downloadPayslip(payrollKey) {
        // Implementation for PDF download
        // Note: For actual PDF generation, you'd need a library like jsPDF
        // This is a simplified version
        alert('PDF download would be implemented with jsPDF library');
    }

    static downloadPayslipAsPDF(modalId) {
        const modalElement = document.getElementById(modalId);
        const payslipContent = modalElement.querySelector('.payslip-border');
        
        // This is where you'd integrate with jsPDF
        // For now, just trigger print
        window.print();
    }
}