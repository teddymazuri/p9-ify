class P9Generator {
    static renderUI(containerId = 'tab-content') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const employees = StateManager.getEmployees();
        const currentYear = new Date().getFullYear();
        
        container.innerHTML = `
            <div class="card p-4 mb-4">
                <h4 class="fw-bold mb-3">P9 Tax Deduction Card Generator</h4>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="small fw-bold">Select Employee</label>
                        <select id="p9Employee" class="form-select" ${employees.length === 0 ? 'disabled' : ''}>
                            ${employees.length === 0 ? 
                                '<option>No employees available</option>' : 
                                employees.map(e => `<option value="${e.id}">${e.name} (${e.pin})</option>`).join('')
                            }
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="small fw-bold">Tax Year</label>
                        <select id="p9Year" class="form-select">
                            ${Array.from({length: 5}, (_, i) => {
                                const year = currentYear - 2 + i;
                                return `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-success w-100 fw-bold" 
                                onclick="P9Generator.generate()"
                                ${employees.length === 0 ? 'disabled' : ''}>
                            Generate P9
                        </button>
                    </div>
                </div>
                <div class="mt-3 small text-muted">
                    <strong>Note:</strong> SHIF (2.75%) and Housing Levy (1.5%) are included in statutory deductions as per Kenyan regulations.
                </div>
            </div>
            
            <div id="p9-output" class="d-none">
                <div class="d-flex justify-content-between align-items-center mb-3 no-print">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-dark" onclick="window.print()">
                            <i class="bi bi-printer me-1"></i> Print
                        </button>
                        <button class="btn btn-sm btn-success" onclick="P9Generator.downloadPDF()">
                            <i class="bi bi-file-pdf me-1"></i> Download PDF
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="P9Generator.exportP9Data()">
                            <i class="bi bi-file-earmark-spreadsheet me-1"></i> Export Data
                        </button>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="document.getElementById('p9-output').classList.add('d-none')">
                        <i class="bi bi-x-lg me-1"></i> Close
                    </button>
                </div>
                <div id="p9-content" class="doc-container"></div>
            </div>
        `;
    }

    static generate() {
        const employeeId = document.getElementById('p9Employee').value;
        const year = document.getElementById('p9Year').value;
        
        const employee = StateManager.getEmployees().find(e => e.id == employeeId);
        if (!employee) {
            Utils.showToast('Employee not found', 'error');
            return;
        }

        const settings = StateManager.getSettings();
        const months = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
        
        let rowsHtml = '';
        let totals = {
            basic: 0, benefits: 0, quarters: 0, gross: 0,
            nssf: 0, shif: 0, housingLevy: 0, totalStatutory: 0,
            e1: 0, e2: 0, e3: 0,
            taxablePay: 0, taxCharged: 0, 
            personalRelief: 0, insuranceRelief: 0, paye: 0
        };
        
        months.forEach(month => {
            const payrollKey = `${year}-${month}-${employeeId}`;
            const data = StateManager.getPayrolls()[payrollKey] || {
                basic: 0, benefits: 0, quarters: 0, nssf: 0, shif: 0, ahl: 0,
                relief: settings.rates.personalRelief, 
                insRelief: settings.rates.insRelief,
                paye: 0
            };
            
            // Calculate values for P9
            const gross = data.basic + (data.benefits || 0) + (data.quarters || 0);
            const e1 = Math.round(gross * 0.3); // 30% of gross (statutory exemption)
            const e2 = data.nssf || 0; // Actual NSSF
            
            // E3 includes SHIF and Housing Levy
            const shifAmount = data.shif || 0;
            const housingLevyAmount = data.ahl || 0;
            const e3 = shifAmount + housingLevyAmount; // SHIF + Housing Levy
            
            // Total statutory deductions for display
            const totalStatutoryDeductions = e2 + e3;
            
            // Calculate taxable pay (Gross minus total statutory deductions)
            const taxablePay = Math.max(0, gross - totalStatutoryDeductions);
            
            // Calculate tax charged using Kenyan tax bands (2024)
            let taxCharged = 0;
            if (taxablePay > 32333) {
                // For amounts above KES 32,333
                taxCharged = 2400 + ((Math.min(taxablePay, 32333) - 24000) * 0.25) + ((taxablePay - 32333) * 0.3);
            } else if (taxablePay > 24000) {
                // For amounts between KES 24,001 - 32,333
                taxCharged = 2400 + ((taxablePay - 24000) * 0.25);
            } else if (taxablePay > 0) {
                // For amounts up to KES 24,000
                taxCharged = taxablePay * 0.1;
            }
            
            // Round tax charged
            taxCharged = Math.round(taxCharged);
            
            // Get reliefs
            const personalRelief = data.relief || settings.rates.personalRelief || 2400;
            const insuranceRelief = data.insRelief || settings.rates.insRelief || 0;
            
            // Calculate PAYE
            const paye = Math.max(0, taxCharged - personalRelief - insuranceRelief);
            
            // Update totals
            totals.basic += data.basic || 0;
            totals.benefits += data.benefits || 0;
            totals.quarters += data.quarters || 0;
            totals.gross += gross;
            totals.nssf += e2;
            totals.shif += shifAmount;
            totals.housingLevy += housingLevyAmount;
            totals.totalStatutory += totalStatutoryDeductions;
            totals.e1 += e1;
            totals.e2 += e2;
            totals.e3 += e3;
            totals.taxablePay += taxablePay;
            totals.taxCharged += taxCharged;
            totals.personalRelief += personalRelief;
            totals.insuranceRelief += insuranceRelief;
            totals.paye += paye;
            
            // Format numbers for display
            const formatNumber = (num) => num.toLocaleString();
            
            rowsHtml += `
                <tr>
                    <td class="text-start fw-bold">${month}</td>
                    <td>${formatNumber(data.basic || 0)}</td>
                    <td>${formatNumber(data.benefits || 0)}</td>
                    <td>${formatNumber(data.quarters || 0)}</td>
                    <td class="fw-bold">${formatNumber(gross)}</td>
                    <td>${formatNumber(e1)}</td>
                    <td>${formatNumber(e2)}</td>
                    <td>${formatNumber(e3)}</td>
                    <td>0</td> <!-- Int. (Interest) -->
                    <td>0</td> <!-- Retire H (Pension) -->
                    <td>${formatNumber(taxablePay)}</td>
                    <td>${formatNumber(taxCharged)}</td>
                    <td>${formatNumber(personalRelief)}</td>
                    <td>${formatNumber(insuranceRelief)}</td>
                    <td class="fw-bold text-danger">${formatNumber(paye)}</td>
                </tr>
            `;
        });

        // Format totals for display
        const formatNumber = (num) => num.toLocaleString();
        
        const p9Content = `
            <div class="p9-document" id="p9-pdf-content">
                <div class="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <h2 class="fw-800 m-0">${settings.name}</h2>
                        <p class="m-0 small text-muted"><b>Address:</b> ${settings.address || 'N/A'}</p>
                        <p class="m-0 small"><b>Employer PIN:</b> ${settings.pin}</p>
                        <p class="m-0 small"><b>Tax Year:</b> ${year}</p>
                    </div>
                    ${settings.logo ? `<img src="${settings.logo}" class="logo-preview">` : ''}
                </div>
                
                <div class="text-center mb-3">
                    <h5 class="fw-bold border-bottom d-inline-block pb-1">
                        P9A INCOME TAX DEDUCTION CARD - YEAR ${year}
                    </h5>
                </div>
                
                <div class="row small mb-3">
                    <div class="col-6">
                        <p class="mb-1"><b>Employee Name:</b> ${employee.name}</p>
                        <p class="mb-1"><b>Employee PIN:</b> ${employee.pin}</p>
                        ${employee.nationalId ? `<p class="mb-1"><b>National ID:</b> ${employee.nationalId}</p>` : ''}
                        ${employee.employeeId ? `<p class="mb-1"><b>Employee ID:</b> ${employee.employeeId}</p>` : ''}
                    </div>
                    <div class="col-6 text-end">
                        <p class="mb-1"><b>Employer Name:</b> ${settings.name}</p>
                        <p class="mb-1"><b>Employer PIN:</b> ${settings.pin}</p>
                        <p class="mb-1"><b>Date Generated:</b> ${new Date().toLocaleDateString('en-KE')}</p>
                    </div>
                </div>
                
                <div class="alert alert-info small mb-3">
                    <strong>Statutory Deductions Breakdown:</strong> E1 = 30% of Gross (exemption), E2 = NSSF, E3 = SHIF (2.75%) + Housing Levy (1.5%)
                </div>
                
                <div class="table-responsive">
                    <table class="table p9-table w-100">
                        <thead class="table-light">
                            <tr>
                                <th rowspan="2">MONTH</th>
                                <th rowspan="2">Basic Salary</th>
                                <th rowspan="2">Benefits</th>
                                <th rowspan="2">Value of Quarters</th>
                                <th rowspan="2">Total Gross</th>
                                <th colspan="3">Statutory Deductions (Exemptions)</th>
                                <th rowspan="2">Int.</th>
                                <th rowspan="2">Retire H</th>
                                <th rowspan="2">Taxable Pay</th>
                                <th rowspan="2">Tax Charged</th>
                                <th rowspan="2">Personal Relief</th>
                                <th rowspan="2">Ins. Relief</th>
                                <th rowspan="2">PAYE</th>
                            </tr>
                            <tr>
                                <th>E1: 30% of Gross</th>
                                <th>E2: NSSF</th>
                                <th>E3: SHIF & Housing</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                        <tfoot class="fw-bold table-secondary">
                            <tr>
                                <td><strong>TOTALS</strong></td>
                                <td>${formatNumber(totals.basic)}</td>
                                <td>${formatNumber(totals.benefits)}</td>
                                <td>${formatNumber(totals.quarters)}</td>
                                <td>${formatNumber(totals.gross)}</td>
                                <td>${formatNumber(totals.e1)}</td>
                                <td>${formatNumber(totals.e2)}</td>
                                <td>${formatNumber(totals.e3)}</td>
                                <td>0</td>
                                <td>0</td>
                                <td>${formatNumber(totals.taxablePay)}</td>
                                <td>${formatNumber(totals.taxCharged)}</td>
                                <td>${formatNumber(totals.personalRelief)}</td>
                                <td>${formatNumber(totals.insuranceRelief)}</td>
                                <td class="text-danger">${formatNumber(totals.paye)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div class="mt-4 p-3 bg-light rounded">
                    <h6 class="fw-bold mb-3">Annual Summary for ${employee.name}</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <p class="mb-1 small"><strong>Annual Gross Salary:</strong> KES ${formatNumber(totals.gross)}</p>
                            <p class="mb-1 small"><strong>Annual Taxable Income:</strong> KES ${formatNumber(totals.taxablePay)}</p>
                            <p class="mb-1 small"><strong>Monthly Average Gross:</strong> KES ${formatNumber(Math.round(totals.gross / 12))}</p>
                        </div>
                        <div class="col-md-4">
                            <p class="mb-1 small"><strong>Total NSSF Paid:</strong> KES ${formatNumber(totals.nssf)}</p>
                            <p class="mb-1 small"><strong>Total SHIF Paid:</strong> KES ${formatNumber(totals.shif)}</p>
                            <p class="mb-1 small"><strong>Total Housing Levy:</strong> KES ${formatNumber(totals.housingLevy)}</p>
                        </div>
                        <div class="col-md-4">
                            <p class="mb-1 small"><strong>Total PAYE Deducted:</strong> KES ${formatNumber(totals.paye)}</p>
                            <p class="mb-1 small"><strong>Total Tax Charged:</strong> KES ${formatNumber(totals.taxCharged)}</p>
                            <p class="mb-1 small"><strong>Effective Tax Rate:</strong> ${((totals.paye / totals.taxablePay) * 100 || 0).toFixed(1)}%</p>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="small text-muted">
                                <strong>Statutory Deductions Breakdown:</strong>
                                <div class="mt-1">
                                    <span class="badge bg-info me-2">NSSF: KES ${formatNumber(totals.nssf)}</span>
                                    <span class="badge bg-warning me-2">SHIF: KES ${formatNumber(totals.shif)}</span>
                                    <span class="badge bg-success me-2">Housing Levy: KES ${formatNumber(totals.housingLevy)}</span>
                                    <span class="badge bg-secondary">Total Statutory: KES ${formatNumber(totals.totalStatutory)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 row small">
                    <div class="col-8">
                        <p class="mb-1"><strong>Kenyan P9 Form Notes:</strong></p>
                        <ul class="small text-muted">
                            <li><strong>E1 (30% of Gross):</strong> Statutory exemption allowed by KRA</li>
                            <li><strong>E2 (NSSF):</strong> National Social Security Fund contributions</li>
                            <li><strong>E3 (SHIF & Housing Levy):</strong> Social Health Insurance Fund (2.75%) and Affordable Housing Levy (1.5%)</li>
                            <li><strong>Taxable Pay:</strong> Total Gross - (E2 + E3)</li>
                            <li><strong>Personal Relief:</strong> KES 2,400 per month (KES 28,800 annually)</li>
                            <li>This document is generated for reference. Verify with official KRA guidelines.</li>
                        </ul>
                    </div>
                    <div class="col-4 text-center">
                        <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px;"></div>
                        <p class="fw-bold mb-0">Authorized Signature</p>
                        <p class="small text-muted mb-0">${settings.name}</p>
                        <p class="small text-muted">Date: ${new Date().toLocaleDateString('en-KE')}</p>
                    </div>
                </div>
                
                <div class="mt-3 text-center">
                    <p class="text-[8px] text-muted mb-0">
                        Generated by P9-ify - Free Kenyan Payroll Tool | ${new Date().toLocaleString('en-KE')}
                    </p>
                </div>
            </div>
        `;

        document.getElementById('p9-content').innerHTML = p9Content;
        document.getElementById('p9-output').classList.remove('d-none');
        
        // Store current P9 data for PDF generation
        this.currentP9Data = {
            employee,
            year,
            settings,
            totals,
            content: p9Content
        };
        
        // Scroll to the P9 output
        document.getElementById('p9-output').scrollIntoView({ behavior: 'smooth' });
        
        Utils.showToast('P9 generated successfully', 'success');
    }

    static downloadPDF() {
        if (!this.currentP9Data) {
            Utils.showToast('Please generate a P9 first', 'warning');
            return;
        }

        const { employee, year, settings } = this.currentP9Data;
        
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            Utils.showToast('PDF library not loaded. Please check your internet connection.', 'error');
            // Fallback to print
            window.print();
            return;
        }

        // Create a clean HTML for PDF
        const pdfContent = document.getElementById('p9-pdf-content').cloneNode(true);
        
        // Remove print-only classes and add PDF styling
        pdfContent.querySelectorAll('.no-print').forEach(el => el.remove());
        
        // Add PDF-specific styles
        const style = document.createElement('style');
        style.textContent = `
            @page { margin: 15mm; }
            body { font-family: Arial, sans-serif; }
            .p9-document { margin: 0; padding: 0; }
            .p9-table { 
                font-size: 8pt !important;
                border-collapse: collapse;
                width: 100%;
            }
            .p9-table th, .p9-table td {
                border: 1px solid #000;
                padding: 3px 5px;
                text-align: center;
            }
            .p9-table th {
                background-color: #f8f9fa;
                font-weight: bold;
            }
            .logo-preview {
                max-height: 60px;
                max-width: 150px;
            }
            .alert {
                border: 1px solid #84c6e8;
                background-color: #d1ecf1;
                padding: 8px;
                margin: 10px 0;
                font-size: 8pt;
            }
            .bg-light {
                background-color: #f8f9fa !important;
            }
            .text-danger {
                color: #dc3545 !important;
            }
            .text-success {
                color: #198754 !important;
            }
            .badge {
                padding: 2px 6px;
                font-size: 8pt;
                margin: 2px;
            }
        `;
        pdfContent.prepend(style);
        
        // Configure PDF options
        const options = {
            margin: [10, 10, 10, 10],
            filename: `P9-${employee.name.replace(/\s+/g, '_')}-${year}-${settings.pin}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'landscape', // Changed to landscape for better table fit
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        // Show loading indicator
        Utils.showToast('Generating PDF...', 'info');
        
        // Generate PDF
        html2pdf()
            .from(pdfContent)
            .set(options)
            .save()
            .then(() => {
                Utils.showToast('PDF downloaded successfully', 'success');
            })
            .catch((error) => {
                console.error('PDF generation error:', error);
                Utils.showToast('Error generating PDF. Please try again.', 'error');
                // Fallback to print
                window.print();
            });
    }

    static exportP9Data() {
        const employeeId = document.getElementById('p9Employee').value;
        const year = document.getElementById('p9Year').value;
        
        const employee = StateManager.getEmployees().find(e => e.id == employeeId);
        if (!employee) return;

        const settings = StateManager.getSettings();
        const months = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
        
        const data = {
            employer: {
                name: settings.name,
                pin: settings.pin,
                address: settings.address
            },
            employee: employee,
            year: year,
            monthlyData: [],
            summary: {},
            generatedAt: new Date().toISOString()
        };

        let summary = {
            basic: 0, benefits: 0, quarters: 0, gross: 0,
            nssf: 0, shif: 0, housingLevy: 0, totalStatutory: 0,
            e1: 0, e2: 0, e3: 0,
            taxablePay: 0, taxCharged: 0, 
            personalRelief: 0, insuranceRelief: 0, paye: 0
        };

        months.forEach(month => {
            const payrollKey = `${year}-${month}-${employeeId}`;
            const record = StateManager.getPayrolls()[payrollKey] || {};
            
            // Calculate P9 values
            const gross = (record.basic || 0) + (record.benefits || 0) + (record.quarters || 0);
            const e1 = Math.round(gross * 0.3);
            const e2 = record.nssf || 0;
            
            // E3 includes SHIF and Housing Levy
            const shifAmount = record.shif || 0;
            const housingLevyAmount = record.ahl || 0;
            const e3 = shifAmount + housingLevyAmount;
            
            const totalStatutoryDeductions = e2 + e3;
            const taxablePay = Math.max(0, gross - totalStatutoryDeductions);
            
            // Calculate tax
            let taxCharged = 0;
            if (taxablePay > 32333) {
                taxCharged = 2400 + ((Math.min(taxablePay, 32333) - 24000) * 0.25) + ((taxablePay - 32333) * 0.3);
            } else if (taxablePay > 24000) {
                taxCharged = 2400 + ((taxablePay - 24000) * 0.25);
            } else if (taxablePay > 0) {
                taxCharged = taxablePay * 0.1;
            }
            taxCharged = Math.round(taxCharged);
            
            const personalRelief = record.relief || settings.rates.personalRelief || 2400;
            const insuranceRelief = record.insRelief || settings.rates.insRelief || 0;
            const paye = Math.max(0, taxCharged - personalRelief - insuranceRelief);
            
            const monthlyRecord = {
                month: month,
                basic: record.basic || 0,
                benefits: record.benefits || 0,
                quarters: record.quarters || 0,
                gross: gross,
                e1: e1,
                e2: e2,
                e3: e3,
                shif: shifAmount,
                housingLevy: housingLevyAmount,
                totalStatutory: totalStatutoryDeductions,
                taxablePay: taxablePay,
                taxCharged: taxCharged,
                personalRelief: personalRelief,
                insuranceRelief: insuranceRelief,
                paye: paye
            };
            
            data.monthlyData.push(monthlyRecord);
            
            // Update summary
            summary.basic += record.basic || 0;
            summary.benefits += record.benefits || 0;
            summary.quarters += record.quarters || 0;
            summary.gross += gross;
            summary.nssf += e2;
            summary.shif += shifAmount;
            summary.housingLevy += housingLevyAmount;
            summary.totalStatutory += totalStatutoryDeductions;
            summary.e1 += e1;
            summary.e2 += e2;
            summary.e3 += e3;
            summary.taxablePay += taxablePay;
            summary.taxCharged += taxCharged;
            summary.personalRelief += personalRelief;
            summary.insuranceRelief += insuranceRelief;
            summary.paye += paye;
        });

        data.summary = summary;
        
        const filename = `P9-${employee.name.replace(/\s+/g, '-')}-${year}.json`;
        Utils.downloadJSON(data, filename);
        Utils.showToast('P9 data exported successfully', 'success');
    }

    // Helper method to generate P9 for a specific employee (used from employee view)
    static generateForEmployee(employeeId) {
        // Set the dropdown values
        document.getElementById('p9Employee').value = employeeId;
        document.getElementById('p9Year').value = new Date().getFullYear();
        
        // Generate the P9
        this.generate();
        
        // Switch to P9 tab if we're in a different tab
        if (!window.location.hash.includes('p9')) {
            switchTab('p9');
        }
    }
}