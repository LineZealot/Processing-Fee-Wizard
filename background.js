chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {
  // Check if the URL matches the desired pattern
  if (details.url && details.url.startsWith("https://prod.avpos.com/")) {
    // Check if the URL is in the redundantUrls array
    const redundantUrls = [
      "https://prod.avpos.com/FrontDesk",
      "https://prod.avpos.com/Review",
      "https://prod.avpos.com/Manage",
      "https://prod.avpos.com/Settings",
      "https://prod.avpos.com/FrontDesk/",
      "https://prod.avpos.com/Review/",
      "https://prod.avpos.com/Manage/",
      "https://prod.avpos.com/Settings/"
    ];
    
    if (redundantUrls.some(url => details.url === url)) {
      // Remove the button if it exists
      const button = document.getElementById("myButton");
      if (button) {
        button.remove();
      }
    } else {
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
            button.textContent = "Fast Login";

            // Style the button
            button.style.backgroundColor = "rgb(76, 124, 255)";
            button.style.color = "white";
            button.style.border = "none";
            button.style.borderRadius = "8px";
            button.style.position = "absolute";
            button.style.left = "45vw";
            button.style.bottom = "5vh";
            button.style.width = "max(10vw, 64px)";
            button.style.height = "max(4vh, 12px)";

            // Add an event listener to the button
            button.addEventListener("click", () => {
              // Find the text inputs and set their values
              const input1 = document.getElementById("ClientIdentifier");
              const input2 = document.getElementById("Username");
              const input3 = document.getElementById("Password");
              if (input1 && input2 && input3) {
                input1.value = "";
                input1.removeAttribute("readonly");
                input2.value = "";
                input2.removeAttribute("readonly");
                input3.value = "";
                input3.removeAttribute("readonly");
              }
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
  }
}, { url: [{ urlMatches: "https://prod.avpos.com/" }] });
