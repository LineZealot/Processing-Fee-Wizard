chrome.action.onClicked.addListener(async (tab) => {

    const tabId = tab.id;
    
    // Get the receipt subtotal
    const [result] = await chrome.scripting.executeScript({
        target: {tabId},
        func: () => {
            const price = parseFloat((document.querySelector('td.align-right.RunningTotal').textContent * 0.035) + 0.01).toFixed(2);
            return price;
        }
    });
    console.log(result.result);

    // Wait for the tab to navigate to a new page
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
            // Remove the listener to avoid executing this code multiple times
            chrome.tabs.onUpdated.removeListener(listener);

            // Execute a content script on the new page to autofill the number
            chrome.scripting.executeScript({
                target: {tabId},
                func: (result) => {
                    // Find the text input and fill in the number
                    const input = document.querySelector('input[type="text"]#txtListPrice');
                    if (input) {
                        input.value = result.result.toString();
                    }
                },
                args: [result]
            });
        }
    });

    // Open the processing fee page
    await chrome.scripting.executeScript({
        target: {tabId},
        function: () => {
            // Get the invoice number from the url
            const invoiceNum = (function(currUrl) {
                const urlToArray = currUrl.split('/');
                return urlToArray[urlToArray.length - 1];
            })(window.location.href);

            // Ammends the link with the invoice number
            let procFeeLink = 'a[href="/FrontDesk/InvoiceDetailAdd?DepartmentId=18&InvoiceId=' + invoiceNum +'"]';
            const link = document.querySelector(procFeeLink);
            if (link) {
                window.location.href = link.href;
            }
        }
    });
});