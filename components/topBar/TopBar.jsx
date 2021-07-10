import React from 'react';
import axios from 'axios';

import {
  AppBar, Button, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, IconButton, Toolbar, 
  Typography, Grid, Menu, MenuItem, Tooltip,
} from '@material-ui/core';

import SentimentVerySatisfiedRoundedIcon from '@material-ui/icons/SentimentVerySatisfiedRounded';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import HomeIcon from '@material-ui/icons/Home';
import MenuIcon from '@material-ui/icons/Menu';
import './TopBar.css';

class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {  schemaInfo:undefined, 
                    menuPos:undefined, 
                    menuOpen:false,
                    dialogOpen:false,
                  };
  }

  fetchSchemaInfo() {
    let url = "/test/info";
    axios.get(url).then(response => {
      this.setState({schemaInfo : response.data});
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    });
  }

  fetchUserMentions() {
    let url = "/usersMentioned/" + this.props.curUserId;
    axios.get(url).then(response => {
      this.setState({mentions : response.data});
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    });
  }

  componentDidMount() {
    this.fetchSchemaInfo();
  }

  handleLogOut() {
    let url = "/admin/logout";
    axios.post(url).then(() => {
      this.props.resetLogin(undefined);
      this.setState({menuOpen:false});
      sessionStorage.clear();
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    });
  }

  handleDelAccount() {
    let url = "/delUser";
    axios.post(url).then(() => {
      this.props.resetLogin(undefined);
      this.setState({dialogOpen:false});
      sessionStorage.clear();
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }
      
      console.log(error.response);
    });
  }

  handleUserProfile() {
    window.location.href = `#/users/${this.props.curUserId}`;
  }

  handleFriendList() {
    window.location.href = `#/users`;
  }

  handleBookmark() {
    window.location.href = `#/favorites`;
  }

  render() {
    return this.state.schemaInfo ? (
      <AppBar className="cs142-topbar-appBar" position="absolute">
        <Toolbar>
          <Grid container justify="space-between" direction="row" alignItems="center">
            <Grid item xs={4}>
              { this.props.curUserId ?
                <div>
                <IconButton
                  variant="contained"
                  color="inherit"
                  onClick={(event)=>this.setState({menuPos:event.currentTarget,menuOpen:true})}
                >
                  <Tooltip title="Menu">
                    <MenuIcon />
                  </Tooltip>
                </IconButton>

                <Menu
                  id="fade-menu"
                  anchorEl={this.state.menuPos}
                  open={this.state.menuOpen}
                  onClose={()=>this.setState({menuOpen:false})}
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <MenuItem onClick={()=>this.setState({menuOpen:false, dialogOpen:true})}>
                    <Typography>Delete account</Typography>
                  </MenuItem>
                  <MenuItem onClick={()=>this.handleLogOut()}>
                    <Typography>Logout</Typography>
                  </MenuItem>
                </Menu>

                <Dialog
                  open={this.state.dialogOpen}
                  onClose={()=>this.setState({dialogOpen:false})}
                  aria-labelledby="alert-dialog-title"
                  aria-describedby="alert-dialog-description"
                >
                  <DialogTitle id="alert-dialog-title">{"Are you sure you want to delete your account?"}</DialogTitle>
                  <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                      All your data and information will be remove
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={()=>this.handleDelAccount()} color="primary">
                      Delete Account
                    </Button>
                    <Button onClick={()=>this.setState({dialogOpen:false})} color="primary" autoFocus>
                      Cancel
                    </Button>
                  </DialogActions>
                </Dialog>

                <IconButton
                  variant="contained"
                  color="inherit"
                  onClick={()=>this.handleUserProfile()}
                >
                  <Tooltip title="Home">
                    <HomeIcon />
                  </Tooltip>
                </IconButton>

                <IconButton
                  variant="contained"
                  color="inherit"
                  onClick={()=>this.handleFriendList()}
                >
                  <Tooltip title="User Stat">
                    <PeopleAltIcon />
                  </Tooltip>
                </IconButton>

                <IconButton
                  variant="contained"
                  color="inherit"
                  onClick={()=>this.handleBookmark()}
                >
                  <Tooltip title="Favorite Photos">
                    <SentimentVerySatisfiedRoundedIcon/>
                  </Tooltip>
                </IconButton>
                </div>
                :
                <Typography variant="h5" color="inherit">PhotoApp</Typography>
              }
            </Grid>
            {this.props.view !== 'Sign In Page' ?
            <Grid item xs={4}>
              <Typography variant="h5" color="inherit">
                {`PhotoApp v2.${this.state.schemaInfo.__v}`}
              </Typography>
            </Grid>
            : null
            }
            <Grid item xs={4}>
              <Typography variant="h5" color="inherit">
                {this.props.view}
              </Typography>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>) : (<div />
    );
  }
}

export default TopBar;
