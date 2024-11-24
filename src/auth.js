// Initialize FirebaseUI
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// FirebaseUI Configuration
function getUiConfig() {
  return {
    callbacks: {
      signInSuccess: function (user, credential, redirectUrl) {
        handleSignedInUser(user);
        // Do not redirect.
        return false;
      },
    },
    signInFlow: "popup", // Use popup for the sign-in flow
    signInOptions: [
      {
        provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        recaptchaParameters: {
          type: "image", // Can also be 'audio'
          size: "invisible", // Other options are 'normal' or 'compact'
          badge: "bottomleft", // Position of the reCAPTCHA badge
        },
      },
    ],
    tosUrl: "https://www.google.com", // Terms of service URL
  };
}

// Monitor authentication state
firebase.auth().onAuthStateChanged(function (user) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("loaded").style.display = "block";

  if (user) {
    handleSignedInUser(user);
  } else {
    handleSignedOutUser();
  }
});

// Handle signed-in user
function handleSignedInUser(user) {
  document.getElementById("user-signed-in").style.display = "block";
  document.getElementById("user-signed-out").style.display = "none";
  document.getElementById("phone").textContent = `Phone: ${
    user.phoneNumber || "N/A"
  }`;
}

// Handle signed-out user
function handleSignedOutUser() {
  document.getElementById("user-signed-in").style.display = "none";
  document.getElementById("user-signed-out").style.display = "block";

  // Configure FirebaseUI
  ui.start("#firebaseui-container", getUiConfig());
}

// Add sign-out functionality on page load
window.addEventListener("load", function () {
  document.getElementById("sign-out").addEventListener("click", function () {
    firebase.auth().signOut();
  });
});
