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
                month: `${displayMonthName} ${year}`,
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
                                            onclick="PayslipManager.viewExistingPayslip('${slip.key}')">
                                        View
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary ms-1" 
                                            onclick="PayslipManager.downloadPayslip('${slip.key}')">
                                        Download
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
}

// Global function for tab switching
function switchTab(tabName) {
    window.p9ifyApp = window.p9ifyApp || new P9ifyApp();
    window.p9ifyApp.switchTab(tabName);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.p9ifyApp = new P9ifyApp();
});