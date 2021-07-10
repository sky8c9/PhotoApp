import React from 'react';
import axios from 'axios';
import RefreshIcon from '@material-ui/icons/Refresh';

import {
  Avatar, List, ListItem, ListItemAvatar, Tooltip,
  IconButton, ListItemText, Typography, Grid
}
from '@material-ui/core';


class UserActivity extends React.Component {
  constructor(props) {
    super(props);
    this.state = ({usrActivities: undefined});
  }

  fetchUserActivities() {
    let url = "/user/activities";
    axios.get(url).then(response => {
      this.setState({usrActivities : response.data});
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }
      
      console.log(error.response);
    });
  }

  componentDidMount() {
    this.fetchUserActivities();
  }

  showUsrAct() {
    if (this.state.usrActivities === undefined) return;
    let usrInfo = [];

    this.state.usrActivities.forEach((user) => {
      let toUserText = (user.activity.to_user && user.activity.from_user != user.activity.to_user) ? ` on ${user.activity.to_user} photo` : "";
      usrInfo.push(
        <ListItem key={user.activity._id} alignItems="flex-start">
          <ListItemText primary={`${user.activity.from_user} ${user.activity.type}${toUserText}`}
                        secondary={user.activity.date_time}
          />
          {
            user.activity.thumbnail_name 
            ?
              <ListItemAvatar>
                <Avatar style={{ height: '50px', width: '80px' }}
                        variant="rounded" 
                        alt={user.activity.thumbnail_name} 
                        src={`/images/${user.activity.thumbnail_name}`} 
                />
              </ListItemAvatar>
            : null
          }
        </ListItem>
      )
    });

    return (
      <List component="nav"> {usrInfo} </List>
    );
  }

  render() {
    return (
      <div>
        <Grid container alignItems='center' justify='center'>
          <Grid item>
            <Typography variant="h5" color='primary'>
              Recent Activities
            </Typography>
          </Grid>
          <Grid item>
            <Tooltip title='Refresh'>
              <IconButton color='primary' onClick={()=>this.fetchUserActivities()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
        {this.showUsrAct()}
      </div>
    );
  }
}

export default UserActivity;
