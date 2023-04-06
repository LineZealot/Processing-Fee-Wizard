chrome.action.onClicked.addListener(async (tab) => {
    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: () => {
        const invoiceNum = (function(currUrl) {
            const urlToArray = currUrl.split('/');
            return urlToArray[5];
        })(window.location.href);

        let procFeeLink = 'a[href="/FrontDesk/InvoiceDetailAdd?DepartmentId=18&InvoiceId=' + invoiceNum +'"]';
        const link = document.querySelector(procFeeLink);
        if (link) {
          window.location.href = link.href;
        }
        alert(invoiceNum);
        alert(procFeeLink);
      }
    });
  });