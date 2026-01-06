class SettingsManager {
    static renderUI(containerId = 'tab-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const settings = StateManager.getSettings();
        
        container.innerHTML = `
            <div class="row">
                <div class="col-lg-8">
                    <div class="card p-4 mb-4">
                        <h4 class="fw-bold mb-4">Employer Profile</h4>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-bold">Company/Employer Name</label>
                                <input type="text" id="settingName" class="form-control" 
                                       value="${settings.name}" 
                                       oninput="SettingsManager.updateField('name', this.value)">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold">Employer KRA PIN</label>
                                <input type="text" id="settingPin" class="form-control" 
                                       value="${settings.pin}" 
                                       oninput="SettingsManager.updateField('pin', this.value)">
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-bold">Employer Physical/Postal Address</label>
                                <input type="text" id="settingAddress" class="form-control" 
                                       value="${settings.address || ''}" 
                                       placeholder="e.g., P.O. Box 1234, Nairobi" 
                                       oninput="SettingsManager.updateField('address', this.value)">
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
                <h4 class="fw-bold mb-4">Default Statutory Rates & Reliefs</h4>
                <div class="row g-3">
                    <div class="col-md-3">
                        <label class="small fw-bold">SHIF (%)</label>
                        <input type="number" step="0.01" id="rateSHIF" class="form-control" 
                               value="${settings.rates.shif}" 
                               onchange="SettingsManager.updateRate('shif', this.value)">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Housing Levy (%)</label>
                        <input type="number" step="0.01" id="rateAHL" class="form-control" 
                               value="${settings.rates.ahl}" 
                               onchange="SettingsManager.updateRate('ahl', this.value)">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">NSSF (%)</label>
                        <input type="number" step="0.01" id="rateNSSF" class="form-control" 
                               value="${settings.rates.nssf}" 
                               onchange="SettingsManager.updateRate('nssf', this.value)">
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
                               onchange="SettingsManager.updateRate('personalRelief', this.value)">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Insurance Relief (KES)</label>
                        <input type="number" id="defaultInsRelief" class="form-control" 
                               value="${settings.rates.insRelief}" 
                               onchange="SettingsManager.updateRate('insRelief', this.value)">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Benefits (KES)</label>
                        <input type="number" id="defaultBenefits" class="form-control" 
                               value="${settings.rates.benefits}" 
                               onchange="SettingsManager.updateRate('benefits', this.value)">
                    </div>
                    <div class="col-md-3">
                        <label class="small fw-bold">Quarters (KES)</label>
                        <input type="number" id="defaultQuarters" class="form-control" 
                               value="${settings.rates.quarters}" 
                               onchange="SettingsManager.updateRate('quarters', this.value)">
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

    static updateField(field, value) {
        const settings = StateManager.getSettings();
        settings[field] = value;
        StateManager.saveSettings(settings);
        
        // Update UI elements that display company name
        if (field === 'name') {
            document.querySelectorAll('.text-company-name, #company-name').forEach(el => {
                el.textContent = value;
            });
        }
        
        Utils.showToast('Settings updated', 'success');
    }

    static updateRate(rateKey, value) {
        const settings = StateManager.getSettings();
        settings.rates[rateKey] = parseFloat(value) || 0;
        StateManager.saveSettings(settings);
        Utils.showToast('Rate updated', 'success');
    }

    static handleLogoUpload(input) {
        if (!input.files[0]) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const settings = StateManager.getSettings();
            settings.logo = e.target.result;
            StateManager.saveSettings(settings);
            SettingsManager.renderUI();
            Utils.showToast('Logo uploaded', 'success');
        };
        reader.readAsDataURL(input.files[0]);
    }

    static removeLogo() {
        const settings = StateManager.getSettings();
        settings.logo = '';
        StateManager.saveSettings(settings);
        SettingsManager.renderUI();
        Utils.showToast('Logo removed', 'success');
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
        Utils.showToast('Payroll data cleared', 'success');
        setTimeout(() => location.reload(), 1000);
    }
}