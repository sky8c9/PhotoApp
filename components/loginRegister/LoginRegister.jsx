import React from 'react';
import axios from 'axios';

import {
  Button, Grid, TextField, Typography, Divider
} from '@material-ui/core';

import './LoginRegister.css';
class LoginRegister extends React.Component {
  constructor(props) {
    super(props);
    this.state = ({
      loginName:'', 
      password:'',
      firstName:'',
      lastName:'',
      registerName:'',
      registerPass:'',
      confirmPass:'',
      location:'',
      description:'',
      occupation:'',
      logInStatus:'',
      signUpStatus:''
    });

    this.props.setView("Sign In Page");
  }

  resetLogin() {
    this.setState({loginName:''});
    this.setState({password:''});
  }

  resetForm() {
    this.resetLogin();
    this.setState({firstName:''});
    this.setState({lastName:''});
    this.setState({registerName:''});
    this.setState({registerPass:''}); 
    this.setState({confirmPass:''}); 
    this.setState({location:''});
    this.setState({description:''});
    this.setState({occupation:''});
    this.setState({logInStatus:''});
  }



  handleLogIn() {
    if (!this.state.loginName || !this.state.password) {
      this.setState({loginStatus:"Please enter required fields"});
      return;
    }

    let url = "/admin/login";
    axios.post(url, {login_name : this.state.loginName, password : this.state.password}).then(response => {
      this.props.resetLogin(response.data);
    })
    .catch(error => {
      this.resetLogin();
      this.setState({logInStatus:error.response.data});
    });
  }

  handleRegister() {
    if (!this.state.firstName || !this.state.lastName || !this.state.registerName || !this.state.registerPass || !this.state.confirmPass) {
      this.setState({signUpStatus:"Please enter required fields"});
      return;
    }

    if (this.state.registerPass !== this.state.confirmPass) {
      this.setState({signUpStatus:"The passwords do not match"});
      return;
    }

    let url = "/user";
    axios.post(url, {
      login_name : this.state.registerName, 
      password : this.state.registerPass,
      first_name : this.state.firstName,
      last_name : this.state.lastName,
      location : this.state.location,
      description : this.state.description,
      occupation : this.state.occupation,
      })
    .then(response => {
      this.resetForm();
      this.setState({signUpStatus:response.data});
    })
    .catch(error => {
      this.setState({signUpStatus:error.response.data});
    });
  }

  logInForm() {
    return (
      <Grid container item xs={6} spacing={2} direction="column" alignItems="center">
        <Grid item>
          <Typography variant="h6" color="primary"> Existing User </Typography>
        </Grid>
        <Grid item>
          <TextField 
            id="userName"
            label="UserName"
            value={this.state.loginName}
            variant="outlined"
            onChange={() => this.setState({loginName:event.target.value})}
          />
        </Grid>
        <Grid item>
          <TextField
            id="logPass"
            label="Password"
            value={this.state.password}
            type="password"
            variant="outlined"
            onChange={() => this.setState({password:event.target.value})}
          />  
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={()=>this.handleLogIn()}
          >
            Login
          </Button>
        </Grid>
        <Grid item>
          <Typography color="secondary">{this.state.logInStatus ? this.state.logInStatus : null}</Typography>
        </Grid>
      </Grid>
    );
  }

  signUpForm() {
    return (
      <Grid container item xs={6} spacing={2} direction="column" justify="space-evenly" alignItems="center">
        <Grid item>
          <Typography variant="h6" color="primary">New User Register</Typography>
        </Grid>
        <Grid item>
          <TextField
            id="fname"
            label="First Name"
            required
            value={this.state.firstName}
            helperText={!this.state.firstName ? "This field is required" : null}
            onChange={()=>this.setState({firstName:event.target.value})}
          />
        </Grid>
        <Grid item>
          <TextField
            id="lname"
            label="Last Name"
            value={this.state.lastName}
            required
            helperText={!this.state.lastName ? "This field is required" : null}
            onChange={()=>this.setState({lastName:event.target.value})}
          />
        </Grid>   
        <Grid item>
          <TextField
            id="userName"
            label="Login Name"
            value={this.state.registerName}
            required
            helperText={!this.state.registerName ? "This field is required" : null}
            onChange={()=>this.setState({registerName:event.target.value})}
          />
        </Grid>
        <Grid item>
          <TextField
            id="pass"
            label="Password"
            value={this.state.registerPass}
            type="password"
            required
            helperText={!this.state.registerPass ? "This field is required" : null}
            onChange={()=>this.setState({registerPass:event.target.value})}
          />
        </Grid>
        <Grid item>
          <TextField
            id="confPass"
            label="Confirm Password"
            value={this.state.confirmPass}
            type="password"
            required
            helperText={!this.state.confirmPass ? "This field is required" : null}
            onChange={()=>this.setState({confirmPass:event.target.value})}
          />
        </Grid>
        <Grid item>
          <TextField  label="Location" 
                      value={this.state.location}
                      onChange={()=>this.setState({location:event.target.value})}
          />
        </Grid>
        <Grid item>
          <TextField  label="Description" 
                      value={this.state.description}
                      onChange={()=>this.setState({description:event.target.value})}
          />
        </Grid>
        <Grid item>
          <TextField  label="Occupation" 
                      value={this.state.occupation}
                      onChange={()=>this.setState({occupation:event.target.value})}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={() => this.handleRegister()}
          >
            Register Me
          </Button>
        </Grid>
        <Grid item>
          <Typography color="secondary">{this.state.signUpStatus ? this.state.signUpStatus : null}</Typography>
        </Grid>
      </Grid>
    );
  }

  render() {
    return (
      <Grid container direction="row" justify="center">
        {this.logInForm()}
        <Divider orientation="vertical" flexItem />
        {this.signUpForm()}
      </Grid>
    );
  }
}

export default LoginRegister;
