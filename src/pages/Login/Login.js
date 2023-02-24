import React, {useCallback, useContext} from "react";
import { withRouter, Redirect} from "react-router";
import app from "../../Firebase/firebase-config";
import {AuthContext} from "../../Firebase/Auth.js";
import './login.css';
import App from "../../App";
import Navbar from "../../components/Navbar";
import Header from "../../components/Header";

 



const Login = ({ history }) => {

    const handleLogin = useCallback(
        async event => {
            event.preventDefault();
            const {email, password} = event.target.elements;
            try {
                await app
                .auth()
                .signInWithEmailAndPassword(email.value, password.value);
                App.currentUserName = email.value
                history.push("/menu");
            } catch (error) {
                alert(error);
            }
        },
        [history]
    );
    //currentUser = useContext(AuthContext);
      //  if (App.currentUserName != undefined) {
            //User ist eingeloggt }

           

           
      
            return (
              <>
                <Header />
             
        
                <div className="container" >
                    <div className="center">
                    <h1>Log in</h1>
                    <form onSubmit={handleLogin}>
                        <div className="form">
                        <label className="label">
                            Email 
                        </label>                    
                        <input className="email" type="email" placeholder="Email" />
                        <br></br><br></br>
                        <label className="label">
                            Password
                        </label>
                        
                        <input name="password" type="password" placeholder="Password"/>
                        </div>
        
                        <button type="submit">Log in</button>
                       
                   </form>
                   <br></br>
                   <a href="/signup" className="button">Sign up</a>
        
                   </div>
                </div>
        
                </>
            );

        
};



export default withRouter(Login);