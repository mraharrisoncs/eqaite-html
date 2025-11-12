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
                // Wrapper for flex layout
                const wrapper = document.createElement('div');
                wrapper.style.display = "flex";
                wrapper.style.alignItems = "center";
                wrapper.style.marginBottom = "0.5rem";

                // Question label
                const label = document.createElement('label');
                label.textContent = q.label;
                label.setAttribute('for', q.id);
                label.style.flex = "1";
                wrapper.appendChild(label);

                // Optional N/A checkbox for non-required questions
                let naCheckbox = null;
                let naLabel = null;
                if (!q.required) {
                    naCheckbox = document.createElement('input');
                    naCheckbox.type = 'checkbox';
                    naCheckbox.id = q.id + "_na";
                    naCheckbox.checked = true; // N/A by default
                    naCheckbox.style.marginLeft = "12px";
                    naCheckbox.style.marginRight = "4px";

                    naLabel = document.createElement('label');
                    naLabel.textContent = "N/A";
                    naLabel.setAttribute('for', naCheckbox.id);
                    naLabel.style.fontSize = "0.95rem";
                    naLabel.style.color = "#888";

                    wrapper.appendChild(naCheckbox);
                    wrapper.appendChild(naLabel);
                }

                // Range input
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

                // If not required, start disabled and greyed out
                if (!q.required) {
                    input.disabled = true;
                    input.value = -1; // Sentinel value for N/A
                    valueSpan.textContent = "";
                    input.style.opacity = "0.5";
                    naCheckbox.addEventListener('change', () => {
                        if (naCheckbox.checked) {
                            input.disabled = true;
                            input.value = -1;
                            valueSpan.textContent = "";
                            input.style.opacity = "0.5";
                        } else {
                            input.disabled = false;
                            input.value = Math.floor((parseInt(q.min) + parseInt(q.max)) / 2);
                            valueSpan.textContent = input.value;
                            input.style.opacity = "1";
                        }
                    });
                }

                wrapper.appendChild(input);
                wrapper.appendChild(valueSpan);
                form.appendChild(wrapper);

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
            if (field.type === "text") input.value = "test";
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

        // Set lastToolName immediately after collecting formValues
        lastToolName = formValues["tool"] || "";

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
                // Only count if not N/A (sentinel -1) and is a valid number
                if (!isNaN(val) && val >= 0) {
                    sum += val;
                    count++;
                }
            });
            sectionAverages[section] = count ? (sum / count).toFixed(2) : '';
            // Add averages to formValues for CSV
            // formValues[section] = sectionAverages[section];
        }

        // --- All code below here should be OUTSIDE the for-loop ---
        // Prepare data for radar chart
        const radarLabels = Object.keys(sectionAverages).map(label =>
            label.split(' - ')); // Array for multi-line labels
    console.log(radarLabels);
        const radarData = Object.values(sectionAverages).map(val => Number(val));

        // Draw radar chart
        const ctx = document.getElementById('radarChart').getContext('2d');
        if (window.radarChartInstance) {
            window.radarChartInstance.destroy();
        }
        const rootStyles = getComputedStyle(document.documentElement);
        const highlight = rootStyles.getPropertyValue('--highlight').trim();
        const active = rootStyles.getPropertyValue('--active').trim();
        const dark = rootStyles.getPropertyValue('--dark').trim();

        window.radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: radarLabels,
                datasets: [{
                    label: 'EQAITE summary',
                    data: radarData,
                    backgroundColor: highlight + '33', // semi-transparent
                    borderColor: highlight,
                    pointBackgroundColor: highlight,
                    pointBorderColor: dark,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: highlight
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

        // Build CSV from formValues (uses helper convertToCSV at end of file)
        const csv = convertToCSV(formValues);
        const safeStamp = (formValues.datestamp || new Date().toISOString()).replace(/[\/ :]/g, '_');
        const dropboxPath = `/eqaite_submissions/eqaite_submission_${safeStamp}.csv`; // change folder/name as needed

        const DROPBOX_TOKEN = getDropboxToken();
        if (!DROPBOX_TOKEN) {
            console.error('No Dropbox token available, aborting upload to Dropbox.');
            messageSection.innerHTML = `Submission received locally, but writing to Dropbox skipped (no token). Your results are shown and you may download a PDF below the chart.`;
            messageSection.style.display = 'block';
        } else {
            fetch('https://content.dropboxapi.com/2/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DROPBOX_TOKEN}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: dropboxPath,
                        mode: 'add',
                        autorename: true,
                        mute: false
                    })
                },
                body: new TextEncoder().encode(csv)
            })
            .then(async res => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Dropbox upload failed: ${res.status} ${text}`);
                }
                return res.json();
            })
            .then(data => {
                messageSection.innerHTML = `Thank you for your submission. Your data has been written to Dropbox. Your results are shown, and you may download a PDF below the chart.`;
                messageSection.style.display = 'block';
            })
            .catch(error => {
                console.error("Dropbox upload error:", error);
                messageSection.innerHTML = `Submission received locally, but writing to Dropbox failed. See console for details. Your results are shown and you may download a PDF below the chart.`;
                messageSection.style.display = 'block';
            });
        }

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

            // EQAITE logo settings
            const logoUrl = "./assets/eqaite_wordmarque_1280px.png";
            const imgProps = { x: 10, y: y, width: 50, height: 18 }; // Adjust as needed

            // Load the logo image and add to PDF
            const img = new window.Image();
            img.crossOrigin = "Anonymous";
            img.onload = function() {
                doc.addImage(img, 'PNG', imgProps.x, imgProps.y, imgProps.width, imgProps.height);
                y += imgProps.height + 6;

                // Title
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
            img.onerror = function() {
                alert("Could not load logo image for PDF.");
            };
            img.src = logoUrl;
        };
    }

    // Get section headings for radar chart labels
    const radarLabels = formConfig.fields
        .filter(field => field.section && field.questions)
        .map(field => field.section.split(' - ')); // <-- wrap here too!

    // Set blank data (all zeros)
    const radarData = radarLabels.map(() => 0);

    // Get CSS variables for colors
    const rootStyles = getComputedStyle(document.documentElement);
    const highlight = rootStyles.getPropertyValue('--highlight').trim();
    const dark = rootStyles.getPropertyValue('--dark').trim();

    // Draw blank radar chart
    const ctx = document.getElementById('radarChart').getContext('2d');
    window.radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: radarLabels,
            datasets: [{
                label: 'EQAITE summary',
                data: radarData,
                backgroundColor: highlight + '33', // semi-transparent
                borderColor: highlight,
                pointBackgroundColor: highlight,
                pointBorderColor: dark,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: highlight
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

// Replace previous getDropboxToken implementation with this client call
async function getDropboxToken() {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (isLocal) {
        // local dev token (keeps current behaviour)
        return 'sl.u.AGFtivBtEJH6o2hN99iDIWEc300rmgVhshng8op9-JV0BJ6KFE_9HsjTWLTYb7LI5V6x9j7UvtWrxMs_YlfcECD2exZeYJSSlOQA4DuK39lm04B-UqlEibQsAQV0VUQwRc0l5lBpqX3v6P9KhTH3EtS-4FVgjRrcXpFLqi0KVNxMI-qPwMvFuH73PPSnuiSiMrmDHbISSdW9Be4RkYz41H3JLhbzOpYyrr7aW3ZAqObu51I4Ri0AegNoeEogqsTtFyBBUZCxJAaGTpUTsem5VFws6V7NA5GM-GS9Vv0sgifo5e6vKapafiNf2RgFV7ULwOAQmRZm4YEXAVKCFP1ySrhuARZZl_Hs9FJWSX1yRZPqaTzF9DvWaxNFuls5OuvADypN2_vRgmgXvDVSs_1NgRzdBTW94hUtHFKMbccoV9vZF8hWvyRK7S6u7-xN5m2RnZoMfBhX1YQ-WLwjTpIiuaiWQ37k7Ff6jDlZXZJhHUBRGHBZBlWGi2XxBA3cfOWQul1eXd0-sKJUdEa2eC8m-T2bkgF46eNdXZxTcHOfHGXGMsxNVTmvPYT4WM0D4CbZfwNDwtTl9ZojVy9L5ZhpTE7-DVclfk9HfhL_IGWVol7_LGgwwjdspwjd2TDvX0nqk1r1pBhkCiI_wlc14XgHOhQ2UZRLGs5v6jY_TOu8KEq9ZNvZ3wO1oGHDqXnXDZhZ3kuLykPjOdSAPeEcMA2cCbirrY6PvOu0N4AnjVLl7F_VR54mklNZPZi1eAjEORF1ob3Jrmx7Up4BiKA6ol3OG_tcMOGumFMe7lDn2JqsUkhVT-Hjm4Fmu8YSSUjeHNoicR_XIxdijCKMG3srbHZiK4Yq4mNSKfgRIrbHMYK2o3DsFiq2eMz6heDyQHlucJDz48Mc9VIHXMjgqav06A4qlEKhgh2-_w9Pd0JU_C5dY3swAlCgpLUUqsceVxiAZN8KN2HYeTia-ronEL11-r8qkchs_cZURJjCNO3tYCwEI1u89G7hVSRzvZe0LZlyKGjOjV5B0GaPnNi5ul2BYEImfBq6h1RjObw0cT1Wajs6iYyyOpff03ldJ1whEqCAYxD2DWF08idwTTQCYh5UcW2Hi6G7zanXr3FkLZs5V26hj4X2n4_x61AiiDIMuo_GUx9pGs09lyaSKhLIVEwK07yIKHM2A_wa8ElKCOZ6HhE-KKFe0E2iGUTl90RWeOP71futz8xTOqm-4rvBCYIb9ox2OFMbS63shg1Q4w5VGrAaSyophKkVfJ30HRWqDlkKkoOtDDe4BfSo3NEkjV-j96mUjWGp';
    }

    try {
        const res = await fetch('/.netlify/functions/getDropboxToken', { method: 'GET' });
        if (!res.ok) {
            console.warn('getDropboxToken: server returned', res.status);
            return '';
        }
        const json = await res.json();
        return json.token || '';
    } catch (err) {
        console.warn('getDropboxToken error', err);
        return '';
    }
}
