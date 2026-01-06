class Utils {
    // Format currency
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Convert number to words (Kenyan English)
    static numberToWords(num) {
        if (num === 0) return 'Zero Shillings';
        
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        
        function convertHundreds(n) {
            if (n === 0) return '';
            let result = '';
            
            if (n >= 100) {
                result += ones[Math.floor(n / 100)] + ' Hundred';
                n %= 100;
                if (n > 0) result += ' and ';
            }
            
            if (n >= 20) {
                result += tens[Math.floor(n / 10)];
                n %= 10;
                if (n > 0) result += ' ' + ones[n];
            } else if (n >= 10) {
                result += teens[n - 10];
            } else if (n > 0) {
                result += ones[n];
            }
            
            return result;
        }
        
        function convert(n) {
            if (n === 0) return '';
            
            if (n >= 1000000) {
                return convertHundreds(Math.floor(n / 1000000)) + ' Million ' + convert(n % 1000000);
            } else if (n >= 1000) {
                return convertHundreds(Math.floor(n / 1000)) + ' Thousand ' + convert(n % 1000);
            } else {
                return convertHundreds(n);
            }
        }
        
        const words = convert(Math.floor(num));
        return words ? words + ' Shillings Only' : 'Zero Shillings';
    }

    // Generate unique ID
    static generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    // Validate KRA PIN format
    static validateKRAPIN(pin) {
        const regex = /^[A-Z]\d{9}[A-Z]$/;
        return regex.test(pin.toUpperCase());
    }

    // Download data as JSON
    static downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Export data
    static exportAllData() {
        const data = {
            employees: StateManager.getEmployees(),
            payrolls: StateManager.getPayrolls(),
            settings: StateManager.getSettings(),
            exportedAt: new Date().toISOString()
        };
        this.downloadJSON(data, `p9ify-backup-${new Date().toISOString().slice(0, 10)}.json`);
    }

    // Import data
    static importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!data.employees || !data.payrolls || !data.settings) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Save data
                    localStorage.setItem('gen_employees', JSON.stringify(data.employees));
                    localStorage.setItem('gen_payrolls', JSON.stringify(data.payrolls));
                    localStorage.setItem('gen_settings', JSON.stringify(data.settings));
                    
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Show toast notification
    static showToast(message, type = 'success') {
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        const container = document.getElementById('toast-container') || (() => {
            const div = document.createElement('div');
            div.id = 'toast-container';
            div.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(div);
            return div;
        })();
        
        container.innerHTML += toastHTML;
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}