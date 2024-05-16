
document.addEventListener('DOMContentLoaded', function() {
    // The initial loading function is now removed as the content will be loaded from an uploaded file
});

const ADDRESSEES = ['AMBIGUOUS', 'UNNAMED GROUP', 'UNNAMED INDIVIDUAL', 'VIEWER', 'NO ADDRESSEE'];
var CURRENT_FILENAME = null;
var CURRENT_ANNOTATED_SECTION = null;
var editingAnnotation = null;

function uploadFile() {
    console.log("upload file")
    const input = document.getElementById('file-input');
    const file = input.files[0];
    if (!file) alert("Please click 'Choose File' to upload a file first.");
    CURRENT_FILENAME = file['name'];
    if (file && file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = function(e) {
            let text = e.target.result;
            document.getElementById('text-container').innerHTML = '';
            document.getElementById('entity-form').innerHTML = '';
            // Ensure "List of Addressees" is the first line
            if (!text.startsWith('List of Addressees')) {
                console.log("Raw")

                loadRawScreenplay(text);
            } else {
                console.log("Already annotated")
                loadAnnotatedScreenplay(text);
            }
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a .txt file.');
    }
}

function loadRawScreenplay(text) {
    text = "List of Addressees\nAMBIGUOUS\nUNNAMED GROUP\nUNNAMED INDIVIDUAL\nVIEWER\nNO ADDRESSEE\nEnd List\n" + text;
    const lines = text.split('\n');
    const textContainer = document.getElementById('text-container');

    let numbering = false;
    let lineNumber = 1; 

    lines.forEach((line, index) => {
        line = line.trim();
        if (!line) return;

        const lineContainer = document.createElement('div');
        const lineNumberSpan = document.createElement('span');
        lineNumberSpan.className = 'line-number';
        const textSpan = document.createElement('span');

        // Handling line numbers after 'End List'
        if (line === 'End List') {
            numbering = true; // Start numbering from the next line
        } else if (numbering) {
            lineNumberSpan.textContent = `${lineNumber++}. `;
            if (line.toUpperCase() === line) {
                // Split the line into words
                const words = line.split(/\s+/);
                // Check if the line has 1 or 2 words and is an alphabetic
                if (words.length >= 1 && words.length <= 2 && /^[A-Za-z ]+$/.test(line)) {
                    // Check if addresee already exists
                    if (!ADDRESSEES.includes(line)) addAddressee(line);
                }
            }
        }
        
        // Add line
        textSpan.appendChild(document.createTextNode(line));

        if (line === line.toUpperCase()) {
            textSpan.style.fontWeight = 'bold';
        }

        lineContainer.appendChild(lineNumberSpan);
        lineContainer.appendChild(textSpan);
        textContainer.appendChild(lineContainer);
    });
}

function addAddressee(addressee) {
    ADDRESSEES.push(addressee);
    // Find all div elements in the text container
    const divs = document.getElementById('text-container').getElementsByTagName('div');

    // Create the new div
    const addresseeContainer = document.createElement('div');

    const lineNumberSpan = document.createElement('span');
    lineNumberSpan.className = 'line-number';
    const textSpan = document.createElement('span');
    textSpan.appendChild(document.createTextNode(addressee));
    textSpan.style.fontWeight = 'bold';

    addresseeContainer.appendChild(lineNumberSpan);
    addresseeContainer.appendChild(textSpan);

    // Iterate through each div to find the one that contains the 'End List' span
    for (let div of divs) {
        if (div.childNodes[1].textContent === 'End List') {
            // Insert the new div before the div with 'End List'
            div.parentNode.insertBefore(addresseeContainer, div);
            break; // Exit the loop once the new div is inserted
        }
    }
    // Update addresee list within entity-selection div
    loadEntities();
}

function loadAnnotatedScreenplay(text) {
    const lines = text.split('\n');
    const textContainer = document.getElementById('text-container');

    let lineNumber = 1; 
    let numbering = false; // Flag if past End List to start numbering lines
    let readingAddressees = false; // Flags if reading through addressee list

    lines.forEach((line, index) => {
        line = line.trim();
        if (!line) return;

        if (line === 'List of Addressees') {
            console.log("Starting addressee list")
            readingAddressees = true;
        } else if (line === 'End List') {
            console.log("End of addressee list")
            readingAddressees = false;
        } else if (readingAddressees) {
            console.log("Adding addressees to global array")
            if (!ADDRESSEES.includes(line)) ADDRESSEES.push(line);
        }

        const lineContainer = document.createElement('div');
        const lineNumberSpan = document.createElement('span');
        const textSpan = document.createElement('span');
        
        // Handling line numbers after 'End List'
        if (line === 'End List') {
            numbering = true; // Start numbering from the next line
        } else if (numbering) {
            lineNumberSpan.textContent = `${lineNumber++}. `;
        }

        lineNumberSpan.className = 'line-number';

        // Use a regular expression to find all annotated segments in the line
        const regex = /<START(.*?)<END>/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(line)) !== null) {
            // Add text before the match, if any
            if (match.index > lastIndex) {
                textSpan.appendChild(document.createTextNode(line.substring(lastIndex, match.index)));
            }
            // Create a highlighted span for the matched segment
            const highlightSpan = document.createElement('span');
            highlightSpan.className = 'line-highlight';
            highlightSpan.textContent = match[0]; // Include the <START> and <END> markers in the highlight
            textSpan.appendChild(highlightSpan);

            lastIndex = match.index + match[0].length;
        }

        // Add any remaining text after the last match
        if (lastIndex < line.length) {
            textSpan.appendChild(document.createTextNode(line.substring(lastIndex)));
        }

        if (line === line.toUpperCase() && !line.includes('<START') && !line.includes('<END>') && line !== 'List of Addressees' && line !== 'End List') {
            textSpan.style.fontWeight = 'bold';
        }

        lineContainer.appendChild(lineNumberSpan);
        lineContainer.appendChild(textSpan);
        textContainer.appendChild(lineContainer);
    });

    // Update addressee list within entity-selection div
    loadEntities();
}

function loadEntities(entities) {
    const form = document.getElementById('entity-form');
    let childNodes = Array.from(form.childNodes); // Convert NodeList to Array for easier manipulation
    childNodes.forEach(node => {
        if (node.tagName === 'LABEL' || node.tagName === 'BR') {
            form.removeChild(node);
        }
    });
    ADDRESSEES.forEach(entity => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = entity;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(entity));
        form.appendChild(label);
        form.appendChild(document.createElement('br'));
    });
}

// Function to check if the selection is within an annotated text
function isSelectionInAnnotation() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const ancestor = selection.getRangeAt(0).commonAncestorContainer;
        const ancestorElement = ancestor.nodeType === 1 ? ancestor : ancestor.parentNode;
        if (ancestorElement.classList.contains('line-highlight')) CURRENT_ANNOTATED_SECTION = ancestorElement
    }
}

function handleMouseKeyEvents() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
        showEntityOptionsNearSelection();
        // Check if selected section is a prior annotation
        isSelectionInAnnotation();
    } else {
        CURRENT_ANNOTATED_SECTION = null;
        // Hide entity options and reset editing state if no text is selected
        hideEntityOptions();
        if (editingAnnotation) {
            editingAnnotation = null;
        }
    }
}

document.addEventListener('mouseup', function() {
    handleMouseKeyEvents()
});

document.addEventListener('keyup', function(event) {
    handleMouseKeyEvents()
});


function showEntityOptionsNearSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        return; // Ensure there's a selection to process.
    } 

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Calculate position for the entity selection box (e.g., directly below the selected text).
    const entitySelectionBox = document.getElementById('entity-selection');
    const labels = entitySelectionBox.getElementsByTagName('label');
    const labelsCount = labels.length;

    // Calculate the total height needed based on the number of labels + 1. Adjust multiplier as needed to match your label height.
    // This example assumes a simple 20px height per label/line, adjust this based on your actual CSS.
    const totalOffset = (labelsCount + 1) * 20; // For example, 20px per line.

    entitySelectionBox.style.position = 'absolute';
    entitySelectionBox.style.left = `${rect.left}px`;
    entitySelectionBox.style.top = `${rect.bottom + window.scrollY + 10}px`; // Adjust as needed
    entitySelectionBox.style.display = 'block';
    entitySelectionBox.style.backgroundColor = 'rgba(255, 255, 255, 1)'; // Opaque white background
    entitySelectionBox.style.border = '1px solid black'; // Black border
    entitySelectionBox.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)'; // Optional: adds a subtle shadow for better visual separation
    entitySelectionBox.style.padding = '10px'; // Optional: adds some spacing inside the box for the content
    entitySelectionBox.style.zIndex = '1000'; // Ensures the box appears above other page content
}

function addAddresseeManually() {
    var addresseeName = prompt('Enter the name of the new addressee:');
    console.log(addresseeName)
    if (ADDRESSEES.includes(addresseeName)) {
        alert(`${addresseeName} is already in the list of addressees.`)
    } else if (addresseeName != '' && addresseeName.toUpperCase() == addresseeName) {
        addresseeName = addresseeName.trim();
        addAddressee(addresseeName);
    } else {
        alert("Please enter a name that is in all caps. For example, 'DIANA' or 'THE CHIEF'");
        addAddresseeManually();
    }
}

function hideEntityOptions() {
    const entitySelectionBox = document.getElementById('entity-selection');
    entitySelectionBox.style.display = 'none';
    const form = document.getElementById('entity-form');
    form.reset();
    
    // Reset any dynamically added margins if applicable
    const nextElement = entitySelectionBox.nextElementSibling;
    if (nextElement) {
        nextElement.style.marginTop = ''; // Reset to default or previous value
    }

    // Remove the spacer element.
    let spacer = document.getElementById('entity-box-spacer');
    if (spacer) {
        spacer.parentNode.removeChild(spacer);
    }
}

function annotateText() {
    const selection = window.getSelection();
    const checkboxes = document.getElementById('entity-form').querySelectorAll('input[type="checkbox"]:checked');
    let addressees = Array.from(checkboxes).map(cb => cb.value.toUpperCase()).join(', ');
    
    if (checkboxes.length > 0 && selection.toString().trim()) {
        // If we're creating a new annotation
        let selectedText = selection.toString().trim();
        let newText = `&lt;START, ${addressees}&gt; ${selectedText} &lt;END&gt;`;
        
        // Create a new span element to wrap the selected text for highlighting
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'line-highlight';
        highlightSpan.innerHTML = newText;

        // Replace the selected text with the new span
        const range = selection.getRangeAt(0);
        range.deleteContents(); // Remove the selected text
        range.insertNode(highlightSpan); // Insert the new highlighted span

        hideEntityOptions(); // Hide the selection box after annotation
    }
}



function clearAnnotation() {
    if (CURRENT_ANNOTATED_SECTION) {
        const text = CURRENT_ANNOTATED_SECTION.innerHTML;
        const cleanText = text.replace(/&lt;START,[^&gt;]*&gt; /, '').replace(/ &lt;END&gt;/, '');
        // Replace the inner span with its cleaned text
        CURRENT_ANNOTATED_SECTION.outerHTML = cleanText;
    }
}

function exportText() {
    const lines = document.getElementById('text-container').querySelectorAll('div');
    let screenplayText = '';
    lines.forEach(lineContainer => {
        if (lineContainer.childNodes.length > 1 && lineContainer.childNodes[1].textContent !== undefined) {
            screenplayText += lineContainer.childNodes[1].textContent + '\n';
        } else {
            screenplayText += lineContainer.childNodes[0].textContent + '\n';
        }    
    });

    // Write filename
    var filename_export;
    var filename_regex;
    var pos;
    if (CURRENT_FILENAME.includes("_annotated")){
        pos = CURRENT_FILENAME.lastIndexOf('_annotated');
        filename_export = CURRENT_FILENAME.slice(0, pos) + '_annotated_v1.txt';
    } else if (CURRENT_FILENAME.includes(".txt")){
        pos = CURRENT_FILENAME.lastIndexOf('.txt');
        filename_export = CURRENT_FILENAME.slice(0, pos) + '_annotated_v1.txt';
    } else {
        filename_export = CURRENT_FILENAME + '_annotated_v1' + '.txt'; // Return original if '.txt' not found
    }

    filename_regex = new RegExp(`^${filename_export.split('_annotated_v')[0]}_annotated_v\\d+.txt$`);

    console.log(filename_export)
    console.log(filename_regex)

    // Allow version number entry. Check to ensure file is named correctly
    var filename = prompt("Please enter a filename.\n\nIt should start with the ID of the screenplay and end with '_annotated_vX.txt' where X is the version number.\n\nFor example, if exporting the 4th version of your annotations for screenplay 1_2.txt, the filename should be '1_2_annotated_v4.txt'", filename_export);
    if (!filename_regex.test(filename)) {
        alert("Incorrect filename.\n\nIt should start with the ID of the screenplay and end with '_annotated_vX.txt' where X is the version number.\n\nFor example, if exporting the 4th version of your annotations for screenplay 1_2.txt, the filename should be '1_2_annotated_v4.txt'");
        return;
    }

    const blob = new Blob([screenplayText], { type: 'text/plain' });
    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
    window.URL.revokeObjectURL(anchor.href);
}
