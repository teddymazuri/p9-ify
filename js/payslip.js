class PayslipManager {
    // Store the current payslip data for pagination
    static currentPayslips = [];
    static currentPage = 0;
    static payslipsPerPage = 5;
    static currentModalInstance = null; // Store the current modal instance

    // Generate individual payslip
    static generatePayslip(employee, payrollData, monthDetails, settings = null, index = null, total = null) {
        if (!settings) {
            settings = StateManager.getSettings();
        }

        // Calculate NSSF split (50/50 between employer and employee)
        const nssfTotal = payrollData.nssf || 0;
        const nssfEmployee = Math.round(nssfTotal / 2);
        const nssfEmployer = Math.round(nssfTotal / 2);

        // Calculate gross pay and total deductions
        const grossPay = payrollData.basic + (payrollData.benefits || 0) + (payrollData.quarters || 0);
        const totalEmployeeDeductions = (payrollData.paye || 0) + nssfEmployee + (payrollData.shif || 0) + (payrollData.ahl || 0);
        const totalEmployerContributions = nssfEmployer;

        // Get current payslip key for print/download functionality
        const currentPayslipKey = `${monthDetails.year}-${monthDetails.monthName}-${employee.id}`;

        const content = `
            <div class="payslip-border" id="payslip-${employee.id}">
                ${index !== null && total !== null ? `
                <div class="mb-3 text-center">
                    <span class="badge bg-info">Payslip ${index + 1} of ${total}</span>
                </div>
                ` : ''}
                
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
                            <span>KES ${grossPay.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="col-6 border-start">
                        <h6 class="fw-bold border-bottom pb-1 text-uppercase small text-danger">Deductions</h6>
                        ${payrollData.paye > 0 ? `
                        <div class="d-flex justify-content-between small mb-1">
                            <span>PAYE (Tax)</span>
                            <span>KES ${payrollData.paye.toLocaleString()}</span>
                        </div>` : ''}
                        ${nssfEmployee > 0 ? `
                        <div class="d-flex justify-content-between small mb-1">
                            <span>NSSF - Employee Share</span>
                            <span>KES ${nssfEmployee.toLocaleString()}</span>
                        </div>` : ''}
                        ${nssfEmployer > 0 ? `
                        <div class="d-flex justify-content-between small mb-1">
                            <span>NSSF - Employer Share</span>
                            <span>KES ${nssfEmployer.toLocaleString()}</span>
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
                            <span>Total Employee Deductions</span>
                            <span>KES ${totalEmployeeDeductions.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="mt-4 row">
                    <div class="col-6">
                        <div class="bg-light p-3 rounded">
                            <h6 class="fw-bold text-uppercase small mb-2">Employee Summary</h6>
                            <div class="d-flex justify-content-between small mb-1">
                                <span>Gross Pay:</span>
                                <span>KES ${grossPay.toLocaleString()}</span>
                            </div>
                            <div class="d-flex justify-content-between small mb-1">
                                <span>Total Deductions:</span>
                                <span>KES ${totalEmployeeDeductions.toLocaleString()}</span>
                            </div>
                            <div class="d-flex justify-content-between fw-bold border-top pt-1 mt-1">
                                <span>Net Pay:</span>
                                <span>KES ${payrollData.net.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="bg-light p-3 rounded">
                            <h6 class="fw-bold text-uppercase small mb-2">Employer Contributions</h6>
                            <div class="d-flex justify-content-between small mb-1">
                                <span>NSSF Employer Share:</span>
                                <span>KES ${nssfEmployer.toLocaleString()}</span>
                            </div>
                            <div class="d-flex justify-content-between small mb-1">
                                <span>Total NSSF (Employee + Employer):</span>
                                <span>KES ${nssfTotal.toLocaleString()}</span>
                            </div>
                            <div class="d-flex justify-content-between fw-bold border-top pt-1 mt-1">
                                <span>Total Cost to Employer:</span>
                                <span>KES ${(grossPay + totalEmployerContributions).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-4 p-3 bg-success text-white rounded text-center">
                    <p class="m-0 small text-uppercase fw-bold">Net Salary Payable</p>
                    <h2 class="fw-800 mb-1">KES ${payrollData.net.toLocaleString()}.00</h2>
                    <p class="m-0 small italic">
                        Amount in Words: <i>${Utils.numberToWords ? Utils.numberToWords(payrollData.net) : this.numberToWords(payrollData.net)}</i>
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

        // Create modal with unique ID
        const modalId = 'payslip-modal-' + Date.now();
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Payslip - ${employee.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            ${index !== null ? `
                            <div class="btn-group me-2" role="group">
                                <button type="button" class="btn btn-outline-primary" onclick="PayslipManager.prevPayslip()" ${index === 0 ? 'disabled' : ''}>
                                    <i class="bi bi-chevron-left"></i> Previous
                                </button>
                                <button type="button" class="btn btn-outline-primary" onclick="PayslipManager.nextPayslip()" ${index === total - 1 ? 'disabled' : ''}>
                                    Next <i class="bi bi-chevron-right"></i>
                                </button>
                            </div>
                            ` : ''}
                            <button type="button" class="btn btn-primary" onclick="PayslipManager.downloadSinglePayslipPDF('${currentPayslipKey}')">
                                <i class="bi bi-download me-1"></i> Save as PDF
                            </button>
                            <button type="button" class="btn btn-success" onclick="PayslipManager.printSinglePayslipFromKey('${currentPayslipKey}')">
                                <i class="bi bi-printer me-1"></i> Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Clear existing modals to prevent overlay issues
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = '';
        modalContainer.innerHTML = modalHTML;
        
        // Show modal
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        // Store current payslip key for navigation
        if (index !== null) {
            modalElement.dataset.payslipKey = currentPayslipKey;
            modalElement.dataset.currentIndex = index;
        }
    }

    // View a specific payslip by key
    static viewExistingPayslip(payrollKey) {
        try {
            console.log('Opening payslip with key:', payrollKey);
            
            // Parse the payroll key (format: "2026-January-123456789")
            const parts = payrollKey.split('-');
            if (parts.length < 3) {
                Utils.showToast('Invalid payslip format', 'error');
                return;
            }

            const year = parts[0];
            const monthName = parts[1];
            const employeeId = parts[2];
            
            console.log('Parsed:', {year, monthName, employeeId});
            
            // Get employee and payroll data
            const employee = StateManager.getEmployees().find(e => e.id == employeeId);
            const payrollData = StateManager.getPayrolls()[payrollKey];
            
            if (!employee) {
                console.error('Employee not found:', employeeId);
                Utils.showToast('Employee not found', 'error');
                return;
            }
            
            if (!payrollData) {
                console.error('Payroll data not found for key:', payrollKey);
                Utils.showToast('Payslip data not found', 'error');
                return;
            }

            console.log('Found employee and payroll data:', {employee, payrollData});
            
            // Create month details
            const monthDetails = {
                year: year,
                monthName: monthName,
                monthIdx: ["January","February","March","April","May","June",
                          "July","August","September","October","November","December"]
                         .indexOf(monthName),
                inputValue: `${year}-${String(["January","February","March","April","May","June",
                          "July","August","September","October","November","December"]
                         .indexOf(monthName) + 1).padStart(2, '0')}`
            };

            console.log('Month details:', monthDetails);
            
            // Generate the payslip
            this.generatePayslip(employee, payrollData, monthDetails);
            
        } catch (error) {
            console.error('Error viewing payslip:', error);
            Utils.showToast('Error loading payslip', 'error');
        }
    }

    // Download PDF for a single payslip
    static downloadSinglePayslipPDF(payrollKey) {
        try {
            console.log('Downloading PDF for key:', payrollKey);
            
            // Parse the payroll key
            const parts = payrollKey.split('-');
            if (parts.length < 3) {
                Utils.showToast('Invalid payslip format', 'error');
                return;
            }

            const year = parts[0];
            const monthName = parts[1];
            const employeeId = parts[2];
            
            // Get employee and payroll data
            const employee = StateManager.getEmployees().find(e => e.id == employeeId);
            const payrollData = StateManager.getPayrolls()[payrollKey];
            
            if (!employee || !payrollData) {
                Utils.showToast('Payslip data not found', 'error');
                return;
            }

            // Create month details
            const monthDetails = {
                year: year,
                monthName: monthName,
                monthIdx: ["January","February","March","April","May","June",
                          "July","August","September","October","November","December"]
                         .indexOf(monthName)
            };

            // Generate HTML for the payslip
            const settings = StateManager.getSettings();
            const payslipHTML = this.getPayslipHTML(employee, payrollData, monthDetails, settings);
            
            // Create temporary div
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 210mm; padding: 20px; background: white;';
            tempDiv.innerHTML = payslipHTML;
            document.body.appendChild(tempDiv);
            
            // Generate PDF
            if (typeof jsPDF !== 'undefined' && typeof html2canvas !== 'undefined') {
                this.generatePDFFromElement(tempDiv, `Payslip_${employee.name}_${monthName}_${year}`);
            } else {
                Utils.showToast('PDF libraries not loaded', 'warning');
                this.printSinglePayslipFromKey(payrollKey);
            }
            
            // Clean up
            setTimeout(() => {
                if (tempDiv.parentNode) {
                    document.body.removeChild(tempDiv);
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            Utils.showToast('Error generating PDF', 'error');
        }
    }

    // Print a single payslip
    static printSinglePayslipFromKey(payrollKey) {
        try {
            console.log('Printing payslip with key:', payrollKey);
            
            // Parse the payroll key
            const parts = payrollKey.split('-');
            if (parts.length < 3) {
                Utils.showToast('Invalid payslip format', 'error');
                return;
            }

            const year = parts[0];
            const monthName = parts[1];
            const employeeId = parts[2];
            
            // Get employee and payroll data
            const employee = StateManager.getEmployees().find(e => e.id == employeeId);
            const payrollData = StateManager.getPayrolls()[payrollKey];
            
            if (!employee || !payrollData) {
                Utils.showToast('Payslip data not found', 'error');
                return;
            }

            // Create month details
            const monthDetails = {
                year: year,
                monthName: monthName,
                monthIdx: ["January","February","March","April","May","June",
                          "July","August","September","October","November","December"]
                         .indexOf(monthName)
            };

            // Generate HTML for the payslip
            const settings = StateManager.getSettings();
            const payslipHTML = this.getPayslipHTML(employee, payrollData, monthDetails, settings);
            
            // Create print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Payslip - ${employee.name} - ${monthName} ${year}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        @media print {
                            body { margin: 0; padding: 20px; }
                            .payslip-border { border: 2px solid #000 !important; padding: 20px; }
                            @page { margin: 20mm; }
                        }
                        body { font-family: Arial, sans-serif; background: white; }
                        .payslip-border { border: 2px solid #28a745; padding: 20px; max-width: 800px; margin: 0 auto; background: white; }
                        .no-print { display: none !important; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        ${payslipHTML}
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 1000);
                        }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
            
        } catch (error) {
            console.error('Error printing payslip:', error);
            Utils.showToast('Error printing payslip', 'error');
        }
    }

    // Generate all payslips modal (pagination view)
    static generateAllPayslipsModal() {
        console.log('Generating all payslips modal');
        
        const employees = StateManager.getEmployees();
        const settings = StateManager.getSettings();

        // Get all employees with payroll data for all months
        this.currentPayslips = [];

        // Loop through all payroll entries
        const payrolls = StateManager.getPayrolls();
        Object.keys(payrolls).forEach(key => {
            const payroll = payrolls[key];
            if (!payroll || payroll.basic <= 0) return;

            // Parse key to get employee ID
            const parts = key.split('-');
            if (parts.length < 3) return;

            const year = parts[0];
            const monthName = parts[1];
            const employeeId = parts[2];

            const employee = employees.find(e => e.id == employeeId);
            if (!employee) return;

            this.currentPayslips.push({
                employee: employee,
                payrollData: payroll,
                key: key,
                monthName: monthName,
                year: year
            });
        });

        if (this.currentPayslips.length === 0) {
            Utils.showToast('No payslips available', 'warning');
            return;
        }

        // Reset pagination
        this.currentPage = 0;
        this.showPayslipPage();
    }

    static showPayslipPage() {
        const startIndex = this.currentPage * this.payslipsPerPage;
        const endIndex = startIndex + this.payslipsPerPage;
        const currentPagePayslips = this.currentPayslips.slice(startIndex, endIndex);

        const content = `
            <div class="modal fade" id="all-payslips-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-receipt me-2"></i>
                                All Generated Payslips
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h6 class="mb-1">Showing payslips ${startIndex + 1} to ${Math.min(endIndex, this.currentPayslips.length)} of ${this.currentPayslips.length}</h6>
                                    <p class="text-muted small mb-0">Click on a payslip to view details</p>
                                </div>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-outline-success btn-sm" onclick="PayslipManager.downloadAllAsPDF()">
                                        <i class="bi bi-download me-1"></i> Download All as PDF
                                    </button>
                                    <button class="btn btn-success btn-sm" onclick="PayslipManager.printAllPayslips()">
                                        <i class="bi bi-printer me-1"></i> Print All
                                    </button>
                                </div>
                            </div>

                            <div class="row g-4">
                                ${currentPagePayslips.map((item, index) => `
                                    <div class="col-md-6">
                                        <div class="card border hover-shadow" onclick="PayslipManager.viewPayslipInModal(${startIndex + index})" style="cursor: pointer;">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 class="card-title mb-0">${item.employee.name}</h6>
                                                    <span class="badge bg-success">Payslip ${startIndex + index + 1}</span>
                                                </div>
                                                <p class="text-muted small mb-2">${item.employee.employeeId || item.employee.pin}</p>
                                                <div class="row g-2">
                                                    <div class="col-6">
                                                        <div class="bg-light p-2 rounded text-center">
                                                            <p class="small mb-0 text-muted">Basic Pay</p>
                                                            <p class="mb-0 fw-bold">KES ${item.payrollData.basic.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div class="col-6">
                                                        <div class="bg-light p-2 rounded text-center">
                                                            <p class="small mb-0 text-muted">Net Pay</p>
                                                            <p class="mb-0 fw-bold text-success">KES ${item.payrollData.net.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="mt-3 d-flex justify-content-between small">
                                                    <span class="text-muted">Click to view details</span>
                                                    <span><i class="bi bi-chevron-right"></i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <!-- Pagination -->
                            ${this.currentPayslips.length > this.payslipsPerPage ? `
                            <div class="mt-4 d-flex justify-content-center">
                                <nav aria-label="Payslip pagination">
                                    <ul class="pagination">
                                        <li class="page-item ${this.currentPage === 0 ? 'disabled' : ''}">
                                            <button class="page-link" onclick="PayslipManager.prevPage()">
                                                <i class="bi bi-chevron-left"></i> Previous
                                            </button>
                                        </li>
                                        ${Array.from({ length: Math.ceil(this.currentPayslips.length / this.payslipsPerPage) }, (_, i) => `
                                            <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                                                <button class="page-link" onclick="PayslipManager.goToPage(${i})">${i + 1}</button>
                                            </li>
                                        `).join('')}
                                        <li class="page-item ${this.currentPage >= Math.ceil(this.currentPayslips.length / this.payslipsPerPage) - 1 ? 'disabled' : ''}">
                                            <button class="page-link" onclick="PayslipManager.nextPage()">
                                                Next <i class="bi bi-chevron-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Clear existing modals to prevent overlay issues
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = '';
        modalContainer.innerHTML = content;
        
        // Remove any existing modal backdrop
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }
        
        // Remove modal-open class from body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = ''; // Reset overflow
        
        // Show new modal
        const modalElement = document.getElementById('all-payslips-modal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Store modal instance
        this.currentModalInstance = modal;
    }

    static viewPayslipInModal(index) {
        if (index < 0 || index >= this.currentPayslips.length) return;

        const { employee, payrollData } = this.currentPayslips[index];
        const monthDetails = {
            year: this.currentPayslips[index].year,
            monthName: this.currentPayslips[index].monthName,
            monthIdx: ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"]
                     .indexOf(this.currentPayslips[index].monthName)
        };

        // Hide the current modal properly
        if (this.currentModalInstance) {
            this.currentModalInstance.hide();
        }

        // Show individual payslip after a short delay
        setTimeout(() => {
            this.generatePayslip(employee, payrollData, monthDetails, null, index, this.currentPayslips.length);
        }, 300);
    }

    static prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.showPayslipPage();
        }
    }

    static nextPage() {
        if ((this.currentPage + 1) * this.payslipsPerPage < this.currentPayslips.length) {
            this.currentPage++;
            this.showPayslipPage();
        }
    }

    static goToPage(page) {
        if (page >= 0 && page < Math.ceil(this.currentPayslips.length / this.payslipsPerPage)) {
            this.currentPage = page;
            this.showPayslipPage();
        }
    }

    static prevPayslip() {
        const currentModal = document.querySelector('.modal.show');
        if (!currentModal) return;

        const currentIndex = this.getCurrentPayslipIndex();
        if (currentIndex > 0) {
            const { employee, payrollData } = this.currentPayslips[currentIndex - 1];
            const monthDetails = {
                year: this.currentPayslips[currentIndex - 1].year,
                monthName: this.currentPayslips[currentIndex - 1].monthName,
                monthIdx: ["January","February","March","April","May","June",
                          "July","August","September","October","November","December"]
                         .indexOf(this.currentPayslips[currentIndex - 1].monthName)
            };

            const modal = bootstrap.Modal.getInstance(currentModal);
            if (modal) modal.hide();
            
            // Clean up backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            
            setTimeout(() => {
                this.generatePayslip(employee, payrollData, monthDetails, null, currentIndex - 1, this.currentPayslips.length);
            }, 300);
        }
    }

    static nextPayslip() {
        const currentModal = document.querySelector('.modal.show');
        if (!currentModal) return;

        const currentIndex = this.getCurrentPayslipIndex();
        if (currentIndex < this.currentPayslips.length - 1) {
            const { employee, payrollData } = this.currentPayslips[currentIndex + 1];
            const monthDetails = {
                year: this.currentPayslips[currentIndex + 1].year,
                monthName: this.currentPayslips[currentIndex + 1].monthName,
                monthIdx: ["January","February","March","April","May","June",
                          "July","August","September","October","November","December"]
                         .indexOf(this.currentPayslips[currentIndex + 1].monthName)
            };

            const modal = bootstrap.Modal.getInstance(currentModal);
            if (modal) modal.hide();
            
            // Clean up backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            
            setTimeout(() => {
                this.generatePayslip(employee, payrollData, monthDetails, null, currentIndex + 1, this.currentPayslips.length);
            }, 300);
        }
    }

    static getCurrentPayslipIndex() {
        const modal = document.querySelector('.modal.show');
        if (!modal) return -1;

        const title = modal.querySelector('.modal-title');
        if (!title) return -1;
        
        const employeeName = title.textContent.replace('Payslip - ', '');
        return this.currentPayslips.findIndex(item => item.employee.name === employeeName);
    }

    // PDF Generation Methods
    static generatePDFFromElement(element, filename = 'payslip') {
        try {
            // Create a new jsPDF instance
            const doc = new jsPDF('p', 'mm', 'a4');

            // Use html2canvas to convert HTML to image
            html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const imgWidth = 190; // A4 width in mm (210 - 20mm margins)
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Add the image to PDF
                doc.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);

                // Save the PDF
                doc.save(`${filename}-${new Date().getTime()}.pdf`);

                Utils.showToast('PDF downloaded successfully', 'success');
            }).catch(error => {
                console.error('Error converting to canvas:', error);
                Utils.showToast('Error generating PDF', 'error');
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            Utils.showToast('Error generating PDF. Please try printing instead.', 'error');
        }
    }

    static downloadAllAsPDF() {
        if (!this.currentPayslips.length) {
            Utils.showToast('No payslips available', 'warning');
            return;
        }

        Utils.showToast('Generating PDF for all payslips...', 'info');
        
        // Create a combined PDF with all payslips
        if (typeof jsPDF !== 'undefined' && typeof html2canvas !== 'undefined') {
            this.generateCombinedPayslipsPDF();
        } else {
            Utils.showToast('PDF library not loaded. Please include jsPDF and html2canvas.', 'warning');
        }
    }

    static generateCombinedPayslipsPDF() {
        const doc = new jsPDF('p', 'mm', 'a4');
        let currentPage = 1;
        
        Utils.showToast(`Generating PDF (1/${this.currentPayslips.length})...`, 'info');
        
        // Helper function to add a payslip to PDF
        const addPayslipToPDF = (index) => {
            if (index >= this.currentPayslips.length) {
                // All payslips processed, save the PDF
                doc.save(`All_Payslips_${new Date().getTime()}.pdf`);
                Utils.showToast('PDF downloaded successfully', 'success');
                return;
            }
            
            const item = this.currentPayslips[index];
            const monthDetails = {
                year: item.year,
                monthName: item.monthName,
                monthIdx: ["January","February","March","April","May","June",
                          "July","August","September","October","November","December"]
                         .indexOf(item.monthName)
            };
            
            const settings = StateManager.getSettings();
            const payslipHTML = this.getPayslipHTML(item.employee, item.payrollData, monthDetails, settings);
            
            // Create temporary div
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 190mm; padding: 20px; background: white;';
            tempDiv.innerHTML = payslipHTML;
            document.body.appendChild(tempDiv);
            
            // Convert to image and add to PDF
            html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const imgWidth = 190;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Add new page if not the first
                if (index > 0) {
                    doc.addPage();
                }
                
                // Add the image to PDF
                doc.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
                
                // Clean up
                document.body.removeChild(tempDiv);
                
                // Update progress
                currentPage++;
                Utils.showToast(`Generating PDF (${currentPage}/${this.currentPayslips.length})...`, 'info');
                
                // Process next payslip
                setTimeout(() => {
                    addPayslipToPDF(index + 1);
                }, 500);
                
            }).catch(error => {
                console.error('Error generating payslip PDF:', error);
                document.body.removeChild(tempDiv);
                addPayslipToPDF(index + 1);
            });
        };
        
        // Start the process
        addPayslipToPDF(0);
    }

    static printAllPayslips() {
        if (!this.currentPayslips.length) {
            Utils.showToast('No payslips available', 'warning');
            return;
        }

        // Create print window with all payslips
        const printWindow = window.open('', '_blank');
        let printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>All Payslips</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    @media print {
                        body { margin: 0; padding: 20px; }
                        .payslip-border { border: 2px solid #000 !important; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
                        @page { margin: 20mm; }
                    }
                    body { font-family: Arial, sans-serif; background: white; }
                    .payslip-border { border: 2px solid #28a745; padding: 20px; max-width: 800px; margin: 0 auto 30px auto; background: white; }
                    .no-print { display: none !important; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="text-center mb-4">All Payslips</h1>
                    <p class="text-center text-muted mb-5">Generated on ${new Date().toLocaleDateString()}</p>
        `;
        
        // Add each payslip
        this.currentPayslips.forEach((item, index) => {
            const monthDetails = {
                year: item.year,
                monthName: item.monthName,
                monthIdx: ["January","February","March","April","May","June",
                          "July","August","September","October","November","December"]
                         .indexOf(item.monthName)
            };
            
            const settings = StateManager.getSettings();
            const payslipHTML = this.getPayslipHTML(item.employee, item.payrollData, monthDetails, settings);
            
            printContent += `
                <div class="mb-5">
                    <h4 class="mb-3">Payslip ${index + 1} of ${this.currentPayslips.length}: ${item.employee.name}</h4>
                    ${payslipHTML}
                </div>
                ${index < this.currentPayslips.length - 1 ? '<div style="page-break-after: always;"></div>' : ''}
            `;
        });
        
        printContent += `
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
    }

    // Helper method to generate payslip HTML for PDF/Print
    static getPayslipHTML(employee, payrollData, monthDetails, settings) {
        // Calculate NSSF split
        const nssfTotal = payrollData.nssf || 0;
        const nssfEmployee = Math.round(nssfTotal / 2);
        const nssfEmployer = Math.round(nssfTotal / 2);
        
        // Calculate gross pay
        const grossPay = payrollData.basic + (payrollData.benefits || 0) + (payrollData.quarters || 0);
        const totalEmployeeDeductions = (payrollData.paye || 0) + nssfEmployee + (payrollData.shif || 0) + (payrollData.ahl || 0);
        
        return `
            <div class="payslip-border" style="border: 2px solid #28a745; padding: 20px; max-width: 800px; margin: 0 auto; background: white;">
                <!-- Header -->
                <div style="border-bottom: 2px solid #28a745; padding-bottom: 15px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="color: #28a745; margin: 0; font-weight: 800;">${settings.name.toUpperCase()}</h3>
                            <p style="margin: 0; font-size: 12px; color: #6c757d;">${settings.address || 'Nairobi, Kenya'}</p>
                            <p style="margin: 0; font-size: 12px; color: #6c757d;">PIN: ${settings.pin}</p>
                        </div>
                        ${settings.logo ? `<img src="${settings.logo}" style="max-height: 70px; max-width: 150px;">` : ''}
                    </div>
                </div>
                
                <!-- Employee and Payment Details -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
                    <div>
                        <p style="margin: 0 0 5px 0;"><b>Employee:</b> ${employee.name}</p>
                        <p style="margin: 0 0 5px 0;"><b>KRA PIN:</b> ${employee.pin}</p>
                        ${employee.employeeId ? `<p style="margin: 0 0 5px 0;"><b>Employee ID:</b> ${employee.employeeId}</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0 0 5px 0;"><b>Pay Period:</b> ${monthDetails.monthName} ${monthDetails.year}</p>
                        <p style="margin: 0 0 5px 0;"><b>Payment Date:</b> ${new Date().toLocaleDateString('en-KE')}</p>
                        <p style="margin: 0;"><b>Status:</b> PAID</p>
                    </div>
                </div>
                
                <!-- Earnings and Deductions -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <!-- Earnings -->
                    <div>
                        <h6 style="border-bottom: 1px solid #28a745; padding-bottom: 5px; margin-bottom: 10px; color: #28a745; font-weight: bold;">EARNINGS</h6>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Basic Pay</span>
                            <span>KES ${payrollData.basic.toLocaleString()}</span>
                        </div>
                        ${payrollData.benefits > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Benefits</span>
                            <span>KES ${payrollData.benefits.toLocaleString()}</span>
                        </div>` : ''}
                        ${payrollData.quarters > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Quarters</span>
                            <span>KES ${payrollData.quarters.toLocaleString()}</span>
                        </div>` : ''}
                        <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px; margin-top: 5px;">
                            <span>Gross Pay</span>
                            <span>KES ${grossPay.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <!-- Deductions -->
                    <div>
                        <h6 style="border-bottom: 1px solid #dc3545; padding-bottom: 5px; margin-bottom: 10px; color: #dc3545; font-weight: bold;">DEDUCTIONS</h6>
                        ${payrollData.paye > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>PAYE (Tax)</span>
                            <span>KES ${payrollData.paye.toLocaleString()}</span>
                        </div>` : ''}
                        ${nssfEmployee > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>NSSF - Employee</span>
                            <span>KES ${nssfEmployee.toLocaleString()}</span>
                        </div>` : ''}
                        ${nssfEmployer > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>NSSF - Employer</span>
                            <span>KES ${nssfEmployer.toLocaleString()}</span>
                        </div>` : ''}
                        ${payrollData.shif > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>SHIF</span>
                            <span>KES ${payrollData.shif.toLocaleString()}</span>
                        </div>` : ''}
                        ${payrollData.ahl > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Housing Levy</span>
                            <span>KES ${payrollData.ahl.toLocaleString()}</span>
                        </div>` : ''}
                        <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px; margin-top: 5px;">
                            <span>Total Deductions</span>
                            <span>KES ${totalEmployeeDeductions.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <!-- NSSF Split Summary -->
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <h6 style="color: #28a745; font-weight: bold; margin-bottom: 10px;">NSSF CONTRIBUTION SPLIT</h6>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div style="text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d;">Employee Share (50%)</p>
                            <p style="margin: 0; font-size: 16px; font-weight: bold;">KES ${nssfEmployee.toLocaleString()}</p>
                        </div>
                        <div style="text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d;">Employer Share (50%)</p>
                            <p style="margin: 0; font-size: 16px; font-weight: bold;">KES ${nssfEmployer.toLocaleString()}</p>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6;">
                        <p style="margin: 0; font-size: 14px; font-weight: bold;">
                            Total NSSF: KES ${nssfTotal.toLocaleString()}
                        </p>
                    </div>
                </div>
                
                <!-- Net Pay -->
                <div style="text-align: center; background: #28a745; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                    <h5 style="margin: 0 0 10px 0;">NET PAY</h5>
                    <h1 style="margin: 0; font-weight: 800;">KES ${payrollData.net?.toLocaleString() || '0'}.00</h1>
                    <p style="margin: 10px 0 0 0; font-size: 14px; font-style: italic;">
                        ${Utils.numberToWords ? Utils.numberToWords(payrollData.net || 0) : this.numberToWords(payrollData.net || 0)}
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
                    <p style="margin: 0;">This is a computer-generated payslip. No signature required for digital records.</p>
                    <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        `;
    }

    // Helper method for number to words conversion
    static numberToWords(num) {
        if (num === 0) return 'zero shillings';
        
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        
        let words = '';
        
        // Handle thousands
        if (Math.floor(num / 1000) > 0) {
            words += this.numberToWords(Math.floor(num / 1000)) + ' thousand ';
            num %= 1000;
        }
        
        // Handle hundreds
        if (Math.floor(num / 100) > 0) {
            words += ones[Math.floor(num / 100)] + ' hundred ';
            num %= 100;
        }
        
        // Handle tens and ones
        if (num > 0) {
            if (num < 10) {
                words += ones[num];
            } else if (num < 20) {
                words += teens[num - 10];
            } else {
                words += tens[Math.floor(num / 10)];
                if (num % 10 > 0) {
                    words += ' ' + ones[num % 10];
                }
            }
        }
        
        return words.trim() + ' shillings only';
    }
}