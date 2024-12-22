document.addEventListener('DOMContentLoaded', () => {
    let currentSortColumn = 'emp_code'; // Default sort column
    let currentSortOrder = 'asc'; // Default sort order
    let rowCount = 10; // Default rows per page
    let callTypeFilter = 'all'; // Default call type filter
    let callStatusFilter = 'all'; // Default call status filter
    let regionFilter = 'all'; // Default region filter

    // Fetch data from the API
    const fetchData = async () => {
        try {
            // API request with sorting, pagination, and filters
            const response = await fetch(`/api/call-logs?sort=${currentSortColumn}&order=${currentSortOrder}&limit=${rowCount}&callType=${callTypeFilter}&callStatus=${callStatusFilter}&region=${regionFilter}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log('Data received:', data);

            // Clear existing table data
            const tableBody = document.querySelector('#call-logs-table tbody');
            tableBody.innerHTML = '';

            // Populate table with new data
            data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row.emp_code}</td>
                    <td>${row.employee_name}</td>
                    <td>${row.call_type}</td>
                    <td>${row.duration}</td>
                    <td>${row.missed_calls}</td>
                    <td>${row.connected_calls}</td>
                    <td>${row.call_status}</td>
                    <td>${row.region}</td>
                    <td>${row.customer_feedback}</td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (err) {
            console.error('Error loading call logs:', err);
        }
    };

    // Function to handle sorting when a column header is clicked
    const handleSort = (event) => {
        const header = event.target.closest('th');
        if (header) {
            const sortColumn = header.getAttribute('data-sort');

            // Toggle sort order
            currentSortOrder = (currentSortColumn === sortColumn && currentSortOrder === 'asc') ? 'desc' : 'asc';
            currentSortColumn = sortColumn;

            // Clear the current sorting styles from all headers
            document.querySelectorAll('#call-logs-table th').forEach(th => {
                th.classList.remove('asc', 'desc');
            });

            // Add the sorting class to the current column
            header.classList.add(currentSortOrder);

            fetchData();
        }
    };

    // Attach event listener to the table header for sorting
    document.querySelectorAll('#call-logs-table th').forEach(th => {
        th.addEventListener('click', handleSort);
    });

    // Handle row count change
    document.getElementById('rowCount').addEventListener('change', (event) => {
        rowCount = event.target.value; // Update the number of rows to display
        fetchData();
    });

    // Handle call type filtering
    document.getElementById('callTypeFilter').addEventListener('change', (event) => {
        callTypeFilter = event.target.value; // Update the call type filter
        fetchData();
    });

    // Handle call status filtering
    document.getElementById('callStatusFilter').addEventListener('change', (event) => {
        callStatusFilter = event.target.value; // Update the call status filter
        fetchData();
    });

    // Handle region filtering
    document.getElementById('regionFilter').addEventListener('change', (event) => {
        regionFilter = event.target.value; // Update the region filter
        fetchData();
    });

    // Sorting by buttons for employee name, call type, call status, and region
    const toggleSortOrder = () => {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    };

    document.getElementById('sortByEmployee').addEventListener('click', () => {
        currentSortColumn = 'employee_name';
        toggleSortOrder(); // Toggle the order
        fetchData();
    });

    document.getElementById('sortByCallType').addEventListener('click', () => {
        currentSortColumn = 'call_type';
        toggleSortOrder(); // Toggle the order
        fetchData();
    });

    document.getElementById('sortByCallStatus').addEventListener('click', () => {
        currentSortColumn = 'call_status';
        toggleSortOrder(); // Toggle the order
        fetchData();
    });
    
    document.getElementById('sortByRegion').addEventListener('click', () => {
        currentSortColumn = 'region';
        toggleSortOrder(); // Toggle the order
        fetchData();
    });

    fetchData(); // Initial fetch for data
});
