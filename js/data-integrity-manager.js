class DataIntegrityManager {
    static async validateData() {
        const issues = [];
        
        // Check employees
        const employees = StateManager.getEmployees();
        employees.forEach((emp, index) => {
            if (!emp.name || emp.name.trim() === '') {
                issues.push({ type: 'employee', id: emp.id, issue: 'Missing name', severity: 'high' });
            }
            if (!emp.pin || emp.pin.trim() === '') {
                issues.push({ type: 'employee', id: emp.id, issue: 'Missing KRA PIN', severity: 'high' });
            }
            // Check for duplicates
            const duplicates = employees.filter(e => 
                e.pin === emp.pin && e.id !== emp.id
            );
            if (duplicates.length > 0) {
                issues.push({ type: 'employee', id: emp.id, issue: 'Duplicate KRA PIN', severity: 'medium' });
            }
        });
        
        // Check payrolls
        const payrolls = StateManager.getPayrolls();
        Object.keys(payrolls).forEach(key => {
            const [year, month, employeeId] = key.split('-');
            const payroll = payrolls[key];
            
            // Check if employee exists
            const employee = employees.find(e => e.id == employeeId);
            if (!employee) {
                issues.push({ type: 'payroll', key, issue: 'Orphaned payroll (employee not found)', severity: 'medium' });
            }
            
            // Validate payroll amounts
            if (payroll.basic < 0) {
                issues.push({ type: 'payroll', key, issue: 'Negative basic pay', severity: 'low' });
            }
        });
        
        return issues;
    }
    
    static async repairData() {
        if (!confirm('Run data repair? This will fix common data issues.')) return;
        
        const employees = StateManager.getEmployees();
        const payrolls = StateManager.getPayrolls();
        let fixedCount = 0;
        
        // Fix employee data
        const updatedEmployees = employees.map(emp => {
            const updated = { ...emp };
            let changed = false;
            
            // Trim whitespace
            if (emp.name !== emp.name?.trim()) {
                updated.name = emp.name.trim();
                changed = true;
            }
            if (emp.pin !== emp.pin?.trim()?.toUpperCase()) {
                updated.pin = emp.pin.trim().toUpperCase();
                changed = true;
            }
            
            if (changed) fixedCount++;
            return updated;
        });
        
        // Fix payroll data
        const updatedPayrolls = { ...payrolls };
        Object.keys(payrolls).forEach(key => {
            const payroll = payrolls[key];
            const employee = employees.find(e => e.id == key.split('-')[2]);
            
            if (!employee) {
                // Remove orphaned payrolls
                delete updatedPayrolls[key];
                fixedCount++;
            }
        });
        
        if (fixedCount > 0) {
            StateManager.saveEmployees(updatedEmployees);
            StateManager.savePayrolls(updatedPayrolls);
            Utils.showToast(`Fixed ${fixedCount} data issues`, 'success');
            return true;
        } else {
            Utils.showToast('No issues found', 'info');
            return false;
        }
    }
}