[P9-ify - Kenyan Payroll & P9 Generator 🏢💰.md](https://github.com/user-attachments/files/24451026/P9-ify.-.Kenyan.Payroll.P9.Generator.md)
# **P9-ify \- Kenyan Payroll & P9 Generator 🏢💰**

**P9-ify** is a comprehensive, browser-based payroll management system specifically designed for Kenyan businesses. It streamlines the generation of P9 tax certificates, professional payslips, and monthly payroll processing while ensuring strict compliance with current KRA tax regulations.

## **✨ Features**

### **📋 Core Functionality**

* **Employee Management:** Add and manage staff records including KRA PINs and ID numbers.  
* **Monthly Payroll Processing:** Calculate salaries with automated statutory deductions (NSSF, SHIF, Housing Levy, PAYE).  
* **Multi-Month History:** Store and switch between payroll cycles for the entire financial year.  
* **P9 Tax Certificate Generation:** Instantly generate official P9A forms for tax filing season.  
* **Payslip Generation:** Professional templates with automatic "amount-to-words" conversion.

### **🧮 Automatic Kenyan Tax Engine**

P9-ify handles the complex math of Kenyan statutory deductions:

* **NSSF:** Tiered calculation (capped at KES 2,160).  
* **SHIF:** Calculated at 2.75% of Gross Pay.  
* **Affordable Housing Levy (AHL):** Calculated at 1.5% of Gross Pay.  
* **PAYE:** Progressive tax brackets with integrated Personal Relief (KES 2,400) and Insurance Relief.  
* **Benefits:** Support for non-cash benefits and quarters allowance.

### **📄 Document Generation**

* **Professional P9 Forms:** Print-optimized P9A tax deduction cards in landscape format.  
* **Dynamic Payslips:** Clean, modern designs ready for PDF export or direct printing.  
* **Zero-Server Storage:** All data stays on your machine via the Browser LocalStorage API.

## **🛠️ Technology Stack**

* **Frontend:** HTML5, CSS3, JavaScript (ES6+).  
* **UI Framework:** [Bootstrap 5](https://getbootstrap.com/) (Responsive Design).  
* **Typography:** Inter & Monospace (for financial legibility).  
* **Icons:** Inline SVGs / Font Awesome.

## **🚀 Quick Start**

1. **Clone the repository**  
   git clone \[https://github.com/yourusername/p9-ify.git\](https://github.com/yourusername/p9-ify.git)

2. Open the Application  
   Simply open index.html in any modern web browser (Chrome, Firefox, Safari, or Edge).  
   No installation or backend server required.  
3. **Configure Settings**  
   * Navigate to the **Settings** tab.  
   * Set your Company Name, KRA PIN, and Address.  
   * (Optional) Upload your company logo for professional branding on documents.

## **📋 Usage Instructions**

### **1\. Setup Employees**

Add your staff list in the **Employee Register**. Ensure KRA PINs are correct, as these are mandatory for valid P9 forms.

### **2\. Process Monthly Payroll**

Go to the **Monthly Payroll** tab. Use the date picker to select the current cycle. Enter the Basic Pay for each employee; the system will live-calculate all deductions and the final Net Pay.

### **3\. Track Yearly Data**

Switch months using the cycle selector to enter data for different periods. The system maintains a historical record for each employee indexed by year and month.

### **4\. Generate P9 Forms**

At the end of the tax year:

* Go to the **P9 Generator**.  
* Select the Employee and the Tax Year.  
* Click **Generate Full Year P9** to view the consolidated tax card.

## **🔧 Technical Details & Compliance**

* **Security:** Since there is no backend, your payroll data never leaves your computer. It is stored locally in your browser.  
* **Print Optimization:** CSS @media print queries ensure that navigations and buttons are hidden during printing, leaving only the professional documents.  
* **2024/2025 Rates:** Pre-configured with the latest SHIF (2.75%) and AHL (1.5%) rates.

## **🤝 Contributing**

Contributions are what make the open-source community an amazing place to learn, inspire, and create.

1. Fork the Project.  
2. Create your Feature Branch (git checkout \-b feature/AmazingFeature).  
3. Commit your Changes (git commit \-m 'Add some AmazingFeature').  
4. Push to the Branch (git push origin feature/AmazingFeature).  
5. Open a Pull Request.

## **📝 License**

Distributed under the MIT License. See LICENSE for more information.

## **🙏 Acknowledgments**

* **KRA:** For providing the P9A template guidelines.  
* **Kenyan SME Community:** For the feedback on payroll pain points.

*Built with ❤️ for Kenyan businesses and accountants. Simplify your tax season with **P9-ify**.*
