startCheckoutCompanion();

async function startCheckoutCompanion() {
  // ######################## VARIABLES
  var activeProfileFound = false;
  const debugMessages = false;

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
  fill('email', activeProfile.autofillInformation.email, true);
  fill('name', `${activeProfile.autofillInformation.firstName} ${activeProfile.autofillInformation.lastName}`);

  fill('fullname', `${activeProfile.autofillInformation.firstName} ${activeProfile.autofillInformation.lastName}`, true);
  fill('fullName', `${activeProfile.autofillInformation.firstName} ${activeProfile.autofillInformation.lastName}`, true);

  fill('first-name', activeProfile.autofillInformation.firstName, true);
  fill('firstname', activeProfile.autofillInformation.firstName, true);
  fill('firstName', activeProfile.autofillInformation.firstName, true);

  fill('last-name', activeProfile.autofillInformation.lastName, true);
  fill('lastname', activeProfile.autofillInformation.lastName, true);
  fill('lastName', activeProfile.autofillInformation.lastName, true);

  fill('tel', activeProfile.autofillInformation.phoneNumber);
  fill('tele', activeProfile.autofillInformation.phoneNumber, true);
  fill('phone', activeProfile.autofillInformation.phoneNumber, true);

  fill('street', `${activeProfile.autofillInformation.address}`, true);
  fill('address1', `${activeProfile.autofillInformation.address}`, true);
  fill('address2', `${activeProfile.autofillInformation.unit}`, true);
  fill('unit', `${activeProfile.autofillInformation.unit}`, true);

  fill('address-line1', `${activeProfile.autofillInformation.address}, ${activeProfile.autofillInformation.unit}`, true);
  fill('address-level2', activeProfile.autofillInformation.city, true);
  fill('city', activeProfile.autofillInformation.city, true);
  fill('state', activeProfile.autofillInformation.state, true);
  fill('State', activeProfile.autofillInformation.state, true);
  fill('address-level1', activeProfile.autofillInformation.state, true);

  fill('postal-code', activeProfile.autofillInformation.zipCode, true);
  fill('zipcode', activeProfile.autofillInformation.zipCode, true);
  fill('postcode', activeProfile.autofillInformation.zipCode, true);
  fill('post-code', activeProfile.autofillInformation.zipCode, true);

  if (activeProfile.settings.autoCheckout) {
    if (activeProfile.settings.autoCheckoutDelay) {
      await sleep(parseInt(activeProfile.settings.autoCheckoutDelay));
    }
    // Stripe Popout (using js.stripe.com method)
    try { document.querySelector("#purchase-button").click(); if (activeProfile.settings.simulateTyping) { await sleep(128); } document.querySelector("#form-actions-button").click(); } catch(err) {}
  }
};

function fill(name, value, useKeywords = false) {
  let element;
  element = fillByAutocomplete(name, value);
	if (element) {
    console.log("FOUND AUTO COMPLETE FOR: " + name + ". SET VALUE TO: " + value);
    console.log(element);
    return;
  }
  element = fillByName(name, value);
  if (element) {
    console.log("FOUND NAME FOR: " + name + ". SET VALUE TO: " + value);
    console.log(element);
    return;
  }
  element = fillById(name, value);
  if (element) {
    console.log("FOUND ID FOR: " + name + ". SET VALUE TO: " + value);
    console.log(element);
    return;
  }
  if (useKeywords) {
    element = fillByKeyword(name, value);
    if (element) {
      console.log("FOUND KEYWORDS FOR: " + name + ". SET VALUE TO: " + value);
      console.log(element);
      return;
    }
  }
}

function fillByAutocomplete(name, value) {
  let elements = document.querySelectorAll(`input [autocomplete=${name}]`);
  if (elements.length == 0) {
    elements = document.querySelectorAll(`select [autocomplete=${name}]`);
    elements.forEach(function (element) {
      autofill(element, value);
    });
  }
  elements.forEach(function (element) {
    autofill(element, value);
  });
  if (elements.length > 0) {
    return elements;
  }
  return false;
}

function fillByName(name, value) {
	let element = document.querySelector('input [name="' + name + '"]');
  if (!element) {
    element = document.querySelector("select #" + name);
  }
	if (element) {
		autofill(element, value);
    return element;
	}
  return false;
}

function fillById(name, value) {
	let element = document.querySelector("input #" + name);
  if (!element) {
    element = document.querySelector("select #" + name);
  }
	if (element) {
		autofill(element, value);
    return element;
	}
  return false;
}

function fillByKeyword(keyword, value) {
	const elements = document.querySelectorAll("input, select");
  for (var element of elements) {
    if (element.id.includes(keyword)) {
      autofill(element, value);
      return element;
    } else if (element.name.includes(keyword)) {
      autofill(element, value);
      return element;
    } else {
      for (var elementClass of element.classList) {
        if (elementClass.includes(keyword)) {
          autofill(element, value);
          return element;
        }
      }
    }
  }
  return false;
}

function autofill(element, value) {
  try {
    if (element.value && element.value.length > 0) {
      return;
    }
    let event = document.createEvent("HTMLEvents");
    event.initEvent('change', true, false);
    element.focus();
    element.dispatchEvent(new Event('keydown'));
    element.dispatchEvent(new Event('input'));
    element.dispatchEvent(new Event('keyup'));
    element.value = value;
    element.dispatchEvent(event);
    element.blur();
  } catch(err) {}
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
