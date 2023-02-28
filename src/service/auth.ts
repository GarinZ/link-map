import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { auth } from 'firebaseui';

import firebaseApp from './config';

// FirebaseUI config.
export const uiConfig: auth.Config = {
    // signInSuccessUrl: '<url-to-redirect-to-on-success>',
    signInOptions: [
        // Leave the lines as is for the providers you want to offer your users.
        GoogleAuthProvider.PROVIDER_ID,
        // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // firebase.auth.GithubAuthProvider.PROVIDER_ID,
        // firebase.auth.EmailAuthProvider.PROVIDER_ID,
        // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
    ],
    signInFlow: 'popup',
    // tosUrl and privacyPolicyUrl accept either url string or a callback
    // function.
    // Terms of service url/callback.
    // tosUrl: '<your-tos-url>',
    // Privacy policy url/callback.
    // privacyPolicyUrl() {
    //     window.location.assign('<your-privacy-policy-url>');
    // },
};

// Initialize the FirebaseUI Widget using Firebase.
export const authUI = new auth.AuthUI(getAuth(firebaseApp));
// The start method will wait until the DOM is loaded.
export const initUI = (selector?: string) => {
    authUI.start(selector ?? '#firebaseui-auth-container', uiConfig);
};
