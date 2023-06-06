chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;

  // Check for old fee element
  const [feeElement] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const tdElements = [...document.querySelectorAll("td")];
      return tdElements.some(
        (td) => td.textContent.trim() === "Processing Fee"
      );
    },
  });

  // Get the old fee's price
  const [oldFeePrice] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (x) => {
      if (x.result === true) {
        const rows = [
          ...document
            .querySelector("table.InvoiceDetails > tbody")
            .querySelectorAll("tr"),
        ];
        const index = () => {
          for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName("td");
            for (let j = 0; j < cells.length; j++) {
              if (cells[j].textContent.trim() === "Processing Fee") {
                return i;
              }
            }
          }
        };
        const price = () => {
          const rowIndex = index();
          const cells = rows[rowIndex + 3].getElementsByTagName("td");
          const num = parseFloat(cells[1].textContent);
          return num;
        };
        return price();
      }
    },
    args: [feeElement],
  });

  // Get the receipt subtotal
  const [receipt] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (oldFee, oldPrice) => {
      const subTotal = parseFloat(
        document.querySelector("td.align-right.RunningTotal").textContent
      );

      function roundUpCent(num) {
        const fixedPrice = Math.ceil(num * 100) / 100;
        return fixedPrice.toFixed(2);
      }

      if (oldFee.result == true) {
        const newTotal = parseFloat((subTotal - oldPrice.result) * 0.035);
        return roundUpCent(newTotal);
      } else {
        const price = parseFloat(
          document.querySelector("td.align-right.RunningTotal").textContent *
            0.035
        );
        return roundUpCent(price);
      }
    },
    args: [feeElement, oldFeePrice],
  });
  console.log(receipt.result);

  // Wait for the tab to navigate to a new page
  chrome.tabs.onUpdated.addListener(function listener(
    updatedTabId,
    changeInfo
  ) {
    if (updatedTabId === tabId && changeInfo.status === "complete") {
      // Remove the listener to avoid executing this code multiple times
      chrome.tabs.onUpdated.removeListener(listener);

      // Execute a content script on the new page to autofill the number
      chrome.scripting.executeScript({
        target: { tabId },
        func: (receipt) => {
          // Find the text input and fill in the number
          const input = document.querySelector(
            'input[type="text"]#txtListPrice'
          );
          if (input) {
            input.value = receipt.result.toString();
          }
        },
        args: [receipt],
      });
    }
  });

  // Open the processing fee page
  await chrome.scripting.executeScript({
    target: { tabId },
    function: (oldFee) => {
      // const link = document.querySelector(procFeeButton.result);
      const link = () => {
        if (oldFee.result === false) {
          const hotButtons = [...document.querySelectorAll("a.hotbutton-link")];
          const feeButton = (arr) => {
            for (let i = 0; i < arr.length; i++) {
              if (
                arr[i]
                  .querySelector("div.hotbutton > p.caption")
                  .textContent.trim() == "Processing Fee"
              ) {
                return arr[i].getAttribute("href").toString();
              }
            }
          };
          return feeButton(hotButtons);
        } else {
          const rows = [
            ...document
              .querySelector("table.InvoiceDetails > tbody")
              .querySelectorAll("tr"),
          ];
          const index = () => {
            for (let i = 0; i < rows.length; i++) {
              const cells = rows[i].getElementsByTagName("td");
              for (let j = 0; j < cells.length; j++) {
                if (cells[j].textContent.trim() === "Processing Fee") {
                  return cells[j + 1]
                    .querySelector("div > a#InvoiceDetailEditLink")
                    .getAttribute("href")
                    .toString();
                }
              }
            }
          };
          return index();
        }
      };
      window.location.href = link();
    },
    args: [feeElement],
  });
});

chrome.webNavigation.onDOMContentLoaded.addListener(
  function (details) {
    // Check if the URL matches the desired pattern
    if (
      details.url &&
      details.url.startsWith("https://prod.avpos.com/Security/")
    ) {
      // Execute a content script to append the button to the page
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        func: () => {
          // Check if the button is already appended
          const buttonExists = document.getElementById("myButton");
          if (!buttonExists) {
            // Create the button element
            const button = document.createElement("button");
            button.id = "myButton";
            button.textContent = "Click Me";

            // Add an event listener to the button
            button.addEventListener("click", () => {
              // Button click action
              console.log("Button clicked!");
            });

            // Append the button to the appropriate location on the page
            const pageBody = document.getElementById("siteHeader");
            if (pageBody) {
              pageBody.appendChild(button);
            }
          }
        },
      });
    }
  },
  { url: [{ urlMatches: "https://prod.avpos.com/Security/" }] }
);
