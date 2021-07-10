import React from 'react';
import axios from 'axios';

import {
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon
} from '@material-ui/core';

import Avatar from '@material-ui/core/Avatar';
import LocationCityRoundedIcon from '@material-ui/icons/LocationCityRounded';
import DescriptionRoundedIcon from '@material-ui/icons/DescriptionRounded';
import WorkRoundedIcon from '@material-ui/icons/WorkRounded';
import PhotoLibraryRoundedIcon from '@material-ui/icons/PhotoLibraryRounded';

import './userDetail.css';
import {Link} from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {userInfo : undefined, 
                  mentions : undefined,
                  taggedPhotos : undefined
                };
  }

  fetchCommentTags() {
    let url = "/usersMentioned/" + this.props.match.params.userId;
    axios.get(url).then(response => {
      this.setState({mentions:response.data});
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    }); 
  }

  fetchPhotoTags() {
    let url = "/getTag/" + this.props.match.params.userId;
    axios.get(url).then(response => {
      this.setState({taggedPhotos:response.data});
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    }); 
  }

  fetchUserInfo() {
    let url = "/user/" + this.props.match.params.userId;
    axios.get(url).then(response => {
      this.setState({userInfo : response.data});
      this.props.setView(`Details of ${response.data.first_name} ${response.data.last_name}`);
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    }); 
  }

  componentDidMount() {
    this.fetchUserInfo();
    this.fetchCommentTags();
    this.fetchPhotoTags();
  }

  componentDidUpdate() {
    if (this.state.userInfo && this.state.userInfo._id !== this.props.match.params.userId) {
      this.fetchUserInfo();
      this.fetchCommentTags();
      this.fetchPhotoTags();
    }
  }

  showTags() {
    if (!this.state.taggedPhotos || this.props.curUserId !== this.props.match.params.userId) return;
    return(
      this.state.taggedPhotos.map((photo, index) => {
        return(
          <ListItem key={index}>
            <ListItemText secondary={photo.tagInfo[0].date_time}>
              {`Tag from `}
              <Link to={`/users/${photo.tagInfo[0].from_uid}`} style={{ textDecoration: 'none' }}>
                {`${photo.tagInfo[0].from_uname}`}
              </Link>
            </ListItemText>
            <ListItemAvatar>
              <HashLink to={`/photos/${photo.user_id}#${photo._id}`}
                        scroll={(el) => {
                          setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'end' }), 100)
                        }}

              >
                <Avatar variant="rounded" 
                        alt={photo.file_name} 
                        src={`/images/${photo.file_name}`} 
                />
              </HashLink>
            </ListItemAvatar>
          </ListItem>
        );
      })
    );
  }

  showMentions() {
    if (!this.state.mentions || this.props.curUserId !== this.props.match.params.userId) return;
    let retVal = [];
    
    this.state.mentions.forEach((mention, index) => {
      retVal.push(
        <ListItem key={index}>
          <ListItemText secondary={mention.date_time}>
            {`Mentioned in `}
            <Link to={`/users/${mention.author_id}`} style={{ textDecoration: 'none' }}>
              {`${mention.author_name}`}
            </Link>
            {`'s photo`}
          </ListItemText>
          <ListItemAvatar>
            <HashLink to={`/photos/${mention.author_id}#${mention.photo_id}`}
                      scroll={(el) => {
                          setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100)
                      }}
            >
              <Avatar variant="rounded" 
                      alt={mention.photo_name} 
                      src={`/images/${mention.photo_name}`} 
              />
            </HashLink>
          </ListItemAvatar>
        </ListItem>
      );
    });

    return retVal;
  }

  showUsrInfo() {
    if (!this.state.userInfo) return;
    let retVal = [];
    let fName = this.state.userInfo.first_name;
    let lName = this.state.userInfo.last_name;
    retVal.push(
      <List key={this.state.userInfo._id}>
        <ListItem>
          <ListItemAvatar>
            <Avatar>{fName.charAt(0)}{lName.charAt(0)}</Avatar>
          </ListItemAvatar>
          <ListItemText primary={`${fName} ${lName}`} />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <LocationCityRoundedIcon />
          </ListItemIcon>
          <ListItemText primary={this.state.userInfo.location} />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <DescriptionRoundedIcon /> 
          </ListItemIcon>
          <ListItemText primary={this.state.userInfo.description} />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <WorkRoundedIcon />
          </ListItemIcon>
          <ListItemText primary={this.state.userInfo.occupation} />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <PhotoLibraryRoundedIcon />
          </ListItemIcon>

          <Link to={`/photos/${this.state.userInfo._id}`} key={this.state.userInfo._id}>
            <ListItemText primary="View Photos" />
          </Link> 
        </ListItem>

        <Divider />
        {this.showMentions()}

        <Divider />
        {this.showTags()}
      </List>
    );

    return retVal;
  }

  render() {
    return (
      <div>
        {this.showUsrInfo()}
      </div>
    );
  }
}

export default UserDetail;
