// Global variables
let formData = {};

// DOM elements
const generateBtn = document.getElementById('generate-btn');
const printBtn = document.getElementById('print-btn');
const copyBtn = document.getElementById('copy-btn');
const emptyState = document.getElementById('empty-state');
const certificateContent = document.getElementById('certificate-content');
const certificatePreview = document.querySelector('.certificate-preview');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add generate button event listener
    generateBtn.addEventListener('click', validateAndGenerateCertificate);
    
    // Add print button event listener
    printBtn.addEventListener('click', printCertificate);
    
    // 修改复制按钮为返回表单按钮
    copyBtn.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i><span>Get New Certificate</span>';
    copyBtn.addEventListener('click', returnToForm);
    
    // Initialize date pickers
    initDatePickers();
    
    // Same address checkbox functionality
    document.getElementById('same-address').addEventListener('change', function() {
        const propertyAddress = document.getElementById('property-address');
        const riskAddress = document.getElementById('risk-address');
        
        if(this.checked) {
            riskAddress.value = propertyAddress.value;
            riskAddress.disabled = true;
        } else {
            riskAddress.disabled = false;
        }
    });
    
    // Update risk address when property address changes if checkbox is checked
    document.getElementById('property-address').addEventListener('input', function() {
        const sameAddress = document.getElementById('same-address');
        const riskAddress = document.getElementById('risk-address');
        
        if(sameAddress.checked) {
            riskAddress.value = this.value;
        }
    });
    
    // Show/hide other insurer input
    document.getElementById('insurer-select').addEventListener('change', function() {
        const otherInsurer = document.getElementById('insurer');
        otherInsurer.classList.toggle('hidden', this.value !== 'other');
    });

    // Show/hide other liability input
    document.getElementById('liability-select').addEventListener('change', function() {
        const otherInput = document.getElementById('liability');
        otherInput.classList.toggle('hidden', this.value !== 'other');
        if(this.value !== 'other') {
            otherInput.value = this.value;
        } else {
            otherInput.value = '';
        }
    });

    // Show/hide other deductible input
    document.getElementById('deductible-select').addEventListener('change', function() {
        const otherInput = document.getElementById('deductible');
        otherInput.classList.toggle('hidden', this.value !== 'other');
        if(this.value !== 'other') {
            otherInput.value = this.value;
        } else {
            otherInput.value = '';
        }
    });
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // 初始化默认值
    document.getElementById('liability-select').value = '2000000';
    document.getElementById('deductible-select').value = '1000';
    
    // 触发所有相关事件
    ['liability-select', 'deductible-select'].forEach(id => {
        const element = document.getElementById(id);
        element.dispatchEvent(new Event('change'));
    });
});

// Initialize date pickers
function initDatePickers() {
    // Flatpickr configuration for effective date
    const effectiveDatePicker = flatpickr("#effective-date", {
        dateFormat: "Y-m-d",
        allowInput: true,
        altInput: true,
        altFormat: "F j, Y",
        disableMobile: true,
        position: 'auto',
        static: true,
        appendTo: document.body,
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                // Calculate expiry date (1 year from effective date)
                const expiryDate = new Date(selectedDates[0]);
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                
                // Update expiry date picker
                expiryDatePicker.setDate(expiryDate);
            }
        }
    });
    
    // Flatpickr configuration for expiry date
    const expiryDatePicker = flatpickr("#expiry-date", {
        dateFormat: "Y-m-d",
        allowInput: true,
        altInput: true,
        altFormat: "F j, Y",
        disableMobile: true,
        position: 'auto',
        static: true,
        appendTo: document.body
    });
}

// Validate form and generate certificate
function validateAndGenerateCertificate() {
    // Get all input values
    const namedInsured = document.getElementById('named-insured').value.trim();
    const propertyAddress = document.getElementById('property-address').value.trim();
    const riskAddress = document.getElementById('risk-address').value.trim();
    const mortgageeText = document.getElementById('mortgagee').value.trim();
    const mortgageeInfo = parseMortgageeInfo(mortgageeText);
    
    const effectiveDate = document.getElementById('effective-date').value.trim();
    const expiryDate = document.getElementById('expiry-date').value.trim();
    
    // Get insurer
    let insurer = document.getElementById('insurer-select').value;
    if (insurer === 'other') {
        insurer = document.getElementById('insurer').value.trim();
    } else if (insurer) {
        // Convert selected value to display name
        const insurerSelect = document.getElementById('insurer-select');
        insurer = insurerSelect.options[insurerSelect.selectedIndex].text;
    }
    
    const policyNumber = document.getElementById('policy-number').value.trim();
    const buildingValue = document.getElementById('building-value').value.trim();
    const liability = document.getElementById('liability-select').value === 'other' 
        ? document.getElementById('liability').value.trim()
        : document.getElementById('liability-select').value;
    const deductible = document.getElementById('deductible-select').value === 'other'
        ? document.getElementById('deductible').value.trim()
        : document.getElementById('deductible-select').value;
    
    const guaranteedReplacement = document.getElementById('guaranteed-replacement').checked;
    
    // Get signature
    const signatureName = document.getElementById('signature-name').value.trim();
    
    // Validate required fields
    const requiredFields = [
        { value: namedInsured, name: 'Named Insured' },
        { value: propertyAddress, name: 'Property Address' },
        { value: riskAddress, name: 'Risk Address' },
        { value: effectiveDate, name: 'Effective Date' },
        { value: expiryDate, name: 'Expiry Date' },
        { value: insurer, name: 'Insurer' },
        { value: policyNumber, name: 'Policy Number' },
        { value: liability, name: 'Liability' },
        { value: deductible, name: 'Deductible' },
        { value: signatureName, name: 'Authorized Signature Name' }
    ];
    
    // Check for empty fields
    const emptyFields = requiredFields.filter(field => !field.value);
    if (emptyFields.length > 0) {
        const fieldNames = emptyFields.map(field => field.name).join(', ');
        alert(`Please fill in the following required fields: ${fieldNames}`);
        return;
    }
    
    // Validate date format and logic
    const effectiveDateTime = new Date(effectiveDate);
    const expiryDateTime = new Date(expiryDate);
    
    if (isNaN(effectiveDateTime.getTime())) {
        alert('Please enter a valid effective date');
        return;
    }
    
    if (isNaN(expiryDateTime.getTime())) {
        alert('Please enter a valid expiry date');
        return;
    }
    
    if (effectiveDateTime >= expiryDateTime) {
        alert('Expiry date must be later than effective date');
        return;
    }
    
    // Save form data
    formData = {
        namedInsured,
        propertyAddress,
        riskAddress,
        mortgageeInfo,
        effectiveDate: formatDate(effectiveDateTime),
        expiryDate: formatDate(expiryDateTime),
        insurer,
        policyNumber,
        buildingValue,
        liability,
        deductible,
        guaranteedReplacement,
        signatureName
    };
    
    // Generate certificate
    generateCertificate();
}

// Parse mortgagee information
function parseMortgageeInfo(mortgageeText) {
    if (!mortgageeText) return { name: '', address: '' };
    
    const lines = mortgageeText.trim().split('\n');
    if (lines.length === 0) return { name: '', address: '' };
    
    const name = lines[0].trim();
    const address = lines.slice(1).join(', ').trim();
    
    return { name, address };
}

// Format date to more readable format
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format currency
function formatCurrency(amount) {
    if (!amount) return '';
    const number = parseInt(amount.toString().replace(/[^0-9]/g, ''));
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number).replace('USD', '$');
}

// Generate certificate
function generateCertificate() {
    // 获取DOM元素
    const inputsSection = document.querySelector('.calculator-inputs');
    const resultsSection = document.querySelector('.calculator-results');
    const calculatorContainer = document.querySelector('.calculator-container');
    
    // 隐藏输入表单
    inputsSection.style.display = 'none';
    
    // 调整结果区域样式，使其占满整个容器
    resultsSection.style.cssText = `
        flex: 1;
        max-width: 100%;
        width: 100%;
        padding: 0 20px;
        margin: 0 auto;
    `;
    
    // 调整容器样式
    calculatorContainer.style.cssText = `
        display: block;
        width: 100%;
    `;
    
    // 隐藏空状态，显示证书内容
    emptyState.classList.add('hidden');
    certificateContent.classList.remove('hidden');
    
    // 更新按钮文本，确保显示正确
    copyBtn.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i><span>Get New Certificate</span>';
    
    // 添加样式使证书内容更美观
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --certificate-section-gap: 15px;
            --certificate-row-gap: 8px;
            --coverage-top-margin: 40px;
            --coverage-bottom-margin: 20px;
            --coverage-title-top-margin: 25px;
            --coverage-title-bottom-margin: 15px;
            --footer-top-margin: 40px;
            --footer-padding: 15px 0;
            --certificate-max-width: 900px;
            /* 签名样式变量已移至signature-styles.css */
        }
        
        .certificate-preview {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 25px;
            background-color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin: 20px auto;
            max-width: var(--certificate-max-width);
        }
        
        .certificate-section {
            margin-bottom: var(--certificate-section-gap);
        }
        
        .certificate-row {
            display: flex;
            margin-bottom: var(--certificate-row-gap);
        }
        
        .coverage-section {
            margin: var(--coverage-top-margin) 0 var(--coverage-bottom-margin);
        }
        
        .coverage-section h3 {
            margin: var(--coverage-title-top-margin) 0 var(--coverage-title-bottom-margin);
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
            padding-bottom: 8px;
            display: inline-block;
            border-bottom: 1px solid #000000;
            width: 50%;
        }
        
        .certificate-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: var(--footer-top-margin);
            padding: var(--footer-padding);
        }
        
        .results-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .download-options {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 20px;
        }
        
        .secondary-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .secondary-button:hover {
            background-color: #3182ce;
        }
        
        /* 签名框样式已移至signature-styles.css */
    `;
    document.head.appendChild(style);
    
    // Create certificate HTML
    const certificateHTML = `
        <div class="certificate-header">
            <div class="certificate-logo">
                <img src="../tenant-coi/BrokerTeamInsurance_BT20-Colored.png" alt="Insurance Logo" class="logo-image">
            </div>
            <div class="certificate-title">
                <h2 style="font-size: 20px; color: #2c3e50; font-weight: 600; margin-bottom: 8px;">HOME INSURANCE CONFIRMATION</h2>
                <h3 style="font-size: 14px; color: #7f8c8d; margin: 4px 0;">9560 MARKHAM RD UNIT 117, MARKHAM ON L6E 0V1</h3>
                <h3 style="font-size: 14px; color: #7f8c8d; margin: 4px 0;">TEL: (905) 472-5666</h3>
            </div>
        </div>
        
        <div class="certificate-body">
            <div class="certificate-section">
                <p class="certificate-note" style="margin-bottom: 15px;">
                This binder is valid for 365 days from the effective date.
                <br>Terms and conditions are to be governed by actual policy issued by the insurer.
                </p>
                <div class="certificate-row">
                    <div class="certificate-label">Named Insured:</div>
                    <div class="certificate-value">${formData.namedInsured}</div>
                </div>
                <div class="certificate-row">
                    <div class="certificate-label">Property Address:</div>
                    <div class="certificate-value">${formData.propertyAddress}</div>
                </div>
                <div class="certificate-row">
                    <div class="certificate-label">Risk Address:</div>
                    <div class="certificate-value">${formData.riskAddress}</div>
                </div>
                ${formData.mortgageeInfo.name ? `
                <div class="certificate-row">
                    <div class="certificate-label">Mortgagee:</div>
                    <div class="certificate-value">${formData.mortgageeInfo.name}</div>
                </div>
                ` : ''}
                ${formData.mortgageeInfo.address ? `
                <div class="certificate-row">
                    <div class="certificate-label">Mortgagee Address:</div>
                    <div class="certificate-value">${formData.mortgageeInfo.address}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="certificate-section">
                <div class="certificate-row">
                    <div class="certificate-label">Insurer:</div>
                    <div class="certificate-value">${formData.insurer}</div>
                </div>
                <div class="certificate-row">
                    <div class="certificate-label">Policy Number:</div>
                    <div class="certificate-value">${formData.policyNumber}</div>
                </div>
            </div>
            
            <div class="certificate-section">
                <div class="certificate-row">
                    <div class="certificate-label">Effective Date:</div>
                    <div class="certificate-value">${formData.effectiveDate}</div>
                </div>
                <div class="certificate-row">
                    <div class="certificate-label">Expiry Date:</div>
                    <div class="certificate-value">${formData.expiryDate}</div>
                </div>
            </div>
            
            <div class="certificate-section coverage-section">
                <h3>Insurance Coverage</h3>
                
                ${formData.buildingValue ? `
                <div class="certificate-row">
                    <div class="certificate-label">Building Value:</div>
                    <div class="certificate-value">${formatCurrency(formData.buildingValue)}</div>
                </div>
                ` : ''}
                
                <div class="certificate-row">
                    <div class="certificate-label">Liability:</div>
                    <div class="certificate-value">${formatCurrency(formData.liability)}</div>
                </div>
                
                <div class="certificate-row">
                    <div class="certificate-label">Deductible:</div>
                    <div class="certificate-value">${formatCurrency(formData.deductible)}</div>
                </div>
                
                ${formData.guaranteedReplacement ? `
                <div class="certificate-row" style="margin-top: 10px;">
                    <div class="certificate-label">Additional Coverage:</div>
                    <div class="certificate-value">Guaranteed Building Replacement Cost</div>
                </div>
                ` : ''}
            </div>
            
            <div class="certificate-footer">
                <div class="certificate-date" style="font-size: 14px; color: #7f8c8d; min-width: 200px;">
                    Signed Date: ${new Date().toLocaleDateString('en-US')}
                </div>
                
                <div class="certificate-signature">
                    <div class="signature-box">
                        <div class="signature-label">Signed electronically by</div>
                        <div class="signature-content">
                            ${generateSignature(formData.signatureName)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Update certificate preview
    certificatePreview.innerHTML = certificateHTML;
    
    // 调换按钮位置
    const downloadOptions = document.querySelector('.download-options');
    downloadOptions.innerHTML = `
        <button id="copy-btn" class="secondary-button">
            <i class="fa-solid fa-arrow-rotate-left"></i>
            <span>Get New Certificate</span>
        </button>
        <button id="print-btn" class="secondary-button">
            <i class="fas fa-print"></i>
            <span>Generate PDF / Print Form</span>
        </button>
    `;
    
    // 重新添加事件监听器
    document.getElementById('print-btn').addEventListener('click', printCertificate);
    document.getElementById('copy-btn').addEventListener('click', returnToForm);
    
    // Scroll to certificate section
    certificateContent.scrollIntoView({ behavior: 'smooth' });
}

// Print certificate
function printCertificate() {
    // Get certificate content
    const certificateHtml = certificatePreview.innerHTML;
    
    // Create print window
    const printWindow = window.open('', '_blank');
    
    // Write HTML content
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>HOME INSURANCE CONFIRMATION - ${formData.namedInsured}</title>
            <link rel="stylesheet" href="../../common/signature-styles.css">
            <style>
                :root {
                    --certificate-section-gap: 15px;
                    --certificate-row-gap: 8px;
                    --coverage-top-margin: 40px;
                    --coverage-bottom-margin: 20px;
                    --coverage-title-top-margin: 25px;
                    --coverage-title-bottom-margin: 15px;
                    --footer-top-margin: 40px;
                    --footer-padding: 15px 0;
                    --certificate-max-width: 900px;
                    /* 签名样式变量已移至signature-styles.css */
                }
                
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.5;
                    color: #333;
                    margin: 0;
                    padding: 15px;
                }
                
                .certificate-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #2c3e50;
                    padding-bottom: 10px;
                }
                
                .logo-image {
                    max-width: 200px;
                    max-height: 80px;
                }
                
                .certificate-title {
                    text-align: right;
                }
                
                .certificate-title h2 {
                    font-size: 20px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 8px;
                }
                
                .certificate-title h3 {
                    font-size: 14px;
                    color: #7f8c8d;
                    margin: 4px 0;
                }
                
                .certificate-section {
                    margin-bottom: var(--certificate-section-gap);
                }
                
                .certificate-row {
                    display: flex;
                    margin-bottom: var(--certificate-row-gap);
                }
                
                .certificate-label {
                    font-weight: 600;
                    color: #34495e;
                    width: 200px;
                    flex-shrink: 0;
                    font-size: 14px;
                }
                
                .certificate-value {
                    color: #2c3e50;
                    font-weight: 500;
                    font-size: 14px;
                }
                
                .coverage-section {
                    margin: var(--coverage-top-margin) 0 var(--coverage-bottom-margin);
                }
                
                .coverage-section h3 {
                    margin: var(--coverage-title-top-margin) 0 var(--coverage-title-bottom-margin);
                    font-size: 16px;
                    font-weight: 600;
                    color: #2c3e50;
                    padding-bottom: 8px;
                    display: inline-block;
                    border-bottom: 1px solid #000000;
                    width: 50%;
                }
                
                .certificate-note {
                    font-size: 12px;
                    font-style: italic;
                    color: #7f8c8d;
                    margin: 5px 0;
                }
                
                .certificate-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: var(--footer-top-margin);
                    padding: var(--footer-padding);
                }
                
                .certificate-date {
                    min-width: 200px;
                    font-size: 14px;
                    color: #7f8c8d;
                }
                
                /* .certificate-signature 样式已移至signature-styles.css */
                
                /* .signature-box 样式已移至signature-styles.css */
                
                /* .signature-label 样式已移至signature-styles.css */
                
                /* .signature-content 样式已移至signature-styles.css */
                
                @media print {
                    body {
                        padding: 0;
                        margin: 0;
                    }
                    
                    .calculator-inputs {
                        display: none !important;
                    }
                    
                    .calculator-results {
                        flex: 1 0 100% !important;
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .calculator-container {
                        display: block !important;
                        width: 100% !important;
                    }
                    
                    .certificate-preview {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                    }
                    
                    .results-header, .download-options {
                        display: none !important;
                    }
                    
                    @page {
                        margin: 1cm;
                    }
                }

                @font-face {
                    font-family: 'Cursive Font';
                    src: local('Brush Script MT'), 
                         local('Segoe Script'), 
                         local('Bradley Hand'), 
                         local('Comic Sans MS');
                }

                /* .certificate-signature 样式已移至signature-styles.css */
            </style>
        </head>
        <body>
            ${certificateHtml}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Properly handle image loading before printing
    const handlePrint = () => {
        printWindow.focus(); // Focus ensures better printing support across browsers
        printWindow.print();
    };
    
    // 检查打印窗口中是否有图片
    const images = printWindow.document.querySelectorAll('img');
    
    if (images.length === 0) {
        // 没有图片，直接打印
        handlePrint();
    } else {
        let loadedImages = 0;
        const totalImages = images.length;
        
        // 预加载所有图片
        images.forEach(img => {
            // 如果图片已经加载完成
            if (img.complete) {
                loadedImages++;
                // 当所有图片都加载完成时打印
                if (loadedImages === totalImages) {
                    handlePrint();
                }
            } else {
                // 添加图片加载事件
                img.addEventListener('load', () => {
                    loadedImages++;
                    // 当所有图片都加载完成时打印
                    if (loadedImages === totalImages) {
                        handlePrint();
                    }
                });
                
                // 添加图片加载错误处理
                img.addEventListener('error', () => {
                    loadedImages++;
                    console.error('Image failed to load:', img.src);
                    // 即使图片加载失败也继续打印
                    if (loadedImages === totalImages) {
                        handlePrint();
                    }
                });
            }
        });
        
        // 添加超时保护，避免无限等待
        setTimeout(() => {
            if (loadedImages < totalImages) {
                console.warn('Not all images loaded after timeout, printing anyway');
                handlePrint();
            }
        }, 3000); // 3秒超时
    }
}

// 返回表单页面
function returnToForm() {
    // 获取DOM元素
    const inputsSection = document.querySelector('.calculator-inputs');
    const resultsSection = document.querySelector('.calculator-results');
    const calculatorContainer = document.querySelector('.calculator-container');
    
    // 显示输入表单
    inputsSection.style.display = 'block';
    
    // 重置容器样式为默认的flex布局
    calculatorContainer.style.cssText = `
        display: flex;
        width: 100%;
    `;
    
    // 重置结果区域样式
    resultsSection.style.cssText = `
        flex: 1;
    `;
    
    // 隐藏证书内容，显示空状态
    certificateContent.classList.add('hidden');
    emptyState.classList.remove('hidden');
    
    // 滚动到表单顶部
    inputsSection.scrollIntoView({ behavior: 'smooth' });
}

// Signature generation function
function generateSignature(name) {
    if (!name) return '';
    
    const randomRotation = Math.floor(Math.random() * 5) - 2;
    const rotationClass = `rotate-${randomRotation < 0 ? 'neg-' : 'pos-'}${Math.abs(randomRotation)}`;
    
    return `<span class="dynamic-signature ${rotationClass}">${name}</span>`;
}