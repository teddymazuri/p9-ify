class P9ifyApp {
    constructor() {
        this.currentTab = 'employees';
        this.init();
    }

    init() {
        // Load initial tab from URL hash or default
        const hash = window.location.hash.replace('#', '');
        if (hash && ['employees', 'payroll', 'p9', 'payslips', 'settings'].includes(hash)) {
            this.currentTab = hash;
        }
        
        this.switchTab(this.currentTab);
        
        // Initialize sidebar active state
        this.updateSidebar();
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash) {
                this.switchTab(hash);
            }
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        window.location.hash = tabName;
        
        // Update UI
        this.updateSidebar();
        
        // Load appropriate content
        switch(tabName) {
            case 'employees':
                EmployeeManager.renderUI();
                break;
            case 'payroll':
                PayrollManager.renderUI();
                break;
            case 'p9':
                P9Generator.renderUI();
                break;
            case 'payslips':
                this.renderPayslipsUI();
                break;
            case 'settings':
                SettingsManager.renderUI();
                break;
            default:
                EmployeeManager.renderUI();
        }
    }

    updateSidebar() {
        document.querySelectorAll('#sidebar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.textContent.toLowerCase().includes(this.currentTab)) {
                link.classList.add('active');
            }
        });
    }

    renderPayslipsUI() {
        const container = document.getElementById('tab-content');
        if (!container) return;

        const employees = StateManager.getEmployees();
        const payrolls = StateManager.getPayrolls();
        
        console.log('Raw payroll data:', payrolls); // Debug log
        
        // Get unique years from payroll data
        const years = this.extractUniqueYears(payrolls);
        
        console.log('Extracted years:', years); // Debug log
        
        // Collect all payslips
        const allPayslips = [];
        
        // Loop through all payroll entries
        Object.keys(payrolls).forEach(key => {
            const payroll = payrolls[key];
            
            // Skip if no basic pay
            if (!payroll || payroll.basic <= 0) return;
            
            console.log(`Processing payroll key: ${key}`); // Debug log
            
            // Extract employee ID from key - handle different formats
            let employeeId = null;
            let year = null;
            let month = null;
            let monthName = null;
            
            // Parse the key: format is "2026-January-1767685807816"
            const parts = key.split('-');
            
            // Handle "2026-January-1767685807816" format
            if (parts.length === 3) {
                // First part should be year
                if (parts[0].length === 4 && !isNaN(parts[0])) {
                    year = parseInt(parts[0]);
                    monthName = parts[1]; // "January"
                    employeeId = parts[2]; // "1767685807816"
                    
                    // Convert month name to number
                    month = this.getMonthNumberFromName(monthName);
                    
                    console.log(`Parsed key ${key}: year=${year}, month=${month} (${monthName}), employeeId=${employeeId}`);
                }
            }
            
            // If parsing from key failed, try to get from payroll data
            if (!year && payroll.year) {
                year = parseInt(payroll.year);
            }
            if (!month && payroll.month) {
                month = parseInt(payroll.month);
            } else if (!month && payroll.monthName) {
                month = this.getMonthNumberFromName(payroll.monthName);
                monthName = payroll.monthName;
            }
            
            // If we still don't have employeeId, check payroll data
            if (!employeeId && payroll.employeeId) {
                employeeId = payroll.employeeId.toString();
            }
            
            // Skip if we don't have required data
            if (!employeeId || !year || !month) {
                console.warn(`Could not parse payroll key: ${key}`, {
                    employeeId, 
                    year, 
                    month,
                    monthName,
                    parts: parts,
                    payrollData: payroll
                });
                return;
            }
            
            // Find employee name
            const employee = employees.find(emp => 
                emp.id === employeeId || 
                emp.id.toString() === employeeId.toString()
            );
            if (!employee) {
                console.warn(`Employee not found for ID: ${employeeId}`, {employees});
                return;
            }
            
            // Use monthName if we have it, otherwise get from month number
            const displayMonthName = monthName || this.getMonthName(month);
            
            // Add to payslips
            allPayslips.push({
                employee: employee.name,
                employeeId: employee.id,
                employeeObj: employee,
                month: `${displayMonthName} ${year}`,
                monthName: displayMonthName,
                year: year,
                monthNumber: month,
                data: payroll,
                key: key
            });
        });

        console.log('All payslips collected:', allPayslips); // Debug log

        // Sort by year and month (descending)
        allPayslips.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.monthNumber - a.monthNumber;
        });

        container.innerHTML = `
            <div class="card p-4">
                <h4 class="fw-bold mb-4">Generated Payslips</h4>
                
                <!-- Filter Controls -->
                <div class="row mb-4 g-3">
                    <div class="col-md-4">
                        <label class="form-label">Filter by Employee</label>
                        <select id="employeeFilter" class="form-select" onchange="window.p9ifyApp.filterPayslips()">
                            <option value="all">All Employees</option>
                            ${employees.map(emp => `
                                <option value="${emp.id}">${emp.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Filter by Year</label>
                        <select id="yearFilter" class="form-select" onchange="window.p9ifyApp.filterPayslips()">
                            <option value="all">All Years</option>
                            ${years.map(year => `
                                <option value="${year}">${year}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="col-md-4 d-flex align-items-end">
                        <button class="btn btn-outline-secondary w-100" onclick="window.p9ifyApp.clearFilters()">
                            Clear Filters
                        </button>
                    </div>
                </div>
                
                <!-- Payslips Table -->
                <div id="payslips-container">
                    ${allPayslips.length === 0 ? 
                        '<p class="text-muted text-center py-4">No payslips generated yet. Add payroll data first.</p>' :
                        this.renderFilteredPayslips(allPayslips)
                    }
                </div>
            </div>
        `;
        
        // Store the current payslips data for filtering
        this.currentPayslipsData = allPayslips;
    }

    getMonthNumberFromName(monthName) {
        if (!monthName) return null;
        
        const monthNames = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12
        };
        
        return monthNames[monthName.toLowerCase()] || null;
    }

    getMonthName(monthNumber) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNumber - 1] || `Month ${monthNumber}`;
    }

    extractUniqueYears(payrolls) {
        const years = new Set();
        Object.keys(payrolls).forEach(key => {
            const payroll = payrolls[key];
            
            // Try to get year from key first (format: "2026-January-1767685807816")
            const parts = key.split('-');
            if (parts.length >= 1 && parts[0].length === 4 && !isNaN(parts[0])) {
                years.add(parseInt(parts[0]));
            }
            
            // Also check payroll data for year
            if (payroll && payroll.year) {
                years.add(parseInt(payroll.year));
            }
        });
        
        const yearArray = Array.from(years).filter(y => y && !isNaN(y) && y > 2000 && y < 2100);
        return yearArray.sort((a, b) => b - a); // Sort descending
    }

    renderFilteredPayslips(payslips) {
        if (payslips.length === 0) {
            return '<p class="text-muted text-center py-4">No payslips found matching the selected filters.</p>';
        }

        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Month</th>
                            <th>Gross Pay</th>
                            <th>Net Pay</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payslips.map(slip => `
                            <tr>
                                <td>${slip.employee}</td>
                                <td>${slip.month}</td>
                                <td>KES ${slip.data.gross?.toLocaleString() || slip.data.basic?.toLocaleString() || '0'}</td>
                                <td>KES ${slip.data.net?.toLocaleString() || '0'}</td>
                                <td class="text-end">
                                    <button class="btn btn-sm btn-outline-success" 
                                            onclick="P9ifyApp.previewPayslip('${slip.key}')">
                                        <i class="bi bi-eye me-1"></i> Preview
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary ms-1" 
                                            onclick="P9ifyApp.downloadPayslipPDF('${slip.key}')">
                                        <i class="bi bi-file-pdf me-1"></i> PDF
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning ms-1" 
                                            onclick="window.printPayslip('${slip.key}')">
                                        <i class="bi bi-printer me-1"></i> Print
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    filterPayslips() {
        if (!this.currentPayslipsData || this.currentPayslipsData.length === 0) {
            console.log('No payslips data available to filter');
            return;
        }

        const employeeFilter = document.getElementById('employeeFilter');
        const yearFilter = document.getElementById('yearFilter');
        
        if (!employeeFilter || !yearFilter) {
            console.error('Filter elements not found');
            return;
        }
        
        const selectedEmployee = employeeFilter.value;
        const selectedYear = yearFilter.value;

        console.log('Filtering with:', {selectedEmployee, selectedYear, dataCount: this.currentPayslipsData.length});

        let filtered = this.currentPayslipsData;

        // Apply employee filter
        if (selectedEmployee !== 'all') {
            filtered = filtered.filter(slip => {
                const matches = slip.employeeId.toString() === selectedEmployee.toString();
                console.log(`Employee filter: ${slip.employeeId} === ${selectedEmployee} = ${matches}`, slip);
                return matches;
            });
        }

        // Apply year filter
        if (selectedYear !== 'all') {
            const year = parseInt(selectedYear);
            filtered = filtered.filter(slip => {
                const matches = slip.year === year;
                console.log(`Year filter: ${slip.year} === ${year} = ${matches}`, slip);
                return matches;
            });
        }

        console.log('Filtered results:', filtered);

        // Update the table
        const container = document.getElementById('payslips-container');
        if (container) {
            container.innerHTML = this.renderFilteredPayslips(filtered);
        }
    }

    clearFilters() {
        const employeeFilter = document.getElementById('employeeFilter');
        const yearFilter = document.getElementById('yearFilter');
        
        if (employeeFilter) employeeFilter.value = 'all';
        if (yearFilter) yearFilter.value = 'all';
        
        this.filterPayslips();
    }

    static previewPayslip(payrollKey) {
        const [year, monthName, employeeId] = payrollKey.split('-');
        const employee = StateManager.getEmployees().find(e => e.id == employeeId);
        const payrollData = StateManager.getPayrolls()[payrollKey];
        
        if (!employee || !payrollData) {
            Utils.showToast('Payslip data not found', 'error');
            return;
        }

        // Generate payslip content
        const settings = StateManager.getSettings();
        const grossPay = payrollData.basic + (payrollData.benefits || 0) + (payrollData.quarters || 0);
        const totalDeductions = (payrollData.nssf || 0) + (payrollData.shif || 0) + 
                               (payrollData.ahl || 0) + (payrollData.paye || 0);
        
        const payslipHTML = `
            <div class="payslip-container" id="payslip-preview-${payrollKey}">
                <style>
                    .payslip-container { 
                        max-width: 800px; 
                        margin: 0 auto; 
                        background: white; 
                        padding: 25px;
                        border: 2px solid #15803d;
                        border-radius: 8px;
                    }
                    .payslip-header { 
                        border-bottom: 2px solid #15803d; 
                        padding-bottom: 15px; 
                        margin-bottom: 20px;
                    }
                    .company-logo { max-height: 70px; max-width: 150px; }
                    .amount-big { font-size: 2rem; font-weight: 800; }
                    .text-company { color: #14532d; font-weight: 700; }
                    .border-success { border-color: #15803d !important; }
                    .bg-light-green { background-color: #f0fdf4 !important; }
                    @media print {
                        .no-print { display: none !important; }
                        .payslip-container { border: none; padding: 0; }
                    }
                </style>
                
                <div class="payslip-header">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h3 class="text-company mb-1">${settings.name}</h3>
                            <p class="text-muted small mb-1">${settings.address || ''}</p>
                            <p class="text-muted small mb-0">PIN: ${settings.pin}</p>
                        </div>
                        ${settings.logo ? `<img src="${settings.logo}" class="company-logo">` : ''}
                    </div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card border-success mb-3">
                            <div class="card-header bg-success text-white py-2">
                                <strong>Employee Details</strong>
                            </div>
                            <div class="card-body">
                                <p class="mb-1"><strong>Name:</strong> ${employee.name}</p>
                                <p class="mb-1"><strong>Employee ID:</strong> ${employee.employeeId || employee.pin || 'N/A'}</p>
                                <p class="mb-1"><strong>KRA PIN:</strong> ${employee.pin}</p>
                                ${employee.nationalId ? `<p class="mb-0"><strong>National ID:</strong> ${employee.nationalId}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card border-success mb-3">
                            <div class="card-header bg-success text-white py-2">
                                <strong>Payment Details</strong>
                            </div>
                            <div class="card-body">
                                <p class="mb-1"><strong>Pay Period:</strong> ${monthName} ${year}</p>
                                <p class="mb-1"><strong>Payment Date:</strong> ${new Date().toLocaleDateString('en-KE')}</p>
                                <p class="mb-0"><strong>Payslip ID:</strong> ${payrollKey}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Earnings -->
                <div class="table-responsive mb-4">
                    <table class="table table-bordered">
                        <thead class="bg-light-green">
                            <tr>
                                <th colspan="2" class="text-center border-success">
                                    <strong class="text-company">EARNINGS</strong>
                                </th>
                            </tr>
                            <tr>
                                <th width="80%">Description</th>
                                <th width="20%" class="text-end">Amount (KES)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Basic Salary</td>
                                <td class="text-end">${payrollData.basic.toLocaleString()}</td>
                            </tr>
                            ${payrollData.benefits ? `
                            <tr>
                                <td>Benefits</td>
                                <td class="text-end">${payrollData.benefits.toLocaleString()}</td>
                            </tr>
                            ` : ''}
                            ${payrollData.quarters ? `
                            <tr>
                                <td>Quarters Allowance</td>
                                <td class="text-end">${payrollData.quarters.toLocaleString()}</td>
                            </tr>
                            ` : ''}
                            <tr class="table-success">
                                <td><strong>TOTAL GROSS PAY</strong></td>
                                <td class="text-end"><strong>${grossPay.toLocaleString()}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Deductions -->
                <div class="table-responsive mb-4">
                    <table class="table table-bordered">
                        <thead class="bg-light-green">
                            <tr>
                                <th colspan="2" class="text-center border-success">
                                    <strong class="text-company">DEDUCTIONS</strong>
                                </th>
                            </tr>
                            <tr>
                                <th width="80%">Description</th>
                                <th width="20%" class="text-end">Amount (KES)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>NSSF Contribution</td>
                                <td class="text-end">${(payrollData.nssf || 0).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td>SHIF Contribution</td>
                                <td class="text-end">${(payrollData.shif || 0).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td>Affordable Housing Levy</td>
                                <td class="text-end">${(payrollData.ahl || 0).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td>PAYE Tax</td>
                                <td class="text-end">${(payrollData.paye || 0).toLocaleString()}</td>
                            </tr>
                            <tr class="table-success">
                                <td><strong>TOTAL DEDUCTIONS</strong></td>
                                <td class="text-end"><strong>${totalDeductions.toLocaleString()}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Net Pay -->
                <div class="text-center p-4 bg-light-green border border-success rounded">
                    <h5 class="text-muted mb-2">NET PAY</h5>
                    <h1 class="amount-big text-success">KES ${payrollData.net?.toLocaleString() || '0'}</h1>
                    <p class="text-muted mb-0">
                        <em>${Utils.numberToWords(payrollData.net || 0)}</em>
                    </p>
                </div>
                
                <!-- Signatures -->
                <div class="row mt-4 pt-4 border-top">
                    <div class="col-6">
                        <div class="text-center">
                            <div style="border-bottom: 1px solid #000; width: 200px; height: 40px; margin: 0 auto 10px;"></div>
                            <p class="small mb-0">Employee's Signature</p>
                            <p class="small text-muted">Date: ________________</p>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="text-center">
                            <div style="border-bottom: 1px solid #000; width: 200px; height: 40px; margin: 0 auto 10px;"></div>
                            <p class="small mb-0">Authorized Signatory</p>
                            <p class="small text-muted">For: ${settings.name}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="mt-4 text-center">
                    <p class="small text-muted mb-0">
                        Generated by P9-ify | ${new Date().toLocaleString('en-KE')}
                    </p>
                </div>
            </div>
        `;

        // Create modal
        const modalId = 'payslip-modal-' + payrollKey;
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" style="--bs-modal-width: 900px;">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Payslip Preview - ${employee.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${payslipHTML}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="P9ifyApp.printPayslip('${payrollKey}')">
                                <i class="bi bi-printer me-1"></i> Print
                            </button>
                            <button type="button" class="btn btn-success" onclick="P9ifyApp.downloadPayslipPDF('${payrollKey}')">
                                <i class="bi bi-file-pdf me-1"></i> Download PDF
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

    static printPayslip(payrollKey) {
        // Store original body content
        const originalBody = document.body.innerHTML;
        
        // Get payslip content
        const payslipElement = document.getElementById(`payslip-preview-${payrollKey}`);
        if (!payslipElement) {
            Utils.showToast('Payslip content not found', 'error');
            return;
        }
        
        const payslipContent = payslipElement.outerHTML;
        
        // Create print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip Print</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    @media print {
                        body { margin: 0; padding: 20px; }
                        .no-print { display: none !important; }
                        .payslip-container { border: 2px solid #000 !important; }
                        table { page-break-inside: avoid; }
                        h1, h2, h3, h4, h5 { page-break-after: avoid; }
                    }
                    body { font-family: Arial, sans-serif; }
                    .payslip-container { 
                        max-width: 800px !important; 
                        margin: 0 auto !important; 
                        padding: 25px !important;
                        border: 2px solid #15803d !important;
                    }
                </style>
            </head>
            <body>
                ${payslipContent}
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
        
        // Close modal if open
        const modal = bootstrap.Modal.getInstance(document.getElementById('payslip-modal-' + payrollKey));
        if (modal) modal.hide();
        
        Utils.showToast('Opening print dialog...', 'info');
    }

    static downloadPayslipPDF(payrollKey) {
        const [year, monthName, employeeId] = payrollKey.split('-');
        const employee = StateManager.getEmployees().find(e => e.id == employeeId);
        
        if (!employee) {
            Utils.showToast('Employee data not found', 'error');
            return;
        }

        // Get payslip content
        const payslipElement = document.getElementById(`payslip-preview-${payrollKey}`);
        if (!payslipElement) {
            // If modal is not open, create the content first
            this.previewPayslip(payrollKey);
            setTimeout(() => {
                this.downloadPayslipPDF(payrollKey);
            }, 500);
            return;
        }

        // Clone the element to avoid modifying the original
        const elementToPrint = payslipElement.cloneNode(true);
        
        // Remove any no-print classes
        elementToPrint.querySelectorAll('.no-print').forEach(el => el.remove());
        
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            Utils.showToast('PDF library not loaded. Please check your internet connection.', 'error');
            // Fallback to print
            this.printPayslip(payrollKey);
            return;
        }

        // Configure PDF options
        const options = {
            margin: [10, 10, 10, 10],
            filename: `Payslip_${employee.name.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        // Show loading indicator
        Utils.showToast('Generating PDF...', 'info');
        
        // Generate PDF
        html2pdf()
            .from(elementToPrint)
            .set(options)
            .save()
            .then(() => {
                Utils.showToast('PDF downloaded successfully', 'success');
            })
            .catch((error) => {
                console.error('PDF generation error:', error);
                Utils.showToast('Error generating PDF. Please try printing instead.', 'error');
                // Fallback to print
                this.printPayslip(payrollKey);
            });
    }
}

// Global function for tab switching
function switchTab(tabName) {
    window.p9ifyApp = window.p9ifyApp || new P9ifyApp();
    window.p9ifyApp.switchTab(tabName);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.p9ifyApp = new P9ifyApp();
    
    // Add global print function for backward compatibility
    window.printPayslip = function(payrollKey) {
        P9ifyApp.printPayslip(payrollKey);
    };
});