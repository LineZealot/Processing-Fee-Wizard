chrome.action.onClicked.addListener(async (tab) => {
    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: () => {
        const link = document.querySelector('a[href="/FrontDesk/InvoiceDetailAdd?DepartmentId=18]');
        if (link) {
          window.location.href = link.href;
        }
      }
    });
  });