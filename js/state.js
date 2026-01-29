class StateManager {
    static STORAGE_KEYS = {
        EMPLOYEES: 'gen_employees',
        PAYROLLS: 'gen_payrolls',
        SETTINGS: 'gen_settings'
    };

    static DEFAULT_SETTINGS = {
        name: 'My Business Ltd',
        pin: 'P000000000X',
        address: '',
        logo: '',
        rates: {
            shif: 2.75,
            ahl: 1.5,
            nssf: 6,
            personalRelief: 2400,
            insRelief: 0,
            benefits: 0,
            quarters: 0
        }
    };

    // Employee Management
    static getEmployees() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.EMPLOYEES)) || [];
    }

    static saveEmployees(employees) {
        localStorage.setItem(this.STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
        this.triggerEvent('employeesUpdated', employees);
    }

    // Payroll Management
    static getPayrolls() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PAYROLLS)) || {};
    }

    static savePayrolls(payrolls) {
        localStorage.setItem(this.STORAGE_KEYS.PAYROLLS, JSON.stringify(payrolls));
        this.triggerEvent('payrollsUpdated', payrolls);
    }

    // Settings Management
    static getSettings() {
        const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SETTINGS));

        //return { ...this.DEFAULT_SETTINGS, ...saved }; ** Previous Code that I highlighted **

        // If no saved settings, return defaults
        if (!saved) return { ...this.DEFAULT_SETTINGS };

        // Deep merge to ensure rates object is properly merged
        const result = { ...this.DEFAULT_SETTINGS, ...saved };

        // Ensure rates object is fully merged
        if (saved.rates) {
            result.rates = { ...this.DEFAULT_SETTINGS.rates, ...saved.rates };
        }

        return result;
    }

    static saveSettings(settings) {
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        this.triggerEvent('settingsUpdated', settings);
    }

    // Payroll Record Management
    static getPayrollRecord(employeeId, year, monthName) {
        const payrolls = this.getPayrolls();
        const key = `${year}-${monthName}-${employeeId}`;
        return payrolls[key] || null;
    }

    static savePayrollRecord(employeeId, year, monthName, data) {
        const payrolls = this.getPayrolls();
        const key = `${year}-${monthName}-${employeeId}`;
        payrolls[key] = data;
        this.savePayrolls(payrolls);
        return data;
    }

    // Event System for reactivity
    static events = {};

    static on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    static off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    static triggerEvent(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }

    // Clear all data
    static clearAllData() {
        if (confirm('Wipe everything? All employee lists and payroll history will be lost.')) {
            Object.values(this.STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
            location.reload();
        }
    }

    // Helper to get current month details
    static getCurrentMonthDetails() {
        const now = new Date();
        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        return {
            year: now.getFullYear(),
            monthIdx: now.getMonth(),
            monthName: months[now.getMonth()],
            inputValue: now.toISOString().slice(0, 7) // YYYY-MM
        };
    }
}