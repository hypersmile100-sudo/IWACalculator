document.addEventListener('DOMContentLoaded', () => {
    // --- Theme / Dark Mode Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const currentTheme = localStorage.getItem('theme');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            document.body.removeAttribute('data-theme');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    };

    if (currentTheme) {
        applyTheme(currentTheme);
    }

    themeToggle.addEventListener('click', () => {
        let theme = document.body.getAttribute('data-theme') ? '' : 'dark';
        localStorage.setItem('theme', theme);
        applyTheme(theme);
    });

    // --- Universal Tool Navigation ---
    document.getElementById('tool-navigation').addEventListener('click', (e) => {
        if (e.target.matches('.nav-btn')) {
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.calculator-tool').forEach(tool => tool.classList.add('hidden'));
            document.getElementById(e.target.dataset.tool).classList.remove('hidden');
        }
    });

    // --- History Panel Logic ---
    const historyPanel = document.getElementById('history-panel');
    function updateHistoryPanel(historyArray) {
        if (historyArray.length === 0) {
            historyPanel.innerHTML = '<p class="placeholder-text">History will appear here.</p>';
            return;
        }
        historyPanel.innerHTML = '';
        historyArray.slice().reverse().forEach(calc => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="history-expression">${calc.expression} =</span>
                <span class="history-result">${calc.result}</span>
            `;
            item.addEventListener('click', () => {
                if (!document.getElementById('standard-calculator').classList.contains('hidden')) {
                    currentInput = String(calc.result);
                    updateCalcDisplay();
                }
            });
            historyPanel.appendChild(item);
        });
    }

    // --- 1. Standard Calculator Logic (UPGRADED) ---
    const mainDisplay = document.getElementById('calc-main-display');
    const expressionDisplay = document.getElementById('calc-expression-display');
    const memoryIndicator = document.getElementById('calc-memory-indicator');
    
    let currentInput = '0';
    let expression = '';
    let hasCalculated = false;
    let calculationHistory = [];
    let memoryValue = 0;

    const updateCalcDisplay = () => {
        mainDisplay.textContent = currentInput;
        expressionDisplay.textContent = expression.replace(/\*/g, '×').replace(/\//g, '÷');
        memoryIndicator.textContent = memoryValue !== 0 ? 'M' : '';
    }
    
    const handleCalcInput = (type, value) => {
        if (type === 'number') { if (currentInput === '0' || hasCalculated) { currentInput = value; hasCalculated = false; } else { currentInput += value; } }
        if (type === 'operator') { if (currentInput.endsWith('.')) currentInput = currentInput.slice(0,-1); expression += currentInput + ' ' + value + ' '; currentInput = '0'; hasCalculated = false; }
        if (type === 'decimal') { if (hasCalculated) { currentInput = '0.'; hasCalculated = false; } else if (!currentInput.includes('.')) { currentInput += '.'; } }
        if (type === 'clear') { currentInput = '0'; expression = ''; hasCalculated = false; calculationHistory = []; updateHistoryPanel(calculationHistory); }
        if (type === 'delete') { if (hasCalculated) return; currentInput = currentInput.slice(0, -1) || '0'; }
        if (type === 'calculate') {
            if (expression === '') return;
            const fullExpression = expression + currentInput;
            try {
                // Sanitize expression before evaluating to prevent security issues
                const sanitizedExpression = fullExpression.replace(/[^0-9\.\+\-\*\/ KATEX_INLINE_OPENKATEX_INLINE_CLOSE]/g, '');
                const result = (new Function('return ' + sanitizedExpression))();
                calculationHistory.push({ expression: fullExpression.replace(/\*/g, '×').replace(/\//g, '÷'), result });
                updateHistoryPanel(calculationHistory);
                expression = ''; currentInput = String(result); hasCalculated = true;
            } catch (error) { currentInput = 'Error'; expression = ''; hasCalculated = true; }
        }
        if (type === 'memory-clear') { memoryValue = 0; }
        if (type === 'memory-recall') { currentInput = String(memoryValue); hasCalculated = false; }
        if (type === 'memory-add') { memoryValue += parseFloat(currentInput) || 0; }
        if (type === 'memory-subtract') { memoryValue -= parseFloat(currentInput) || 0; }
        updateCalcDisplay();
    }
    
    document.getElementById('standard-calculator').addEventListener('click', (e) => {
        if (e.target.matches('.calc-btn')) {
            const button = e.target; const action = button.dataset.action; const key = button.textContent;
            if (action) {
                const operatorMap = { add: '+', subtract: '-', multiply: '*', divide: '/' };
                if (operatorMap[action]) handleCalcInput('operator', operatorMap[action]);
                else handleCalcInput(action, key);
            } else handleCalcInput('number', key);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (!document.getElementById('standard-calculator').classList.contains('hidden')) {
            const key = event.key;
            const button = document.querySelector(`.calc-btn[data-key="${key}"]`);
            if (button) { event.preventDefault(); button.click(); }
        }
    });

    document.getElementById('export-receipt-btn').addEventListener('click', () => {
        if (calculationHistory.length === 0) { alert('No calculations to export.'); return; }
        const { jsPDF } = window.jspdf; const doc = new jsPDF(); let y = 20;
        doc.setFontSize(18); doc.text('IWA™ Calculation Receipt', 105, y, { align: 'center' }); y += 7;
        doc.setFontSize(10); doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, y, { align: 'center' }); y += 10;
        doc.setLineWidth(0.5); doc.line(15, y, 195, y); y += 10;
        doc.setFontSize(12);
        calculationHistory.forEach(calc => { doc.text(`${calc.expression} =`, 20, y); doc.text(String(calc.result), 190, y, { align: 'right' }); y += 8; });
        y += 5; doc.line(15, y, 195, y); y += 10;
        const finalTotal = calculationHistory[calculationHistory.length - 1].result;
        doc.setFont('helvetica', 'bold'); doc.text('Final Total:', 20, y); doc.text(String(finalTotal), 190, y, { align: 'right' });
        doc.save('IWA-Calculation-Receipt.pdf');
    });

    // --- 2. GST / Tax Calculator Logic ---
    const gstResultDiv = document.getElementById('gst-result');
    document.getElementById('gst-add-btn').addEventListener('click', () => calculateGst('add'));
    document.getElementById('gst-remove-btn').addEventListener('click', () => calculateGst('remove'));
    const calculateGst = (mode) => {
        const amount = parseFloat(document.getElementById('gst-amount').value); const rate = parseFloat(document.getElementById('gst-rate').value);
        if (isNaN(amount) || isNaN(rate)) { alert('Please enter valid amount and rate.'); return; }
        let base, tax, total;
        if (mode === 'add') { base = amount; tax = base * (rate / 100); total = base + tax; } 
        else { total = amount; base = total / (1 + rate / 100); tax = total - base; }
        gstResultDiv.innerHTML = `<div class="result-box-grid"><div><h3>Base Amount</h3><p>₹ ${base.toFixed(2)}</p></div><div><h3>Tax Amount</h3><p>₹ ${tax.toFixed(2)}</p></div><div><h3>Total Amount</h3><p>₹ ${total.toFixed(2)}</p></div></div>`;
        gstResultDiv.classList.remove('hidden');
    }

    // --- 3. Loan / EMI Calculator Logic ---
    const loanResultDiv = document.getElementById('loan-result');
    document.getElementById('calculate-emi-btn').addEventListener('click', () => {
        const p = parseFloat(document.getElementById('loan-principal').value); const annualRate = parseFloat(document.getElementById('loan-rate').value); const tenureYears = parseFloat(document.getElementById('loan-tenure').value);
        if (isNaN(p) || isNaN(annualRate) || isNaN(tenureYears) || p <= 0 || annualRate <= 0 || tenureYears <= 0) { alert('Please enter valid, positive loan details.'); return; }
        const r = (annualRate / 100) / 12; const n = tenureYears * 12;
        const emi = p * r * (Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n; const totalInterest = totalPayment - p;
        loanResultDiv.innerHTML = `<div class="result-box-grid"><div><h3>Monthly EMI</h3><p>₹ ${emi.toFixed(2)}</p></div><div><h3>Total Interest</h3><p>₹ ${totalInterest.toFixed(2)}</p></div><div><h3>Total Payment</h3><p>₹ ${totalPayment.toFixed(2)}</p></div></div>`;
        loanResultDiv.classList.remove('hidden');
    });
    
    // --- 4. Date Calculator Logic ---
    const dateMode = document.getElementById('date-mode'), durationView = document.getElementById('date-duration-view'), addSubtractView = document.getElementById('date-add-subtract-view'), dateResultDiv = document.getElementById('date-result');
    dateMode.addEventListener('change', () => { if (dateMode.value === 'duration') { durationView.classList.remove('hidden'); addSubtractView.classList.add('hidden'); } else { durationView.classList.add('hidden'); addSubtractView.classList.remove('hidden'); } });
    document.getElementById('calculate-date-btn').addEventListener('click', () => {
        dateResultDiv.classList.remove('hidden');
        if (dateMode.value === 'duration') {
            const start = new Date(document.getElementById('start-date').value); const end = new Date(document.getElementById('end-date').value);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) { alert('Please select valid dates.'); return; }
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
            dateResultDiv.innerHTML = `<h3>Duration</h3><p>${diffDays} days</p>`;
        } else {
            const initialDate = new Date(document.getElementById('initial-date').value);
            if (isNaN(initialDate.getTime())) { alert('Please select a valid initial date.'); return; }
            const operation = document.getElementById('date-operation').value, value = parseInt(document.getElementById('date-value').value), unit = document.getElementById('date-unit').value, multiplier = operation === 'add' ? 1 : -1;
            if (unit === 'Days') initialDate.setDate(initialDate.getDate() + value * multiplier); if (unit === 'Weeks') initialDate.setDate(initialDate.getDate() + value * 7 * multiplier); if (unit === 'Months') initialDate.setMonth(initialDate.getMonth() + value * multiplier); if (unit === 'Years') initialDate.setFullYear(initialDate.getFullYear() + value * multiplier);
            dateResultDiv.innerHTML = `<h3>Resulting Date</h3><p>${initialDate.toLocaleDateString()}</p>`;
        }
    });

    // --- 5. Age Calculator Logic ---
    const birthdateInput = document.getElementById('birthdate'), calculateAgeBtn = document.getElementById('calculate-age-btn'), ageResultDiv = document.getElementById('age-result');
    calculateAgeBtn.addEventListener('click', () => {
        const birthDate = new Date(birthdateInput.value); if (isNaN(birthDate.getTime())) { ageResultDiv.innerHTML = 'Please enter a valid date.'; return; }
        const today = new Date(); let years = today.getFullYear() - birthDate.getFullYear(), months = today.getMonth() - birthDate.getMonth(), days = today.getDate() - birthDate.getDate();
        if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
        if (months < 0) { years--; months += 12; }
        ageResultDiv.innerHTML = `<h3>Your age is</h3><p>${years} years, ${months} months, ${days} days</p>`;
    });

    // --- 6. Percentage Calculator Logic ---
    const percentMode = document.getElementById('percent-mode'), percentNum1 = document.getElementById('percent-num1'), percentNum2 = document.getElementById('percent-num2'), calculatePercentBtn = document.getElementById('calculate-percent-btn'), percentResultDiv = document.getElementById('percent-result'), label1 = document.getElementById('percent-label1'), label2 = document.getElementById('percent-label2');
    percentMode.addEventListener('change', () => {
        if (percentMode.value === 'percentOf') { label1.textContent = 'Percentage (%):'; label2.textContent = 'Value:'; percentNum1.placeholder = 'e.g., 5'; percentNum2.placeholder = 'e.g., 200'; } 
        else { label1.textContent = 'Part Value:'; label2.textContent = 'Total Value:'; percentNum1.placeholder = 'e.g., 10'; percentNum2.placeholder = 'e.g., 200'; }
    });
    calculatePercentBtn.addEventListener('click', () => {
        const num1 = parseFloat(percentNum1.value), num2 = parseFloat(percentNum2.value);
        if (isNaN(num1) || isNaN(num2)) { percentResultDiv.innerHTML = 'Please enter valid numbers.'; return; }
        let resultText;
        if (percentMode.value === 'percentOf') { resultText = `<h3>Result</h3><p>${((num1 / 100) * num2).toLocaleString()}</p>`; } 
        else { if (num2 === 0) { resultText = 'Cannot divide by zero.'; } else { resultText = `<h3>Result</h3><p>${((num1 / num2) * 100).toFixed(2)}%</p>`; } }
        percentResultDiv.innerHTML = resultText;
    });

    // --- 7. Unit Converter Logic ---
    const unitCategory = document.getElementById('unit-category'), unitFrom = document.getElementById('unit-from'), unitTo = document.getElementById('unit-to'), unitInput = document.getElementById('unit-input'), unitOutput = document.getElementById('unit-output'), unitResultDiv = document.getElementById('unit-result');
    const units = { length: { 'Meters (m)': 1, 'Kilometers (km)': 1000, 'Centimeters (cm)': 0.01, 'Feet (ft)': 0.3048, 'Inches (in)': 0.0254 }, weight: { 'Kilograms (kg)': 1, 'Grams (g)': 0.001, 'Pounds (lb)': 0.453592, 'Ounce (oz)': 0.0283495 }, temperature: { 'Celsius (°C)': 'celsius', 'Fahrenheit (°F)': 'fahrenheit', 'Kelvin (K)': 'kelvin' } };
    function populateUnitSelectors() {
        const category = unitCategory.value; const options = Object.keys(units[category]); unitFrom.innerHTML = ''; unitTo.innerHTML = '';
        options.forEach(option => { unitFrom.innerHTML += `<option value="${option}">${option}</option>`; unitTo.innerHTML += `<option value="${option}">${option}</option>`; });
        unitTo.value = options[1] || options[0]; convertUnits();
    }
    function convertUnits() {
        const category = unitCategory.value, fromValue = parseFloat(unitInput.value), fromUnit = unitFrom.value, toUnit = unitTo.value;
        if (isNaN(fromValue)) { unitOutput.value = ''; unitResultDiv.textContent = ''; return; }
        let result;
        if (category === 'temperature') {
            let tempInCelsius; if (fromUnit === 'Celsius (°C)') tempInCelsius = fromValue; if (fromUnit === 'Fahrenheit (°F)') tempInCelsius = (fromValue - 32) * 5/9; if (fromUnit === 'Kelvin (K)') tempInCelsius = fromValue - 273.15;
            if (toUnit === 'Celsius (°C)') result = tempInCelsius; if (toUnit === 'Fahrenheit (°F)') result = (tempInCelsius * 9/5) + 32; if (toUnit === 'Kelvin (K)') result = tempInCelsius + 273.15;
        } else { const fromFactor = units[category][fromUnit], toFactor = units[category][toUnit]; result = (fromValue * fromFactor) / toFactor; }
        unitOutput.value = result.toFixed(4); unitResultDiv.textContent = `${fromValue} ${fromUnit} = ${result.toFixed(4)} ${toUnit}.`;
    }
    unitCategory.addEventListener('change', populateUnitSelectors); unitInput.addEventListener('input', convertUnits); unitFrom.addEventListener('change', convertUnits); unitTo.addEventListener('change', convertUnits);
    populateUnitSelectors();
});