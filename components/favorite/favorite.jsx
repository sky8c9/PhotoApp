import React from 'react';
import axios from 'axios';

import {
  Avatar, Button, Badge, Dialog, DialogTitle, DialogContent, 
  DialogActions, Grid, 
}

from '@material-ui/core';
import HighlightOffRoundedIcon from '@material-ui/icons/HighlightOffRounded';

class Favorite extends React.Component {
  constructor(props) {
    super(props);
    this.state = {favorite_photos:undefined, dialogOpen:undefined};
    this.props.setView("Favorite Photos");
  }

  fetchFavoritePhotos() {
    let url = "/favoritePhotos/";
    axios.get(url).then(response => {
      let initDialog = new Array(response.data.length);
      initDialog.fill(false);
      this.setState({favorite_photos:response.data});
      this.setState({dialogOpen : initDialog});
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }

      console.log(error.response);
    });
  }

  removePhoto(index) {
    let url = "/favoriteRemove/" + this.state.favorite_photos[index]._id;
    axios.post(url).then(() => {
      this.fetchFavoritePhotos();
    })
    .catch(error => {
      if (error.response.status === 401) {
        this.props.expiredSession();
      }
      
      console.log(error.response);
    });
  }

  setDialogOpen(val, index) {
    let tmp = [...this.state.dialogOpen];
    tmp[index] = val;
    this.setState({dialogOpen:tmp});
  }

  componentDidMount() {
    this.fetchFavoritePhotos();
  }

  showPhoto() {
    if (!this.state.favorite_photos || !this.state.dialogOpen) return;
    let retVal = [];
    this.state.favorite_photos.forEach((photo, index)=> {
      retVal.push(
        <div key={photo._id}>
          <Grid item container>
            <Grid item>
              <Button onClick={()=>this.setDialogOpen(true,index)}>
                <Badge badgeContent=
                        {
                            <HighlightOffRoundedIcon color="secondary" 
                              onClick={(e)=>{ e.stopPropagation();
                                              this.removePhoto(index);
                                            }
                            }/>
                        }
                >
                  <Avatar variant="rounded" 
                          alt={photo.file_name} 
                          src={`/images/${photo.file_name}`} 
                  />
                </Badge>
              </Button>
            </Grid>
          </Grid>

          <Dialog
            fullScreen
            open={this.state.dialogOpen[index]}
            onClose={()=>this.setDialogOpen(false,index)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">{photo.date_time}</DialogTitle>
            <DialogContent>
              <img
                src={`/images/${photo.file_name}`}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>this.setDialogOpen(false,index)} color="primary" autoFocus>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      );
    })
    return retVal;
  }

  render() {
    return (
      <Grid container>
        {this.showPhoto()}
      </Grid>
    );
  }
}

export default Favorite;
