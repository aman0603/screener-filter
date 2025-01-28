<?php
/*
Plugin Name: Data Screener Plugin
Description: Advanced filtering plugin with Select2 and DataTables.
Version: 1.0
Author:Aman Paswan
*/

if (!defined('ABSPATH')) exit;

class DataScreenerPlugin {
    private $screener_list_file;
    private $screener_data_file;

    public function __construct() {
        $this->screener_list_file = plugin_dir_path(__FILE__) . 'data/screener_list.csv';
        $this->screener_data_file = plugin_dir_path(__FILE__) . 'data/screener_data.csv';

        // Increase memory limit
        ini_set('memory_limit', '512M');    
        set_time_limit(300);

        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('wp_enqueue_styles', [$this, 'enqueue_styles']);
        add_shortcode('screener-dropdown', [$this, 'render_screener_shortcode']);
        add_action('wp_ajax_filter_data', [$this, 'filter_data']);
        add_action('wp_ajax_nopriv_filter_data', [$this, 'filter_data']);
    }

    public function enqueue_scripts() {
        wp_enqueue_style('select2-css', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css');
        wp_enqueue_style('datatables-css', 'https://cdn.datatables.net/1.11.5/css/jquery.dataTables.min.css');
        
        wp_enqueue_script('jquery');
        wp_enqueue_script('select2-js', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js', ['jquery'], null, true);
        wp_enqueue_script('datatables-js', 'https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js', ['jquery'], null, true);
        
        wp_enqueue_script('screener-plugin', plugin_dir_url(__FILE__) . 'assets/js/screener-plugin.js', ['jquery', 'select2-js', 'datatables-js'], null, true);
        wp_enqueue_style('screener-plugin', plugin_dir_url(__FILE__) . 'assets/css/screener.css',null);
        
        wp_localize_script('screener-plugin', 'screenerAjax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'screener_list' => $this->get_screener_list(),
        ]);
    }

    public function render_screener_shortcode() {
        ob_start();
        ?>
        <div id="screener-container" class="container">
            <!-- Filter Section -->
            <div id="filter-section">
                <div id="filter-container"></div>
                <button id="add-filter-btn">+</button>
            </div>
    
            <!-- Table Section -->
            <div id="table-section">
                <div class="table-wrapper">
                    <table id="results-table" class="display" style='width:100%'>
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Company</th>
                                <th>Sector</th>
                                <th>Industry</th>
                                <th>Market Cap</th>
                                <th>52_Week High</th>
                                <!-- Dynamic columns will be added here -->
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Data will be populated by DataTables -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function filter_data() {
        error_log('Entering filter_data method.');
    
        // Log the raw POST data
        error_log('Raw POST data: ' . print_r($_POST, true));
    
        // Ensure filters are provided
        if (!isset($_POST['filters'])) {
            error_log('Filters key is missing in POST data.');
            wp_send_json_error(['message' => 'Invalid or missing filters.']);
            return;
        }
    
        // Decode the filters
        $filters = json_decode(stripslashes($_POST['filters']), true);
        error_log('Decoded filters: ' . print_r($filters, true));
    
        if (!is_array($filters)) {
            error_log('Filters are not in the expected format (array).');
            wp_send_json_error(['message' => 'Invalid or missing filters.']);
            return;
        }
    
        // Validate each filter
        foreach ($filters as $filter) {
            if (!isset($filter['metric']) || !isset($filter['operator']) || !isset($filter['value'])) {
                error_log('Invalid filter structure: ' . print_r($filter, true));
                wp_send_json_error(['message' => 'Invalid filter structure.']);
                return;
            }
        }
    
        // Proceed with filtering
        try {
            error_log('Starting stream_filter_data.');
            $filtered_data = $this->stream_filter_data($filters);
            error_log('Filtered data: ' . print_r($filtered_data, true));
            wp_send_json_success($filtered_data);
        } catch (Exception $e) {
            error_log('Filter Data Error: ' . $e->getMessage());
            wp_send_json_error(['message' => 'An error occurred while filtering data.']);
        }
    }
    
    
    // error_log(print_r($filters, true)); // Log filters to verify their structure


    private function stream_filter_data($filters) {
        error_log('Entering stream_filter_data method.');
        $filtered_data = [];
        $list = $this->get_screener_list();
    
        if (($handle = fopen($this->screener_data_file, 'r')) !== false) {
            error_log('Opened screener_data file.');
            $headers = fgetcsv($handle); // Get column headers
            error_log('Headers: ' . print_r($headers, true));
    
            while (($row = fgetcsv($handle)) !== false) {
                $data_row = array_combine($headers, $row);
    
                // Validate data_row against filters
                if ($this->row_matches_filters($data_row, $filters)) {
                    // Ensure all required columns are present
                    $filtered_row = [
                        'ticker' => $data_row['Ticker'] ?? '',
                        'company' => $data_row['Company Name'] ?? '',
                        'sector' => $data_row['Sector'] ?? '',
                        'industry' => $data_row['Industry'] ?? '',
                        'marketcap' => $data_row['Market Capitalization'] ?? '',
                        '52week_high' => $data_row['Stock price % From 52W High'] ?? '',
                    ];
    
                    // Add dynamic columns based on filters
                    foreach ($filters as $filter) {
                        $metric = $filter['metric'];
                        $filtered_row[$metric] = $data_row[$metric] ?? '';
                    }
    
                    $filtered_data[] = $filtered_row;
                }
    
                // Limit results to prevent memory issues
                // if (count($filtered_data) >= 10000) break;
            }
    
            fclose($handle);
            error_log('Closed screener_data file.');
        } else {
            error_log('Failed to open screener_data file.');
        }
    
        error_log('Filtered data count: ' . count($filtered_data));
        return $filtered_data;
    }
    
    
    

    private function row_matches_filters($row, $filters) {
        if (empty($filters)) return true;
    
        foreach ($filters as $filter) {
            // Extract filter properties
            $metric = $filter['metric']; // Define $metric here
            $operator = $filter['operator'];
            $value = $filter['value'];
    
            // Check if the metric exists in the row
            if (!isset($row[$metric])) {
                error_log("Metric '$metric' not found in row: " . print_r($row, true));
                return false;
            }
    
            $row_value = $row[$metric];
    
            // Apply the filter based on the operator
            switch ($operator) {
                case 'equals':
                    if ($row_value != $value) return false;
                    break;
                case 'not_equals':
                    if ($row_value == $value) return false;
                    break;
                case 'greater_than':
                    if ($row_value <= $value) return false;
                    break;
                case 'less_than':
                    if ($row_value >= $value) return false;
                    break;
                case 'greater_than_or_equal':
                    if ($row_value < $value) return false;
                    break;
                case 'less_than_or_equal':
                    if ($row_value > $value) return false;
                    break;
                default:
                    error_log("Invalid operator: $operator");
                    return false;
            }
        }
        return true;
    }
    

    private function get_screener_list() {
        $list = [];
        if (($handle = fopen($this->screener_list_file, 'r')) !== FALSE) {
            $headers = fgetcsv($handle);
            while (($row = fgetcsv($handle)) !== FALSE) {
                $list[$row[0]] = [$row[1], $row[2]];
            }
            fclose($handle);
        }
        return $list;
    }
}

new DataScreenerPlugin();
