const debugMessages = false;

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
  const fieldsToFill = [
    {
      elementQuery: "#email",
      value: activeProfile.autofillInformation.email,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#cardNumber",
      value: activeProfile.autofillInformation.billing.cardNumber.replace(new RegExp(" ", 'g'), ""),
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#cardExpiry",
      value: activeProfile.autofillInformation.billing.expirationDate.month + "/" + activeProfile.autofillInformation.billing.expirationDate.year,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#cardCvc",
      value: activeProfile.autofillInformation.billing.cvc,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#billingName",
      value: activeProfile.autofillInformation.firstName + " " + activeProfile.autofillInformation.lastName,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#billingCountry",
      value: longToShortCountries[activeProfile.autofillInformation.country.toLowerCase()] || activeProfile.autofillInformation.country,
      shouldSimulateTyping: false
    },
    {
      elementQuery: "#billingPostalCode",
      value: activeProfile.autofillInformation.zipCode,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    }
  ];

  for (var field of fieldsToFill) {
    await fillField(field.elementQuery, field.value, field.shouldSimulateTyping);
  }

  if (activeProfile.settings.autoCheckout) {
    if (activeProfile.settings.autoCheckoutDelay) {
      await sleep(parseInt(activeProfile.settings.autoCheckoutDelay));
    }
    document.querySelector(".SubmitButton").click();
  }
};

async function fillField(elementQuery, value, shouldSimulateTyping = false) {
  const element = document.querySelector(elementQuery);
  if (!element) {
    if (debugMessages) console.log("COULD NOT FIND ELEMENT. (" + elementQuery + ")");
    return;
  }
  if (element.value.length > 0 && elementQuery != "#billingCountry") {
    return;
  }
  element.focus();
  if (shouldSimulateTyping) {
    await fillFieldWithSimulatedTyping(element, value);
  } else {
    element.value = value;
    element.dispatchEvent(new Event('animationstart'));
    element.dispatchEvent(new Event('keydown'));
    element.dispatchEvent(new Event('input'));
    element.dispatchEvent(new Event('keyup'));
    element.dispatchEvent(new Event('change'));
  }
  element.blur();
}

async function fillFieldWithSimulatedTyping(element, value) {
  while (element.value != value) {
    if (element.value.length > 0) {
      element.value = "";
      element.dispatchEvent(new Event('animationstart'));
      element.dispatchEvent(new Event('keydown'));
      element.dispatchEvent(new Event('input'));
      element.dispatchEvent(new Event('keyup'));
      element.dispatchEvent(new Event('change'));
    }
    for (var char of value) {
      element.value += char;
      element.dispatchEvent(new Event('animationstart'));
      element.dispatchEvent(new Event('keydown'));
      element.dispatchEvent(new Event('input'));
      element.dispatchEvent(new Event('keyup'));
      element.dispatchEvent(new Event('change'));
      await sleep(Math.floor(Math.random() * 8));
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

const longToShortCountries = {
  "united kingdom": "GB",
  "northern ireland": "NB",
  "united states": "US",
  "canada": "CA",
  "austria": "AT",
  "belarus": "BY",
  "belgium": "BE",
  "bulgaria": "BG",
  "croatia": "HR",
  "czech republic": "CZ",
  "denmark": "DK",
  "estonia": "EE",
  "finland": "FI",
  "france": "FR",
  "germany": "DE",
  "greece": "GR",
  "hungary": "HU",
  "iceland": "IS",
  "ireland": "IE",
  "italy": "IT",
  "latvia": "LV",
  "lithuania": "LT",
  "luxembourg": "LU",
  "monaco": "MC",
  "netherlands": "NL",
  "norway": "NO",
  "poland": "PL",
  "portugal": "PT",
  "romania": "RO",
  "russia": "RU",
  "slovakia": "SK",
  "slovenia": "SI",
  "spain": "ES",
  "sweden": "SE",
  "switzerland": "CH",
  "turkey": "TR",
}
