import React from 'react';
import axios from 'axios';
import {MentionsInput, Mention} from 'react-mentions';
import defaultStyle from './defaultStyle';

import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Radio, RadioGroup, FormControlLabel, FormControl
} from '@material-ui/core';

import AddAPhotoIcon from '@material-ui/icons/AddAPhoto';
class UploadPhoto extends React.Component {
	constructor(props) {
		super(props);
		this.state={ 	
						dialogOpen:false,
						shareList:'',
						shareType:'list'
					};
	}

	handleUploadPhoto() {
		if (this.uploadInput.files.length > 0) {
			// Build share list
			let list = [];

			if(this.state.shareType === 'list') {
				// Preprocessing sharing list
				let trim = this.props.textPreProcessing(this.state.shareList);
				list = [...trim.mentioned_ids];
				if (list.indexOf(this.props.curUserId) === -1) {
					list.push(this.props.curUserId);
				}
			}

			// Create a DOM form and add the file to it under the name uploadedphoto
			let domForm = new FormData();

			let url = "/photos/new";
			domForm.append('uploadedphoto', this.uploadInput.files[0]);
			domForm.append('list', list);
			axios.post(url, domForm).then(() => {
				this.props.fetchPhotos();
				this.setState({dialogOpen:false});
			})
			.catch(error => {
				if (error.response.status === 401) {
					this.props.expiredSession();
				}
				
				console.log(error.response);
			});
		}
	}

render() {
    return (
		<div>
			<input type="file" accept="image/*" ref={(domFileRef) => { this.uploadInput = domFileRef; }} />
			
			<Button 	
				variant="contained"
				color="primary"
				size="small"
				startIcon={<AddAPhotoIcon />}
				onClick={()=> 	{ 	this.uploadInput.files.length > 0 ?
										this.setState({dialogOpen:true, shareType:"list", shareList:''})
									: null;
								}
						}
			>
			Upload
			</Button>

			<Dialog
				open={this.state.dialogOpen}
				onClose={()=>this.setState({dialogOpen:false})}
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description"
			>
				<DialogTitle id="alert-dialog-title">{"Who can view this photo ?"}</DialogTitle>
				<DialogContent>
					<FormControl style = {{width:"500px"}}>
						<RadioGroup aria-label="gender" 
									name="gender1" 
									value={this.state.shareType} 
									onChange={(event)=>this.setState({shareType:event.target.value})}
						>
							<FormControlLabel value="all" control={<Radio />} label="All" />
							<FormControlLabel value="list" control={<Radio />} label="Customized List (Empty List = Only Me Mode)" />
					</RadioGroup>
					</FormControl>
					{
						this.state.shareType === "list" ?
						<MentionsInput  
							value={this.state.shareList} 
							placeholder="Add People Using @"
							onChange={(event)=>this.setState({shareList:event.target.value})}
							style={defaultStyle}
							singleLine
						>
							<Mention
								trigger="@"
								data={this.props.users}
							/>
						</MentionsInput>
						: null
					}
				</DialogContent>

				<DialogActions>
					<Button onClick={(event)=>this.handleUploadPhoto(event)} color="primary">
						Confirm
					</Button>
					<Button onClick={()=>this.setState({dialogOpen:false})} color="primary" autoFocus>
						Cancel
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
  }
}

export default UploadPhoto;
