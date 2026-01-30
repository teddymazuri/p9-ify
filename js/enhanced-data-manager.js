class EnhancedDataManager {
    static SCHEMA_VERSION = '1.0.0';
    
    static exportWithOptions() {
        const modalContent = `
            <div class="modal fade" id="exportOptionsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Export Options</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Include:</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="exportEmployees" checked>
                                    <label class="form-check-label" for="exportEmployees">
                                        Employees (${StateManager.getEmployees().length})
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="exportPayrolls" checked>
                                    <label class="form-check-label" for="exportPayrolls">
                                        Payroll Records (${Object.keys(StateManager.getPayrolls()).length})
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="exportSettings" checked>
                                    <label class="form-check-label" for="exportSettings">
                                        Company Settings
                                    </label>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Format:</label>
                                <select class="form-select" id="exportFormat">
                                    <option value="json">JSON (Recommended)</option>
                                    <option value="csv">CSV - Employees Only</option>
                                    <option value="excel">Excel - Summary Report</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">File Name:</label>
                                <input type="text" class="form-control" id="exportFileName" 
                                       value="payroll_export_${new Date().toISOString().slice(0, 10)}">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="EnhancedDataManager.processExport()">
                                Export Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = modalContent;
        const modal = new bootstrap.Modal(document.getElementById('exportOptionsModal'));
        modal.show();
    }
    
    static processExport() {
        const includeEmployees = document.getElementById('exportEmployees').checked;
        const includePayrolls = document.getElementById('exportPayrolls').checked;
        const includeSettings = document.getElementById('exportSettings').checked;
        const format = document.getElementById('exportFormat').value;
        const fileName = document.getElementById('exportFileName').value || 'export';
        
        const data = {
            metadata: {
                exportedAt: new Date().toISOString(),
                schemaVersion: this.SCHEMA_VERSION,
                appName: 'Payroll Management System',
                counts: {
                    employees: includeEmployees ? StateManager.getEmployees().length : 0,
                    payrolls: includePayrolls ? Object.keys(StateManager.getPayrolls()).length : 0
                }
            }
        };
        
        if (includeEmployees) data.employees = StateManager.getEmployees();
        if (includePayrolls) data.payrolls = StateManager.getPayrolls();
        if (includeSettings) data.settings = StateManager.getSettings();
        
        let finalFileName, content, mimeType;
        
        switch(format) {
            case 'json':
                finalFileName = `${fileName}.json`;
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
                Utils.downloadJSON(data, finalFileName);
                break;
                
            case 'csv':
                // Convert employees to CSV
                const employees = StateManager.getEmployees();
                const headers = ['Name', 'KRA PIN', 'Employee ID', 'National ID', 'Date Added'];
                const csvContent = [
                    headers.join(','),
                    ...employees.map(emp => [
                        `"${emp.name}"`,
                        `"${emp.pin}"`,
                        `"${emp.employeeId || ''}"`,
                        `"${emp.nationalId || ''}"`,
                        `"${new Date(emp.createdAt).toLocaleDateString()}"`
                    ].join(','))
                ].join('\n');
                
                finalFileName = `${fileName}_employees.csv`;
                content = csvContent;
                mimeType = 'text/csv';
                Utils.downloadText(content, finalFileName, mimeType);
                break;
                
            case 'excel':
                // Create HTML table for Excel
                const html = this.generateExcelReport(data);
                finalFileName = `${fileName}.html`;
                content = html;
                mimeType = 'text/html';
                Utils.downloadText(content, finalFileName, mimeType);
                break;
        }
        
        bootstrap.Modal.getInstance(document.getElementById('exportOptionsModal')).hide();
        Utils.showToast(`Data exported as ${format.toUpperCase()}`, 'success');
    }
}