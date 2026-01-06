class PayrollManager {
    constructor() {
        this.currentMonth = StateManager.getCurrentMonthDetails();
        this.initEvents();
    }

    initEvents() {
        StateManager.on('payrollsUpdated', () => this.renderPayrollTable());
        StateManager.on('employeesUpdated', () => this.renderPayrollTable());
    }

    static calculatePayroll(basic, employeeId = null, monthDetails = null) {
        const settings = StateManager.getSettings();
        const rates = settings.rates;
        
        // Convert to numbers
        basic = parseFloat(basic) || 0;
        
        // Calculate statutory deductions
        const shif = Math.round(basic * (rates.shif / 100));
        const ahl = Math.round(basic * (rates.ahl / 100));
        const nssf = Math.min(basic * (rates.nssf / 100), 2160); // NSSF cap
        
        // Calculate taxable income
        let taxable = basic - nssf - shif - ahl;
        taxable += (rates.benefits || 0) + (rates.quarters || 0);
        
        // Calculate PAYE (Kenyan tax brackets 2024)
        let tax = 0;
        if (taxable > 24000) {
            tax = (taxable - 24000) * 0.30; // 30% for amounts above 24,000
        }
        
        // Apply reliefs
        const paye = Math.max(0, Math.round(tax - rates.personalRelief - rates.insRelief));
        const net = basic - shif - ahl - nssf - paye;
        
        const result = {
            basic,
            shif,
            ahl,
            nssf,
            paye,
            net,
            benefits: rates.benefits,
            quarters: rates.quarters,
            relief: rates.personalRelief,
            insRelief: rates.insRelief,
            taxable,
            gross: basic + rates.benefits + rates.quarters,
            totalDeductions: shif + ahl + nssf + paye,
            calculatedAt: new Date().toISOString()
        };
        
        // Save if employee and month details provided
        if (employeeId && monthDetails) {
            StateManager.savePayrollRecord(
                employeeId,
                monthDetails.year,
                monthDetails.monthName,
                result
            );
        }
        
        return result;
    }

    renderPayrollTable(containerId = 'tab-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const monthDetails = this.currentMonth;
        const employees = StateManager.getEmployees();
        const payrolls = StateManager.getPayrolls();
        
        // Count payslips for current month
        const payslipCount = Object.keys(payrolls).filter(key => 
            key.startsWith(`${monthDetails.year}-${monthDetails.monthName}`)
        ).length;
        
        container.innerHTML = `
            <div class="card p-4">
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h4 class="fw-bold m-0">Monthly Payroll</h4>
                        <p class="small text-muted m-0">Enter values for the selected cycle. Data is auto-saved.</p>
                    </div>
                    <div class="d-flex gap-3 align-items-center">
                        <div class="d-flex gap-2 align-items-center bg-light p-2 rounded border">
                            <label class="small fw-bold text-success mb-0 me-1">Payroll Month:</label>
                            <input type="month" id="payMonthCycle" class="form-control form-control-sm w-auto fw-bold" 
                                   value="${monthDetails.inputValue}" onchange="PayrollManager.changeMonth(this.value)">
                        </div>
                        <button class="btn btn-success btn-sm" onclick="PayrollManager.showAddPayslipModal()">
                            + Add Payslip
                        </button>
                    </div>
                </div>
                
                <div class="alert alert-info d-flex align-items-center mb-3" role="alert">
                    <i class="bi bi-info-circle me-2"></i>
                    <div class="small">
                        <strong>${monthDetails.monthName} ${monthDetails.year}</strong> • 
                        ${payslipCount} payslip${payslipCount !== 1 ? 's' : ''} generated • 
                        Click "Payslip" to view or print
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table align-middle">
                        <thead class="table-light small text-uppercase">
                            <tr>
                                <th>Employee</th>
                                <th>Basic Pay</th>
                                <th>NSSF</th>
                                <th>SHIF</th>
                                <th>Housing Levy</th>
                                <th>PAYE</th>
                                <th>Net Pay</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="payroll-entries">
                            ${this.generatePayrollRows(employees, monthDetails)}
                        </tbody>
                        ${this.generatePayrollFooter(employees, monthDetails)}
                    </table>
                </div>
            </div>
        `;

        // Add payslip list if there are payslips
        if (payslipCount > 0) {
            this.renderPayslipList(monthDetails);
        }
    }

    generatePayrollRows(employees, monthDetails) {
        if (employees.length === 0) {
            return '<tr><td colspan="8" class="text-center py-4 text-muted">No employees added yet.</td></tr>';
        }

        return employees.map(emp => {
            const record = StateManager.getPayrollRecord(
                emp.id,
                monthDetails.year,
                monthDetails.monthName
            ) || { basic: 0, nssf: 0, shif: 0, ahl: 0, paye: 0, net: 0 };
            
            return `
                <tr data-employee-id="${emp.id}">
                    <td>
                        <div class="fw-bold small">${emp.name}</div>
                        <div class="small text-muted">${emp.employeeId || emp.pin}</div>
                    </td>
                    <td>
                        <input type="number" 
                               class="form-control form-control-sm payroll-input" 
                               style="width:110px" 
                               value="${record.basic}"
                               data-employee-id="${emp.id}"
                               onchange="PayrollManager.updatePayroll(${emp.id}, this.value)">
                    </td>
                    <td>${record.nssf.toLocaleString()}</td>
                    <td>${record.shif.toLocaleString()}</td>
                    <td>${record.ahl.toLocaleString()}</td>
                    <td>${record.paye.toLocaleString()}</td>
                    <td class="fw-bold">${record.net.toLocaleString()}</td>
                    <td class="text-end">
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-success" 
                                    onclick="PayrollManager.viewPayslip(${emp.id})"
                                    ${record.basic === 0 ? 'disabled' : ''}>
                                <span class="me-1">📄</span> Payslip
                            </button>
                            <button class="btn btn-outline-primary" 
                                    onclick="PayrollManager.generatePayslip(${emp.id})"
                                    ${record.basic === 0 ? 'disabled' : ''}>
                                <span class="me-1">🖨️</span> Print
                            </button>
                            <button class="btn btn-outline-warning" 
                                    onclick="PayrollManager.editPayslip('${emp.id}', '${monthDetails.year}', '${monthDetails.monthName}')"
                                    ${record.basic === 0 ? 'disabled' : ''}>
                                <span class="me-1">✏️</span> Edit
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    generatePayrollFooter(employees, monthDetails) {
        const totals = employees.reduce((acc, emp) => {
            const record = StateManager.getPayrollRecord(
                emp.id,
                monthDetails.year,
                monthDetails.monthName
            ) || { basic: 0, nssf: 0, shif: 0, ahl: 0, paye: 0, net: 0 };
            
            acc.basic += record.basic;
            acc.nssf += record.nssf;
            acc.shif += record.shif;
            acc.ahl += record.ahl;
            acc.paye += record.paye;
            acc.net += record.net;
            return acc;
        }, { basic: 0, nssf: 0, shif: 0, ahl: 0, paye: 0, net: 0 });
        
        return `
            <tfoot class="table-light fw-bold">
                <tr>
                    <td>Totals</td>
                    <td>${totals.basic.toLocaleString()}</td>
                    <td>${totals.nssf.toLocaleString()}</td>
                    <td>${totals.shif.toLocaleString()}</td>
                    <td>${totals.ahl.toLocaleString()}</td>
                    <td>${totals.paye.toLocaleString()}</td>
                    <td>${totals.net.toLocaleString()}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-success" onclick="PayrollManager.generateAllPayslips()"
                                ${totals.basic === 0 ? 'disabled' : ''}>
                            Generate All Payslips
                        </button>
                    </td>
                </tr>
            </tfoot>
        `;
    }

    renderPayslipList(monthDetails) {
        const container = document.getElementById('tab-content');
        const payrolls = StateManager.getPayrolls();
        const employees = StateManager.getEmployees();
        
        const currentMonthPayslips = Object.keys(payrolls)
            .filter(key => key.startsWith(`${monthDetails.year}-${monthDetails.monthName}`))
            .map(key => {
                const employeeId = key.split('-').pop();
                const employee = employees.find(e => e.id == employeeId);
                return { key, employee, data: payrolls[key] };
            })
            .filter(ps => ps.employee && ps.data.basic > 0);
        
        if (currentMonthPayslips.length === 0) return;
        
        const payslipListHTML = `
            <div class="card p-4 mt-4">
                <h5 class="fw-bold mb-3">Generated Payslips - ${monthDetails.monthName} ${monthDetails.year}</h5>
                <div class="row g-3">
                    ${currentMonthPayslips.map(ps => `
                        <div class="col-md-6 col-lg-4">
                            <div class="card border border-success border-2">
                                <div class="card-body">
                                    <h6 class="card-title fw-bold">${ps.employee.name}</h6>
                                    <p class="card-text small mb-1">
                                        <span class="text-muted">Basic:</span> 
                                        <strong>KES ${ps.data.basic.toLocaleString()}</strong>
                                    </p>
                                    <p class="card-text small mb-1">
                                        <span class="text-muted">Net Pay:</span> 
                                        <strong>KES ${ps.data.net.toLocaleString()}</strong>
                                    </p>
                                    <p class="card-text small mb-3">
                                        <span class="text-muted">PAYE:</span> 
                                        <strong>KES ${ps.data.paye.toLocaleString()}</strong>
                                    </p>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-sm btn-success flex-fill" 
                                                onclick="PayrollManager.viewPayslip(${ps.employee.id})">
                                            View
                                        </button>
                                        <button class="btn btn-sm btn-warning" 
                                                onclick="PayrollManager.editPayslip('${ps.employee.id}', '${monthDetails.year}', '${monthDetails.monthName}')">
                                            Edit
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" 
                                                onclick="PayrollManager.deletePayslip('${ps.key}')">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', payslipListHTML);
    }

    static changeMonth(monthValue) {
        const [year, month] = monthValue.split('-');
        const months = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
        
        const payrollManager = new PayrollManager();
        payrollManager.currentMonth = {
            year,
            monthIdx: parseInt(month) - 1,
            monthName: months[parseInt(month) - 1],
            inputValue: monthValue
        };
        
        payrollManager.renderPayrollTable();
    }

    static updatePayroll(employeeId, basicAmount) {
        const payrollManager = new PayrollManager();
        const result = PayrollManager.calculatePayroll(
            basicAmount,
            employeeId,
            payrollManager.currentMonth
        );
        
        Utils.showToast('Payroll updated successfully', 'success');
        
        // Update the row immediately
        const input = document.querySelector(`input[data-employee-id="${employeeId}"]`);
        if (input) {
            const row = input.closest('tr');
            row.cells[2].textContent = result.nssf.toLocaleString();
            row.cells[3].textContent = result.shif.toLocaleString();
            row.cells[4].textContent = result.ahl.toLocaleString();
            row.cells[5].textContent = result.paye.toLocaleString();
            row.cells[6].textContent = result.net.toLocaleString();
            
            // Enable/disable buttons based on basic pay
            const viewBtn = row.querySelector('button.btn-outline-success');
            const printBtn = row.querySelector('button.btn-outline-primary');
            const editBtn = row.querySelector('button.btn-outline-warning');
            if (basicAmount > 0) {
                viewBtn.disabled = false;
                printBtn.disabled = false;
                editBtn.disabled = false;
            } else {
                viewBtn.disabled = true;
                printBtn.disabled = true;
                editBtn.disabled = true;
            }
        }
        
        // Update totals
        payrollManager.renderPayrollTable();
    }

    static showAddPayslipModal() {
        const employees = StateManager.getEmployees();
        if (employees.length === 0) {
            Utils.showToast('Please add employees first', 'warning');
            return;
        }
        
        const modalContent = `
            <div class="modal fade" id="addPayslipModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New Payslip</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addPayslipForm">
                                <div class="mb-3">
                                    <label class="form-label small fw-bold">Select Employee</label>
                                    <select id="payslipEmployee" class="form-select" required>
                                        <option value="">Choose employee...</option>
                                        ${employees.map(emp => `
                                            <option value="${emp.id}">
                                                ${emp.name} (${emp.employeeId || emp.pin})
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small fw-bold">Payroll Month</label>
                                    <input type="month" id="payslipMonth" class="form-control" 
                                           value="${new Date().toISOString().slice(0, 7)}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small fw-bold">Basic Pay (KES)</label>
                                    <input type="number" id="payslipBasic" class="form-control" 
                                           placeholder="Enter basic salary" required>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <label class="form-label small fw-bold">Benefits (KES)</label>
                                        <input type="number" id="payslipBenefits" class="form-control" 
                                               value="${StateManager.getSettings().rates.benefits}">
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small fw-bold">Quarters (KES)</label>
                                        <input type="number" id="payslipQuarters" class="form-control" 
                                               value="${StateManager.getSettings().rates.quarters}">
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="PayrollManager.createPayslip()">
                                Create Payslip
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').innerHTML = modalContent;
        const modal = new bootstrap.Modal(document.getElementById('addPayslipModal'));
        modal.show();
    }

    static createPayslip() {
        const employeeId = document.getElementById('payslipEmployee').value;
        const monthValue = document.getElementById('payslipMonth').value;
        const basic = parseFloat(document.getElementById('payslipBasic').value) || 0;
        const benefits = parseFloat(document.getElementById('payslipBenefits').value) || 0;
        const quarters = parseFloat(document.getElementById('payslipQuarters').value) || 0;
        
        if (!employeeId || !monthValue || basic <= 0) {
            Utils.showToast('Please fill all required fields with valid values', 'error');
            return;
        }
        
        const [year, month] = monthValue.split('-');
        const months = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
        const monthName = months[parseInt(month) - 1];
        
        // Update settings with custom benefits and quarters for this calculation
        const settings = StateManager.getSettings();
        const originalBenefits = settings.rates.benefits;
        const originalQuarters = settings.rates.quarters;
        
        settings.rates.benefits = benefits;
        settings.rates.quarters = quarters;
        StateManager.saveSettings(settings);
        
        // Calculate payroll
        const monthDetails = { year, monthName, monthIdx: parseInt(month) - 1, inputValue: monthValue };
        const result = PayrollManager.calculatePayroll(basic, employeeId, monthDetails);
        
        // Restore original settings
        settings.rates.benefits = originalBenefits;
        settings.rates.quarters = originalQuarters;
        StateManager.saveSettings(settings);
        
        Utils.showToast('Payslip created successfully', 'success');
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('addPayslipModal')).hide();
        
        // If viewing same month, refresh table
        const currentMonth = new PayrollManager().currentMonth;
        if (year === currentMonth.year && monthName === currentMonth.monthName) {
            new PayrollManager().renderPayrollTable();
        }
        
        // Show the payslip
        setTimeout(() => {
            PayrollManager.viewPayslip(employeeId, monthDetails);
        }, 500);
    }

    static viewPayslip(employeeId, customMonthDetails = null) {
        const payrollManager = customMonthDetails ? { currentMonth: customMonthDetails } : new PayrollManager();
        const employee = StateManager.getEmployees().find(e => e.id == employeeId);
        
        if (!employee) {
            Utils.showToast('Employee not found', 'error');
            return;
        }

        const record = StateManager.getPayrollRecord(
            employeeId,
            payrollManager.currentMonth.year,
            payrollManager.currentMonth.monthName
        );

        if (!record || record.basic === 0) {
            Utils.showToast('No payroll data found for this employee', 'warning');
            return;
        }

        // Create and show payslip modal
        this.generatePayslipModal(employee, record, payrollManager.currentMonth);
    }

    static generatePayslipModal(employee, payrollData, monthDetails) {
        // Calculate totals
        const grossPay = payrollData.basic + (payrollData.benefits || 0) + (payrollData.quarters || 0);
        const totalDeductions = (payrollData.nssf || 0) + (payrollData.shif || 0) + 
                               (payrollData.ahl || 0) + (payrollData.paye || 0);
        
        const modalContent = `
            <div class="modal fade" id="payslipModal" tabindex="-1" aria-labelledby="payslipModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="payslipModalLabel">Payslip - ${monthDetails.monthName} ${monthDetails.year}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Payslip Content -->
                            <div class="payslip-container" id="payslip-content">
                                <div class="text-center mb-4">
                                    <h4 class="fw-bold">PAYSLIP</h4>
                                    <p class="text-muted mb-1">For the month of ${monthDetails.monthName} ${monthDetails.year}</p>
                                </div>
                                
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <div class="card border-0 bg-light">
                                            <div class="card-body">
                                                <h6 class="card-title fw-bold">EMPLOYEE DETAILS</h6>
                                                <p class="mb-1"><strong>Name:</strong> ${employee.name}</p>
                                                <p class="mb-1"><strong>Employee ID:</strong> ${employee.employeeId || employee.pin || 'N/A'}</p>
                                                <p class="mb-1"><strong>KRA PIN:</strong> ${employee.pin || 'N/A'}</p>
                                                <p class="mb-1"><strong>ID Number:</strong> ${employee.idNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="card border-0 bg-light">
                                            <div class="card-body">
                                                <h6 class="card-title fw-bold">PAYMENT SUMMARY</h6>
                                                <p class="mb-1"><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
                                                <p class="mb-1"><strong>Pay Period:</strong> ${monthDetails.monthName} ${monthDetails.year}</p>
                                                <p class="mb-1"><strong>Net Pay:</strong> KES ${payrollData.net?.toLocaleString() || '0'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Earnings -->
                                <div class="table-responsive mb-4">
                                    <table class="table table-bordered">
                                        <thead class="table-light">
                                            <tr>
                                                <th colspan="2" class="bg-success text-white">EARNINGS</th>
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
                                        <thead class="table-light">
                                            <tr>
                                                <th colspan="2" class="bg-danger text-white">DEDUCTIONS</th>
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
                                            <tr class="table-danger">
                                                <td><strong>TOTAL DEDUCTIONS</strong></td>
                                                <td class="text-end"><strong>${totalDeductions.toLocaleString()}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <!-- Net Pay Summary -->
                                <div class="row">
                                    <div class="col-md-8 offset-md-4">
                                        <div class="card border-success">
                                            <div class="card-body text-center">
                                                <h5 class="card-title text-success">NET PAY</h5>
                                                <h2 class="fw-bold text-success">KES ${payrollData.net?.toLocaleString() || '0'}</h2>
                                                <p class="text-muted mb-0">Amount payable to employee</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Footer -->
                                <div class="mt-4 pt-4 border-top text-center text-muted small">
                                    <p class="mb-1">This is a computer-generated payslip. No signature required.</p>
                                    <p class="mb-0">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="PayrollManager.printPayslip()">
                                <i class="bi bi-printer me-1"></i> Print
                            </button>
                            <button type="button" class="btn btn-success" onclick="PayrollManager.downloadPayslip(${employee.id}, '${monthDetails.year}', '${monthDetails.monthName}')">
                                <i class="bi bi-download me-1"></i> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.getElementById('modal-container').innerHTML = modalContent;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('payslipModal'));
        modal.show();
    }

    static printPayslip() {
        // Store original body content
        const originalBody = document.body.innerHTML;
        
        // Get payslip content
        const payslipContent = document.getElementById('payslip-content').outerHTML;
        
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
                        .payslip-container { border: 2px solid #000; padding: 20px; }
                        table { page-break-inside: avoid; }
                        h2, h4, h5 { page-break-after: avoid; }
                    }
                    body { font-family: Arial, sans-serif; }
                    .payslip-container { border: 2px solid #000; padding: 20px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${payslipContent}
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
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('payslipModal')).hide();
    }

    static downloadPayslip(employeeId, year, monthName) {
        const employee = StateManager.getEmployees().find(e => e.id == employeeId);
        const record = StateManager.getPayrollRecord(employeeId, year, monthName);
        
        if (!employee || !record) {
            Utils.showToast('Payslip data not found', 'error');
            return;
        }

        // Get payslip content
        const payslipContent = document.getElementById('payslip-content').outerHTML;
        
        // Create a temporary element for html2pdf
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip - ${employee.name} - ${monthName} ${year}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .payslip-container { border: 2px solid #000; padding: 20px; }
                    table { width: 100%; margin-bottom: 20px; }
                    h2, h4, h5 { margin-bottom: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${payslipContent}
                </div>
            </body>
            </html>
        `;
        
        // Use html2pdf if available
        if (typeof html2pdf !== 'undefined') {
            html2pdf()
                .from(tempDiv)
                .set({
                    margin: 10,
                    filename: `Payslip_${employee.name}_${monthName}_${year}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                })
                .save();
        } else {
            // Fallback to print if html2pdf not available
            alert('PDF library not loaded. Opening print view instead.');
            this.printPayslip();
        }
        
        Utils.showToast('Payslip download started', 'success');
    }

    // Update the generatePayslip method to use our new modal
    static generatePayslip(employeeId) {
        const payrollManager = new PayrollManager();
        const employee = StateManager.getEmployees().find(e => e.id == employeeId);
        
        if (!employee) return;

        const record = StateManager.getPayrollRecord(
            employeeId,
            payrollManager.currentMonth.year,
            payrollManager.currentMonth.monthName
        );

        if (!record || record.basic === 0) {
            Utils.showToast('Please enter basic pay for this employee first', 'warning');
            return;
        }

        // Show the payslip modal first
        this.generatePayslipModal(employee, record, payrollManager.currentMonth);
    }

    // Also update the processAllPayslips to use the new method
    static processAllPayslips() {
        const payrollManager = new PayrollManager();
        const employees = StateManager.getEmployees();
        
        bootstrap.Modal.getInstance(document.getElementById('generateAllModal')).hide();
        
        // Filter employees with payroll data
        const employeesWithData = employees.filter(emp => {
            const record = StateManager.getPayrollRecord(
                emp.id,
                payrollManager.currentMonth.year,
                payrollManager.currentMonth.monthName
            );
            return record && record.basic > 0;
        });
        
        if (employeesWithData.length === 0) {
            Utils.showToast('No employees with payroll data', 'warning');
            return;
        }
        
        Utils.showToast(`Generating ${employeesWithData.length} payslips...`, 'info');
        
        // Generate payslips one by one with delay
        employeesWithData.forEach((emp, index) => {
            setTimeout(() => {
                const record = StateManager.getPayrollRecord(
                    emp.id,
                    payrollManager.currentMonth.year,
                    payrollManager.currentMonth.monthName
                );
                
                // Show modal for each payslip
                this.generatePayslipModal(emp, record, payrollManager.currentMonth);
                
                if (index === employeesWithData.length - 1) {
                    setTimeout(() => {
                        Utils.showToast(`Generated ${employeesWithData.length} payslips`, 'success');
                    }, 1000);
                }
            }, index * 2000); // Increased delay to allow viewing each
        });
    }

    static deletePayslip(payrollKey) {
        if (!confirm('Delete this payslip? This action cannot be undone.')) return;
        
        const payrolls = StateManager.getPayrolls();
        delete payrolls[payrollKey];
        StateManager.savePayrolls(payrolls);
        
        Utils.showToast('Payslip deleted', 'success');
        
        // Refresh the table
        new PayrollManager().renderPayrollTable();
    }

    // Render the payroll UI
    static renderUI(containerId = 'tab-content') {
        const payrollManager = new PayrollManager();
        payrollManager.renderPayrollTable(containerId);
    }
}