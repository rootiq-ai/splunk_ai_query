// AI Query Assistant - Frontend JavaScript

(function() {
    'use strict';

    const API_ENDPOINT = '/splunkd/__raw/services/openai_query';
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeEventListeners();
        loadSavedConfig();
    });

    function initializeEventListeners() {
        document.getElementById('submitQuery').addEventListener('click', handleQuerySubmit);
        document.getElementById('copySPL').addEventListener('click', copySPLToClipboard);
        document.getElementById('chartType').addEventListener('change', handleChartTypeChange);
        
        // Allow Enter key in textarea with Shift+Enter for new line
        document.getElementById('userQuery').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuerySubmit();
            }
        });
    }

    function loadSavedConfig() {
        // Load from localStorage if available
        const savedIndexes = localStorage.getItem('ai_query_indexes');
        const savedFields = localStorage.getItem('ai_query_fields');
        
        if (savedIndexes) {
            document.getElementById('indexes').value = savedIndexes;
        }
        if (savedFields) {
            document.getElementById('fields').value = savedFields;
        }
    }

    function saveConfig() {
        const indexes = document.getElementById('indexes').value;
        const fields = document.getElementById('fields').value;
        
        localStorage.setItem('ai_query_indexes', indexes);
        localStorage.setItem('ai_query_fields', fields);
    }

    async function handleQuerySubmit() {
        const query = document.getElementById('userQuery').value.trim();
        
        if (!query) {
            showError('Please enter a query');
            return;
        }

        const indexes = document.getElementById('indexes').value.trim();
        const fields = document.getElementById('fields').value.trim();
        
        saveConfig();
        showLoading(true);
        hideError();
        hideResults();

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Splunk-Form-Key': getFormKey()
                },
                body: JSON.stringify({
                    query: query,
                    indexes: indexes,
                    fields: fields
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            displayResults(data);
            
        } catch (error) {
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }

    function displayResults(data) {
        // Display SPL query
        document.getElementById('splQuery').textContent = data.spl_query;
        
        // Set chart type
        if (data.chart_type) {
            document.getElementById('chartType').value = data.chart_type;
        }
        
        // Render chart/table
        renderVisualization(data.results, data.chart_type);
        
        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
    }

    function renderVisualization(results, chartType) {
        const container = document.getElementById('chartContainer');
        container.innerHTML = '';
        
        if (!results || results.length === 0) {
            container.innerHTML = '<p class="no-results">No results found</p>';
            return;
        }

        switch(chartType) {
            case 'table':
                renderTable(container, results);
                break;
            case 'bar':
                renderBarChart(container, results);
                break;
            case 'line':
                renderLineChart(container, results);
                break;
            case 'pie':
                renderPieChart(container, results);
                break;
            default:
                renderTable(container, results);
        }
    }

    function renderTable(container, results) {
        const table = document.createElement('table');
        table.className = 'results-table';
        
        // Get all unique keys
        const keys = [...new Set(results.flatMap(r => Object.keys(r)))];
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        keys.forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        results.forEach(row => {
            const tr = document.createElement('tr');
            keys.forEach(key => {
                const td = document.createElement('td');
                td.textContent = row[key] || '-';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
    }

    function renderBarChart(container, results) {
        // Simple SVG bar chart
        const width = container.offsetWidth;
        const height = 400;
        const margin = {top: 20, right: 20, bottom: 60, left: 60};
        
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Get first two fields for x and y
        const keys = Object.keys(results[0]);
        const xKey = keys[0];
        const yKey = keys[1] || keys[0];
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        
        // Simple bar rendering
        const maxValue = Math.max(...results.map(r => parseFloat(r[yKey]) || 0));
        const barWidth = chartWidth / results.length - 10;
        
        results.forEach((item, i) => {
            const value = parseFloat(item[yKey]) || 0;
            const barHeight = (value / maxValue) * chartHeight;
            const x = margin.left + i * (barWidth + 10);
            const y = margin.top + chartHeight - barHeight;
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', '#00A651');
            
            svg.appendChild(rect);
            
            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + barWidth / 2);
            text.setAttribute('y', height - margin.bottom + 15);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.textContent = item[xKey];
            svg.appendChild(text);
        });
        
        container.appendChild(svg);
    }

    function renderLineChart(container, results) {
        container.innerHTML = '<p>Line chart visualization - Use Splunk\'s built-in visualization for advanced charts</p>';
        renderTable(container, results);
    }

    function renderPieChart(container, results) {
        container.innerHTML = '<p>Pie chart visualization - Use Splunk\'s built-in visualization for advanced charts</p>';
        renderTable(container, results);
    }

    function handleChartTypeChange() {
        // Re-render with current results
        const splQuery = document.getElementById('splQuery').textContent;
        if (splQuery) {
            // Would need to store results and re-render
            console.log('Chart type changed');
        }
    }

    function copySPLToClipboard() {
        const splQuery = document.getElementById('splQuery').textContent;
        navigator.clipboard.writeText(splQuery).then(() => {
            const btn = document.getElementById('copySPL');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }

    function showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    function showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorSection').style.display = 'block';
    }

    function hideError() {
        document.getElementById('errorSection').style.display = 'none';
    }

    function hideResults() {
        document.getElementById('resultsSection').style.display = 'none';
    }

    function getFormKey() {
        // Get Splunk form key from cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'splunkweb_csrf_token') {
                return value;
            }
        }
        return '';
    }

})();
