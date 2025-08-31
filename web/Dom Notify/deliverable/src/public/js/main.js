// window.custom_elements.enabled = true;
const endpoint = window.custom_elements.endpoint || '/custom-divs';

async function fetchCustomElements() {
    console.log('Fetching elements');
    
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const customElements = await response.json();
    console.log('Custom Elements fetched:', customElements);

    return customElements;
}

function createElements(elements) {
    console.log('Registering elements');
    
    for (var element of elements) {
        // Registers a custom element
        console.log(element)
        customElements.define(element.name, class extends HTMLDivElement {
            static get observedAttributes() { 
                if (element.observedAttribute.includes('-')) {
                    return [element.observedAttribute]; 
                }

                return [];
            }
            
            attributeChangedCallback(name, oldValue, newValue) {
                // Log when attribute is changed
                eval(`console.log('Old value: ${oldValue}', 'New Value: ${newValue}')`)
            }
        }, { extends: 'div' });
    }
}

// When the DOM is loaded
document.addEventListener('DOMContentLoaded', async function () {
    const enabled = window.custom_elements.enabled || false;
    
    // Check if the custom div functionality is enabled
    if (enabled) {
        var customDivs = await fetchCustomElements();
        createElements(customDivs);
    }
});