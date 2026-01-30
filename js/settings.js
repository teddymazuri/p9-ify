class SettingsManager {
    static renderUI(containerId = 'tab-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const settings = StateManager.getSettings();

        container.innerHTML = `
            <div class="row">
                <div class="col-lg-8">
                    <div class="card p-4 mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h4 class="fw-bold m-0">Employer Profile</h4>
                            <button class="btn btn-sm btn-success" onclick="SettingsManager.confirmSettingsUpdate()">
                                <i class="bi bi-check-lg me-1"></i> Save Changes
                            </button>
                        </div>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-bold">Company/Employer Name</label>
                                <input type="text" id="settingName" class="form-control" 
                                        value="${settings.name}" 
                                        oninput="SettingsManager.markAsChanged()">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold">Employer KRA PIN</label>
                                <input type="text" id="settingPin" class="form-control" 
                                        value="${settings.pin}" 
                                        oninput="SettingsManager.markAsChanged()">
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-bold">Employer Physical/Postal Address</label>
                                <input type="text" id="settingAddress" class="form-control" 
                                        value="${settings.address || ''}" 
                                        placeholder="e.g., P.O. Box 1234, Nairobi" 
                                        oninput="SettingsManager.markAsChanged()">
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-bold">Company Logo</label>
                                <div class="input-group">
                                    <input type="file" id="logoUpload" class="form-control" 
                                            accept="image/*" 
                                            onchange="SettingsManager.handleLogoUpload(this)">
                                    <button class="btn btn-outline-danger" type="button" 
                                            onclick="SettingsManager.removeLogo()" 
                                            ${!settings.logo ? 'disabled' : ''}>
                                        Remove
                                    </button>
                                </div>
                                <div id="logoPreviewArea" class="mt-2">
                                    ${settings.logo ? `<img src="${settings.logo}" class="logo-preview rounded border">` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <div class="card p-4 mb-4">
                        <h4 class="fw-bold mb-4">Data Management</h4>
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary" onclick="EnhancedDataManager.exportWithOptions()">
                                📤 Smart Export
                            </button>
                            <button class="btn btn-outline-info" onclick="BackupManager.createAutoBackup()">
                                💾 Create Backup
                            </button>
                            <button class="btn btn-outline-warning" onclick="DataIntegrityManager.repairData()">
                                🔧 Repair Data
                            </button>
                            <button class="btn btn-outline-secondary" onclick="SettingsManager.showBackupManager()">
                                ⏱️ Manage Backups
                            </button>
                            <button class="btn btn-outline-danger" onclick="StateManager.clearAllData()">
                                ⚠️ Reset Everything
                            </button>
                        </div>
                        <div class="mt-3 small text-muted">
                            <p class="mb-1"><b>Current Stats:</b></p>
                            <p class="mb-0">Employees: ${StateManager.getEmployees().length}</p>
                            <p class="mb-0">Payroll Records: ${Object.keys(StateManager.getPayrolls()).length}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card p-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="fw-bold m-0">Default Statutory Rates & Reliefs</h4>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="SettingsManager.resetToDefaults()">
                            Reset to Defaults
                        </button>
                        <button class="btn btn-sm btn-success" onclick="SettingsManager.confirmRatesUpdate()">
                            <i class="bi bi-check-lg me-1"></i> Save Rates
                        </button>
                    </div>
                </div>
                <div class="row g-3">
                    <div class="col-md-3">
                        <label class="small fw-bold">SHIF (%)</label>
                        <input type="number" step="0.01" id="rateSHIF" class="form-control" 
                                value="${settings.rates.shif}" 
                                oninput="SettingsManager.markRatesAsChanged()">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Housing Levy (%)</label>
                        <input type="number" step="0.01" id="rateAHL" class="form-control" 
                                value="${settings.rates.ahl}" 
                                oninput="SettingsManager.markRatesAsChanged()">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">NSSF (%)</label>
                        <input type="number" step="0.01" id="rateNSSF" class="form-control" 
                                value="${settings.rates.nssf}" 
                                oninput="SettingsManager.markRatesAsChanged()">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">NSSF Cap (KES)</label>
                        <input type="number" class="form-control" value="2160" disabled>
                        <small class="text-muted">Fixed by law</small>
                    </div>
                    
                    <div class="col-md-3">
                        <label class="small fw-bold">Personal Relief (KES)</label>
                        <input type="number" id="defaultRelief" class="form-control" 
                                value="${settings.rates.personalRelief}" 
                                oninput="SettingsManager.markRatesAsChanged()">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Insurance Relief (KES)</label>
                        <input type="number" id="defaultInsRelief" class="form-control" 
                                value="${settings.rates.insRelief}" 
                                oninput="SettingsManager.markRatesAsChanged()">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Benefits (KES)</label>
                        <input type="number" id="defaultBenefits" class="form-control" 
                                value="${settings.rates.benefits}" 
                                oninput="SettingsManager.markRatesAsChanged()">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Quarters (KES)</label>
                        <input type="number" id="defaultQuarters" class="form-control" 
                                value="${settings.rates.quarters}" 
                                oninput="SettingsManager.markRatesAsChanged()">
                    </div>
                </div>
                
                <div class="mt-4 pt-3 border-top">
                    <h6 class="fw-bold mb-3">Tax Brackets (Kenya 2024)</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Taxable Income (KES)</th>
                                    <th>Tax Rate</th>
                                    <th>Deduction (KES)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Up to 24,000</td><td>10%</td><td>2,400</td></tr>
                                <tr><td>24,001 - 32,333</td><td>25%</td><td>6,000</td></tr>
                                <tr><td>Above 32,333</td><td>30%</td><td>9,600</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    static markAsChanged() {
        const saveBtn = document.querySelector('button[onclick="SettingsManager.confirmSettingsUpdate()"]');
        if (saveBtn) {
            saveBtn.classList.remove('btn-success');
            saveBtn.classList.add('btn-warning');
            saveBtn.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i> Save Changes';
        }
    }

    static markRatesAsChanged() {
        const saveBtn = document.querySelector('button[onclick="SettingsManager.confirmRatesUpdate()"]');
        if (saveBtn) {
            saveBtn.classList.remove('btn-success');
            saveBtn.classList.add('btn-warning');
            saveBtn.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i> Save Rates';
        }
    }

    static confirmSettingsUpdate() {
        const settings = StateManager.getSettings();

        // Update all fields
        const nameInput = document.getElementById('settingName');
        const pinInput = document.getElementById('settingPin');
        const addressInput = document.getElementById('settingAddress');

        if (nameInput) settings.name = nameInput.value;
        if (pinInput) settings.pin = pinInput.value;
        if (addressInput) settings.address = addressInput.value;

        StateManager.saveSettings(settings);

        // Reset button state
        const saveBtn = document.querySelector('button[onclick="SettingsManager.confirmSettingsUpdate()"]');
        if (saveBtn) {
            saveBtn.classList.remove('btn-warning');
            saveBtn.classList.add('btn-success');
            saveBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Save Changes';
        }

        // Update UI elements that display company name
        document.querySelectorAll('.text-company-name, #company-name').forEach(el => {
            el.textContent = settings.name;
        });

        Utils.showToast('Company profile updated successfully', 'success');
    }

    static confirmRatesUpdate() {
        const settings = StateManager.getSettings();

        // Helper function to parse input safely
        const parseInput = (inputId, defaultValue = 0) => {
            const input = document.getElementById(inputId);
            if (!input || input.value.trim() === '') return defaultValue;
            const parsed = parseFloat(input.value);
            return isNaN(parsed) ? defaultValue : parsed;
        };

        // Update all rates
        settings.rates.shif = parseInput('rateSHIF', 2.75);
        settings.rates.ahl = parseInput('rateAHL', 1.5);
        settings.rates.nssf = parseInput('rateNSSF', 6);
        settings.rates.personalRelief = parseInput('defaultRelief', 2400);
        settings.rates.insRelief = parseInput('defaultInsRelief', 0);
        settings.rates.benefits = parseInput('defaultBenefits', 0);
        settings.rates.quarters = parseInput('defaultQuarters', 0);

        StateManager.saveSettings(settings);

        // Reset button state
        const saveBtn = document.querySelector('button[onclick="SettingsManager.confirmRatesUpdate()"]');
        if (saveBtn) {
            saveBtn.classList.remove('btn-warning');
            saveBtn.classList.add('btn-success');
            saveBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Save Rates';
        }

        Utils.showToast('Statutory rates updated successfully', 'success');
    }

    static resetToDefaults() {
        if (!confirm('Reset all rates to default values?')) return;

        const settings = StateManager.getSettings();
        settings.rates = {
            shif: 2.75,
            ahl: 1.5,
            nssf: 6,
            personalRelief: 2400,
            insRelief: 0,
            benefits: 0,
            quarters: 0
        };

        StateManager.saveSettings(settings);
        this.renderUI();
        Utils.showToast('Rates reset to defaults', 'success');
    }

    static handleLogoUpload(input) {
        if (!input.files[0]) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const settings = StateManager.getSettings();
            settings.logo = e.target.result;
            StateManager.saveSettings(settings);
            SettingsManager.renderUI();
            Utils.showToast('Logo uploaded successfully', 'success');
        };
        reader.readAsDataURL(input.files[0]);
    }

    static removeLogo() {
        const settings = StateManager.getSettings();
        settings.logo = '';
        StateManager.saveSettings(settings);
        SettingsManager.renderUI();
        Utils.showToast('Logo removed successfully', 'success');
    }

    static showBackupManager() {
        const backups = BackupManager.getBackups();

        const modalContent = `
            <div class="modal fade" id="backupManagerModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Backup Manager</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <button class="btn btn-primary btn-sm me-2" onclick="BackupManager.createAutoBackup(); bootstrap.Modal.getInstance(document.getElementById('backupManagerModal')).hide();">
                                    + Create New Backup
                                </button>
                                <button class="btn btn-success btn-sm" onclick="SettingsManager.uploadBackupFile()">
                                    📁 Upload Backup File
                                </button>
                            </div>
                            
                            ${backups.length === 0 ?
                '<div class="alert alert-info">No backups found. Create your first backup to get started.</div>' :
                `<div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Date & Time</th>
                                            <th>Size</th>
                                            <th>Employees</th>
                                            <th>Payrolls</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${backups.map(backup => `
                                            <tr>
                                                <td>${new Date(backup.timestamp).toLocaleString()}</td>
                                                <td>${Math.round(backup.size / 1024)} KB</td>
                                                <td>${backup.data.employees?.length || 0}</td>
                                                <td>${Object.keys(backup.data.payrolls || {}).length}</td>
                                                <td>
                                                    <button class="btn btn-sm btn-success" onclick="BackupManager.restoreBackup('${backup.id}')">
                                                        Restore
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger" 
                                                            onclick="if(confirm('Delete this backup?')) { 
                                                                const backups = BackupManager.getBackups();
                                                                const updated = backups.filter(b => b.id !== '${backup.id}');
                                                                localStorage.setItem('payroll_backups', JSON.stringify(updated));
                                                                location.reload();
                                                            }">
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>`
            }
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modal-container').innerHTML = modalContent;
        const modal = new bootstrap.Modal(document.getElementById('backupManagerModal'));
        modal.show();
    }

    static uploadBackupFile() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';
        fileInput.style.display = 'none';
        
        fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.name.endsWith('.json')) {
                Utils.showToast('Please select a valid JSON file', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    // Validate the backup structure
                    if (!backupData.employees || !backupData.settings || !backupData.payrolls) {
                        Utils.showToast('Invalid backup file structure', 'error');
                        return;
                    }
                    
                    // Ask for confirmation
                    if (confirm('This will overwrite your current data. Are you sure you want to restore from this backup file?')) {
                        // Create a backup entry
                        const newBackup = {
                            id: 'imported_' + Date.now(),
                            timestamp: Date.now(),
                            size: file.size,
                            data: backupData
                        };
                        
                        // Get existing backups
                        const backups = BackupManager.getBackups();
                        backups.unshift(newBackup);
                        
                        // Save to localStorage
                        localStorage.setItem('payroll_backups', JSON.stringify(backups));
                        
                        // Restore the backup
                        BackupManager.restoreBackup(newBackup.id);
                        
                        // Close the modal
                        const modal = bootstrap.Modal.getInstance(document.getElementById('backupManagerModal'));
                        if (modal) modal.hide();
                        
                        Utils.showToast('Backup imported and restored successfully!', 'success');
                    }
                } catch (error) {
                    console.error('Error parsing backup file:', error);
                    Utils.showToast('Error parsing backup file. Please check the file format.', 'error');
                }
            };
            
            reader.onerror = () => {
                Utils.showToast('Error reading file', 'error');
            };
            
            reader.readAsText(file);
        };
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }
}