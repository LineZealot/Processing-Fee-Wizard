chrome.action.onClicked.addListener(async (tab) => {
    const tabId = tab.id;
    // Get the receipt subtotal
    const [result] = await chrome.scripting.executeScript({
        target: {tabId},
        func: () => {
            const subTotal = parseFloat((document.querySelector("td.align-right.RunningTotal").textContent * 0.035) + 0.01).toFixed(2);
            alert(subTotal);
            return subTotal;
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