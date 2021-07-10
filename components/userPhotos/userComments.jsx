import React from 'react';
import axios from 'axios';
import {MentionsInput, Mention} from 'react-mentions';
import defaultStyle from './defaultStyle';

import {
  Button, IconButton, List, ListItem, 
  ListItemIcon, ListItemText, Typography 
} from '@material-ui/core';

import CreateIcon from '@material-ui/icons/Create';
import CommentRoundedIcon from '@material-ui/icons/CommentRounded';
import RemoveCircleOutlineRoundedIcon from '@material-ui/icons/RemoveCircleOutlineRounded';
import {Link} from 'react-router-dom';

class UserComments extends React.Component {
  constructor(props) {
    super(props);
    this.state ={ 
                  commentText : '', 
                };
  }

  handleOnClickAddComment() {
    if (!this.state.commentText) return;

    // Preprocessing comment text
    let trim = this.props.textPreProcessing(this.state.commentText);

    // Add comment to db
    let url = "/commentsOfPhoto/" + this.props.curPid;
    axios.post(url, { comment : trim.text, 
                      photo_author_name : `${this.props.photos_author.first_name} ${this.props.photos_author.last_name}`,
                      mentioned_uid_list : trim.mentioned_ids
                    }
    ).then(() => {
        // Update props and states
        this.props.fetchPhotos();
        this.setState({commentText:''});
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    });
  }

  addComments() {
    return (
      <List>
        <ListItem>
          <ListItemIcon>
            <CreateIcon />
          </ListItemIcon>

          <MentionsInput  
                          value={this.state.commentText} 
                          placeholder="Write Your Comment Here. Mention People Using @"
                          onChange={(event)=>this.setState({commentText:event.target.value})}
                          style={defaultStyle}
                          singleLine
          >
            <Mention
              trigger="@"
              data={this.props.users}
            />
          </MentionsInput>

          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => this.handleOnClickAddComment()}
          >
            Add
          </Button>
        </ListItem>
      </List>);
  }

  handleDelComment(commentId) {
    let url = "/delComment/" + commentId;
    axios.post(url, {photo_id:this.props.curPid}).then(() => {
      this.props.fetchPhotos();
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    });
  }

  showComments() {
    let retVal = [];
    if (this.props.comments === undefined) return;
      this.props.comments.forEach( (commentObj) => {
        let name = `${commentObj.user.first_name} ${commentObj.user.last_name}`;
        let user = commentObj.user;
        retVal.push(
          <List key={commentObj._id}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <CommentRoundedIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <React.Fragment>
                    <Link to={`/users/${commentObj.user._id}`} 
                          key={commentObj.user._id} 
                          style={{ textDecoration: 'none' }}>
                      <Typography color="primary">
                        {name}
                      </Typography>
                    </Link>
                    <Typography color="textSecondary">
                      {commentObj.date_time}
                    </Typography>
                    <Typography color="textPrimary">
                      {commentObj.comment}
                    </Typography>
                  </React.Fragment>
                }
              />
              {
                user._id === this.props.curUid ?
                  <IconButton color="secondary" 
                              onClick={()=>this.handleDelComment(commentObj._id)}
                  >
                    <RemoveCircleOutlineRoundedIcon />
                  </IconButton>
                : null
              }
            </ListItem>
          </List>
        );
      });

    return (
      <div>
        {retVal}
        {this.addComments()}
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.showComments()}
      </div>
    );
  }
}

export default UserComments;
