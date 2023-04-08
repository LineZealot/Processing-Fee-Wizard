chrome.action.onClicked.addListener(async (tab) => {

    const tabId = tab.id;
    
    // Check for old fee element
    const [feeElement] = await chrome.scripting.executeScript({
        target: {tabId},
        func: () => {
            const tdElements = [...document.querySelectorAll('td')];
            return tdElements.some(td => td.textContent.trim() === 'Processing Fee');
        }
    });
    
    // Get the old fee's price
    const[oldFeePrice] = await chrome.scripting.executeScript({
        target: {tabId},
        func: (x) => {
            if(x.result === true) {
                const rows = [...document.querySelector('table.InvoiceDetails > tbody').querySelectorAll('tr')];
                const index = () => {
                    for(let i = 0; i < rows.length; i++) {
                        const cells = rows[i].getElementsByTagName('td');
                        for (let j = 0; j < cells.length; j++) {
                            if (cells[j].textContent.trim() === "Processing Fee") {
                                return i;
                            }
                        }
                    }
                };
                const price = () => {
                    const rowIndex = index();
                    const cells = rows[rowIndex + 3].getElementsByTagName('td');
                    const num = parseFloat(cells[1].textContent);
                    return num;
                }
                return price();
            }
        },
        args: [feeElement]
    });

    // Get the receipt subtotal
    const [receipt] = await chrome.scripting.executeScript({
        target: {tabId},
        func: (oldFee, oldPrice) => {
            const subTotal = parseFloat((document.querySelector('td.align-right.RunningTotal').textContent));

            if(oldFee.result == true) {
                const newTotal = parseFloat(((subTotal - oldPrice.result) * 0.035) + 0.01).toFixed(2);
                return newTotal;
            } else {
                const price = parseFloat((document.querySelector('td.align-right.RunningTotal').textContent * 0.035) + 0.01).toFixed(2);
                return price;
            }
        },
        args: [feeElement, oldFeePrice]
    });
    console.log(receipt.result);

    // Wait for the tab to navigate to a new page
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
            // Remove the listener to avoid executing this code multiple times
            chrome.tabs.onUpdated.removeListener(listener);

            // Execute a content script on the new page to autofill the number
            chrome.scripting.executeScript({
                target: {tabId},
                func: (receipt) => {
                    // Find the text input and fill in the number
                    const input = document.querySelector('input[type="text"]#txtListPrice');
                    if (input) {
                        input.value = receipt.result.toString();
                    }
                },
                args: [receipt]
            });
        }
    });

    // Open the processing fee page
    await chrome.scripting.executeScript({
        target: {tabId},
        function: (oldFee) => {
            // Get the invoice number from the url
            const invoiceNum = (function(currUrl) {
                const urlToArray = currUrl.split('/');
                return urlToArray[urlToArray.length - 1];
            })(window.location.href);

            // const link = document.querySelector(procFeeButton.result);
            const link = () => {
                if(oldFee.result === false) {
                    const divs = document.querySelector('div#button-container').querySelectorAll('div.button-holder');
                    const anchor = divs[11].querySelector('a.hotbutton-link');
                    return anchor.getAttribute("href").toString();
                } else {
                    const rows = [...document.querySelector('table.InvoiceDetails > tbody').querySelectorAll('tr')];
                    const index = () => {
                        for(let i = 0; i < rows.length; i++) {
                            const cells = rows[i].getElementsByTagName('td');
                            for (let j = 0; j < cells.length; j++) {
                                if (cells[j].textContent.trim() === "Processing Fee") {
                                    return cells[j + 1].querySelector('div > a#InvoiceDetailEditLink').getAttribute("href").toString();
                                }
                            }
                        }
                    }
                    return index();
                }
            }
            window.location.href = link();
        },
        args: [feeElement]
    });
});