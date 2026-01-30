class BackupManager {
    static BACKUP_KEY = 'payroll_backups';
    static MAX_BACKUPS = 10;

    static async createAutoBackup() {
        try {
            const timestamp = new Date().toISOString();
            const employees = StateManager.getEmployees();
            const payrolls = StateManager.getPayrolls();
            const settings = StateManager.getSettings();

            const backup = {
                id: `backup_${Date.now()}`,
                timestamp,
                data: {
                    employees: employees,
                    payrolls: payrolls,
                    settings: settings
                },
                size: JSON.stringify(employees).length +
                    JSON.stringify(payrolls).length +
                    JSON.stringify(settings).length,
                summary: {
                    employeeCount: employees.length,
                    payrollCount: Object.keys(payrolls).length,
                    companyName: settings.name || 'Unknown Company'
                }
            };

            const backups = JSON.parse(localStorage.getItem(this.BACKUP_KEY) || '[]');
            backups.unshift(backup); // Add to beginning

            // Keep only recent backups
            if (backups.length > this.MAX_BACKUPS) {
                backups.splice(this.MAX_BACKUPS);
            }

            localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups));

            // Show detailed success notification
            const backupTime = new Date(backup.timestamp).toLocaleTimeString();
            Utils.showToast(
                `✅ Backup created successfully!<br>
            <small>${backup.summary.employeeCount} employees, ${backup.summary.payrollCount} payrolls<br>
            Saved at ${backupTime}</small>`,
                'success',
                4000 // Show for 4 seconds
            );

            console.log('Backup created:', backup);
            return backup;

        } catch (error) {
            console.error('Backup failed:', error);
            Utils.showToast(
                '❌ Backup failed!<br><small>Please try again</small>',
                'error',
                3000
            );
            throw error;
        }
    }

    static getBackups() {
        return JSON.parse(localStorage.getItem(this.BACKUP_KEY) || '[]');
    }

    static restoreBackup(backupId) {
        const backups = this.getBackups();
        const backup = backups.find(b => b.id === backupId);

        if (!backup) {
            Utils.showToast('Backup not found', 'error');
            return false;
        }

        if (confirm(`Restore backup from ${new Date(backup.timestamp).toLocaleString()}?`)) {
            // Restore all data
            localStorage.setItem('gen_employees', JSON.stringify(backup.data.employees));
            localStorage.setItem('gen_payrolls', JSON.stringify(backup.data.payrolls));
            localStorage.setItem('gen_settings', JSON.stringify(backup.data.settings));

            Utils.showToast('Backup restored successfully! Page will reload.', 'success');
            setTimeout(() => location.reload(), 1500);
            return true;
        }
        return false;
    }
}