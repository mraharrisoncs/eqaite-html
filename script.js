// Script.js
document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('form.json');
    const formConfig = await response.json();

    document.getElementById('formTitle').textContent = formConfig.title;
    const form = document.getElementById('surveyForm');
    form.innerHTML = '';

    // Map to keep track of section questions for averaging
    const sectionMap = {};

    formConfig.fields.forEach(field => {
        // Section with range questions
        if (field.section && field.questions) {
            const sectionHeader = document.createElement('h2');
            sectionHeader.textContent = field.section;
            form.appendChild(sectionHeader);

            if (field.description) {
                const desc = document.createElement('p');
                desc.textContent = field.description;
                desc.style.fontSize = "0.95rem";
                desc.style.color = "#555";
                form.appendChild(desc);
            }

            sectionMap[field.section] = [];

            field.questions.forEach(q => {
                const label = document.createElement('label');
                label.textContent = q.label;
                label.setAttribute('for', q.id);
                form.appendChild(label);

                const input = document.createElement('input');
                input.type = 'range';
                input.id = q.id;
                input.name = q.name;
                input.min = q.min;
                input.max = q.max;
                input.required = q.required;
                input.value = Math.floor((parseInt(q.min) + parseInt(q.max)) / 2);

                // Show value
                const valueSpan = document.createElement('span');
                valueSpan.textContent = input.value;
                valueSpan.style.marginLeft = "10px";
                input.addEventListener('input', () => {
                    valueSpan.textContent = input.value;
                });

                form.appendChild(input);
                form.appendChild(valueSpan);
                form.appendChild(document.createElement('br'));

                sectionMap[field.section].push(q.name);
            });
        }
        // Normal fields (text, radio, textarea)
        else if (field.type === 'radio') {
            const label = document.createElement('label');
            label.textContent = field.label;
            form.appendChild(label);
            form.appendChild(document.createElement('br'));

            field.options.forEach(opt => {
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = field.name;
                input.value = opt.value;
                if (field.required) input.required = true;
                input.id = opt.value.toLowerCase();
                form.appendChild(input);

                const optLabel = document.createElement('label');
                optLabel.textContent = opt.label;
                optLabel.setAttribute('for', opt.value.toLowerCase());
                form.appendChild(optLabel);
                form.appendChild(document.createElement('br'));
            });
        } else if (field.type === 'textarea') {
            const label = document.createElement('label');
            label.textContent = field.label;
            label.setAttribute('for', field.id);
            form.appendChild(label);

            const textarea = document.createElement('textarea');
            textarea.id = field.id;
            textarea.name = field.name;
            if (field.required) textarea.required = true;
            form.appendChild(textarea);
            form.appendChild(document.createElement('br'));
        } else if (field.type === 'select') {
            const label = document.createElement('label');
            label.textContent = field.label;
            label.setAttribute('for', field.name);
            form.appendChild(label);

            const select = document.createElement('select');
            select.name = field.name;
            select.id = field.name;
            if (field.required) select.required = true;

            // Add a placeholder option
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = '-- Please select --';
            placeholder.disabled = true;
            placeholder.selected = true;
            select.appendChild(placeholder);

            field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                select.appendChild(option);
            });

            form.appendChild(select);
            form.appendChild(document.createElement('br'));
        } else {
            const label = document.createElement('label');
            label.textContent = field.label;
            label.setAttribute('for', field.id);
            form.appendChild(label);

            const input = document.createElement('input');
            input.type = field.type;
            input.id = field.id;
            input.name = field.name;
            if (field.required) input.required = true;
            if (field.type === "text") input.value = "test"; // <-- Add this line
            form.appendChild(input);
            form.appendChild(document.createElement('br'));
        }
    });

    // Add submit button
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Submit';
    form.appendChild(submit);

    // Make these accessible to both handlers
    let sectionAverages = {};
    let timestamp = "";
    let lastToolName = "";

    // Handle submit
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const formValues = {};
        formData.forEach((value, key) => {
            formValues[key] = value;
        });

        // Add datestamp in format YYYY/MM/DD HH:mm:ss
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const datestamp = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        formValues["datestamp"] = datestamp;

        // Calculate averages for each section
        sectionAverages = {};
        for (const [section, names] of Object.entries(sectionMap)) {
            let sum = 0, count = 0;
            names.forEach(name => {
                const val = parseFloat(formValues[name]);
                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            });
            sectionAverages[`Average: ${section}`] = count ? (sum / count).toFixed(2) : '';
        }

        // Add averages to formValues for CSV
        Object.entries(sectionAverages).forEach(([section, avg]) => {
            formValues[section] = avg;
        });

        // Prepare data for radar chart
        const radarLabels = Object.keys(sectionAverages).map(label => label.replace(/^Average: /, ''));
        const radarData = Object.values(sectionAverages).map(val => Number(val));

        // Draw radar chart
        const ctx = document.getElementById('radarChart').getContext('2d');
        if (window.radarChartInstance) {
            window.radarChartInstance.destroy();
        }
        window.radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: radarLabels,
                datasets: [{
                    label: 'Dimensions',
                    data: radarData,
                    backgroundColor: 'rgba(255, 213, 0, 0.2)',
                    borderColor: '#ffd500',
                    pointBackgroundColor: '#ffd500',
                    pointBorderColor: '#000',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#ffd500'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        min: 0,
                        max: 10,
                        ticks: { stepSize: 2 }
                    }
                }
            }
        });

        document.getElementById('radarCaption').style.display = 'none';

        const messageSection = document.getElementById('messageSection');
        const downloadSection = document.getElementById('downloadSection');

        // Show "submitting" message and button immediately
        messageSection.innerHTML = `Submitting your data...`;
        messageSection.style.display = 'block';
        downloadSection.innerHTML = `<button id="downloadReport" type="button" class="styled-btn">Download Report</button>`;
        downloadSection.style.display = 'block';
        attachDownloadHandler();

        fetch('https://sheetdb.io/api/v1/6vyhqxr0yjnq6', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [formValues] })
        })
        .then(response => response.json())
        .then(data => {
            messageSection.innerHTML = `Thank you for your submission. Your data has been received by the EQAITE project. Your results are shown, and you may download a PDF below the chart.`;
            messageSection.style.display = 'block';
        })
        .catch(error => {
            messageSection.innerHTML = `Thank you for your submission. Please advise the EQAITE project that "dataset send failed", but your results are shown and you may download a PDF below the chart.`;
            messageSection.style.display = 'block';
        });

        // Reset form after 2s
        setTimeout(() => form.reset(), 2000);
    });

    function attachDownloadHandler() {
        const btn = document.getElementById('downloadReport');
        if (!btn) return;
        btn.onclick = async function() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            let y = 10;
            doc.setFontSize(16);
            doc.text("EQAITE Evaluation Report", 10, y);
            y += 10;

            // Add tool name if available
            doc.setFontSize(13);
            if (lastToolName) {
                doc.text(`Tool: ${lastToolName}`, 10, y);
                y += 10;
            }

            // Section averages (Dimensions)
            doc.setFontSize(14);
            doc.text("Dimensions", 10, y);
            y += 8;
            doc.setFontSize(12);
            Object.entries(sectionAverages).forEach(([section, avg]) => {
                doc.text(`${section}: ${avg}`, 10, y);
                y += 8;
            });

            // Add radar chart as image
            const chartCanvas = document.getElementById('radarChart');
            const chartImg = chartCanvas.toDataURL('image/png', 1.0);

            const pdfImgWidth = 180;
            const aspectRatio = chartCanvas.height / chartCanvas.width;
            const pdfImgHeight = pdfImgWidth * aspectRatio;

            doc.addImage(chartImg, 'PNG', 10, y, pdfImgWidth, pdfImgHeight);

            doc.save(`eqaite_app_report_${timestamp}.pdf`);
        };
    }

    // Render a blank radar chart with placeholder labels
    const radarLabels = ["Dimension 1", "Dimension 2", "Dimension 3", "Dimension 4", "Dimension 5"];
    const radarData = [0, 0, 0, 0, 0]; // or use [5,5,5,5,5] for mid-value

    const ctx = document.getElementById('radarChart').getContext('2d');
    window.radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: radarLabels,
            datasets: [{
                label: 'Dimensions',
                data: radarData,
                backgroundColor: 'rgba(255, 213, 0, 0.08)',
                borderColor: '#ffd500',
                pointBackgroundColor: '#ffd500',
                pointBorderColor: '#000',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#ffd500'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    min: 0,
                    max: 10,
                    ticks: { stepSize: 2 }
                }
            }
        }
    });
});

// Helper: Convert object to CSV
function convertToCSV(obj) {
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    return keys.join(",") + "\n" + values.join(",");
}