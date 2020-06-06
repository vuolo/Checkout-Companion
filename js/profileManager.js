const DEFAULT_SETTINGS = {
  activeProfileIndex: -1,
  enabled: true,
  isLoggedIn: false
};

var autofillData = {
  settings: DEFAULT_SETTINGS,
  profiles: []
};

let curIconPath = "";
var isLoggedInBeforeVueInitialized = null;
let autofillApp;
(async () => {
  autofillData = await getAutofillData() || {};
  validateAutofillData(autofillData);

  autofillApp = new Vue({
    el: "#Autofill",
    data: {
      settings: autofillData.settings,
      profiles: autofillData.profiles,
      isEditingBilling: false,
      curValue: {},
      window: window
    },
    methods: {
      setIconPath: function() {
        let newIconPath;
        if (this.settings.enabled && this.settings.isLoggedIn) {
          newIconPath = "../icons/icon128.png";
        } else {
          newIconPath = "../icons/icon128_bw.png";
        }
        if (curIconPath != newIconPath) {
          curIconPath = newIconPath;
          // send message to background script
          chrome.runtime.sendMessage({ action: 'setNewIconPath', newIconPath: newIconPath });
        }
      },
      saveProfiles: saveProfiles,
      getCardTypeLocation: function() {
        var cardType = "";
        if (this.settings.activeProfileIndex != -1) {
          cardType = getCardType(this.profiles[this.settings.activeProfileIndex].autofillInformation.billing.cardNumber.replace(new RegExp(" ", 'g'), ""));
          this.profiles[this.settings.activeProfileIndex].autofillInformation.billing.cardType = cardType;
        }
        if (cardType == "Visa") {
          return "../images/Card Providers/Visa_Icon.png";
        } else if (cardType == "AMEX") {
          return "../images/Card Providers/AmericanExpress_Icon.png";
        } else if (cardType == "Diners") {
          return "../images/Card Providers/Diners_Icon.png";
        } else if (cardType == "JCB") {
          return "../images/Card Providers/JCB_Icon.png";
        } else if (cardType == "Mastercard") {
          return "../images/Card Providers/Mastercard_Icon.png";
        } else if (cardType == "Discover") {
          return "../images/Card Providers/Discover_Icon.png";
        }
        return "../images/Emoticons/faces/Happy.png";
      },
      getLastFour: function() {
        if (this.settings.activeProfileIndex == -1) {
          return "----";
        }
        let cardNumber = this.profiles[this.settings.activeProfileIndex].autofillInformation.billing.cardNumber.replace(new RegExp(" ", 'g'), "");
        var outValue = "";
        try {
          outValue = cardNumber.substring(cardNumber.length - 4, cardNumber.length);
        } catch(err) {
          return "----";
        }
        if (outValue.length == 0) {
          return "----";
        }
        return outValue;
      },
      applyCardNumberFormat: applyCardNumberFormat,
      applyExpirationDateFormat: applyExpirationDateFormat,
      delCurProfile: function() {
        if (this.settings.activeProfileIndex == -1) {
          return;
        }
        this.profiles.splice(this.settings.activeProfileIndex--, 1);
      },
      selectProfileFromEvent: function(event) {
        this.settings.activeProfileIndex = parseInt(event.target.value);
        this.curValue = {};
        this.isEditingBilling = false;
      },
      makeNewProfileWithValue: function(field, type, value) {
        var newProfile = {
          settings: {
            autoCheckout: false,
            autoCheckoutDelay: null,
            simulateTyping: false
          },
          autofillInformation: {
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            address: "",
            unit: "",
            zipCode: "",
            city: "",
            state: "",
            country: "",
            billing: {
              cardNumber: "",
              cardType: "",
              expirationDateFull: "",
              expirationDate: {
                month: "",
                year: ""
              },
              cvc: ""
            }
          }
        };
        if (type == 'main') {
          newProfile.autofillInformation[field] = value;
        } else if (type == 'billing') {
          newProfile.autofillInformation.billing[field] = value;
        } else if (type == 'settings') {
          newProfile.settings[field] = value;
        }
        this.profiles.push(newProfile);
        this.settings.activeProfileIndex = this.profiles.length - 1;
      }
    }
  });
})();

function validateAutofillData(autofillData) {
  if (autofillData.settings == undefined) {
    autofillData = {
      settings: DEFAULT_SETTINGS,
      profiles: []
    };
  } else {
    if (autofillData.settings.enabled == undefined) {
      autofillData.settings = DEFAULT_SETTINGS;
    }
    if (autofillData.profiles == undefined) {
      autofillData.profiles = [];
    }
  }
}

async function getAutofillData() {
  return await new Promise(function(resolve, reject) {
    chrome.storage.sync.get({ profiles: [], settings: {} }, function(results) {
      if (isLoggedInBeforeVueInitialized != null) {
        results.settings.isLoggedIn = isLoggedInBeforeVueInitialized;
      }
      var autofillData = {
        settings: results.settings,
        profiles: results.profiles
      };
      resolve(autofillData);
    });
  });
}

function numberWithSpaces(x) {
  var incomingValue = x.toString();
  let formattedValue = "";
  for (var i = 0; i < incomingValue.length; i++) {
    if (i % 4 == 0 && i != 0) {
      formattedValue += " ";
    }
    formattedValue += incomingValue.charAt(i);
  }
  return formattedValue;
}

const NUMBERS_ALLOWED = '0123456789';
function getOnlyNumbers(value) {
  let newValue = "";
  for (var char of value) {
    for (var numberAllowed of NUMBERS_ALLOWED) {
      if (char == numberAllowed) {
        newValue += char;
        break;
      }
    }
  }
  return newValue;
}

function setCardNumberFormat() {
  const cardNumberElement = document.querySelector("#cardNumber");
  let outValue = numberWithSpaces(getOnlyNumbers(cardNumberElement.value));
  cardNumberElement.value = outValue;
  if (autofillApp.settings.activeProfileIndex == -1) {
    autofillApp.curValue.cardNumber = outValue;
  } else {
    autofillApp.profiles[autofillApp.settings.activeProfileIndex].autofillInformation.billing.cardNumber = outValue;
  }
}

function applyCardNumberFormat() {
  setTimeout(function() {
    setCardNumberFormat();
    $("#cardNumber").on('change keydown paste input', function() {
      setCardNumberFormat();
    });
  }, 50);
}

function numberWithSlash(x) {
  var incomingValue = x.toString();
  let formattedValue = "";
  for (var i = 0; i < incomingValue.length; i++) {
    if (i == 2) {
      formattedValue += "/";
    }
    formattedValue += incomingValue.charAt(i);
  }
  return formattedValue;
}

function setApplicationDateFormat() {
  const expirationDateElement = document.querySelector("#expirationDateFull");
  let outValue = numberWithSlash(getOnlyNumbers(expirationDateElement.value));
  expirationDateElement.value = outValue;
  if (autofillApp.settings.activeProfileIndex == -1) {
    autofillApp.curValue.expirationDateFull = outValue;
  } else {
    autofillApp.profiles[autofillApp.settings.activeProfileIndex].autofillInformation.billing.expirationDateFull = outValue;
    try {
      autofillApp.profiles[autofillApp.settings.activeProfileIndex].autofillInformation.billing.expirationDate.month = outValue.split("/")[0];
      autofillApp.profiles[autofillApp.settings.activeProfileIndex].autofillInformation.billing.expirationDate.year = outValue.split("/")[1];
    } catch(err) {
      // console.log(err);
    }
  }
}

function applyExpirationDateFormat() {
  setTimeout(function() {
    setApplicationDateFormat();
    $("#expirationDateFull").on('change keydown paste input', function() {
      setApplicationDateFormat();
    });
  }, 50);
}

function getCardType(number) {
  // visa
  var re = new RegExp("^4");
  if (number.match(re) != null)
    return "Visa";

  // Mastercard
  // Updated for Mastercard 2017 BINs expansion
   if (/^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/.test(number))
    return "Mastercard";

  // AMEX
  re = new RegExp("^3[47]");
  if (number.match(re) != null)
    return "AMEX";

  // Discover
  re = new RegExp("^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)");
  if (number.match(re) != null)
    return "Discover";

  // Diners
  re = new RegExp("^36");
  if (number.match(re) != null)
    return "Diners";

  // Diners - Carte Blanche
  re = new RegExp("^30[0-5]");
  if (number.match(re) != null)
    // return "Diners - Carte Blanche";
    return "Diners";

  // JCB
  re = new RegExp("^35(2[89]|[3-8][0-9])");
  if (number.match(re) != null)
    return "JCB";

  // Visa Electron
  re = new RegExp("^(4026|417500|4508|4844|491(3|7))");
  if (number.match(re) != null)
    // return "Visa Electron";
    return "Visa";

  return "";
}

async function saveProfiles() {
  chrome.storage.sync.set({ profiles: autofillApp.profiles, settings: autofillApp.settings }, function() {
    console.log("saved profiles and settings!");
  });
}

function getLoginInformation() {
  $.get('https://resell.monster/api/check_login', function (data) {
    if (data.status == "success") {
      // login
      try {
        autofillApp.settings.isLoggedIn = true;
      } catch(err) {
        isLoggedInBeforeVueInitialized = true;
      }
    } else {
      // logout
      try {
        autofillApp.settings.isLoggedIn = false;
      } catch(err) {
        isLoggedInBeforeVueInitialized = false;
      }
      // window.open("https://resell.monster/login");
    }
  });
}

getLoginInformation();

setInterval(function() {
  saveProfiles();
}, 1000)

let clouds = [
	"../images/Backgrounds/clouds/cloud-lrg.png",
	"../images/Backgrounds/clouds/cloud-med.png",
	"../images/Backgrounds/clouds/cloud-sml.png"
];

let cloudsElem = document.querySelector('#clouds');
for (var i = 1; i <= 8; i++) {
	let newCloud = document.createElement('img');
	newCloud.setAttribute('alt', 'cloud');
	newCloud.setAttribute('class', 'homeForegroundCloud');
	newCloud.setAttribute('src', grabRandomCloud());
  newCloud.style.transform = "scale(0.7)";
	newCloud.style.top = i == 1 ? "5%" : i == 2 ? "24%" : i == 3 ? "39%" : i == 4 ? "46%" : i == 5 ? "64%" : i == 6 ? "76%" : i == 7 ? "87%" : "94%";
	newCloud.style.left = Math.floor(Math.random() * 100) + '%';
	cloudsElem.appendChild(newCloud);

	setInterval(function() {
		newCloud.style.left = parseFloat(newCloud.style.left.replace('%', '')) - 0.01543281 + '%';
		if (parseInt(newCloud.style.left.replace('%', '')) <= -35) {
			newCloud.style.left = 125 + '%';
		}
	}, Math.floor(Math.random() * 10) * 10) + 10;
}

function grabRandomCloud() {
	return clouds[Math.floor(Math.random() * clouds.length)];
}
