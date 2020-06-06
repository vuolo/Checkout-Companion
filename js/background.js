chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'finishedTypingBilling') {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			chrome.tabs.sendMessage(tabs[0].id, request);
		});
	} else if (request.action == 'setNewIconPath') {
    chrome.browserAction.setIcon({
      path: request.newIconPath
    });
	}
});
