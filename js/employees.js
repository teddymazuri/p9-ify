class EmployeeManager {
    constructor() {
        this.employees = StateManager.getEmployees();
        this.currentPage = 1;
        this.itemsPerPage = 10; // You can adjust this number
        this.initEvents();
    }

    initEvents() {
        StateManager.on('employeesUpdated', (employees) => {
            this.employees = employees;
            this.currentPage = 1; // Reset to first page on updates
            this.renderTable();
            this.renderPagination();
        });
    }

    renderTable(containerId = 'employees-table') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedEmployees = this.employees.slice(startIndex, endIndex);

        const html = paginatedEmployees.map(emp => `
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

    renderPagination(containerId = 'pagination-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const totalPages = Math.ceil(this.employees.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <nav aria-label="Employee pagination">
                <ul class="pagination justify-content-center mb-0">
        `;

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="EmployeeManager.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
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
                    <button class="page-link" onclick="EmployeeManager.goToPage(1)">1</button>
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
                    <button class="page-link" onclick="EmployeeManager.goToPage(${i})">${i}</button>
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
                    <button class="page-link" onclick="EmployeeManager.goToPage(${totalPages})">${totalPages}</button>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="EmployeeManager.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    &raquo;
                </button>
            </li>
        `;

        paginationHTML += `
                </ul>
            </nav>
        `;

        container.innerHTML = paginationHTML;
    }

    static goToPage(pageNumber) {
        const manager = new EmployeeManager();
        const totalPages = Math.ceil(manager.employees.length / manager.itemsPerPage);
        
        if (pageNumber < 1 || pageNumber > totalPages) return;
        
        manager.currentPage = pageNumber;
        manager.renderTable();
        manager.renderPagination();
    }

    static addEmployee(name, pin, employeeId = '', nationalId = '') {
        if (!name || !pin) {
            alert('Please enter at least name and KRA PIN');
            return false;
        }

        // Validate National ID format (Kenyan: 8 digits)
        if (nationalId && !/^\d{7,8}$/.test(nationalId)) {
            alert('National ID must be 7 or 8 digits');
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
        if (updates.nationalId && !/^\d{7,8}$/.test(updates.nationalId)) {
            alert('National ID must be 7 or 8 digits');
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
        // Clean up any existing modals first
        this.cleanupExistingModals();
        
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
                                            <button class="btn btn-outline-success" onclick="EmployeeManager.closeModalAnd('employeeModal', () => EmployeeManager.editEmployee(${employee.id}))">
                                                ✏️ Edit Employee
                                            </button>
                                            <button class="btn btn-outline-primary" onclick="EmployeeManager.closeModalAnd('employeeModal', () => PayrollManager.viewPayslip(${employee.id}))">
                                                💰 View Latest Payslip
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

        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            console.error('Modal container not found');
            return;
        }
        
        modalContainer.innerHTML = modalContent;
        const modalElement = document.getElementById('employeeModal');
        
        // Set up event listeners for proper cleanup
        modalElement.addEventListener('hidden.bs.modal', function () {
            EmployeeManager.cleanupModal(modalElement);
        });
        
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Load history
        this.loadEmployeeHistory(id);
    }

    static editEmployee(id) {
        // Clean up any existing modals first
        this.cleanupExistingModals();
        
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
                                    <input type="text" id="editEmpNationalId" class="form-control" value="${employee.nationalId || ''}" placeholder="7 or 8 digits">
                                    <div class="form-text">Format: 7 or 8 digits (e.g.,1234567 or 12345678)</div>
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

        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            console.error('Modal container not found');
            return;
        }
        
        modalContainer.innerHTML = modalContent;
        const modalElement = document.getElementById('editEmployeeModal');
        
        // Set up event listeners for proper cleanup
        modalElement.addEventListener('hidden.bs.modal', function () {
            EmployeeManager.cleanupModal(modalElement);
        });
        
        const modal = new bootstrap.Modal(modalElement);
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
            const modalElement = document.getElementById('editEmployeeModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }
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

    // Cleanup helper methods
    static cleanupModal(modalElement) {
        if (!modalElement) return;
        
        // Dispose of the Bootstrap modal instance
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.dispose();
        }
        
        // Remove the modal from DOM after animation completes
        setTimeout(() => {
            if (modalElement && modalElement.parentNode) {
                modalElement.parentNode.removeChild(modalElement);
            }
            
            // Check if there are any other modals open
            const remainingModals = document.querySelectorAll('.modal.show');
            if (remainingModals.length === 0) {
                // Clean up backdrop if no modals are showing
                this.cleanupBackdrop();
            }
        }, 300); // Match Bootstrap's fade animation duration
    }
    
    static cleanupExistingModals() {
        // Close and dispose of any currently open modals
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
                // Let the hidden event handle cleanup
            }
        });
    }
    
    static cleanupBackdrop() {
        // Remove modal backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop && backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }
        
        // Remove modal-open class and inline styles from body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
    
    static closeModalAnd(modalId, callback) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                // Hide the modal first
                modalInstance.hide();
                
                // Set up a one-time event listener for when the modal is fully hidden
                const onHidden = () => {
                    modalElement.removeEventListener('hidden.bs.modal', onHidden);
                    this.cleanupModal(modalElement);
                    
                    // Execute the callback after a short delay to ensure cleanup is complete
                    setTimeout(callback, 100);
                };
                
                modalElement.addEventListener('hidden.bs.modal', onHidden);
                return;
            }
        }
        
        // If modal wasn't found or couldn't be closed, just execute the callback
        callback();
    }

    // Render the employee management UI
    static renderUI(containerId = 'tab-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const employeeCount = StateManager.getEmployees().length;
        const totalPages = Math.ceil(employeeCount / 10); // 10 items per page
        
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
                        <div class="form-text"> 7 or 8 digits, optional</div>
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
                    <div>
                        <h5 class="mb-0">Employee Register</h5>
                        <div class="small text-muted">
                            Showing ${employeeCount} employee${employeeCount !== 1 ? 's' : ''}
                            ${employeeCount > 10 ? `(Page 1 of ${totalPages})` : ''}
                        </div>
                    </div>
                    ${employeeCount > 10 ? `
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-list-columns"></i> Rows per page
                        </button>
                        <ul class="dropdown-menu">
                            <li><button class="dropdown-item ${this.itemsPerPage === 10 ? 'active' : ''}" onclick="EmployeeManager.changeItemsPerPage(10)">10 per page</button></li>
                            <li><button class="dropdown-item ${this.itemsPerPage === 25 ? 'active' : ''}" onclick="EmployeeManager.changeItemsPerPage(25)">25 per page</button></li>
                            <li><button class="dropdown-item ${this.itemsPerPage === 50 ? 'active' : ''}" onclick="EmployeeManager.changeItemsPerPage(50)">50 per page</button></li>
                            <li><button class="dropdown-item ${this.itemsPerPage === 100 ? 'active' : ''}" onclick="EmployeeManager.changeItemsPerPage(100)">100 per page</button></li>
                        </ul>
                    </div>` : ''}
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
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <div class="form-check form-switch d-inline-block me-3">
                                <input class="form-check-input" type="checkbox" id="showEmptyFields" checked onchange="EmployeeManager.toggleEmptyFields()">
                                <label class="form-check-label small" for="showEmptyFields">Show empty fields</label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div id="pagination-container" class="d-flex justify-content-end"></div>
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

        // Render the table and pagination
        const manager = new EmployeeManager();
        manager.renderTable();
        manager.renderPagination();
    }

    static changeItemsPerPage(itemsPerPage) {
        const manager = new EmployeeManager();
        manager.itemsPerPage = itemsPerPage;
        manager.currentPage = 1; // Reset to first page when changing items per page
        manager.renderTable();
        manager.renderPagination();
        
        // Update the display text in the header
        const employeeCount = StateManager.getEmployees().length;
        const totalPages = Math.ceil(employeeCount / itemsPerPage);
        const headerText = document.querySelector('.card-header .small.text-muted');
        if (headerText && employeeCount > itemsPerPage) {
            headerText.textContent = `Showing ${employeeCount} employees (Page 1 of ${totalPages})`;
        }
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
}