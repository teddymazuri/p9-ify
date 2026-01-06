class EmployeeManager {
    constructor() {
        this.employees = StateManager.getEmployees();
        this.initEvents();
    }

    initEvents() {
        StateManager.on('employeesUpdated', (employees) => {
            this.employees = employees;
            this.renderTable();
        });
    }

    renderTable(containerId = 'employees-table') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = this.employees.map(emp => `
            <tr>
                <td class="ps-4 fw-bold">${emp.name}</td>
                <td><code>${emp.pin}</code></td>
                <td class="small">${emp.employeeId || 'N/A'}</td>
                <td class="small">${emp.nationalId || 'N/A'}</td>
                <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-success me-1" onclick="EmployeeManager.viewEmployee(${emp.id})">
                        View
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="EmployeeManager.editEmployee(${emp.id})">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-link text-danger" onclick="EmployeeManager.deleteEmployee(${emp.id})">
                        Remove
                    </button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = html || '<tr><td colspan="5" class="text-center py-4 text-muted">No employees added yet.</td></tr>';
    }

    static addEmployee(name, pin, employeeId = '', nationalId = '') {
        if (!name || !pin) {
            alert('Please enter at least name and KRA PIN');
            return false;
        }

        // Validate National ID format (Kenyan: 8 digits)
        if (nationalId && !/^\d{8}$/.test(nationalId)) {
            alert('National ID must be 8 digits');
            return false;
        }

        const employees = StateManager.getEmployees();
        employees.push({
            id: Date.now(),
            name: name.trim(),
            pin: pin.trim().toUpperCase(),
            employeeId: employeeId.trim(),
            nationalId: nationalId.trim(),
            createdAt: new Date().toISOString()
        });
        
        StateManager.saveEmployees(employees);
        Utils.showToast('Employee added successfully', 'success');
        return true;
    }

    static updateEmployee(id, updates) {
        let employees = StateManager.getEmployees();
        const index = employees.findIndex(e => e.id == id);
        
        if (index === -1) {
            Utils.showToast('Employee not found', 'error');
            return false;
        }

        // Validate National ID if provided
        if (updates.nationalId && !/^\d{8}$/.test(updates.nationalId)) {
            alert('National ID must be 8 digits');
            return false;
        }

        employees[index] = { ...employees[index], ...updates };
        StateManager.saveEmployees(employees);
        Utils.showToast('Employee updated successfully', 'success');
        return true;
    }

    static deleteEmployee(id) {
        if (!confirm('Delete this employee? This will also remove their payroll history.')) return;

        let employees = StateManager.getEmployees();
        employees = employees.filter(e => e.id !== id);
        StateManager.saveEmployees(employees);
        
        // Clean up payroll records for this employee
        const payrolls = StateManager.getPayrolls();
        const newPayrolls = {};
        Object.keys(payrolls).forEach(key => {
            if (!key.endsWith(`-${id}`)) {
                newPayrolls[key] = payrolls[key];
            }
        });
        StateManager.savePayrolls(newPayrolls);
        
        Utils.showToast('Employee deleted', 'success');
    }

    static viewEmployee(id) {
        const employee = StateManager.getEmployees().find(e => e.id == id);
        if (!employee) return;

        const modalContent = `
            <div class="modal fade" id="employeeModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${employee.name} - Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-header bg-light">
                                            <h6 class="mb-0">Personal Information</h6>
                                        </div>
                                        <div class="card-body">
                                            <p class="mb-2"><strong>Full Name:</strong> ${employee.name}</p>
                                            <p class="mb-2"><strong>KRA PIN:</strong> <code>${employee.pin}</code></p>
                                            ${employee.employeeId ? `<p class="mb-2"><strong>Employee ID:</strong> ${employee.employeeId}</p>` : ''}
                                            ${employee.nationalId ? `<p class="mb-2"><strong>National ID:</strong> ${employee.nationalId}</p>` : ''}
                                            ${employee.createdAt ? `<p class="mb-0"><strong>Added On:</strong> ${new Date(employee.createdAt).toLocaleDateString('en-KE')}</p>` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-header bg-light">
                                            <h6 class="mb-0">Quick Actions</h6>
                                        </div>
                                        <div class="card-body d-grid gap-2">
                                            <button class="btn btn-outline-success" onclick="EmployeeManager.editEmployee(${employee.id}); bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();">
                                                ✏️ Edit Employee
                                            </button>
                                            <button class="btn btn-outline-primary" onclick="PayrollManager.viewPayslip(${employee.id}); bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();">
                                                💰 View Latest Payslip
                                            </button>
                                            <button class="btn btn-outline-info" onclick="P9Generator.generateForEmployee(${employee.id}); bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();">
                                                📄 Generate P9
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <h6 class="border-bottom pb-2 mb-3">Payroll History</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Basic Pay</th>
                                            <th>Gross Pay</th>
                                            <th>PAYE</th>
                                            <th>Net Pay</th>
                                        </tr>
                                    </thead>
                                    <tbody id="employee-history">
                                        <!-- Will be populated by separate function -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-success" onclick="EmployeeManager.exportEmployeeData(${employee.id})">
                                Export Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').innerHTML = modalContent;
        const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
        modal.show();
        
        // Load history
        this.loadEmployeeHistory(id);
    }

    static editEmployee(id) {
        const employee = StateManager.getEmployees().find(e => e.id == id);
        if (!employee) return;

        const modalContent = `
            <div class="modal fade" id="editEmployeeModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Employee</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editEmployeeForm" class="row g-3">
                                <div class="col-12">
                                    <label class="form-label small fw-bold">Full Name *</label>
                                    <input type="text" id="editEmpName" class="form-control" value="${employee.name}" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold">KRA PIN *</label>
                                    <input type="text" id="editEmpPin" class="form-control" value="${employee.pin}" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold">Employee ID (Optional)</label>
                                    <input type="text" id="editEmpEmployeeId" class="form-control" value="${employee.employeeId || ''}" placeholder="e.g., EMP001">
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold">National ID (Optional)</label>
                                    <input type="text" id="editEmpNationalId" class="form-control" value="${employee.nationalId || ''}" placeholder="8 digits">
                                    <div class="form-text">Format: 8 digits (e.g., 12345678)</div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="EmployeeManager.saveEmployeeEdit(${employee.id})">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').innerHTML = modalContent;
        const modal = new bootstrap.Modal(document.getElementById('editEmployeeModal'));
        modal.show();
    }

    static saveEmployeeEdit(id) {
        const name = document.getElementById('editEmpName').value;
        const pin = document.getElementById('editEmpPin').value;
        const employeeId = document.getElementById('editEmpEmployeeId').value;
        const nationalId = document.getElementById('editEmpNationalId').value;

        const updates = {
            name: name.trim(),
            pin: pin.trim().toUpperCase(),
            employeeId: employeeId.trim(),
            nationalId: nationalId.trim(),
            updatedAt: new Date().toISOString()
        };

        if (this.updateEmployee(id, updates)) {
            bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal')).hide();
            new EmployeeManager().renderTable();
        }
    }

    static loadEmployeeHistory(employeeId) {
        const payrolls = StateManager.getPayrolls();
        const history = [];
        
        Object.keys(payrolls).forEach(key => {
            if (key.endsWith(`-${employeeId}`)) {
                const [year, month] = key.split('-');
                const data = payrolls[key];
                history.push({
                    month: `${month} ${year}`,
                    data: data,
                    gross: data.basic + (data.benefits || 0) + (data.quarters || 0)
                });
            }
        });

        // Sort by date (newest first)
        history.sort((a, b) => {
            const months = ["January", "February", "March", "April", "May", "June", 
                          "July", "August", "September", "October", "November", "December"];
            const aMonth = months.indexOf(a.month.split(' ')[0]);
            const aYear = parseInt(a.month.split(' ')[1]);
            const bMonth = months.indexOf(b.month.split(' ')[0]);
            const bYear = parseInt(b.month.split(' ')[1]);
            
            if (bYear !== aYear) return bYear - aYear;
            return bMonth - aMonth;
        });

        const tbody = document.getElementById('employee-history');
        if (!tbody) return;

        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No payroll records found</td></tr>';
            return;
        }

        tbody.innerHTML = history.map(record => `
            <tr>
                <td>${record.month}</td>
                <td>KES ${record.data.basic?.toLocaleString() || 0}</td>
                <td>KES ${record.gross.toLocaleString()}</td>
                <td>KES ${record.data.paye?.toLocaleString() || 0}</td>
                <td class="fw-bold">KES ${record.data.net?.toLocaleString() || 0}</td>
            </tr>
        `).join('');
    }

    static exportEmployeeData(employeeId) {
        const employee = StateManager.getEmployees().find(e => e.id == employeeId);
        if (!employee) return;

        const payrolls = StateManager.getPayrolls();
        const payrollHistory = [];
        
        Object.keys(payrolls).forEach(key => {
            if (key.endsWith(`-${employeeId}`)) {
                const [year, month] = key.split('-');
                payrollHistory.push({
                    month: `${month} ${year}`,
                    ...payrolls[key]
                });
            }
        });

        const data = {
            employee: employee,
            payrollHistory: payrollHistory,
            exportedAt: new Date().toISOString(),
            totals: {
                totalEarnings: payrollHistory.reduce((sum, p) => sum + (p.basic || 0), 0),
                totalPAYE: payrollHistory.reduce((sum, p) => sum + (p.paye || 0), 0),
                totalNet: payrollHistory.reduce((sum, p) => sum + (p.net || 0), 0)
            }
        };

        const filename = `Employee-${employee.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
        Utils.downloadJSON(data, filename);
        Utils.showToast('Employee data exported', 'success');
    }

    // Render the employee management UI
    static renderUI(containerId = 'tab-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const employeeCount = StateManager.getEmployees().length;
        
        container.innerHTML = `
            <div class="card p-4 mb-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="fw-bold m-0">Add Employee</h4>
                    <span class="badge bg-success">${employeeCount} employees</span>
                </div>
                <form id="employeeForm" class="row g-3">
                    <div class="col-md-6 col-lg-3">
                        <label class="form-label small fw-bold">Full Name *</label>
                        <input type="text" id="empName" class="form-control" placeholder="John Doe" required>
                    </div>
                    <div class="col-md-6 col-lg-2">
                        <label class="form-label small fw-bold">KRA PIN *</label>
                        <input type="text" id="empPin" class="form-control" placeholder="A123456789X" required>
                        <div class="form-text">Format: Letter + 9 digits + Letter</div>
                    </div>
                    <div class="col-md-6 col-lg-2">
                        <label class="form-label small fw-bold">Employee ID</label>
                        <input type="text" id="empEmployeeId" class="form-control" placeholder="EMP001">
                        <div class="form-text">Optional</div>
                    </div>
                    <div class="col-md-6 col-lg-2">
                        <label class="form-label small fw-bold">National ID</label>
                        <input type="text" id="empNationalId" class="form-control" placeholder="12345678" maxlength="8">
                        <div class="form-text">8 digits, optional</div>
                    </div>
                    <div class="col-md-12 col-lg-3 d-flex align-items-end">
                        <button type="submit" class="btn btn-primary w-100">
                            <span class="me-2">+</span> Add Employee
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="card p-0 overflow-hidden">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Employee Register</h5>
                    <div class="small text-muted">
                        Showing ${employeeCount} employee${employeeCount !== 1 ? 's' : ''}
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th class="ps-4">Name</th>
                                <th>KRA PIN</th>
                                <th>Emp ID</th>
                                <th>National ID</th>
                                <th class="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="employees-table"></tbody>
                    </table>
                </div>
                ${employeeCount > 0 ? `
                <div class="card-footer bg-light">
                    <div class="row">
                        <div class="col-md-6">
                            <button class="btn btn-sm btn-outline-secondary" onclick="EmployeeManager.exportAllEmployees()">
                                📥 Export All Employees
                            </button>
                        </div>
                        <div class="col-md-6 text-end">
                            <div class="form-check form-switch d-inline-block me-3">
                                <input class="form-check-input" type="checkbox" id="showEmptyFields" checked onchange="EmployeeManager.toggleEmptyFields()">
                                <label class="form-check-label small" for="showEmptyFields">Show empty fields</label>
                            </div>
                        </div>
                    </div>
                </div>` : ''}
            </div>
        `;

        // Initialize form submission
        document.getElementById('employeeForm').onsubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('empName').value;
            const pin = document.getElementById('empPin').value;
            const employeeId = document.getElementById('empEmployeeId').value;
            const nationalId = document.getElementById('empNationalId').value;
            
            if (EmployeeManager.addEmployee(name, pin, employeeId, nationalId)) {
                this.reset();
                // Focus back on name field for next entry
                document.getElementById('empName').focus();
            }
        };

        // Render the table
        new EmployeeManager().renderTable();
    }

    static toggleEmptyFields() {
        const showEmpty = document.getElementById('showEmptyFields').checked;
        const rows = document.querySelectorAll('#employees-table tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                const empIdCell = cells[2];
                const nationalIdCell = cells[3];
                
                if (!showEmpty) {
                    empIdCell.style.opacity = empIdCell.textContent === 'N/A' ? '0.5' : '1';
                    nationalIdCell.style.opacity = nationalIdCell.textContent === 'N/A' ? '0.5' : '1';
                } else {
                    empIdCell.style.opacity = '1';
                    nationalIdCell.style.opacity = '1';
                }
            }
        });
    }

    static exportAllEmployees() {
        const employees = StateManager.getEmployees();
        const data = {
            employees: employees,
            exportDate: new Date().toISOString(),
            count: employees.length
        };
        
        const filename = `Employees-Export-${new Date().toISOString().slice(0, 10)}.json`;
        Utils.downloadJSON(data, filename);
        Utils.showToast(`${employees.length} employees exported`, 'success');
    }
}