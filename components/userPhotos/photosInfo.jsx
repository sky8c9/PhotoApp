import React from 'react';
import axios from 'axios';

import {
  Avatar, Card, CardHeader, CardMedia,
  CardContent, CardActions, Collapse,
  Grid, Typography, Tooltip, IconButton
} from '@material-ui/core';

import RemoveCircleOutlineRoundedIcon from '@material-ui/icons/RemoveCircleOutlineRounded';
import ThumbUpRoundedIcon from '@material-ui/icons/ThumbUpRounded';
import ForumRoundedIcon from '@material-ui/icons/ForumRounded';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FavoriteIcon from '@material-ui/icons/Favorite';
import LocalOfferIcon from '@material-ui/icons/LocalOffer';
import UserComments from './UserComments';
import UserTags from './UserTags';
import {Link} from 'react-router-dom';
import "./photosInfo.css";

class PhotosInfo extends React.Component {
	constructor(props) {
		super(props);
		this.state =	{
							likeStatus : (this.props.photo.likes_uid.indexOf(this.props.curUid) !== -1) ? true : false,
							favoriteStatus : (this.props.photo.favorite_uid.indexOf(this.props.curUid) !== -1) ? true : false,
							expanded : false,
							tagOpen : false,
							tagVisibility : []
						};
		this.setTagOpen = this.setTagOpen.bind(this);
	}

	handleDelPhoto() {
		let url = "/delPhoto/" + this.props.photo._id;
		axios.post(url).then(() => {
			this.props.fetchPhotos();
		})
		.catch(error => {
			if (error.response.status === 401) {
				this.props.expiredSession();
			}

			console.log(error.response);
		});
	}

	handleLike() {
		let url = "/likeUpdate/" + this.props.photo._id;

		axios.post(url, { curState : this.state.likeStatus })
		.then(() => {
			this.setState(prev=>({likeStatus:!prev.likeStatus}));
			this.props.fetchPhotos();
		})
		.catch(error => {
			if (error.response.status === 401) {
				this.props.expiredSession();
			}

			console.log(error.response);
		});
	}

	handleFavorite() {
		let url = "/favoriteUpdate/" + this.props.photo._id;

		axios.post(url, { curState : this.state.favoriteStatus })
		.then(() => {
			this.setState(prev=>({favoriteStatus:!prev.favoriteStatus}))
		})
		.catch(error => {
			if (error.response.status === 401) {
				this.props.expiredSession();
			}

			console.log(error.response);
		});
	}

	removeTagRequest(uid) {
		let url = "/removeTag/" + this.props.photo._id;
		axios.post(url,{uid:uid}).then(() => {
			this.props.fetchPhotos();
		})
		.catch(error => {
			if (error.response.status === 401) {
				this.props.expiredSession();
			}

			console.log(error.response);
		});
	}

	getTaggedName() {
		let retVal =[];
		this.props.photo.tagInfo.map((photoTag, index) => {
			retVal.push (
				<Grid item key={index}>
					<Link
							to={`/users/${photoTag.uid}`} 
							style={{ textDecoration: 'none' }}
							onMouseOver={()=>this.setTagVisibility(index, true)}
							onMouseLeave={()=>this.setTagVisibility(index, false)}
					>
						<Typography color='primary'>
							{photoTag.uname}
						</Typography>
					</Link>
				</Grid>
			);
		})
		return (
			<Grid container spacing={1} alignItems='center'>
				{retVal}
			</Grid>
		);
	}

	setTagVisibility(index, val) {
		let update = [...this.state.tagVisibility];
		update[index] = val;
		this.setState({tagVisibility:update});
	}

	showTags() {
		return (
			this.props.photo.tagInfo.map((photoTag, index) => {
				return(
				<Tooltip 
					key={index}	
					title=
					{
						<Grid container alignItems='center' justify='space-evenly'>
							<Link to={`/users/${photoTag.uid}`} 
									style={{ textDecoration: 'none' }}>
									{photoTag.uname}
							</Link>
								{	this.props.curUid === this.props.photo.user_id || this.props.curUid === photoTag.uid
									?
									<IconButton color='secondary' 
											size='small'
											onClick={()=>this.removeTagRequest(photoTag.uid)}
									>
										x
									</IconButton>
									: null
								}
							</Grid>
					} 
					interactive
					arrow
				>
					<div className='tags'
						style={{
							left: `${photoTag.x}%`,
							top: `${photoTag.y}%`,
							width: `${photoTag.width}%`,
							height: `${photoTag.height}%`,
							border: `${!this.state.tagVisibility[index] ? 'none' : '1px solid green'}`
						}}
					/>
				</Tooltip>
				);
			})
		);
	}

	showLikeNameList() {
		let likes_uid = this.props.photo.likes_uid;
		let userData = this.props.users;    
		let full_list = [];
		let shown_list = likes_uid.indexOf(this.props.curUid) !== -1 ? ['You'] : [];

		likes_uid.forEach((uid) => {
			userData.filter((user)=>{
				if (user.id === uid) {
					full_list.push(user.display);
					if (uid !== this.props.curUid) shown_list.push(user.display); 
				} 
			})
		})

		let namePart = [...shown_list].splice(0,3).join(', ');
		let countPart = shown_list.splice(3,).length;

		let display = 	full_list.length > 0
						? namePart + (countPart > 0 ? ` and ${countPart} people` : '') + ' liked this'
						: null

		return (
			<Tooltip title={full_list.join(', ')}>
				<Typography color="textSecondary">{display}</Typography>
			</Tooltip>
		);
	}

	setTagOpen(val) {
		this.setState({tagOpen:val});
	}

	render() {
		let fname = this.props.photos_author.first_name;
		let lname = this.props.photos_author.last_name;
		let path = "/images/" + this.props.photo.file_name;

		return (
			<Grid item sm={12} key={this.props.photo._id} id={this.props.photo._id}>
				<Card style={{overflow:'visible'}}>
					<CardHeader 
						avatar={
							<Avatar>
								{`${fname.charAt(0)}${lname.charAt(0)}`}
							</Avatar>
						}

						action=
							{
							<div>
								<IconButton
									aria-label="favorite"
									onClick={() => this.handleFavorite()}
									color={this.state.favoriteStatus ? "secondary" : "default"}
								>
								<Tooltip title="Favorite">
									<FavoriteIcon />
								</Tooltip>
								</IconButton>

								{
								this.props.photo.user_id === this.props.curUid ?
									[<IconButton
										aria-label="tag"
										key="tag"
										onClick={() => this.setState({tagOpen:true})}
										color={this.state.tagOpen ? "secondary" : "default"}
									>
									<Tooltip title="Edit Tag">
										<LocalOfferIcon />
									</Tooltip>
									</IconButton>
									,
									<IconButton 
										aria-label="remove" 
										key="remove"
										color="secondary"
										onClick={()=>this.handleDelPhoto()}
									>
										<Tooltip title="Remove">
											<RemoveCircleOutlineRoundedIcon />
										</Tooltip>
									</IconButton>]
								: null
								}
							</div>
							}

						title=
						{
							<Typography color="primary" variant="h6">
								{`${fname} ${lname}`}
							</Typography>
						}

						subheader={this.props.photo.date_time}                                   
					/>

					<div className='photos'>
						<CardMedia 	component="img" 
							width="100%" 
							height="auto" 
							image={path} 
							title={this.props.photo.file_name} 
						/>  
						{this.showTags()}
						
					</div>

					{
					this.props.photo.tagInfo && this.props.photo.tagInfo.length > 0
					?
					<CardContent>
						{this.getTaggedName()}
					</CardContent>
					: null
					}

					<CardActions>
						<Grid container>
							<Grid item container xs={9} alignItems="center">
								<IconButton 
									aria-label="like or unlike"    
									onClick={() => this.handleLike()}
									color={this.state.likeStatus? "primary" : "default"}
								>
									<Typography>
										{this.props.photo.likes_uid.length}
									</Typography>

									<ThumbUpRoundedIcon />

								</IconButton>

								{this.showLikeNameList()}
							</Grid>

							<Grid item container xs={3} direction="row" justify="flex-end">
								<Typography color="primary">
									{this.props.photo.comments.length} 
								</Typography>

								<ForumRoundedIcon color="primary"/>
								<IconButton
									onClick={()=>this.setState(prev=>({expanded:!prev.expanded}))}
									aria-label="show more"
									color="primary"
								>
									{!this.state.expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
								</IconButton>
							</Grid>
						</Grid>
					</CardActions>

					<Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
						<CardContent>
							<UserComments textPreProcessing = {this.props.textPreProcessing}
								comments = {this.props.photo.comments}
								curUid = {this.props.curUid}
								curPid = {this.props.photo._id}
								users = {this.props.users}
								fetchPhotos = {this.props.fetchPhotos}
								photos_author = {this.props.photos_author}
								expiredSession={this.props.expiredSession}
					/>
						</CardContent>
					</Collapse>
				</Card>

				<UserTags 	users={this.props.users} 
								photo={this.props.photo}
								curUid={this.props.curUid}
								fetchPhotos = {this.props.fetchPhotos}
								tagOpen = {this.state.tagOpen}
								setTagOpen = {this.setTagOpen}
								removeTagRequest = {(uid)=>this.removeTagRequest(uid)}
								expiredSession={this.props.expiredSession}
				/>	
			</Grid>
		);
	}
}

export default PhotosInfo;
