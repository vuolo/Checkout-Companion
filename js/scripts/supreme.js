const debugMessages = false;
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
  const fieldsToFill = [
    {
      elementQuery: "#order_billing_name",
      value: activeProfile.autofillInformation.firstName + " " + activeProfile.autofillInformation.lastName,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#order_email",
      value: activeProfile.autofillInformation.email,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#order_tel",
      value: activeProfile.autofillInformation.phoneNumber,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#bo",
      value: activeProfile.autofillInformation.address,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#oba3",
      value: activeProfile.autofillInformation.unit,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#order_billing_zip",
      value: activeProfile.autofillInformation.zipCode,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#order_billing_city",
      value: activeProfile.autofillInformation.city,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#order_billing_country",
      value: longToShortCountries[activeProfile.autofillInformation.country.toLowerCase()] || activeProfile.autofillInformation.country,
      shouldSimulateTyping: false
    },
    {
      elementQuery: "#order_billing_state",
      value: longToShortStates[activeProfile.autofillInformation.state.toLowerCase()] || activeProfile.autofillInformation.state,
      shouldSimulateTyping: false
    },
    {
      elementQuery: "#credit_card_type",
      value: activeProfile.autofillInformation.billing.cardType,
      shouldSimulateTyping: false
    },
    {
      elementQuery: "#rnsnckrn",
      value: activeProfile.autofillInformation.billing.cardNumber.replace(new RegExp(" ", 'g'), ""),
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#credit_card_month",
      value: activeProfile.autofillInformation.billing.expirationDate.month,
      shouldSimulateTyping: false
    },
    {
      elementQuery: "#credit_card_year",
      value: "20" + activeProfile.autofillInformation.billing.expirationDate.year,
      shouldSimulateTyping: false
    },
    {
      elementQuery: "#orcer",
      value: activeProfile.autofillInformation.billing.cvc,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    },
    {
      elementQuery: "#vval",
      value: activeProfile.autofillInformation.billing.cvc,
      shouldSimulateTyping: activeProfile.settings.simulateTyping
    }
  ];

  for (var field of fieldsToFill) {
    await fillField(field.elementQuery, field.value, field.shouldSimulateTyping);
  }
  document.querySelector('.terms .icheckbox_minimal').click();

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
    if (activeProfile.settings.autoCheckoutDelay) {
      await sleep(parseInt(activeProfile.settings.autoCheckoutDelay));
    }
    document.querySelector('.button, .checkout').click();
  }
};

window.addEventListener('captchaSuccess', function() {
  captchaSolved = true;
}, false);

function getCaptcha() {
	return document.querySelector('#g-recaptcha');
}

async function fillField(elementQuery, value, shouldSimulateTyping = false) {
  const element = document.querySelector(elementQuery);
  if (!element) {
    if (debugMessages) console.log("COULD NOT FIND ELEMENT. (" + elementQuery + ")");
    return;
  }
  if (element.value == " ") {
    element.value = "";
    element.dispatchEvent(new Event('keydown'));
    element.dispatchEvent(new Event('input'));
    element.dispatchEvent(new Event('keyup'));
    element.dispatchEvent(new Event('change'));
  } else if (element.value.length > 0 && elementQuery != "#order_billing_country" && elementQuery != "#order_billing_state") {
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

const longToShortCountries = {
  "united kingdom": "GB",
  "northern ireland": "NB",
  "united states": "USA",
  "canada": "CANADA",
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
