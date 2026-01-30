class PayslipManager {
    static currentPage = 1;
    static itemsPerPage = 10;
    static filteredPayslips = [];
    static initialized = false;
    
    // Initialize the class - call this when the page loads
    static init() {
        if (this.initialized) return;
        
        // Set up event listener for when the payslips tab is shown
        const payslipsTab = document.getElementById('payslips-tab');
        if (payslipsTab) {
            payslipsTab.addEventListener('shown.bs.tab', () => {
                this.renderPayslipsUI();
            });
        }
        
        // Also check if we're already on the payslips tab
        if (document.getElementById('payslips-tab')?.classList.contains('active')) {
            this.renderPayslipsUI();
        }
        
        this.initialized = true;
    }
    
    // Render all payslips with pagination
    static renderPayslipsUI(containerId = 'tab-content') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Initialize data
        this.initPayslipsData();
        
        const totalPayslips = this.filteredPayslips.length;
        const totalPages = Math.ceil(totalPayslips / this.itemsPerPage);
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedPayslips = this.filteredPayslips.slice(startIndex, endIndex);
        
        // Clear container first
        container.innerHTML = '';
        
        const payslipHTML = `
            <div class="card p-0 overflow-hidden">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-0">Payslip History</h5>
                        <div class="small text-muted">
                            ${totalPayslips} payslip${totalPayslips !== 1 ? 's' : ''}
                            ${totalPayslips > this.itemsPerPage ? `(Page ${this.currentPage} of ${totalPages})` : ''}
                        </div>
                    </div>
                    ${totalPayslips > this.itemsPerPage ? `
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-list-columns"></i> Rows per page
                        </button>
                        <ul class="dropdown-menu">
                            <li><button class="dropdown-item ${this.itemsPerPage === 10 ? 'active' : ''}" onclick="PayslipManager.changeItemsPerPage(10)">10 per page</button></li>
                            <li><button class="dropdown-item ${this.itemsPerPage === 25 ? 'active' : ''}" onclick="PayslipManager.changeItemsPerPage(25)">25 per page</button></li>
                            <li><button class="dropdown-item ${this.itemsPerPage === 50 ? 'active' : ''}" onclick="PayslipManager.changeItemsPerPage(50)">50 per page</button></li>
                            <li><button class="dropdown-item ${this.itemsPerPage === 100 ? 'active' : ''}" onclick="PayslipManager.changeItemsPerPage(100)">100 per page</button></li>
                        </ul>
                    </div>` : ''}
                </div>
                
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th class="ps-4">Month</th>
                                <th>Employee</th>
                                <th>Gross Pay</th>
                                <th>Deductions</th>
                                <th>Net Pay</th>
                                <th class="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="payslips-table">
                            ${paginatedPayslips.length > 0 ? paginatedPayslips.map(payslip => `
                                <tr>
                                    <td class="ps-4">
                                        <div class="fw-bold">${payslip.month} ${payslip.year}</div>
                                        <div class="small text-muted">${payslip.employee.employeeId || 'N/A'}</div>
                                    </td>
                                    <td>
                                        <div class="fw-bold">${payslip.employee.name}</div>
                                        <div class="small text-muted">${payslip.employee.pin}</div>
                                    </td>
                                    <td>
                                        <div class="fw-bold">KES ${payslip.grossPay.toLocaleString()}</div>
                                        <div class="small text-muted">Basic: KES ${payslip.payrollData.basic.toLocaleString()}</div>
                                    </td>
                                    <td>
                                        <div class="fw-bold text-danger">KES ${((payslip.payrollData.paye || 0) + (payslip.payrollData.nssf || 0) + (payslip.payrollData.shif || 0) + (payslip.payrollData.ahl || 0)).toLocaleString()}</div>
                                        <div class="small text-muted">PAYE: KES ${(payslip.payrollData.paye || 0).toLocaleString()}</div>
                                    </td>
                                    <td>
                                        <div class="fw-bold text-success">KES ${payslip.netPay.toLocaleString()}</div>
                                        <div class="small text-muted">${new Date(payslip.date).toLocaleDateString('en-KE')}</div>
                                    </td>
                                    <td class="text-end pe-4">
                                        <button class="btn btn-sm btn-outline-success me-1" onclick="PayslipManager.viewExistingPayslip('${payslip.key}')">
                                            <i class="bi bi-eye"></i> View
                                        </button>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="PayslipManager.printPayslip('${payslip.key}')">
                                            <i class="bi bi-printer"></i> Print
                                        </button>
                                        <button class="btn btn-sm btn-outline-info" onclick="PayslipManager.downloadPayslipPDF('${payslip.key}')">
                                            <i class="bi bi-download"></i> PDF
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                            <tr>
                                <td colspan="6" class="text-center py-5 text-muted">
                                    <i class="bi bi-file-earmark-text display-4 d-block mb-2"></i>
                                    No payslips generated yet
                                    <p class="small mt-2">Generate payslips from the payroll section</p>
                                </td>
                            </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                
                ${totalPayslips > 0 ? `
                <div class="card-footer bg-light">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <div class="d-flex align-items-center">
                                <span class="small text-muted me-3">
                                    Showing ${startIndex + 1}-${Math.min(endIndex, totalPayslips)} of ${totalPayslips}
                                </span>
                                <div class="input-group input-group-sm" style="width: 200px;">
                                    <input type="text" id="payslip-search" class="form-control form-control-sm" 
                                           placeholder="Search payslips..." onkeyup="PayslipManager.filterPayslips(event)">
                                    <button class="btn btn-outline-secondary" type="button" onclick="PayslipManager.clearSearch()">
                                        <i class="bi bi-x"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex justify-content-end">
                                ${this.getPaginationHTML()}
                            </div>
                        </div>
                    </div>
                </div>` : ''}
            </div>
        `;
        
        container.innerHTML = payslipHTML;
    }
    
    // Initialize payslips data
    static initPayslipsData() {
        const payrolls = StateManager.getPayrolls();
        const employees = StateManager.getEmployees();
        
        this.filteredPayslips = [];
        Object.keys(payrolls).forEach(key => {
            const [year, month, employeeId] = key.split('-');
            const employee = employees.find(e => e.id == employeeId);
            
            if (employee) {
                const payrollData = payrolls[key];
                this.filteredPayslips.push({
                    key,
                    year,
                    month,
                    employee,
                    payrollData,
                    monthName: month,
                    date: new Date(year, ["January","February","March","April","May","June",
                                         "July","August","September","October","November","December"]
                                         .indexOf(month), 1),
                    netPay: payrollData.net || 0,
                    grossPay: payrollData.basic + (payrollData.benefits || 0) + (payrollData.quarters || 0)
                });
            }
        });
        
        // Sort by date (newest first)
        this.filteredPayslips.sort((a, b) => b.date - a.date);
    }
    
    static getPaginationHTML() {
        const totalPayslips = this.filteredPayslips.length;
        const totalPages = Math.ceil(totalPayslips / this.itemsPerPage);
        
        if (totalPages <= 1) {
            return '';
        }
        
        let paginationHTML = `
            <nav aria-label="Payslip pagination">
                <ul class="pagination pagination-sm mb-0">
        `;
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="PayslipManager.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                    &laquo;
                </button>
            </li>
        `;
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page
        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="PayslipManager.goToPage(1)">1</button>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <button class="page-link" onclick="PayslipManager.goToPage(${i})">${i}</button>
                </li>
            `;
        }
        
        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="PayslipManager.goToPage(${totalPages})">${totalPages}</button>
                </li>
            `;
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="PayslipManager.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    &raquo;
                </button>
            </li>
        `;
        
        paginationHTML += `
                </ul>
            </nav>
        `;
        
        return paginationHTML;
    }
    
    static goToPage(pageNumber) {
        const totalPages = Math.ceil(this.filteredPayslips.length / this.itemsPerPage);
        
        if (pageNumber < 1 || pageNumber > totalPages) return;
        
        this.currentPage = pageNumber;
        this.renderPayslipsUI();
    }
    
    static changeItemsPerPage(itemsPerPage) {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1; // Reset to first page
        this.renderPayslipsUI();
    }
    
    static filterPayslips(event) {
        const searchTerm = event.target.value.toLowerCase();
        const payrolls = StateManager.getPayrolls();
        const employees = StateManager.getEmployees();
        
        if (!searchTerm.trim()) {
            // Reset to all payslips
            this.initPayslipsData();
        } else {
            // Filter payslips
            this.filteredPayslips = [];
            Object.keys(payrolls).forEach(key => {
                const [year, month, employeeId] = key.split('-');
                const employee = employees.find(e => e.id == employeeId);
                
                if (employee) {
                    const payrollData = payrolls[key];
                    
                    // Check if search term matches any field
                    const searchFields = [
                        employee.name.toLowerCase(),
                        employee.pin.toLowerCase(),
                        employee.employeeId ? employee.employeeId.toLowerCase() : '',
                        month.toLowerCase(),
                        year,
                        payrollData.net?.toString() || '',
                        payrollData.basic?.toString() || ''
                    ];
                    
                    if (searchFields.some(field => field.includes(searchTerm))) {
                        this.filteredPayslips.push({
                            key,
                            year,
                            month,
                            employee,
                            payrollData,
                            monthName: month,
                            date: new Date(year, ["January","February","March","April","May","June",
                                                 "July","August","September","October","November","December"]
                                                 .indexOf(month), 1),
                            netPay: payrollData.net || 0,
                            grossPay: payrollData.basic + (payrollData.benefits || 0) + (payrollData.quarters || 0)
                        });
                    }
                }
            });
            this.filteredPayslips.sort((a, b) => b.date - a.date);
        }
        
        this.currentPage = 1; // Reset to first page when filtering
        this.renderPayslipsUI();
    }
    
    static clearSearch() {
        const searchInput = document.getElementById('payslip-search');
        if (searchInput) {
            searchInput.value = '';
            this.filterPayslips({ target: { value: '' } });
        }
    }
    
    // Original payslip generation methods (keep these as they were)
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
    
    static printPayslip(payrollKey) {
        this.viewExistingPayslip(payrollKey);
        // After modal shows, you can add a small delay then trigger print
        setTimeout(() => window.print(), 500);
    }
    
    static downloadPayslipPDF(payrollKey) {
        this.viewExistingPayslip(payrollKey);
        // You would integrate with jsPDF here
        setTimeout(() => {
            Utils.showToast('PDF download ready (jsPDF integration required)', 'info');
        }, 500);
    }

    static downloadPayslipAsPDF(modalId) {
        const modalElement = document.getElementById(modalId);
        const payslipContent = modalElement.querySelector('.payslip-border');
        
        // This is where you'd integrate with jsPDF
        // For now, just trigger print
        window.print();
    }
}

// Auto-initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
    PayslipManager.init();
});