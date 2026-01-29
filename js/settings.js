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
                            <button class="btn btn-outline-primary" onclick="SettingsManager.exportAllData()">
                                📥 Export All Data
                            </button>
                            <button class="btn btn-outline-secondary" onclick="SettingsManager.importData()">
                                📤 Import Data
                            </button>
                            <button class="btn btn-outline-warning" onclick="SettingsManager.clearPayrollData()">
                                🗑️ Clear Payroll Data
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
        document.querySelector('button[onclick="SettingsManager.confirmSettingsUpdate()"]').classList.remove('btn-success');
        document.querySelector('button[onclick="SettingsManager.confirmSettingsUpdate()"]').classList.add('btn-warning');
        document.querySelector('button[onclick="SettingsManager.confirmSettingsUpdate()"]').innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i> Save Changes';
    }

    static markRatesAsChanged() {
        document.querySelector('button[onclick="SettingsManager.confirmRatesUpdate()"]').classList.remove('btn-success');
        document.querySelector('button[onclick="SettingsManager.confirmRatesUpdate()"]').classList.add('btn-warning');
        document.querySelector('button[onclick="SettingsManager.confirmRatesUpdate()"]').innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i> Save Rates';
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
        saveBtn.classList.remove('btn-warning');
        saveBtn.classList.add('btn-success');
        saveBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Save Changes';

        // Update UI elements that display company name
        document.querySelectorAll('.text-company-name, #company-name').forEach(el => {
            el.textContent = settings.name;
        });

        Utils.showToast('Company profile updated successfully', 'success');
    }

    static confirmRatesUpdate() {
        const settings = StateManager.getSettings();

        // Get input elements
        const ahlInput = document.getElementById('rateAHL');

        // Check if input is empty string
        if (ahlInput.value.trim() === '') {
            // If empty, set to 0
            settings.rates.ahl = 0;
        } else {
            // If has value, parse it
            const parsed = parseFloat(ahlInput.value);
            // Use parsed value if valid number, otherwise 0
            settings.rates.ahl = isNaN(parsed) ? 0 : parsed;
        }

        // Apply same logic to other rates
        const shifInput = document.getElementById('rateSHIF');
        if (shifInput.value.trim() === '') {
            settings.rates.shif = 0;
        } else {
            const parsed = parseFloat(shifInput.value);
            settings.rates.shif = isNaN(parsed) ? 0 : parsed;
        }

        const nssfInput = document.getElementById('rateNSSF');
        if (nssfInput.value.trim() === '') {
            settings.rates.nssf = 0;
        } else {
            const parsed = parseFloat(nssfInput.value);
            settings.rates.nssf = isNaN(parsed) ? 0 : parsed;
        }

        // Update all rates
        //settings.rates.shif = parseFloat(document.getElementById('rateSHIF').value) || 2.75;
        //settings.rates.ahl = parseFloat(document.getElementById('rateAHL').value) || 1.5;
        //settings.rates.nssf = parseFloat(document.getElementById('rateNSSF').value) || 6;
        settings.rates.personalRelief = parseFloat(document.getElementById('defaultRelief').value) || 2400;
        settings.rates.insRelief = parseFloat(document.getElementById('defaultInsRelief').value) || 0;
        settings.rates.benefits = parseFloat(document.getElementById('defaultBenefits').value) || 0;
        settings.rates.quarters = parseFloat(document.getElementById('defaultQuarters').value) || 0;

        StateManager.saveSettings(settings);

        // Reset button state
        const saveBtn = document.querySelector('button[onclick="SettingsManager.confirmRatesUpdate()"]');
        saveBtn.classList.remove('btn-warning');
        saveBtn.classList.add('btn-success');
        saveBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Save Rates';

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

    static exportAllData() {
        Utils.exportAllData();
    }

    static importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                await Utils.importData(file);
                Utils.showToast('Data imported successfully! Page will reload.', 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (error) {
                Utils.showToast('Error importing data: ' + error.message, 'error');
            }
        };

        input.click();
    }

    static clearPayrollData() {
        if (!confirm('Clear all payroll data? This will remove all monthly payroll entries but keep employee list and settings.')) {
            return;
        }

        localStorage.removeItem('gen_payrolls');
        Utils.showToast('Payroll data cleared successfully', 'success');
        setTimeout(() => location.reload(), 1000);
    }
}