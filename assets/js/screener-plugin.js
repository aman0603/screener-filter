jQuery(document).ready(function ($) {
  const screenerList = screenerAjax.screener_list;
  let filterCount = 0;

  // Function to create a new filter row
  function createFilterRow() {
    const existingMetrics = $(".metric-select")
      .map(function () {
        return $(this).val();
      })
      .get();

    filterCount++;
    const $row = $("<div>", {
      class: "filter-row",
      "data-filter-id": filterCount,
    });

    // Metric dropdown
    const $metricSelect = $("<select>", {
      class: "metric-select",
      name: `filter[${filterCount}][metric]`,
    }).append(
      $("<option>", {
        value: "",
        text: "Select Metric",
        disabled: true,
        selected: true,
      })
    );

    Object.entries(screenerList).forEach(([metric,value]) => {
        const datatype = value[0];
        const statement = value[1];
      $metricSelect.append(
        $("<option>", {
          value: metric,
          text: metric,
          "data-datatype": datatype, // Set the datatype based on your data
          'data-statement': statement,
                  })
      );
      
    });

    // Operator dropdown
    const $operatorSelect = $("<select>", {
      class: "operator-select",
      name: `filter[${filterCount}][operator]`,
    }).append(
      $("<option>", {
        value: "",
        text: "Select Operator",
        disabled: true,
        selected: true,
      })
    );
    [
      "Equals",
      "Not Equals",
      "Greater Than",
      "Less Than",
      "Greater Than or Equal",
      "Less Than or Equal",
    ].forEach((op) =>
      $operatorSelect.append(
        $("<option>", { value: op.toLowerCase().replace(/ /g, "_"), text: op })
      )
    );

    // Value input
    const $valueInput = $("<input>", {
      type: "text",
      class: "value-input",
      name: `filter[${filterCount}][value]`,
      placeholder: "Enter Value",
      backgroundColor: "#fff",
    });

    // Unit dropdown
    const $unitSelect = $("<select>", {
      class: "unit-select",
      name: `filter[${filterCount}][unit]`,
      style: "display: none;", // Initially hidden
    }).append(
      $("<option>", {
        value: "",
        text: "Select Unit",
        disabled: true,
        selected: true,
      })
    );
    const units = { Billion: 1e9, Million: 1e6, Thousand: 1e3, One: 1 };
    Object.entries(units).forEach(([unit, multiplier]) => {
      $unitSelect.append($("<option>", { value: multiplier, text: unit }));
    });

    // Unit input for percentage metrics
    const $unitInput = $("<input>", {
      type: "text",
      class: "unit-input",
      name: `filter[${filterCount}][unit]`,
      value: "%",
      readonly: true,
      style: "display: none;", // Initially hidden
    });

    // Remove button
    const $removeBtn = $("<button>", {
      class: "remove-filter-btn",
      html: "×",
    }).on("click", () => {
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
    $("#filter-container").append($row);

    // Initialize Select2
    if ($.fn.select2) {
      $metricSelect.select2({ width: "300px", placeholder: "Select Metric" });
      $operatorSelect.select2({
        width: "200px",
        placeholder: "Select Operator",
      });
      $unitSelect.select2({ width: "200px", placeholder: "Select Unit" });
    }

    // Add event listeners for automatic filtering
    $metricSelect.on("change", applyFilters);
    $operatorSelect.on("change", applyFilters);
    $valueInput.on("input", applyFilters);
    $unitSelect.on("change", applyFilters);

    handleMetricChange($row);
  }

  // Function to handle metric dropdown changes
  // Adjust metric change event listener
  function handleMetricChange($row) {
    $row.find(".metric-select").on("change", function () {
      const selectedOption = $(this).find("option:selected");
      const selectedMetric = selectedOption.val();
      const datatype = selectedOption.data("datatype");
      const $unitSelect = $row.find(".unit-select");
      const $unitInput = $row.find(".unit-input");
      const $valueInput = $row.find(".value-input");
      const statement = selectedOption.data('statement');
      console.log("Metric:", selectedMetric);
      console.log("Datatype:", datatype);
      console.log("statement:", statement);
      // Adjust input fields based on datatype

      if (datatype === "%") {
        $unitSelect.hide();
        
        $unitInput.show();
      } else if (datatype === "int") {
        $unitSelect.show();
        $unitInput.hide();
      } else if (datatype === "string") {
        $unitSelect.hide();
        $unitInput.hide();
      }

      
      // Clear value input if the datatype is string
      if (datatype === "string") {
        $valueInput.val("");
      }

      applyFilters(); // Reapply filters when metric changes
    });
  }

  // Apply filters and send an AJAX request
  function applyFilters() {
    const filters = $(".filter-row")
      .map(function () {
        const $row = $(this);
        const metric = $row.find(".metric-select").val();
        const operator = $row.find(".operator-select").val();
        const value = parseFloat($row.find(".value-input").val()) || 0;
        const unitMultiplier = parseFloat($row.find(".unit-select").val()) || 1; // Default multiplier to 1 if no unit is selected
        const statement = $row.find('.metric-select option:selected').data('statement');

        const totalValue = value * unitMultiplier; // Calculate the total value with the unit multiplier

        return { metric, operator, value: totalValue,statement  };
      })
      .get();

    if (filters.length === 0) {
      console.error("No filters applied.");
      return;
    }

    $.ajax({
      url: screenerAjax.ajax_url,
      type: "POST",
      data: {
        action: "filter_data",
        filters: JSON.stringify(filters),
      },
      success: function (response) {
        if (response.success && response.data) {
          console.log("Filtered data:", response.data);
          initDataTable(
            response.data,
            filters.map((f) => f.metric)
          );
        } else {
          console.error("Invalid response:", response);
        }
      },
      error: function (xhr, status, error) {
        console.error("AJAX Error:", error);
        console.error("Response:", xhr.responseText);
      },
    });
  }

  function initDataTable(data, selectedMetrics) {
    if (!data || data.length === 0) {
      console.error("No data available for the table.");
      return;
    }

    const columns = [
      { data: "ticker", title: "Ticker" },
      { data: "company", title: "Company" },
      { data: "sector", title: "Sector" },
      { data: "industry", title: "Industry" },
      { data: "marketcap", title: "Market Cap" },
    ];

    selectedMetrics.forEach((metric) => {
      if (data[0]?.hasOwnProperty(metric)) {
        columns.push({ data: metric, title: metric });
      } else {
        console.warn(`Metric "${metric}" not found in data.`);
      }
    });

    if ($.fn.DataTable.isDataTable("#results-table")) {
      $("#results-table").DataTable().destroy();
      $("#results-table").empty();
    }

    $("#results-table").DataTable({
      data: data,
      columns: columns,
      destroy: true,
    });
  }

  // Add initial filter row
  createFilterRow();

  // Add event listener for the "+" button
  $("#add-filter-btn").on("click", createFilterRow);
});
