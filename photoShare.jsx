import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch, Redirect
} from 'react-router-dom';

import {
  Grid, Paper
} from '@material-ui/core';
import './styles/main.css';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/UserDetail';
import UserList from './components/userList/UserList';
import UserPhotos from './components/userPhotos/UserPhotos';
import LoginRegister from './components/loginRegister/LoginRegister';
import UserActivity from './components/userActivity/userActivity';
import Favorite from './components/favorite/Favorite';
class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = ({
      view:'Home',
      curUserId:JSON.parse(sessionStorage.getItem('user'))
    });

    this.setView = this.setView.bind(this);
    this.resetLogin = this.resetLogin.bind(this);
    this.expiredSession = this.expiredSession.bind(this);
  }

  resetLogin(id) {
    if (!id) {
      this.setState({curUserId:undefined});
    } else {
      this.setState({curUserId:id});
    }
  }

  expiredSession() {
    sessionStorage.clear();
    window.location.href = `#/login-register`;
    this.setState({curUserId:undefined});
  }

  setView(name) {
    this.setState({view:name});
  }

  componentDidUpdate(prev) {
    if (prev.curUserId !== this.state.curUserId) {
      sessionStorage.setItem('user', JSON.stringify(this.state.curUserId));
    }
  }

  render() {
    return (
      <HashRouter>
      <div>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <TopBar view={this.state.view} 
                  resetLogin={this.resetLogin} 
                  curUserId={this.state.curUserId}
                  expiredSession={this.expiredSession}
          />
        </Grid>
        <div className="cs142-main-topbar-buffer"/>
        <Grid item sm={3}>
          {
            this.state.curUserId ?
              <Paper className="cs142-main-grid-item">
                <UserActivity 
                  expiredSession={this.expiredSession}
                />
              </Paper>
            :
              <Paper/>
          }
        </Grid>
        <Grid item sm={this.state.curUserId ? 9 : 12}>
          <Paper className="cs142-main-grid-item">
            <Switch>
              <Route exact path="/">
                {
                  this.state.curUserId ?
                    <Redirect path="/login-register" to={`/users/${this.state.curUserId}`} />
                  :
                    <Redirect path="/" to="/login-register" />
                }
              </Route>

              {
                !this.state.curUserId ?
                  <Route path="/login-register"
                    render ={ props => <LoginRegister
                                          {...props}
                                          resetLogin={this.resetLogin} 
                                          setView={this.setView} 
                                        /> }
                  />
                :
                  <Redirect path="/login-register" to={`/users/${this.state.curUserId }`} />
              }

              {
                this.state.curUserId ?
                  <Route path="/users/:userId" 
                    render={props => <UserDetail {...props} 
                                                  setView={this.setView}
                                                  expiredSession={this.expiredSession}
                                                  curUserId={this.state.curUserId} 
                                    /> }  
                  />  
                :
                  <Redirect path="/users/:userId" to="/login-register" />
              }

              {
                this.state.curUserId ?
                  <Route path="/photos/:userId"
                    render ={ props => <UserPhotos  {...props} 
                                                    setView={this.setView} 
                                                    curUserId={this.state.curUserId} 
                                                    expiredSession={this.expiredSession}
                                        /> }
                  />
                :
                  <Redirect path="/photos/:userId" to="/login-register" />
              }

              {
                this.state.curUserId ?
                  <Route  path="/users" 
                          render={ props =>  <UserList 
                                                {...props}
                                                setView={this.setView}
                                                curUserId={this.state.curUserId} 
                                                expiredSession={this.expiredSession}
                                              /> }
                  />
                :
                  <Redirect path="/users" to="/login-register" />
              }

              {
                this.state.curUserId ?
                  <Route path="/favorites"
                    render ={ props => <Favorite  
                                          {...props}
                                          setView={this.setView} 
                                          expiredSession={this.expiredSession}
                                        /> }
                  />
                :
                  <Redirect path="/favorites" to="/login-register" />
              }

            </Switch>          
          </Paper>
        </Grid>
      </Grid>
      </div>
    </HashRouter>
    );
  }
}

ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);
