import React from 'react';
import axios from 'axios';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {MentionsInput, Mention} from 'react-mentions';
import defaultStyle from './defaultStyle';

import {
	Button, Chip, Grid, Tooltip, Dialog, 
	DialogTitle, DialogContent, DialogActions
} from '@material-ui/core';

import {Link} from 'react-router-dom';

class UserTags extends React.Component {
	constructor(props) {
		super(props);
		this.state =	{ 
							tag: '',
							nameShown: false,
							crop : {}
						};
	}

	editTags() {
		let tags = [];
		let nameList = [];

		this.props.photo.tagInfo.map((photoTag, index) => {
			tags.push(
				<Tooltip 
					key={index}	
					title=
					{
						<Link to={`/users/${photoTag.uid}`} 
								style={{ textDecoration: 'none' }}>
								{photoTag.uname}
						</Link>
					} 
					interactive
					arrow
				>
					<div
						style={{
							left: `${photoTag.x}%`,
							top: `${photoTag.y}%`,
							width: `${photoTag.width}%`,
							height: `${photoTag.height}%`,
							border: `1px solid white`,
							position: 'absolute'
						}}
					/>
				</Tooltip>
			);

			nameList.push(
				<Chip 	label={photoTag.uname}
						size='small'
						key={index}
						variant='outlined'
						onDelete={()=>this.props.removeTagRequest(photoTag.uid)} 
						color="primary" 
				/>
			);
		})

		return(
			<Grid container>
				<Grid item>
					{tags}
				</Grid>
				<Grid item>
					{nameList}
				</Grid>
			</Grid>
		);
	}

	addTagRequest(uid,uname) {
		let data = 	{
							x:this.state.crop.x,
							y:this.state.crop.y,
							width:this.state.crop.width,
							height:this.state.crop.height,
							uid:uid,
							uname:uname
					};

		let url = "/addTag/" + this.props.photo._id;
		axios.post(url, {data:data}).then(() => {
			this.props.fetchPhotos();
			this.resetState();
		})
		.catch(error => {
			if (error.response.status === 401) {
				this.props.expiredSession();
			}

			console.log(error.response.data);
			this.resetState();
		});
	}

	resetState() {
		this.setState({crop:{}});
		this.setState({tag:''});
		this.setState({nameShown:false});
	}

	render() {
		return (
			<div key = {this.props.photo._id}>
			<Dialog
				disableBackdropClick
				disableEscapeKeyDown
				open={this.props.tagOpen}
				onClose={()=>this.props.setTagOpen(false)}
			>
				<DialogTitle>Add tags to photo</DialogTitle>
				<DialogContent>
					<div className='photos'>
						<ReactCrop
							src={`/images/${this.props.photo.file_name}`}
							crop={this.state.crop}
							onChange={(crop,percentCrop)=>this.setState({crop:percentCrop})}
							onDragStart={()=>this.setState({nameShown:false})}
							onDragEnd={()=>this.setState({nameShown:true})}
						/>

						{this.editTags()}

						{
						this.state.nameShown 
						?
						<div className='tags'
							style={{
								left: `${this.state.crop.x}%`,
								top: `${this.state.crop.y + this.state.crop.height}%`,
								width: `${this.state.crop.width}%`
							}}
						>
							<MentionsInput  
								value={this.state.tag} 
								onChange={(event)=>this.setState({tag:event.target.value})}
								placeholder="Type name"
								style={defaultStyle}
								singleLine
								autoFocus
							>
								<Mention
									trigger=""
									data={this.props.users}
									onAdd={(uid,uname)=>this.addTagRequest(uid,uname)}
								/>
							</MentionsInput>
						</div>
						:
						null
						}
					</div>
				</DialogContent>
				<DialogActions>
					<Button color='primary' onClick={()=>{
															this.resetState();
															this.props.setTagOpen(false);
														}}>
						Done
					</Button>
				</DialogActions>
			</Dialog>
			</div>
		);
	}
}

export default UserTags;
