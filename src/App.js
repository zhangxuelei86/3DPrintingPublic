// Import FirebaseAuth and firebase.
import React from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase';
import LoggedIn from './views/loggedin'
import {Icon, Card} from "antd"
import "antd/dist/antd.css";
require('dotenv').config()

console.log(process.env.REACT_APP_projectID)

// Configure Firebase.
const config = {
    apiKey: process.env.REACT_APP_apiKey,
    authDomain: process.env.REACT_APP_authDomain,
    databaseURL: process.env.REACT_APP_databaseURL,
    projectId: process.env.REACT_APP_projectID,
    storageBucket: process.env.REACT_APP_storageBucket,
    messagingSenderId: process.env.REACT_APP_messagingSenderId
  };
if(!firebase.apps.length) {
  firebase.initializeApp(config);

}

const db = firebase.firestore();
db.settings({
  timestampsInSnapshots: true
})


export default class SignInScreen extends React.Component {


  // The component's Local state.
  state = {
    ready: false,  // is loaded
    isSignedIn: false // Local signed-in state.
  };

  // Configure FirebaseUI.
  uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    // We will display Google and Facebook as auth providers.
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID
    ],
    callbacks: {
      // Avoid redirects after sign-in.
      signInSuccessWithAuthResult: () => false
    }
  };

  /**
   * @function addUser
   * adds an user with a timestamp of when that user table was last updated
   * user table is in the firebase firestore cloud database
   * function only called if user does not currently exist
   * also creates a sub collection of prints for when they want to submit prints
   * 
   */
  addUser() {

    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    var curMinute = today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes();
    var curSeconds = today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds();
    var curHour = today.getHours() > 12 ? today.getHours() - 12 : (today.getHours() < 10 ? "0" + today.getHours() : today.getHours());

    const userRef = db.collection("users").doc(this.state.uid).set({
        name: this.state.name,
        balance: 0,
        lastUpdated: mm + '/' + dd + '/' + yyyy + ' | ' + curHour + ':' + curMinute + '.' + curSeconds        
    }, {merge: true})



    const userPrintRef = db.collection("users").doc(this.state.uid).collection("prints").add({
      name: 'test',
      ref: 'test',
      dateCreated: mm + '/' + dd + '/' + yyyy + ' | ' + curHour + ':' + curMinute + '.' + curSeconds   
    })

    console.log(userRef);
  }

    /**
   * @function getUser
   * Called on log in, if the user doesn't exist it calls the previous addUser function
   * if the user does exist, then we get the user and update their table with the last time their
   * user object was queried
   * 
   * we also fetch the user's prints by grabbing the print subcollection
   * and then looping through each print by descending order in terms of date submitted
   * 
   */
  getUser() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    var curMinute = today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes();
    var curSeconds = today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds();
    var curHour = today.getHours() > 12 ? today.getHours() - 12 : (today.getHours() < 10 ? "0" + today.getHours() : today.getHours());

    if (!db.collection("users").doc(this.state.uid)) {
      // Do Shit
      this.addUser()
    }
    else {
      const userRef = db.collection("users").doc(this.state.uid).set({
        name: this.state.name,
        lastUpdated: mm + '/' + dd + '/' + yyyy + ' | ' + curHour + ':' + curMinute + '.' + curSeconds        
    }, {merge: true})

    var query = db.collection("users").doc(this.state.uid).collection("prints").orderBy('dateCreated', 'desc').get()
      .then(snapshot => {
      if (snapshot.empty) {
      this.setState({
        userPrintData: false
      })
      return;
      }  
      let printData = []
      snapshot.forEach(doc => {
      printData.push(doc.data())
      });
      this.setState({
        userPrintData: printData
      })
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });
  }
  }

    /**
   * @function getUserBalance
   * @TODO actually use this function
   * 
   * due to limitations in terms of contracts signed with SchoolCashOnline, and the fact that
   * the board won't allow us to access their API, this will have to be on hold
   * 
   * initially me and Jason were planning on allowing credit card and paypal payments through
   * stripe and paypal, but that got shut down pretty quickly.
   * 
   * For now, users will print for free, but as volume increases, we will implement a balancing system
   */
  getUserBalance() {
   var balanceRef = db.collection("users").doc(this.state.uid)
   var getDoc = balanceRef.get()
    .then(doc => {
      if(!doc.exists) {
        console.log('No document found uh oh');
      } else {
        var data = doc.data()
        console.log('user balance: ', data)
        this.setState({
          balance: data.balance
        })
        console.log(this.state)
      }
    })
  }
  // Listen to the Firebase Auth state and set the local state.
  componentDidMount() {
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(
        (user) => {
            this.setState({
              ready: true
            })
            this.setState({isSignedIn: !!user});
            if (user) {
                // User is signed in.
            var displayName = user.displayName;
            var userEmail = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var userUID = user.uid;
            var userPhoneNumber = user.phoneNumber;
            var userProviderData = user.providerData;
            this.setState({
              name: displayName,
              email: userEmail,
              AvatarSRC: photoURL,
              uid: userUID,
              providerData: userProviderData,
              phoneNumber: userPhoneNumber
            })

            this.getUser();
            console.log(this.state)
            this.getUserBalance();
            console.log(user);
            user.getIdToken().then(function(accessToken) {
                    console.log(accessToken);
                });
            }
        }
    );
  }
  
  // Make sure we un-register Firebase observers when the component unmounts.
  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  render() {
    if (!this.state.ready) {
      return (
        <Icon class="load" type="loading"  style={{
          fontSize: "200px",
          position: "absolute",
          top:      "40%",
          left:     "44.25%"
        }}/>
      )
    }
    else if (!this.state.isSignedIn) {
      return (
        <div className="login--div" style={{height: '100vh'}}>
          <Card hoverable={true} title="JFSS 3D Printing Platform" style={{borderRadius: '21px', width: '20vw', height: '30vh', minWidth: '350px', position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', margin: 'auto'}}> 
          <center style={{marginBottom: '3vh'}}><span>Please Sign In With Your <strong>PDSB.net </strong>email</span></center>
          <StyledFirebaseAuth uiCallback={ui => ui.disableAutoSignIn()} uiConfig={this.uiConfig} firebaseAuth={firebase.auth()}/>
          </Card>
        </div>
      );
    }
    return (
      <LoggedIn userPrintData = {this.state.userPrintData} AvatarSRC={this.state.AvatarSRC} userBalance={this.state.balance} uid={this.state.uid}/>
    );
  }
}