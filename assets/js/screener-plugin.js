jQuery(document).ready(function ($) {
    const screenerList = screenerAjax.screener_list; // Screener list from the backend
    let filterCount = 0;

    // Function to create a new filter row
    function createFilterRow() {
        filterCount++;
        const $row = $('<div>', {
            class: 'filter-row',
            'data-filter-id': filterCount,
        });

        // Metric dropdown
        const $metricSelect = $('<select>', {
            class: 'metric-select',
            name: `filter[${filterCount}][metric]`,
        }).append($('<option>', { value: '', text: 'Select Metric', disabled: true, selected: true }));
        Object.entries(screenerList).forEach(([metric, details]) => {
            $metricSelect.append($('<option>', { value: metric, text: metric, 'data-datatype': details.datatype }));
        });

        // Operator dropdown
        const $operatorSelect = $('<select>', {
            class: 'operator-select',
            name: `filter[${filterCount}][operator]`,
        }).append($('<option>', { value: '', text: 'Select Operator', disabled: true, selected: true }));
        ['Equals', 'Not Equals', 'Greater Than', 'Less Than', 'Greater Than or Equal', 'Less Than or Equal']
            .forEach(op => $operatorSelect.append($('<option>', { value: op.toLowerCase().replace(/ /g, '_'), text: op })));

        // Value input
        const $valueInput = $('<input>', {
            type: 'text',
            class: 'value-input',
            name: `filter[${filterCount}][value]`,
            placeholder: 'Enter Value',
        });

        // Unit dropdown (for numeric metrics)
        const $unitSelect = $('<select>', {
            class: 'unit-select',
            name: `filter[${filterCount}][unit]`,
            style: 'display: none;', // Initially hidden
        }).append($('<option>', { value: '', text: 'Select Unit', disabled: true, selected: true }));
        const units = { Billion: 1e9, Million: 1e6, Thousand: 1e3, One: 1 };
        Object.entries(units).forEach(([unit, multiplier]) => {
            $unitSelect.append($('<option>', { value: multiplier, text: unit }));
        });

        // Unit input for percentage metrics
        const $unitInput = $('<input>', {
            type: 'text',
            class: 'unit-input',
            name: `filter[${filterCount}][unit]`,
            value: '%',
            readonly: true,
            style: 'display: none;', // Initially hidden
        });

        // Remove button
        const $removeBtn = $('<button>', {
            class: 'remove-filter-btn',
            html: '×',
        }).on('click', function () {
            $row.remove();
            applyFilters();
        });

        // Append all elements to the row
        $row.append(
            $metricSelect,
            $operatorSelect,
            $valueInput,
            $unitSelect,
            $unitInput,
            $removeBtn
        );

        // Append the row to the filter container
        $('#filter-container').append($row);

        // Initialize Select2
        if ($.fn.select2) {
            $metricSelect.select2({ width: '300px', placeholder: 'Select Metric' });
            $operatorSelect.select2({ width: '200px', placeholder: 'Select Operator' });
            $unitSelect.select2({ width: '200px', placeholder: 'Select Unit' });
        }

        // Event listeners for dynamic input adjustments
        handleMetricChange($row);
    }

    // Function to handle metric dropdown changes
    // Adjust metric change event listener
function handleMetricChange($row) {
    $row.find('.metric-select').on('change', function () {
        const selectedMetric = $(this).val();
        const datatype = $(this).find('option:selected').data('datatype'); // Get datatype from selected option
        const $unitSelect = $row.find('.unit-select');
        const $unitInput = $row.find('.unit-input');
        const $valueInput = $row.find('.value-input');

        // Adjust input fields based on datatype
        if (datatype === '%') {
            $unitSelect.hide();
            $unitInput.show();
        } else if (datatype === 'int') {
            $unitSelect.show();
            $unitInput.hide();
        } else if (datatype === 'string') {
            $unitSelect.hide();
            $unitInput.hide();
        }

        // Clear value input if the datatype is string
        if (datatype === 'string') {
            $valueInput.val('');
        }

        applyFilters(); // Reapply filters when metric changes
    });
}


    // Apply filters and send an AJAX request
    function applyFilters() {
        const filters = $('.filter-row').map(function () {
            const metric = $(this).find('.metric-select').val();
            const operator = $(this).find('.operator-select').val();
            const value = $(this).find('.value-input').val();
            const unitMultiplier = parseFloat($(this).find('.unit-select').val()) || 1;
            const datatype = $(this).find('.metric-select option:selected').data('datatype');

            // Adjust value for numeric inputs
            const finalValue = datatype === 'int' ? value * unitMultiplier : value;

            if (!metric || !operator || (datatype !== 'string' && isNaN(finalValue))) return null;

            return { metric, operator, value: finalValue };
        }).get();

        if (filters.length === 0) return;

        $.ajax({
            url: screenerAjax.ajax_url,
            type: 'POST',
            data: {
                action: 'filter_data',
                filters: JSON.stringify(filters),
            },
            success: function (response) {
                if (response.success && response.data) {
                    const selectedMetric = $('.metric-select').val();
                    initDataTable(response.data, selectedMetric);
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX Error:', error);
            },
        });
    }

    // Initialize DataTable
    function initDataTable(data, metric) {
        if (!data || data.length === 0) return;

        const columns = [
            { data: 'ticker', title: 'Ticker' },
            { data: 'company', title: 'Company' },
            { data: 'sector', title: 'Sector' },
            { data: 'industry', title: 'Industry' },
            { data: 'marketcap', title: 'Market Cap' },
            { data: 'dynamic_metric', title: metric },
            { data: '52week_high', title: '52-Week High' },
        ];

        $('#results-table').DataTable({
            destroy: true,
            data: data,
            columns: columns,
        });
    }

    // Add an initial filter row on page load
    createFilterRow();

    // Add event listener for the "+" button to add more filter rows
    $('#add-filter-btn').on('click', createFilterRow);
});
