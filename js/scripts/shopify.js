const debugMessages = false;
var awaitingContinueToNextStep = false;
let finishedTypingBillingCount = 0;
let captchaSolved = false;

startCheckoutCompanion();

async function startCheckoutCompanion() {
  // ######################## VARIABLES
  var activeProfileFound = false;

  // ######################## GET ACTIVE PROFILE
  if (debugMessages) console.log("getting active profile...")
  const activeProfile = await getActiveProfile();
  activeProfileFound = activeProfile.settings ? true : false;
  if (activeProfileFound) {
    if (debugMessages) console.log("FOUND ACTIVE PROFILE:");
    if (debugMessages) console.log(activeProfile);
  } else {
    if (debugMessages) console.log("ERR: COULD NOT FIND ACTIVE PROFILE");
    return;
  }

  // ######################## RUN SCRIPT USING ACTIVE PROFILE
  var fieldsToFill = [];
  if (getCurrentStep() == "contact_information") {
    fieldsToFill = [
      {
        elementQuery: "#checkout_email",
        value: activeProfile.autofillInformation.email,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_email_or_phone",
        value: activeProfile.autofillInformation.email,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: '[name="checkout[email_or_phone]"]',
        value: activeProfile.autofillInformation.email,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: '[name="checkout[email]"]',
        value: activeProfile.autofillInformation.email,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_shipping_address_first_name",
        value: activeProfile.autofillInformation.firstName,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_shipping_address_last_name",
        value: activeProfile.autofillInformation.lastName,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_shipping_address_address1",
        value: activeProfile.autofillInformation.address,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_shipping_address_address2",
        value: activeProfile.autofillInformation.unit,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_shipping_address_city",
        value: activeProfile.autofillInformation.city,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_shipping_address_country",
        value: activeProfile.autofillInformation.country,
        shouldSimulateTyping: false
      },
      {
        elementQuery: "#checkout_shipping_address_province",
        value: longToShortStates[activeProfile.autofillInformation.state.toLowerCase()] || activeProfile.autofillInformation.state,
        shouldSimulateTyping: false
      },
      {
        elementQuery: "#checkout_shipping_address_zip",
        value: activeProfile.autofillInformation.zipCode,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_shipping_address_phone",
        value: activeProfile.autofillInformation.phoneNumber,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      }
    ];
  } else if (getCurrentStep() == "payment_method") {
    fieldsToFill = [
      {
        elementQuery: "#checkout_billing_address_first_name",
        value: activeProfile.autofillInformation.firstName,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_billing_address_last_name",
        value: activeProfile.autofillInformation.lastName,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_billing_address_address1",
        value: activeProfile.autofillInformation.address,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_billing_address_address2",
        value: activeProfile.autofillInformation.unit,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_billing_address_city",
        value: activeProfile.autofillInformation.city,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_billing_address_country",
        value: activeProfile.autofillInformation.country,
        shouldSimulateTyping: false
      },
      {
        elementQuery: "#checkout_billing_address_province",
        value: activeProfile.autofillInformation.state,
        shouldSimulateTyping: false
      },
      {
        elementQuery: "#checkout_billing_address_zip",
        value: activeProfile.autofillInformation.zipCode,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      },
      {
        elementQuery: "#checkout_billing_address_phone",
        value: activeProfile.autofillInformation.phoneNumber,
        shouldSimulateTyping: activeProfile.settings.simulateTyping
      }
    ];
  }

  for (var field of fieldsToFill) {
    await fillField(field.elementQuery, field.value, field.shouldSimulateTyping);
  }

  if (getCurrentStep() == "contact_information") {
    // disable receive updates
    try { document.querySelector("#checkout_buyer_accepts_marketing").checked = false; } catch(err) {}
  } else if (getCurrentStep() == "payment_method") {
    // enable use same address as shipping
    try { document.querySelector("#checkout_different_billing_address_false").click(); } catch(err) {}
  }

  if (activeProfile.settings.autoCheckout) {
    if (getCaptcha()) { // wait until captcha is solved THEN try to continue to next step after solving it.
      if (debugMessages) console.log("CAPTCHA FOUND.");
      if (debugMessages) console.log(getCaptcha());
      while (!captchaSolved) { // wait for captcha to be solved
        if (debugMessages) console.log("WAITING FOR CAPTCHA TO BE SOLVED...");
        await sleep(50);
      }
      if (debugMessages) console.log("CAPTCHA SOLVED.");
    } else {
      if (debugMessages) console.log("CAPTCHA NOT FOUND.");
    }
    if (getCurrentStep() != "payment_method") { // not on payment page
      continueToNextStep();
    } else if (awaitingContinueToNextStep) {
      continueToNextStep(activeProfile.settings.autoCheckoutDelay);
    }
  }

  chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'finishedTypingBilling' && request.checkoutToken == getCheckoutToken()) {
      finishedTypingBillingCount++;
      if (finishedTypingBillingCount >= 4 && activeProfile.settings.autoCheckout) {
        continueToNextStep(activeProfile.settings.autoCheckoutDelay);
      }
    }
  });
};

window.addEventListener('captchaSuccess', function() {
  captchaSolved = true;
}, false);

chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'finishedTypingBilling' && request.checkoutToken == getCheckoutToken()) {
    finishedTypingBillingCount++;
    if (finishedTypingBillingCount >= 4) {
      awaitingContinueToNextStep = true;
    }
  }
});

function getCaptcha() {
	return document.querySelector('#g-recaptcha');
}

async function continueToNextStep(autoCheckoutDelay = null) {
  let continueButton;
  while (!continueButton || continueButton.getAttribute("disabled")) { // TODO: fix this to guarantee the button is clickable to go to next step
    continueButton = document.querySelector('.step__footer__continue-btn');
    if (!continueButton || continueButton.getAttribute("disabled")) {
      if (debugMessages) console.log("LOOKING FOR ENABLED CONTINUE BUTTON");
      await sleep(50);
    }
  }
  if (debugMessages) console.log("FOUND ENABLED CONTINUE BUTTON:");
  if (debugMessages) console.log(continueButton);
  if (autoCheckoutDelay && getCurrentStep() == "payment_method") {
    await sleep(parseInt(autoCheckoutDelay));
  }
  continueButton.click();
}

function getCurrentStep() {
  var curStep = "";
  try {
    if (location.href.includes("&step=")) {
      curStep = location.href.substring(
        location.href.indexOf('&step=') + '&step='.length,
        location.href.length
      );
      curStep = outCheckoutToken.substring(
        0,
        outCheckoutToken.indexOf("&") || outCheckoutToken.length
      ).replace(/(\r\n|\n|\r)/gm,"").replace(" ", "");
    } else if (location.href.includes("?step=")) {
      curStep = location.href.substring(
        location.href.indexOf('?step=') + '?step='.length,
        location.href.length
      );
      curStep = outCheckoutToken.substring(
        0,
        outCheckoutToken.indexOf("&") || outCheckoutToken.length
      ).replace(/(\r\n|\n|\r)/gm,"").replace(" ", "");
    } else {
      curStep = document.querySelector('[data-step]').dataset.step;
    }
  } catch(err) {
    return curStep
  }
  return curStep
}

function getCheckoutToken() {
  const headerScripts = document.querySelectorAll("head > script");
  for (var headerScript of headerScripts) {
    if (headerScript.innerHTML.includes("DF_CHECKOUT_TOKEN")) {
      let outCheckoutToken = headerScript.innerHTML.substring(
        headerScript.innerHTML.indexOf('var DF_CHECKOUT_TOKEN = "') + 'var DF_CHECKOUT_TOKEN = "'.length,
        headerScript.innerHTML.length
      ).replace('";', '').replace(/(\r\n|\n|\r)/gm,"").replace(" ", "");
      return outCheckoutToken;
    }
  }
  return "";
}

async function fillField(elementQuery, value, shouldSimulateTyping = false) {
  let element = document.querySelector(elementQuery);
  if (!element) {
    if (debugMessages) console.log("COULD NOT FIND ELEMENT. (" + elementQuery + ")");
    return;
  }
  if (element.value.length > 0 && elementQuery != "#checkout_shipping_address_country" && elementQuery != "#checkout_shipping_address_province" && elementQuery != "#checkout_billing_address_country" && elementQuery != "#checkout_billing_address_province") {
    return;
  }
  element.focus();
  if (shouldSimulateTyping) {
    await fillFieldWithSimulatedTyping(element, value);
  } else {
    element.value = value;
    element.dispatchEvent(new Event('keydown'));
    element.dispatchEvent(new Event('input'));
    element.dispatchEvent(new Event('keyup'));
    element.dispatchEvent(new Event('change'));
  }
  element.blur();
}

async function fillFieldWithSimulatedTyping(element, value) {
  for (var char of value) {
    element.value += char;
    element.dispatchEvent(new Event('keydown'));
    element.dispatchEvent(new Event('input'));
    element.dispatchEvent(new Event('keyup'));
    element.dispatchEvent(new Event('change'));
    await sleep(Math.floor(Math.random() * 8));
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const longToShortStates = {
  "alabama": "AL",
  "alaska": "AK",
  "american samoa": "AS",
  "arizona": "AZ",
  "arkansas": "AR",
  "california": "CA",
  "colorado": "CO",
  "connecticut": "CT",
  "delaware": "DE",
  "district of columbia": "DC",
  "federated states of micronesia": "FM",
  "florida": "FL",
  "georgia": "GA",
  "guam": "GU",
  "hawaii": "HI",
  "idaho": "ID",
  "illinois": "IL",
  "indiana": "IN",
  "iowa": "IA",
  "kansas": "KS",
  "kentucky": "KY",
  "louisiana": "LA",
  "maine": "ME",
  "marshall islands": "MH",
  "maryland": "MD",
  "massachusetts": "MA",
  "michigan": "MI",
  "minnesota": "MN",
  "mississippi": "MS",
  "missouri": "MO",
  "montana": "MT",
  "nebraska": "NE",
  "nevada": "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  "northern mariana islands": "MP",
  "ohio": "OH",
  "oklahoma": "OK",
  "oregon": "OR",
  "palau": "PW",
  "pennsylvania": "PA",
  "puerto rico": "PR",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  "tennessee": "TN",
  "texas": "TX",
  "utah": "UT",
  "vermont": "VT",
  "virgin islands": "VI",
  "virginia": "VA",
  "washington": "WA",
  "west virginia": "WV",
  "wisconsin": "WI",
  "wyoming": "WY"
}

async function getActiveProfile() {
  return await new Promise(function(resolve, reject) {
    chrome.storage.sync.get({ profiles: [], settings: {} }, function(results) {
      if (results.settings && results.settings.activeProfileIndex != -1) {
        if (results.settings.isLoggedIn && results.settings.enabled) {
          resolve(results.profiles[results.settings.activeProfileIndex]); // return active profile
        }
      }
      resolve({}); // return empty object if no active profile is found
    });
  });
}
