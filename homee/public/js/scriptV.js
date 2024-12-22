$(document).ready(function() {
    // Reusable function to search and display audio files
    function searchAudioFiles(searchValue) {
        $.ajax({
            url: '/api/search',
            method: 'GET',
            data: { name: searchValue },
            success: function(response) {
                $('#audioList').empty(); // Clear previous results
                
                if (response.length > 0) {
                    response.forEach(audio => {
                        $('#audioList').append(`
                            <div class="audio-item">
                                <span>${audio.employee_name}</span>
                                <audio controls>
                                    <source src="${audio.audio_file_path}" type="audio/mpeg">
                                    Your browser does not support the audio tag.
                                </audio>
                            </div>
                        `);
                    });
                } else {
                    $('#audioList').html('<p>No audio files found for this name.</p>');
                }
            },
            error: function(err) {
                console.error('Error fetching audio files', err);
                $('#audioList').html('<p>Could not retrieve audio files. Please try again later.</p>');
            }
        });
    }

    // Button click event for search
    $('#searchButton').on('click', function() {
        const searchValue = $('#searchInput').val().toLowerCase();
        searchAudioFiles(searchValue);
    });

    // Input event with debounce for real-time search
    let debounceTimeout;
    $('#searchInput').on('input', function() {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(function() {
            const searchValue = $('#searchInput').val().toLowerCase();
            searchAudioFiles(searchValue);
        }, 300); // 300ms debounce time
    });
});
