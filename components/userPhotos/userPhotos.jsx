import React from 'react';
import axios from 'axios';

import UploadPhoto from './UploadPhoto';
import PhotosInfo from './PhotosInfo';

import {
  Select, InputLabel, MenuItem, 
  Grid, FormControl
} from '@material-ui/core';

import './userPhotos.css';

class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state ={ photos : undefined, 
                  photos_author : undefined,
                  sortBy : 'time',
                  users : [],
                };
    this.fetchPhotos = this.fetchPhotos.bind(this);
    this.textPreProcessing = this.textPreProcessing.bind(this);
  }

  fetchUsersMentionFormat() {
    let url = "/usersMentionedFormat";
    axios.get(url).then(response => {
      this.setState({users:response.data});
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log('Fetching user mention failed !!! - ', error);
    });
  }

  fetchPhotoAuthorInfo() {
    let url = "/user/" + this.props.match.params.userId;
    axios.get(url).then(response => {
      this.props.setView(`Photos of ${response.data.first_name} ${response.data.last_name}`);
      this.setState({photos_author:response.data});
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log('Fetching user data failed !!! - ', error);
    });
  }

  fetchPhotos() {
    let url = `/photosOfUser/${this.props.match.params.userId}/${this.state.sortBy}` ;
    axios.get(url).then(response => {
      this.setState({photos : response.data});
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    });
  }

  componentDidMount() {
    this.fetchPhotos();
    this.fetchPhotoAuthorInfo();
    this.fetchUsersMentionFormat();
  }

  handleSortBy(event) {
    this.setState({sortBy:event.target.value}, () => {
      this.fetchPhotos();
    });
  }

  textPreProcessing(s) {
    // Preprocessing comment text
    let regex1 = /@\[([a-zA-Z\s]+)\]\(([\S]+)\)/g;
    let regex2 = /\(([\S]+)\)/g;

    let text = s.replace(regex1, (match,p1) => {return `@${p1}`;});
    let mentioned_list = s.match(regex1);
    let mentioned_ids = [];

    if (mentioned_list) {
      mentioned_list.forEach(item => {
        let s = item.match(regex2).join();
        let id = s.substring(1,s.length-1);
        if (mentioned_ids.indexOf(id) === -1) {
          mentioned_ids.push(s.substring(1,s.length-1));
        }
      })
    }

    return {text:text,mentioned_ids:mentioned_ids};
  }

  showPhotosInfo() {
    if (!this.state.photos || this.state.photos_author === undefined) return;
      let retVal = [];    
      this.state.photos.forEach( (item, index) => {
        retVal.push(
          <PhotosInfo 
            key = {item._id}
            textPreProcessing = {this.textPreProcessing}
            fetchPhotos = {this.fetchPhotos}
            photo={this.state.photos[index]}
            users={this.state.users}
            curUid={this.props.curUserId}
            photos_author = {this.state.photos_author}
            expiredSession={this.props.expiredSession}
          />
        );
      })

    return retVal;
  }

  render() {
    return (
      <div>
        <Grid container spacing={2}>
          <Grid container item direction="row" alignItems="center" justify="space-between">
            <Grid item xs={2}>
              { this.props.curUserId === this.props.match.params.userId ?
                <UploadPhoto  textPreProcessing = {this.textPreProcessing}
                              curUserId = {this.props.curUserId}
                              fetchPhotos = {this.fetchPhotos}
                              users = {this.state.users}
                              expiredSession={this.props.expiredSession}
                />
              : null
              }
            </Grid>
            <Grid item xs={2} color="primary">
              <FormControl style = {{width:"130px"}}>
                <InputLabel>Sort by:</InputLabel>
                <Select id="photo sort"
                        value={this.state.sortBy}
                        onChange={this.handleSortBy.bind(this)}
                        MenuProps={{
                          anchorOrigin: {
                            vertical: "bottom",
                            horizontal: "left"
                          },
                          transformOrigin: {
                            vertical: "top",
                            horizontal: "left"
                          },
                        getContentAnchorEl: null
            }}
                >
                  <MenuItem value="time">Most Recent</MenuItem>
                  <MenuItem value="like">Most Liked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container item spacing={1}>
            {this.showPhotosInfo()}
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default UserPhotos;
