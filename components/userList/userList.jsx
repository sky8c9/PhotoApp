import React from 'react';
import axios from 'axios';

import {
  Avatar,Badge,Dialog,DialogTitle,DialogContent,
  Grid,IconButton,List,ListItemAvatar,
  ListItem,ListItemText,Typography
}
from '@material-ui/core';
import PersonRoundedIcon from '@material-ui/icons/PersonRounded';
import ChatIcon from '@material-ui/icons/Chat';
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';

import './userList.css';
import {Link} from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = ({usrStat : undefined},
                  {isOpen : undefined}
                  );
  }

  fetchStat() {
    let url = "/statView/" + this.props.curUserId;
    axios.get(url).then(response => {
      let tmp = new Array(response.data.length);
      tmp.fill(false);

      this.setState({isOpen:tmp});
      this.setState({usrStat:response.data});
      this.props.setView("User Stat");
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    });
  }

  commentDetails(index) {
    let retVal = [];
      this.state.usrStat[index].commentInfo.map((item) => {
        retVal.push(
          <HashLink key={item.key}
                    to={`/photos/${item.photo_author_id}#${item.photo_id}`}
                    style={{ textDecoration: 'none' }}
                    scroll={(el) => {
                        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100)
                    }}
          >
            <ListItem alignItems="flex-start">
                <ListItemText secondary={item.comment_date_time}>
                  {item.comment_text}
                </ListItemText>
                <ListItemAvatar>
                  <Avatar variant="rounded" 
                          alt={item.photo_name} 
                          src={`/images/${item.photo_name}`} 
                  />
                </ListItemAvatar>

            </ListItem>
          </HashLink>
        );
      })
  
    return (
      <List>
        {retVal}
      </List>
    );
  }

  componentDidMount() {
    this.fetchStat();
  }

  showUserDetails() {
    if (this.state.usrStat === undefined) return;
    let data = [];

    this.state.usrStat.forEach((record, index) => {
      data.push(
        <Grid item container alignItems="center" justify="space-between" key={record.uid}>
          <Grid item xs={3}>
            <Link to={`/users/${record.uid}`} key={record.key} style={{ textDecoration: 'none' }}>
              <Avatar>
                <PersonRoundedIcon fontSize='large' />
              </Avatar>
              {record.uname}
            </Link>
          </Grid>

          <Grid item xs={3}>
            <Link to={`/photos/${record.uid}`}>
              <Badge badgeContent={record.photoCnt} color="secondary">
                <PhotoCameraIcon color="primary" size="large"/>
              </Badge>
            </Link>   
          </Grid>

          <Grid item xs={3}>
            <Badge  badgeContent={record.commentCnt} 
                    color="secondary"
                    onClick={()=>{
                              let update = [...this.state.isOpen];
                              update[index] = true;
                              this.setState({isOpen:update});
                            }}
            >
              <ChatIcon color="primary" size="large"/>
            </Badge>    
          </Grid>

          <Dialog
            open={this.state.isOpen[index]}
            onClose={()=>{
              let update = [...this.state.isOpen];
              update[index] = false;
              this.setState({isOpen:update});
            }}
          >
            <DialogTitle>{`${this.state.usrStat[index].uname} comment summary`}</DialogTitle>
            <DialogContent>
              {this.commentDetails(index)}
            </DialogContent>
          </Dialog>
        </Grid>
      );
    });

    return (
      <Grid container direction="column" spacing={2}>{data}</Grid>
    );
  }

  render() {
    return (
      <div>
        {this.showUserDetails()}
      </div>
    );
  }
}

export default UserList;
