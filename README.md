# WordPress Screener Plugin

This WordPress plugin provides advanced filtering capabilities for stock datasets. It allows users to dynamically select metrics, operators, and values to filter data, and displays the filtered results in a DataTable. The plugin is designed to handle complex filtering logic with ease.

## Features

- **Dynamic Dropdowns**: Populate metric dropdowns dynamically based on a dataset.
- **Data Filtering**: Apply multiple filtering criteria using operators and values.
- **Custom Inputs**: Show or hide inputs (e.g., unit input or unit select) based on the selected metric's datatype.
- **Infinite Filters**: Add or remove an unlimited number of filtering rows.
- **AJAX-Powered Filtering**: Dynamically update results without reloading the page.
- **DataTable Integration**: Display filtered results in a responsive, interactive table.

## Installation

1. Clone or download the plugin repository.
2. Place the plugin folder in your WordPress installation's `wp-content/plugins` directory.
3. Activate the plugin from the WordPress admin dashboard under the Plugins section.

## Shortcode

Use the following shortcode to render the screener interface on any page or post:

```
[screener-dropdown]
```

## Usage

1. Add the shortcode `[screener-dropdown]` to a WordPress page or post where you want the plugin to appear.
2. Interact with the dropdowns to select a metric, operator, and value.
3. Add additional filter rows by clicking the "Add Filter" button.
4. View the filtered results in the table below.

## Code Structure

### Key Files

- **`screener-plugin.php`**: Main plugin file that initializes the plugin and registers scripts/styles.
- **`screener-plugin.js`**: Contains the JavaScript logic for dropdown interaction, dynamic filtering, and AJAX calls.
- **`style.css`**: Styles for the plugin interface.
- **`includes/`**: Contains PHP files for handling AJAX requests and server-side logic.

### JavaScript Logic

- **Dropdown Interaction**:
  Handles dynamic updates for metric and operator dropdowns.
- **AJAX Filtering**:
  Sends filter criteria to the server and processes the filtered results.
- **Dynamic Inputs**:
  Adjusts visibility of inputs based on the selected metric's datatype (`int`, `%`, `string`).

### AJAX Workflow

1. User selects a metric and operator or enters a value.
2. `applyFilters()` sends an AJAX request with the selected filter criteria.
3. Server processes the request and returns the filtered data.
4. DataTable is updated with the new data.

## Example Dataset Structure

| Metric                | Datatype | Statement      |
|-----------------------|----------|----------------|
| Accounts Payables     | int      | Balance Sheet  |
| Revenue Growth        | %        | Income Statement |
| Net Profit Margin     | %        | Income Statement |

## Debugging Tips

1. **Check Console Logs**:
   Ensure `console.log()` outputs for `Metric`, `Datatype`, and `Statement` show correct values when interacting with dropdowns.
2. **Verify Event Listeners**:
   Ensure event listeners are not being attached multiple times, which can cause unexpected behavior.
3. **AJAX Response**:
   Check the network tab for the server's AJAX response to ensure data is being returned correctly.

## Future Enhancements

- **Export Filtered Data**: Add functionality to export filtered results to CSV.
- **Preset Filters**: Allow users to save and apply predefined filter sets.
- **Enhanced Styling**: Improve the UI/UX with additional animations and themes.

## License

This project is licensed under the MIT License.

---

